import {
  CHARACTER_COUNT_PLUGIN_DEFAULT_OPTIONS,
  CharacterCountPlugin,
  CharacterCountState,
} from '../../index';
import { getEditorView, mountEditor } from '../../../testing/editor-test-utils';

describe('CharacterCountPlugin', () => {
  it('reports graphemes, words, and the configured limit', () => {
    const mounted = mountEditor({
      content: '<p>Hello 👨‍👩‍👧‍👦 world</p>',
      plugins: [CharacterCountPlugin.configure({ limit: 20 })],
    });

    try {
      expect(
        mounted.editor.query<CharacterCountState>('characterCount'),
      ).toEqual({
        characters: 13,
        words: 3,
        limit: 20,
        remaining: 7,
        isOverLimit: false,
      });
    } finally {
      mounted.unmount();
    }
  });

  it('blocks growth beyond the limit but allows an over-limit document to shrink', () => {
    const mounted = mountEditor({
      content: '<p>12345</p>',
      plugins: [CharacterCountPlugin.configure({ limit: 5 })],
    });

    try {
      const view = getEditorView(mounted.editor);

      view.dispatch(view.state.tr.insertText('6', 6));
      expect(mounted.editor.getMarkdown()).toBe('12345');

      mounted.editor.setHtml('<p>123456</p>');
      expect(
        mounted.editor.query<CharacterCountState>('characterCount')
          ?.isOverLimit,
      ).toBe(true);

      const overLimitView = getEditorView(mounted.editor);
      overLimitView.dispatch(overLimitView.state.tr.delete(6, 7));
      expect(mounted.editor.getMarkdown()).toBe('12345');
    } finally {
      mounted.unmount();
    }
  });

  it('supports code-point counting and validates immutable defaults', () => {
    const mounted = mountEditor({
      content: '<p>👨‍👩‍👧‍👦</p>',
      plugins: [CharacterCountPlugin.configure({ mode: 'codePoint' })],
    });

    try {
      expect(
        mounted.editor.query<CharacterCountState>('characterCount')?.characters,
      ).toBe(7);
      expect(Object.isFrozen(CHARACTER_COUNT_PLUGIN_DEFAULT_OPTIONS)).toBe(
        true,
      );
      expect(CharacterCountPlugin.options).toEqual({
        limit: null,
        mode: 'grapheme',
      });
      expect(() => CharacterCountPlugin.configure({ limit: -1 })).toThrow(
        /non-negative integer/,
      );
    } finally {
      mounted.unmount();
    }
  });
});
