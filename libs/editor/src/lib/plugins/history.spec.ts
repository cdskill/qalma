import { HISTORY_PLUGIN_DEFAULT_OPTIONS, HistoryPlugin } from '../../index';
import {
  dispatchModKey,
  getEditorView,
  mountEditor,
  placeCursorAfterText,
} from '../../../testing/editor-test-utils';

describe('HistoryPlugin', () => {
  it('exposes stable undo and redo commands', () => {
    const mounted = mountEditor({
      content: '<p>Qalma</p>',
      plugins: [HistoryPlugin],
    });

    try {
      const { editor } = mounted;
      const view = getEditorView(editor);

      placeCursorAfterText(editor, 'Qalma');
      view.dispatch(view.state.tr.insertText('!'));

      expect(HistoryPlugin.key).toBe('history');
      expect(editor.html()).toBe('<p>Qalma!</p>');
      expect(editor.canExecute('undo')).toBe(true);
      expect(editor.execute('undo')).toBe(true);
      expect(editor.html()).toBe('<p>Qalma</p>');
      expect(editor.canExecute('redo')).toBe(true);
      expect(editor.execute('redo')).toBe(true);
      expect(editor.html()).toBe('<p>Qalma!</p>');
    } finally {
      mounted.unmount();
    }
  });

  it('maps undo and redo shortcuts', () => {
    const mounted = mountEditor({
      content: '<p>Qalma</p>',
      plugins: [HistoryPlugin],
    });

    try {
      const { editor } = mounted;
      const view = getEditorView(editor);

      placeCursorAfterText(editor, 'Qalma');
      view.dispatch(view.state.tr.insertText('!'));

      const undoEvent = dispatchModKey(editor, 'z');

      expect(undoEvent.defaultPrevented).toBe(true);
      expect(editor.html()).toBe('<p>Qalma</p>');

      const shiftRedoEvent = dispatchModKey(editor, 'z', {
        shiftKey: true,
      });

      expect(shiftRedoEvent.defaultPrevented).toBe(true);
      expect(editor.html()).toBe('<p>Qalma!</p>');

      expect(dispatchModKey(editor, 'z').defaultPrevented).toBe(true);
      expect(editor.html()).toBe('<p>Qalma</p>');

      const modYRedoEvent = dispatchModKey(editor, 'y');

      expect(modYRedoEvent.defaultPrevented).toBe(true);
      expect(editor.html()).toBe('<p>Qalma!</p>');
    } finally {
      mounted.unmount();
    }
  });

  it('exposes immutable defaults and validates configuration', () => {
    const configured = HistoryPlugin.configure({
      depth: 200,
      newGroupDelay: 250,
    });

    expect(Object.isFrozen(HISTORY_PLUGIN_DEFAULT_OPTIONS)).toBe(true);
    expect(Object.isFrozen(HistoryPlugin.options)).toBe(true);
    expect(HISTORY_PLUGIN_DEFAULT_OPTIONS).toEqual({
      depth: 100,
      newGroupDelay: 500,
    });
    expect(HistoryPlugin.options).toEqual(HISTORY_PLUGIN_DEFAULT_OPTIONS);
    expect(configured.options).toEqual({
      depth: 200,
      newGroupDelay: 250,
    });
    expect(() =>
      HistoryPlugin.configure({
        depth: 0,
      }),
    ).toThrowError('HistoryPlugin depth must be a positive integer.');
    expect(() =>
      HistoryPlugin.configure({
        newGroupDelay: -1,
      }),
    ).toThrowError(
      'HistoryPlugin newGroupDelay must be a non-negative finite number.',
    );
  });
});
