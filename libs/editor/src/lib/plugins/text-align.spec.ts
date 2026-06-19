import {
  BlockquotePlugin,
  HeadingsPlugin,
  ListsPlugin,
  TEXT_ALIGN_PLUGIN_DEFAULT_OPTIONS,
  TextAlignPlugin,
} from '../../index';
import { mountEditor, selectText } from '../../../testing/editor-test-utils';

describe('TextAlignPlugin', () => {
  it('exposes stable alignment commands, command states, and query state', () => {
    const mounted = mountEditor({
      content: '<p>Aligned text</p>',
      plugins: [TextAlignPlugin, HeadingsPlugin],
    });

    try {
      const { editor } = mounted;

      expect(TextAlignPlugin.key).toBe('textAlign');
      expect(editor.hasCommandState('setTextAlignLeft')).toBe(true);
      expect(editor.hasCommandState('setTextAlignCenter')).toBe(true);
      expect(editor.hasQuery('textAlign')).toBe(true);
      expect(editor.canExecute('setTextAlignCenter')).toBe(true);
      expect(editor.isCommandActive('setTextAlignLeft')).toBe(true);
      expect(editor.query('textAlign')).toBe('left');

      expect(editor.execute('setTextAlignCenter')).toBe(true);
      expect(editor.isCommandActive('setTextAlignCenter')).toBe(true);
      expect(editor.query('textAlign')).toBe('center');
      expect(editor.html()).toBe(
        '<p style="text-align: center;">Aligned text</p>',
      );

      expect(editor.execute('setTextAlignLeft')).toBe(true);
      expect(editor.isCommandActive('setTextAlignLeft')).toBe(true);
      expect(editor.html()).toBe('<p>Aligned text</p>');

      editor.setHtml('<h2 style="text-align: right;">Aligned heading</h2>');

      expect(editor.isCommandActive('setTextAlignRight')).toBe(true);
      expect(editor.query('textAlign')).toBe('right');
      expect(editor.execute('setTextAlignJustify')).toBe(true);
      expect(editor.html()).toBe(
        '<h2 style="text-align: justify;">Aligned heading</h2>',
      );
    } finally {
      mounted.unmount();
    }
  });

  it('aligns configured container nodes such as list items and blockquotes', () => {
    const mounted = mountEditor({
      content:
        '<ul><li><p>Aligned list item</p></li></ul><blockquote><p>Aligned quote</p></blockquote>',
      plugins: [TextAlignPlugin, ListsPlugin, BlockquotePlugin],
    });

    try {
      const { editor } = mounted;

      selectText(editor, 'Aligned list item');

      expect(editor.execute('setTextAlignCenter')).toBe(true);
      expect(editor.html()).toContain(
        '<li style="text-align: center;"><p>Aligned list item</p></li>',
      );

      selectText(editor, 'Aligned quote');

      expect(editor.execute('setTextAlignRight')).toBe(true);
      expect(editor.html()).toContain(
        '<blockquote style="text-align: right;"><p>Aligned quote</p></blockquote>',
      );
    } finally {
      mounted.unmount();
    }
  });

  it('honors configured alignments and node targets', () => {
    const mounted = mountEditor({
      content: '<p>Paragraph</p><h2>Heading</h2>',
      plugins: [
        TextAlignPlugin.configure({
          alignments: ['left', 'center'],
          nodes: ['paragraph'],
        }),
        HeadingsPlugin,
      ],
    });

    try {
      const { editor } = mounted;

      expect(editor.canExecute('setTextAlignRight')).toBe(false);

      selectText(editor, 'Paragraph');

      expect(editor.execute('setTextAlignCenter')).toBe(true);
      expect(editor.html()).toContain(
        '<p style="text-align: center;">Paragraph</p>',
      );

      selectText(editor, 'Heading');

      expect(editor.canExecute('setTextAlignCenter')).toBe(false);
    } finally {
      mounted.unmount();
    }
  });

  it('exposes immutable defaults and validates configuration', () => {
    const configured = TextAlignPlugin.configure({
      alignments: ['left', 'center'],
      nodes: ['paragraph'],
    });

    expect(Object.isFrozen(TEXT_ALIGN_PLUGIN_DEFAULT_OPTIONS)).toBe(true);
    expect(Object.isFrozen(TextAlignPlugin.options)).toBe(true);
    expect(TEXT_ALIGN_PLUGIN_DEFAULT_OPTIONS).toEqual({
      alignments: ['left', 'center', 'right', 'justify'],
      nodes: ['paragraph', 'heading', 'listItem', 'blockquote'],
    });
    expect(TextAlignPlugin.options).toEqual(TEXT_ALIGN_PLUGIN_DEFAULT_OPTIONS);
    expect(configured.options).toEqual({
      alignments: ['left', 'center'],
      nodes: ['paragraph'],
    });
    expect(() =>
      TextAlignPlugin.configure({
        alignments: [],
      }),
    ).toThrowError(
      'TextAlignPlugin alignments must include at least one value.',
    );
    expect(() =>
      TextAlignPlugin.configure({
        alignments: ['center', 'center'],
      }),
    ).toThrowError('TextAlignPlugin alignments entries must be unique.');
    expect(() =>
      TextAlignPlugin.configure({
        nodes: ['paragraph', 'paragraph'],
      }),
    ).toThrowError('TextAlignPlugin nodes entries must be unique.');
    expect(() =>
      TextAlignPlugin.configure({
        nodes: ['paragraph', 'table' as never],
      }),
    ).toThrowError(
      'TextAlignPlugin nodes entries include an unsupported value.',
    );
  });
});
