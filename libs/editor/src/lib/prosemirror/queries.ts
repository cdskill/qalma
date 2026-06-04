import { MarkType } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

export function isMarkActive(state: EditorState, mark: MarkType): boolean {
  const { from, $from, to, empty } = state.selection;

  if (empty) {
    return Boolean(mark.isInSet(state.storedMarks ?? $from.marks()));
  }

  return state.doc.rangeHasMark(from, to, mark);
}
