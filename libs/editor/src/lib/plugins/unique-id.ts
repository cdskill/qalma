import { DOMOutputSpec, NodeSpec, TagParseRule } from 'prosemirror-model';
import {
  EditorState,
  Plugin as ProseMirrorPlugin,
  PluginKey,
  Transaction,
} from 'prosemirror-state';

import {
  QalmaPlugin,
  createConfigurableQalmaPlugin,
  createQalmaPlugin,
} from './qalma-plugin';

const UNIQUE_ID_ATTRIBUTE = 'qalmaId';

export interface UniqueIdPluginOptions {
  nodeTypes: readonly string[];
  attributeName: string;
  generateId: () => string;
}

export interface UniqueIdState {
  id: string;
  nodeType: string;
  position: number;
}

export const UNIQUE_ID_PLUGIN_DEFAULT_OPTIONS: Readonly<UniqueIdPluginOptions> =
  /* @__PURE__ */ Object.freeze({
    nodeTypes: Object.freeze(['paragraph']),
    attributeName: 'data-qalma-id',
    generateId: defaultGenerateId,
  });

export const UniqueIdPlugin = /* @__PURE__ */ createConfigurableQalmaPlugin(
  UNIQUE_ID_PLUGIN_DEFAULT_OPTIONS,
  (options) => {
    assertUniqueIdPluginOptions(options);

    const pluginKey = new PluginKey('qalmaUniqueId');
    const nodeTypes = new Set(options.nodeTypes);

    return createQalmaPlugin({
      key: 'uniqueId',
      extendNodes: (nodes) =>
        extendConfiguredNodes(nodes, options.nodeTypes, options.attributeName),
      queries: () => ({
        uniqueId: (state) => selectedUniqueId(state, nodeTypes),
      }),
      prosemirrorPlugins: () => [
        createUniqueIdProseMirrorPlugin(
          pluginKey,
          nodeTypes,
          options.generateId,
        ),
      ],
    });
  },
);

export const UniqueIdKit: readonly QalmaPlugin[] = [UniqueIdPlugin];

function extendConfiguredNodes(
  nodes: Readonly<Record<string, NodeSpec>>,
  nodeTypes: readonly string[],
  attributeName: string,
): Record<string, NodeSpec> {
  const extensions: Record<string, NodeSpec> = {};

  for (const nodeType of nodeTypes) {
    const spec = nodes[nodeType];

    if (!spec) {
      throw new Error(
        `UniqueIdPlugin cannot extend unknown node "${nodeType}". Add its schema plugin or remove it from nodeTypes.`,
      );
    }

    extensions[nodeType] = {
      ...spec,
      attrs: {
        ...spec.attrs,
        [UNIQUE_ID_ATTRIBUTE]: { default: null, validate: 'string|null' },
      },
      parseDOM: spec.parseDOM?.map((rule) =>
        parseRuleWithUniqueId(rule, attributeName),
      ),
      toDOM: spec.toDOM
        ? (node) =>
            outputSpecWithUniqueId(
              spec.toDOM?.(node) as DOMOutputSpec,
              attributeName,
              node.attrs[UNIQUE_ID_ATTRIBUTE] as string | null,
            )
        : undefined,
    };
  }

  return extensions;
}

function parseRuleWithUniqueId(
  rule: TagParseRule,
  attributeName: string,
): TagParseRule {
  const originalGetAttrs = rule.getAttrs;

  return {
    ...rule,
    getAttrs: (value) => {
      const originalAttrs = originalGetAttrs?.(value) ?? null;

      if (originalAttrs === false) {
        return false;
      }

      return {
        ...(originalAttrs ?? {}),
        [UNIQUE_ID_ATTRIBUTE]: value.getAttribute(attributeName),
      };
    },
  };
}

function outputSpecWithUniqueId(
  output: DOMOutputSpec,
  attributeName: string,
  id: string | null,
): DOMOutputSpec {
  if (!id || !Array.isArray(output) || typeof output[0] !== 'string') {
    return output;
  }

  const existingAttributes = isDomAttributes(output[1]) ? output[1] : null;
  const attributes = {
    ...(existingAttributes ?? {}),
    [attributeName]: id,
  };

  return (
    existingAttributes
      ? [output[0], attributes, ...output.slice(2)]
      : [output[0], attributes, ...output.slice(1)]
  ) as DOMOutputSpec;
}

function isDomAttributes(value: unknown): value is Record<string, string> {
  return Boolean(
    value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      !('nodeType' in value),
  );
}

function createUniqueIdProseMirrorPlugin(
  pluginKey: PluginKey,
  nodeTypes: ReadonlySet<string>,
  generateId: () => string,
): ProseMirrorPlugin {
  return new ProseMirrorPlugin({
    key: pluginKey,
    appendTransaction: (transactions, _oldState, newState) => {
      const shouldInspect = transactions.some(
        (transaction) =>
          transaction.docChanged ||
          transaction.getMeta(pluginKey) === 'initialize',
      );

      return shouldInspect
        ? createUniqueIdTransaction(newState, nodeTypes, generateId)
        : null;
    },
    view: (view) => {
      let destroyed = false;

      queueMicrotask(() => {
        if (!destroyed) {
          view.dispatch(view.state.tr.setMeta(pluginKey, 'initialize'));
        }
      });

      return {
        update: () => undefined,
        destroy: () => {
          destroyed = true;
        },
      };
    },
  });
}

function createUniqueIdTransaction(
  state: EditorState,
  nodeTypes: ReadonlySet<string>,
  generateId: () => string,
): Transaction | null {
  const seenIds = new Set<string>();
  let transaction = state.tr;

  state.doc.descendants((node, position) => {
    if (!nodeTypes.has(node.type.name)) {
      return;
    }

    const currentId = node.attrs[UNIQUE_ID_ATTRIBUTE] as unknown;

    if (
      typeof currentId === 'string' &&
      currentId.trim() !== '' &&
      !seenIds.has(currentId)
    ) {
      seenIds.add(currentId);

      return;
    }

    const id = generateUniqueId(generateId, seenIds);
    seenIds.add(id);
    transaction = transaction.setNodeMarkup(
      position,
      undefined,
      {
        ...node.attrs,
        [UNIQUE_ID_ATTRIBUTE]: id,
      },
      node.marks,
    );
  });

  return transaction.steps.length > 0 ? transaction : null;
}

function generateUniqueId(
  generateId: () => string,
  seenIds: ReadonlySet<string>,
): string {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const id = generateId();

    if (typeof id === 'string' && id.trim() !== '' && !seenIds.has(id)) {
      return id;
    }
  }

  throw new Error(
    'UniqueIdPlugin generateId must return a non-empty unique string.',
  );
}

function selectedUniqueId(
  state: EditorState,
  nodeTypes: ReadonlySet<string>,
): UniqueIdState | null {
  const { $from } = state.selection;

  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth);
    const id = node.attrs[UNIQUE_ID_ATTRIBUTE] as unknown;

    if (nodeTypes.has(node.type.name) && typeof id === 'string' && id !== '') {
      return {
        id,
        nodeType: node.type.name,
        position: $from.before(depth),
      };
    }
  }

  return null;
}

function defaultGenerateId(): string {
  if (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.randomUUID === 'function'
  ) {
    return globalThis.crypto.randomUUID();
  }

  return `qalma-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function assertUniqueIdPluginOptions(
  options: Readonly<UniqueIdPluginOptions>,
): void {
  if (
    !Array.isArray(options.nodeTypes) ||
    options.nodeTypes.length === 0 ||
    options.nodeTypes.some(
      (nodeType) =>
        typeof nodeType !== 'string' || nodeType.trim().length === 0,
    ) ||
    new Set(options.nodeTypes).size !== options.nodeTypes.length
  ) {
    throw new Error(
      'UniqueIdPlugin nodeTypes must contain unique non-empty node names.',
    );
  }

  if (
    typeof options.attributeName !== 'string' ||
    !/^data-[a-z0-9_.:-]+$/i.test(options.attributeName)
  ) {
    throw new Error(
      'UniqueIdPlugin attributeName must be a valid data-* attribute.',
    );
  }

  if (typeof options.generateId !== 'function') {
    throw new Error('UniqueIdPlugin generateId must be a function.');
  }
}
