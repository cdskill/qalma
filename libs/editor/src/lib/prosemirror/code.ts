import { Mark, NodeType } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

export function isInCodeContext(state: EditorState): boolean {
  const { selection } = state;

  if (isCodeTextblock(selection.$from.parent.type)) {
    return true;
  }

  if ((state.storedMarks ?? selection.$from.marks()).some(isCodeMark)) {
    return true;
  }

  if (selection.empty) {
    return false;
  }

  let containsCodeMark = false;

  state.doc.nodesBetween(selection.from, selection.to, (node) => {
    if (containsCodeMark) {
      return false;
    }

    if (node.isInline && node.marks.some(isCodeMark)) {
      containsCodeMark = true;

      return false;
    }

    return undefined;
  });

  return containsCodeMark;
}

function isCodeTextblock(type: NodeType): boolean {
  return Boolean(type.spec.code);
}

function isCodeMark(mark: Mark): boolean {
  return Boolean(mark.type.spec.code);
}
