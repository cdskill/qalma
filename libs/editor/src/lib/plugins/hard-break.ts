import { NodeSpec, NodeType } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

import { createQalmaPlugin, QalmaCommandHandler, QalmaPlugin } from './qalma-plugin';

const hardBreakNode: NodeSpec = {
  inline: true,
  group: 'inline',
  selectable: false,
  linebreakReplacement: true,
  parseDOM: [{ tag: 'br' }],
  toDOM: () => ['br'],
  leafText: () => '\n',
};

export const HardBreakPlugin = /* @__PURE__ */ createQalmaPlugin({
  key: 'hardBreak',
  nodes: {
    hardBreak: hardBreakNode,
  },
  commands: (schema) => ({
    insertHardBreak: createInsertHardBreakCommand(schema.nodes['hardBreak']),
  }),
  shortcuts: (schema) => ({
    'Shift-Enter': createInsertHardBreakCommand(schema.nodes['hardBreak']),
  }),
});

export const HardBreakKit: readonly QalmaPlugin[] = [HardBreakPlugin];

function createInsertHardBreakCommand(
  hardBreak: NodeType,
): QalmaCommandHandler {
  return (state, dispatch) => {
    if (!canInsertHardBreak(state, hardBreak)) {
      return false;
    }

    if (dispatch) {
      dispatch(
        state.tr.replaceSelectionWith(hardBreak.create()).scrollIntoView(),
      );
    }

    return true;
  };
}

function canInsertHardBreak(state: EditorState, hardBreak: NodeType): boolean {
  const { $from, $to } = state.selection;

  return (
    $from.sameParent($to) &&
    $from.parent.inlineContent &&
    $from.parent.canReplaceWith($from.index(), $to.index(), hardBreak)
  );
}
