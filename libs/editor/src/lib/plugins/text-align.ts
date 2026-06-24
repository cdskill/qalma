import {
  Attrs,
  DOMOutputSpec,
  Node as ProseMirrorNode,
  NodeSpec,
  NodeType,
  Schema,
  TagParseRule,
} from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

import {
  createConfigurableQalmaPlugin,
  createQalmaPlugin,
  QalmaCommandHandler,
  QalmaPlugin,
} from './qalma-plugin';

export type TextAlignment = 'left' | 'center' | 'right' | 'justify';
export type TextAlignNode = 'paragraph' | 'heading' | 'listItem' | 'blockquote';

export interface TextAlignPluginOptions {
  alignments: readonly TextAlignment[];
  nodes: readonly TextAlignNode[];
}

export const TEXT_ALIGNMENTS: readonly TextAlignment[] = Object.freeze([
  'left',
  'center',
  'right',
  'justify',
]);

export const TEXT_ALIGN_NODES: readonly TextAlignNode[] = Object.freeze([
  'paragraph',
  'heading',
  'listItem',
  'blockquote',
]);

export const TEXT_ALIGN_PLUGIN_DEFAULT_OPTIONS: Readonly<TextAlignPluginOptions> =
  Object.freeze({
    alignments: TEXT_ALIGNMENTS,
    nodes: TEXT_ALIGN_NODES,
  });

export const TextAlignPlugin = /* @__PURE__ */ createConfigurableQalmaPlugin(
  TEXT_ALIGN_PLUGIN_DEFAULT_OPTIONS,
  (options) => {
    assertTextAlignPluginOptions(options);

    return createQalmaPlugin({
      key: 'textAlign',
      extendNodes: (nodes) => createTextAlignNodeExtensions(nodes, options),
      commands: (schema) =>
        createTextAlignCommands(schema, options.alignments, options.nodes),
      commandStates: (schema) =>
        createTextAlignCommandStates(schema, options.alignments, options.nodes),
      queries: (schema) => ({
        textAlign: (state) =>
          getActiveTextAlign(state, getNodeTypes(schema, options.nodes)),
      }),
    });
  },
);

export const TextAlignKit: readonly QalmaPlugin[] = [TextAlignPlugin];

function createTextAlignNodeExtensions(
  nodes: Readonly<Record<string, NodeSpec>>,
  options: Readonly<TextAlignPluginOptions>,
): Record<string, NodeSpec> {
  return Object.fromEntries(
    options.nodes
      .filter((nodeName) => nodes[nodeName])
      .map((nodeName) => [
        nodeName,
        extendNodeSpecWithTextAlign(nodes[nodeName]),
      ]),
  );
}

function extendNodeSpecWithTextAlign(nodeSpec: NodeSpec): NodeSpec {
  return {
    ...nodeSpec,
    attrs: {
      ...nodeSpec.attrs,
      textAlign: { default: null },
    },
    parseDOM: nodeSpec.parseDOM?.map((rule) =>
      extendParseRuleWithTextAlign(rule),
    ),
    toDOM: (node) =>
      addTextAlignToDomSpec(
        nodeSpec.toDOM?.(node) ?? ['div', 0],
        parseTextAlignment(node.attrs['textAlign']),
      ),
  };
}

function extendParseRuleWithTextAlign(rule: TagParseRule): TagParseRule {
  return {
    ...rule,
    getAttrs: (dom) => {
      const attrs = getParseRuleAttrs(rule, dom);

      if (attrs === false) {
        return false;
      }

      return {
        ...(attrs ?? {}),
        textAlign: getTextAlignFromDom(dom),
      };
    },
  };
}

function getParseRuleAttrs(
  rule: TagParseRule,
  dom: HTMLElement,
): Attrs | false | null {
  const attrs = rule.getAttrs ? rule.getAttrs(dom) : (rule.attrs ?? null);

  return attrs === false || attrs === null ? attrs : { ...attrs };
}

function getTextAlignFromDom(dom: HTMLElement): TextAlignment | null {
  return parseTextAlignment(dom.style.textAlign || dom.getAttribute('align'));
}

function addTextAlignToDomSpec(
  domSpec: DOMOutputSpec,
  alignment: TextAlignment | null,
): DOMOutputSpec {
  if (!alignment || alignment === 'left' || !Array.isArray(domSpec)) {
    return domSpec;
  }

  const [tagName, maybeAttrs, ...children] = domSpec;
  const textAlignStyle = `text-align: ${alignment};`;

  if (isDomAttrs(maybeAttrs)) {
    return [
      tagName,
      {
        ...maybeAttrs,
        style: joinStyles(maybeAttrs['style'], textAlignStyle),
      },
      ...children,
    ];
  }

  return [tagName, { style: textAlignStyle }, maybeAttrs, ...children];
}

function isDomAttrs(value: unknown): value is Record<string, string> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !('nodeType' in value)
  );
}

function joinStyles(
  existingStyle: string | undefined,
  textAlignStyle: string,
): string {
  return existingStyle
    ? `${existingStyle.replace(/;?\s*$/, ';')} ${textAlignStyle}`
    : textAlignStyle;
}

function createTextAlignCommands(
  schema: Schema,
  alignments: readonly TextAlignment[],
  nodes: readonly TextAlignNode[],
): Record<string, QalmaCommandHandler> {
  const nodeTypes = getNodeTypes(schema, nodes);

  return Object.fromEntries(
    alignments.map((alignment) => [
      getTextAlignCommandName(alignment),
      createSetTextAlignCommand(nodeTypes, alignment),
    ]),
  );
}

function createTextAlignCommandStates(
  schema: Schema,
  alignments: readonly TextAlignment[],
  nodes: readonly TextAlignNode[],
): Record<string, (state: EditorState) => boolean> {
  const nodeTypes = getNodeTypes(schema, nodes);

  return Object.fromEntries(
    alignments.map((alignment) => [
      getTextAlignCommandName(alignment),
      (state) => getActiveTextAlign(state, nodeTypes) === alignment,
    ]),
  );
}

function createSetTextAlignCommand(
  nodeTypes: readonly NodeType[],
  alignment: TextAlignment,
): QalmaCommandHandler {
  return (state, dispatch) => {
    const targets = getSelectedAlignmentTargets(state, nodeTypes);

    if (targets.length === 0) {
      return false;
    }

    if (dispatch) {
      const transaction = state.tr;
      const textAlign = alignment === 'left' ? null : alignment;

      for (const target of targets) {
        transaction.setNodeMarkup(target.position, undefined, {
          ...target.node.attrs,
          textAlign,
        });
      }

      dispatch(transaction.scrollIntoView());
    }

    return true;
  };
}

interface SelectedAlignmentTarget {
  node: ProseMirrorNode;
  position: number;
}

function getSelectedAlignmentTargets(
  state: EditorState,
  nodeTypes: readonly NodeType[],
): readonly SelectedAlignmentTarget[] {
  if (nodeTypes.length === 0) {
    return [];
  }

  if (state.selection.empty) {
    const target = findAlignmentTarget(state.selection.$from, nodeTypes);

    return target ? [target] : [];
  }

  const targets = new Map<number, SelectedAlignmentTarget>();

  for (const range of state.selection.ranges) {
    state.doc.nodesBetween(range.$from.pos, range.$to.pos, (node, position) => {
      if (!node.isTextblock && !nodeTypes.includes(node.type)) {
        return undefined;
      }

      const target = findAlignmentTarget(
        state.doc.resolve(position + 1),
        nodeTypes,
      );

      if (target) {
        targets.set(target.position, target);
      }

      if (nodeTypes.includes(node.type)) {
        return false;
      }

      return undefined;
    });
  }

  return Array.from(targets.values());
}

function findAlignmentTarget(
  $pos: EditorState['selection']['$from'],
  nodeTypes: readonly NodeType[],
): SelectedAlignmentTarget | null {
  let textblockTarget: SelectedAlignmentTarget | null = null;

  for (let depth = $pos.depth; depth > 0; depth -= 1) {
    const node = $pos.node(depth);

    if (!nodeTypes.includes(node.type)) {
      continue;
    }

    const target = { node, position: $pos.before(depth) };

    if (!node.isTextblock) {
      return target;
    }

    textblockTarget = target;
  }

  return textblockTarget;
}

function getActiveTextAlign(
  state: EditorState,
  nodeTypes: readonly NodeType[],
): TextAlignment | null {
  const target = getSelectedAlignmentTargets(state, nodeTypes)[0];

  return target ? getNodeTextAlign(target.node) : null;
}

function getNodeTextAlign(node: ProseMirrorNode): TextAlignment {
  return parseTextAlignment(node.attrs['textAlign']) ?? 'left';
}

function getNodeTypes(
  schema: Schema,
  nodeNames: readonly TextAlignNode[],
): readonly NodeType[] {
  return nodeNames
    .map((nodeName) => schema.nodes[nodeName])
    .filter((node): node is NodeType => Boolean(node));
}

function getTextAlignCommandName(alignment: TextAlignment): string {
  return `setTextAlign${alignment[0].toUpperCase()}${alignment.slice(1)}`;
}

function parseTextAlignment(value: unknown): TextAlignment | null {
  return TEXT_ALIGNMENTS.includes(value as TextAlignment)
    ? (value as TextAlignment)
    : null;
}

function assertTextAlignPluginOptions(
  options: Readonly<TextAlignPluginOptions>,
): void {
  assertUniqueOptionEntries(
    options.alignments,
    TEXT_ALIGNMENTS,
    'TextAlignPlugin alignments',
  );
  assertUniqueOptionEntries(
    options.nodes,
    TEXT_ALIGN_NODES,
    'TextAlignPlugin nodes',
  );
}

function assertUniqueOptionEntries<TValue extends string>(
  values: readonly TValue[],
  allowedValues: readonly TValue[],
  optionName: string,
): void {
  if (!Array.isArray(values)) {
    throw new TypeError(`${optionName} must be an array.`);
  }

  if (values.length === 0) {
    throw new RangeError(`${optionName} must include at least one value.`);
  }

  const seen = new Set<TValue>();

  for (const value of values) {
    if (!allowedValues.includes(value)) {
      throw new RangeError(
        `${optionName} entries include an unsupported value.`,
      );
    }

    if (seen.has(value)) {
      throw new Error(`${optionName} entries must be unique.`);
    }

    seen.add(value);
  }
}
