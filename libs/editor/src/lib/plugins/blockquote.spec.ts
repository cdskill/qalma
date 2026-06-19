import {
  BLOCKQUOTE_PLUGIN_DEFAULT_OPTIONS,
  BlockquotePlugin,
} from '../../index';
import {
  mountEditor,
  selectEditorRange,
  typeText,
} from '../../../testing/editor-test-utils';

describe('BlockquotePlugin', () => {
  it('exposes stable toggle command and command state', () => {
    const mounted = mountEditor({
      content: '<p>Quoted text</p>',
      plugins: [BlockquotePlugin],
    });

    try {
      const { editor } = mounted;

      expect(BlockquotePlugin.key).toBe('blockquote');
      expect(editor.hasCommandState('toggleBlockquote')).toBe(true);
      expect(editor.execute('toggleBlockquote')).toBe(true);
      expect(editor.isCommandActive('toggleBlockquote')).toBe(true);
      expect(editor.html()).toBe('<blockquote><p>Quoted text</p></blockquote>');

      expect(editor.execute('toggleBlockquote')).toBe(true);
      expect(editor.isCommandActive('toggleBlockquote')).toBe(false);
      expect(editor.html()).toBe('<p>Quoted text</p>');
    } finally {
      mounted.unmount();
    }
  });

  it('parses serialized blockquotes and applies markdown input rules', () => {
    const parsedMounted = mountEditor({
      content: '<blockquote><p>Quoted text</p></blockquote>',
      plugins: [BlockquotePlugin],
    });

    try {
      expect(parsedMounted.editor.html()).toBe(
        '<blockquote><p>Quoted text</p></blockquote>',
      );
    } finally {
      parsedMounted.unmount();
    }

    const inputRuleMounted = mountEditor({
      content: '<p>&gt;</p>',
      plugins: [BlockquotePlugin],
    });

    try {
      selectEditorRange(inputRuleMounted.editor, 2, 2);

      expect(typeText(inputRuleMounted.editor, ' ')).toBe(true);
      expect(inputRuleMounted.editor.html()).toBe(
        '<blockquote><p></p></blockquote>',
      );
    } finally {
      inputRuleMounted.unmount();
    }
  });

  it('exposes immutable defaults and validates configuration', () => {
    const configured = BlockquotePlugin.configure({
      inputRules: false,
    });

    expect(Object.isFrozen(BLOCKQUOTE_PLUGIN_DEFAULT_OPTIONS)).toBe(true);
    expect(Object.isFrozen(BlockquotePlugin.options)).toBe(true);
    expect(BLOCKQUOTE_PLUGIN_DEFAULT_OPTIONS).toEqual({
      inputRules: true,
    });
    expect(BlockquotePlugin.options).toEqual(BLOCKQUOTE_PLUGIN_DEFAULT_OPTIONS);
    expect(configured.options).toEqual({
      inputRules: false,
    });
    expect(() =>
      BlockquotePlugin.configure({
        inputRules: 'yes' as never,
      }),
    ).toThrowError('BlockquotePlugin inputRules must be a boolean.');
  });
});
