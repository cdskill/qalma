import {
  QalmaEditorController,
  QalmaPlugin,
  SelectionPlugin,
  SelectionState,
  TextFormattingKit,
  createQalmaEditor,
} from '@qalma/editor';
import { TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { describe, expect, it } from 'vitest';

describe('SelectionPlugin', () => {
  it('exposes the current selection range and selected text', () => {
    const { editor, host } = mountEditor('<p>Hello <strong>Qalma</strong></p>', [
      SelectionPlugin,
      ...TextFormattingKit,
    ]);

    selectRange(editor, 1, 6);

    expect(editor.query<SelectionState>('selection')).toEqual({
      empty: false,
      from: 1,
      to: 6,
      text: 'Hello',
    });

    selectRange(editor, 7, 7);

    expect(editor.query<SelectionState>('selection')).toEqual({
      empty: true,
      from: 7,
      to: 7,
      text: '',
    });

    editor.unmount(host);
  });

  it('emits a bubbling update event when the selection changes', () => {
    const { editor, host } = mountEditor('<p>Hello Qalma</p>', [
      SelectionPlugin,
    ]);
    const updates: SelectionState[] = [];

    host.addEventListener('qalma-selection-update', (event) => {
      if (event instanceof CustomEvent) {
        updates.push(event.detail as SelectionState);
      }
    });

    selectRange(editor, 1, 6);

    expect(updates[updates.length - 1]).toEqual({
      empty: false,
      from: 1,
      to: 6,
      text: 'Hello',
    });

    editor.unmount(host);
  });
});

function mountEditor(
  content: string,
  plugins: readonly QalmaPlugin[],
): { editor: QalmaEditorController; host: HTMLElement } {
  const editor = createQalmaEditor({ content, plugins });
  const host = document.createElement('div');

  editor.mount(host);

  return { editor, host };
}

function selectRange(
  editor: QalmaEditorController,
  from: number,
  to: number,
): void {
  const view = (editor as unknown as { editorView: EditorView | undefined })
    .editorView;

  if (!view) {
    throw new Error('Editor view is not mounted.');
  }

  view.dispatch(
    view.state.tr.setSelection(TextSelection.create(view.state.doc, from, to)),
  );
}
