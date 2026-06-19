import {
  INLINE_CODE_PLUGIN_DEFAULT_OPTIONS,
  InlineCodePlugin,
} from '../../index';
import {
  dispatchModKey,
  mountEditor,
  placeCursorAfterText,
  selectText,
  typeText,
} from '../../../testing/editor-test-utils';

describe('InlineCodePlugin', () => {
  it('exposes stable commands and command state', () => {
    const mounted = mountEditor({
      content: '<p>Use createQalmaEditor to start.</p>',
      plugins: [InlineCodePlugin],
    });

    try {
      const { editor } = mounted;

      selectText(editor, 'createQalmaEditor');

      expect(InlineCodePlugin.key).toBe('inlineCode');
      expect(editor.hasCommandState('toggleInlineCode')).toBe(true);
      expect(editor.canExecute('toggleInlineCode')).toBe(true);
      expect(editor.execute('toggleInlineCode')).toBe(true);
      expect(editor.isCommandActive('toggleInlineCode')).toBe(true);
      expect(editor.html()).toBe(
        '<p>Use <code>createQalmaEditor</code> to start.</p>',
      );

      expect(editor.execute('toggleInlineCode')).toBe(true);
      expect(editor.isCommandActive('toggleInlineCode')).toBe(false);
      expect(editor.html()).toBe('<p>Use createQalmaEditor to start.</p>');
    } finally {
      mounted.unmount();
    }
  });

  it('parses serialized inline code and maps Mod-e', () => {
    const mounted = mountEditor({
      content: '<p>Use <code>createQalmaEditor</code> to start.</p>',
      plugins: [InlineCodePlugin],
    });

    try {
      const { editor } = mounted;

      selectText(editor, 'createQalmaEditor');

      expect(editor.html()).toBe(
        '<p>Use <code>createQalmaEditor</code> to start.</p>',
      );
      expect(editor.isCommandActive('toggleInlineCode')).toBe(true);

      const event = dispatchModKey(editor, 'e');

      expect(event.defaultPrevented).toBe(true);
      expect(editor.html()).toBe('<p>Use createQalmaEditor to start.</p>');
    } finally {
      mounted.unmount();
    }
  });

  it('converts matching backticks when input rules are enabled', () => {
    const mounted = mountEditor({
      content: '<p>`createQalmaEditor</p>',
      plugins: [InlineCodePlugin],
    });

    try {
      placeCursorAfterText(mounted.editor, 'createQalmaEditor');

      expect(typeText(mounted.editor, '`')).toBe(true);
      expect(mounted.editor.html()).toBe(
        '<p><code>createQalmaEditor</code></p>',
      );
    } finally {
      mounted.unmount();
    }
  });

  it('exposes immutable defaults and validates configuration', () => {
    const configured = InlineCodePlugin.configure({
      inputRules: false,
    });

    expect(Object.isFrozen(INLINE_CODE_PLUGIN_DEFAULT_OPTIONS)).toBe(true);
    expect(Object.isFrozen(InlineCodePlugin.options)).toBe(true);
    expect(INLINE_CODE_PLUGIN_DEFAULT_OPTIONS).toEqual({
      inputRules: true,
    });
    expect(InlineCodePlugin.options).toEqual(
      INLINE_CODE_PLUGIN_DEFAULT_OPTIONS,
    );
    expect(configured.options).toEqual({
      inputRules: false,
    });
    expect(() =>
      InlineCodePlugin.configure({
        inputRules: 'yes' as never,
      }),
    ).toThrowError('InlineCodePlugin inputRules must be a boolean.');
  });
});
