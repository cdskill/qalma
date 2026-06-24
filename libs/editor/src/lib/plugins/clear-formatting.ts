import { Node as ProseMirrorNode, NodeType } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

import { createQalmaPlugin, QalmaCommandHandler, QalmaPlugin } from './qalma-plugin';

export const ClearFormattingPlugin = /* @__PURE__ */ createQalmaPlugin({
  key: 'clearFormatting',
  commands: (schema) => ({
    clearFormatting: createClearFormattingCommand(schema.nodes['paragraph']),
  }),
});

export const ClearFormattingKit: readonly QalmaPlugin[] = [
  ClearFormattingPlugin,
];

function createClearFormattingCommand(
  paragraph: NodeType,
): QalmaCommandHandler {
  return (state, dispatch) => {
    const markRanges = getMarkRangesToClear(state);
    const hasMarksToClear =
      Boolean(state.storedMarks?.length) ||
      markRanges.some((range) =>
        rangeHasInlineMarks(state.doc, range.from, range.to),
      );
    const hasTextblocksToClear = selectionHasTextblockFormattingToClear(
      state,
      paragraph,
    );

    if (!hasMarksToClear && !hasTextblocksToClear) {
      return false;
    }

    if (dispatch) {
      const transaction = state.tr;

      if (state.storedMarks?.length) {
        transaction.setStoredMarks([]);
      }

      if (hasMarksToClear) {
        for (const range of markRanges) {
          if (range.from < range.to) {
            transaction.removeMark(range.from, range.to, null);
          }
        }
      }

      if (hasTextblocksToClear) {
        for (const range of state.selection.ranges) {
          transaction.setBlockType(range.$from.pos, range.$to.pos, paragraph);
        }
      }

      dispatch(transaction.scrollIntoView());
    }

    return true;
  };
}

interface DocumentRange {
  from: number;
  to: number;
}

function getMarkRangesToClear(state: EditorState): readonly DocumentRange[] {
  if (!state.selection.empty) {
    return state.selection.ranges.map((range) => ({
      from: range.$from.pos,
      to: range.$to.pos,
    }));
  }

  const { $from } = state.selection;

  if ($from.depth === 0 || !$from.parent.inlineContent) {
    return [];
  }

  return [
    {
      from: $from.start(),
      to: $from.end(),
    },
  ];
}

function rangeHasInlineMarks(
  doc: ProseMirrorNode,
  from: number,
  to: number,
): boolean {
  if (from >= to) {
    return false;
  }

  let hasMarks = false;

  doc.nodesBetween(from, to, (node) => {
    if (hasMarks) {
      return false;
    }

    if (node.isInline && node.marks.length > 0) {
      hasMarks = true;

      return false;
    }

    return undefined;
  });

  return hasMarks;
}

function selectionHasTextblockFormattingToClear(
  state: EditorState,
  paragraph: NodeType,
): boolean {
  let applicable = false;

  for (const range of state.selection.ranges) {
    if (applicable) {
      break;
    }

    state.doc.nodesBetween(range.$from.pos, range.$to.pos, (node, pos) => {
      if (applicable) {
        return false;
      }

      if (!node.isTextblock || node.hasMarkup(paragraph)) {
        return undefined;
      }

      if (node.type === paragraph) {
        applicable = true;

        return false;
      }

      const $pos = state.doc.resolve(pos);
      const index = $pos.index();

      if ($pos.parent.canReplaceWith(index, index + 1, paragraph)) {
        applicable = true;

        return false;
      }

      return undefined;
    });
  }

  return applicable;
}
