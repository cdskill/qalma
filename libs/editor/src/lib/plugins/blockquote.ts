import { lift, wrapIn } from 'prosemirror-commands';
import { NodeSpec, NodeType } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

import { createRtePlugin, RteCommandHandler, RtePlugin } from './rte-plugin';

const blockquoteNode: NodeSpec = {
  content: 'block+',
  group: 'block',
  defining: true,
  parseDOM: [{ tag: 'blockquote' }],
  toDOM: () => ['blockquote', 0],
};

export const BlockquotePlugin = createRtePlugin({
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
});

export const BlockquoteKit: readonly RtePlugin[] = [BlockquotePlugin];

function createToggleBlockquoteCommand(
  blockquote: NodeType,
): RteCommandHandler {
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
