import { lift, wrapIn } from 'prosemirror-commands';
import { inputRules, wrappingInputRule } from 'prosemirror-inputrules';
import { NodeSpec, NodeType } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

import {
  createConfigurableQalmaPlugin,
  createQalmaPlugin,
  QalmaCommandHandler,
  QalmaPlugin,
} from './qalma-plugin';

export interface BlockquotePluginOptions {
  /**
   * Enable the markdown-style input rule: typing `>` followed by a space at
   * the start of a textblock wraps it in a blockquote. Backspace immediately
   * after reverts to the literal characters.
   */
  inputRules: boolean;
}

export const BLOCKQUOTE_PLUGIN_DEFAULT_OPTIONS: Readonly<BlockquotePluginOptions> =
  Object.freeze({
    inputRules: true,
  });

const blockquoteNode: NodeSpec = {
  content: 'block+',
  group: 'block',
  defining: true,
  parseDOM: [{ tag: 'blockquote' }],
  toDOM: () => ['blockquote', 0],
};

export const BlockquotePlugin = createConfigurableQalmaPlugin(
  BLOCKQUOTE_PLUGIN_DEFAULT_OPTIONS,
  (options) => {
    assertBlockquotePluginOptions(options);

    return createQalmaPlugin({
      key: 'blockquote',
      nodes: {
        blockquote: blockquoteNode,
      },
      commands: (schema) => ({
        toggleBlockquote: createToggleBlockquoteCommand(
          schema.nodes['blockquote'],
        ),
      }),
      commandStates: (schema) => ({
        toggleBlockquote: (state) =>
          isBlockquoteActive(state, schema.nodes['blockquote']),
      }),
      prosemirrorPlugins: options.inputRules
        ? (schema) => [
            inputRules({
              rules: [wrappingInputRule(/^\s*>\s$/, schema.nodes['blockquote'])],
            }),
          ]
        : undefined,
    });
  },
);

export const BlockquoteKit: readonly QalmaPlugin[] = [BlockquotePlugin];

function createToggleBlockquoteCommand(
  blockquote: NodeType,
): QalmaCommandHandler {
  return (state, dispatch) => {
    if (isBlockquoteActive(state, blockquote)) {
      return lift(state, dispatch);
    }

    return wrapIn(blockquote)(state, dispatch);
  };
}

function isBlockquoteActive(state: EditorState, blockquote: NodeType): boolean {
  const { $from } = state.selection;

  for (let depth = $from.depth; depth > 0; depth -= 1) {
    if ($from.node(depth).type === blockquote) {
      return true;
    }
  }

  return false;
}

function assertBlockquotePluginOptions(
  options: Readonly<BlockquotePluginOptions>,
): void {
  if (typeof options.inputRules !== 'boolean') {
    throw new TypeError('BlockquotePlugin inputRules must be a boolean.');
  }
}
