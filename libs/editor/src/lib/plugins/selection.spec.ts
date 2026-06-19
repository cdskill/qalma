import {
  SelectionPlugin,
  SelectionState,
  TextFormattingKit,
} from '../../index';
import { mountEditor, selectEditorRange } from '../../../testing/editor-test-utils';

describe('SelectionPlugin', () => {
  it('exposes the current selection range and selected text', () => {
    const mounted = mountEditor({
      content: '<p>Hello <strong>Qalma</strong></p>',
      plugins: [SelectionPlugin, ...TextFormattingKit],
    });

    try {
      const { editor } = mounted;

      expect(SelectionPlugin.key).toBe('selection');
      expect(editor.hasQuery('selection')).toBe(true);

      selectEditorRange(editor, 1, 6);

      expect(editor.query<SelectionState>('selection')).toEqual({
        empty: false,
        from: 1,
        to: 6,
        text: 'Hello',
      });

      selectEditorRange(editor, 7, 7);

      expect(editor.query<SelectionState>('selection')).toEqual({
        empty: true,
        from: 7,
        to: 7,
        text: '',
      });
    } finally {
      mounted.unmount();
    }
  });

  it('emits a bubbling update event when the selection changes', () => {
    const mounted = mountEditor({
      content: '<p>Hello Qalma</p>',
      plugins: [SelectionPlugin],
    });

    try {
      const updates: SelectionState[] = [];

      mounted.host.addEventListener('qalma-selection-update', (event) => {
        if (event instanceof CustomEvent) {
          updates.push(event.detail as SelectionState);
        }
      });

      selectEditorRange(mounted.editor, 1, 6);

      expect(updates[updates.length - 1]).toEqual({
        empty: false,
        from: 1,
        to: 6,
        text: 'Hello',
      });
    } finally {
      mounted.unmount();
    }
  });
});
