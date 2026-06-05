import { setBlockType } from 'prosemirror-commands';
import { NodeSpec, NodeType } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

import {
  createConfigurableRtePlugin,
  createRtePlugin,
  RteCommandHandler,
  RtePlugin,
} from './rte-plugin';

export type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

export interface HeadingsPluginOptions {
  levels: readonly HeadingLevel[];
}

export const HEADING_LEVELS: readonly HeadingLevel[] = Object.freeze([
  1, 2, 3, 4, 5, 6,
]);

export const HEADINGS_PLUGIN_DEFAULT_OPTIONS: Readonly<HeadingsPluginOptions> =
  Object.freeze({
    levels: Object.freeze([1, 2, 3] satisfies HeadingLevel[]),
  });

export const HeadingsPlugin = createConfigurableRtePlugin(
  HEADINGS_PLUGIN_DEFAULT_OPTIONS,
  (options) => {
    assertHeadingsPluginOptions(options);

    const headingNode: NodeSpec = {
      attrs: {
        level: { default: options.levels[0] },
      },
      content: 'inline*',
      defining: true,
      group: 'block',
      parseDOM: options.levels.map((level) => ({
        tag: `h${level}`,
        attrs: { level },
      })),
      toDOM: (node) => [`h${node.attrs['level']}`, 0],
    };

    return createRtePlugin({
      key: 'headings',
      nodes: {
        heading: headingNode,
      },
      commands: (schema) => ({
        setParagraph: createSetParagraphCommand(schema.nodes['paragraph']),
        ...createHeadingCommands(
          schema.nodes['heading'],
          schema.nodes['paragraph'],
          options.levels,
        ),
      }),
      commandStates: (schema) => ({
        setParagraph: (state) => isParagraphActive(state),
        ...createHeadingCommandStates(schema.nodes['heading'], options.levels),
      }),
      shortcuts: (schema) => createHeadingShortcuts(schema, options.levels),
    });
  },
);

export const HeadingsKit: readonly RtePlugin[] = [HeadingsPlugin];

function createSetParagraphCommand(paragraph: NodeType): RteCommandHandler {
  return (state, dispatch) => {
    if (isParagraphActive(state)) {
      return true;
    }

    return setBlockType(paragraph)(state, dispatch);
  };
}

function createHeadingCommands(
  heading: NodeType,
  paragraph: NodeType,
  levels: readonly HeadingLevel[],
): Record<string, RteCommandHandler> {
  return Object.fromEntries(
    levels.map((level) => [
      getHeadingCommandName(level),
      createToggleHeadingCommand(heading, paragraph, level),
    ]),
  );
}

function createToggleHeadingCommand(
  heading: NodeType,
  paragraph: NodeType,
  level: HeadingLevel,
): RteCommandHandler {
  return (state, dispatch) => {
    if (isHeadingActive(state, heading, level)) {
      return setBlockType(paragraph)(state, dispatch);
    }

    return setBlockType(heading, { level })(state, dispatch);
  };
}

function createHeadingCommandStates(
  heading: NodeType,
  levels: readonly HeadingLevel[],
): Record<string, (state: EditorState) => boolean> {
  return Object.fromEntries(
    levels.map((level) => [
      getHeadingCommandName(level),
      (state) => isHeadingActive(state, heading, level),
    ]),
  );
}

function createHeadingShortcuts(
  schema: Parameters<NonNullable<RtePlugin['shortcuts']>>[0],
  levels: readonly HeadingLevel[],
) {
  return Object.fromEntries(
    levels.map((level) => [
      `Mod-Alt-${level}`,
      createToggleHeadingCommand(
        schema.nodes['heading'],
        schema.nodes['paragraph'],
        level,
      ),
    ]),
  );
}

function getHeadingCommandName(level: HeadingLevel): string {
  return `toggleHeading${level}`;
}

function isParagraphActive(state: EditorState): boolean {
  return state.selection.$from.parent.type === state.schema.nodes['paragraph'];
}

function isHeadingActive(
  state: EditorState,
  heading: NodeType,
  level: HeadingLevel,
): boolean {
  const parent = state.selection.$from.parent;

  return parent.type === heading && parent.attrs['level'] === level;
}

function assertHeadingsPluginOptions(
  options: Readonly<HeadingsPluginOptions>,
): void {
  if (!Array.isArray(options.levels)) {
    throw new TypeError('HeadingsPlugin levels must be an array.');
  }

  if (options.levels.length === 0) {
    throw new RangeError(
      'HeadingsPlugin levels must include at least one heading level.',
    );
  }

  const seen = new Set<HeadingLevel>();

  for (const level of options.levels) {
    if (!HEADING_LEVELS.includes(level)) {
      throw new RangeError(
        'HeadingsPlugin levels entries must be integers from 1 through 6.',
      );
    }

    if (seen.has(level)) {
      throw new Error('HeadingsPlugin levels entries must be unique.');
    }

    seen.add(level);
  }
}
