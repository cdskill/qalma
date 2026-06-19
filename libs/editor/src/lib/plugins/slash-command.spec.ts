import {
  CodeBlockPlugin,
  HistoryPlugin,
  InlineCodePlugin,
  SLASH_COMMAND_PLUGIN_DEFAULT_OPTIONS,
  SlashCommandPlugin,
  SlashCommandState,
} from '../../index';
import {
  dispatchKey,
  getEditorView,
  insertText,
  mountEditor,
  placeCursorAfterText,
} from '../../../testing/editor-test-utils';

describe('SlashCommandPlugin', () => {
  it('exposes stable slash command query and delete/dismiss commands', () => {
    const mounted = mountEditor({
      content: '<p>/he</p>',
      plugins: [SlashCommandPlugin],
    });

    try {
      const { editor } = mounted;

      placeCursorAfterText(editor, '/he');

      expect(SlashCommandPlugin.key).toBe('slashCommand');
      expect(editor.hasQuery('slashCommand')).toBe(true);
      expect(editor.query<SlashCommandState>('slashCommand')).toEqual({
        from: 1,
        to: 4,
        query: 'he',
        trigger: '/',
      });

      expect(editor.execute('dismissSlashCommand')).toBe(true);
      expect(editor.query<SlashCommandState>('slashCommand')).toBeNull();

      insertText(editor, 'l');

      expect(editor.query<SlashCommandState>('slashCommand')).toEqual({
        from: 1,
        to: 5,
        query: 'hel',
        trigger: '/',
      });
      expect(editor.execute('deleteSlashCommand')).toBe(true);
      expect(editor.html()).toBe('<p></p>');
    } finally {
      mounted.unmount();
    }
  });

  it('re-detects a deleted slash command after undo restores the text', () => {
    const mounted = mountEditor({
      content: '<p>/he</p>',
      plugins: [SlashCommandPlugin, HistoryPlugin],
    });

    try {
      const { editor } = mounted;

      placeCursorAfterText(editor, '/he');

      expect(editor.execute('deleteSlashCommand')).toBe(true);
      expect(editor.html()).toBe('<p></p>');
      expect(editor.execute('undo')).toBe(true);
      expect(editor.html()).toBe('<p>/he</p>');
      expect(editor.query<SlashCommandState>('slashCommand')).toEqual({
        from: 1,
        to: 4,
        query: 'he',
        trigger: '/',
      });
    } finally {
      mounted.unmount();
    }
  });

  it('splits only non-empty slash command blocks', () => {
    const mounted = mountEditor({
      content: '<p>Title /</p>',
      plugins: [SlashCommandPlugin],
    });

    try {
      const { editor } = mounted;

      placeCursorAfterText(editor, '/');

      expect(editor.execute('splitSlashCommandBlock')).toBe(true);
      expect(editor.html()).toBe('<p>Title /</p><p></p>');

      editor.setHtml('<p></p>');

      expect(editor.execute('splitSlashCommandBlock')).toBe(false);
      expect(editor.html()).toBe('<p></p>');
    } finally {
      mounted.unmount();
    }
  });

  it('dispatches cancellable navigation events for consumer-owned slash UI', () => {
    const mounted = mountEditor({
      content: '<p>/he</p>',
      plugins: [SlashCommandPlugin],
    });

    try {
      const { editor } = mounted;
      const view = getEditorView(editor);
      const slashKeydown = vi.fn((event: Event) => event.preventDefault());

      placeCursorAfterText(editor, '/he');
      view.dom.addEventListener('qalma-slash-command-keydown', slashKeydown);

      const event = dispatchKey(editor, 'ArrowDown');

      expect(event.defaultPrevented).toBe(true);
      expect(slashKeydown).toHaveBeenCalledWith(
        expect.objectContaining({
          detail: {
            key: 'ArrowDown',
          },
        }),
      );
    } finally {
      mounted.unmount();
    }
  });

  it('keeps slash commands disabled inside code contexts', () => {
    const codeBlockMounted = mountEditor({
      content: '<pre><code>/he</code></pre>',
      plugins: [CodeBlockPlugin, SlashCommandPlugin],
    });

    try {
      placeCursorAfterText(codeBlockMounted.editor, '/he');

      expect(
        codeBlockMounted.editor.query<SlashCommandState>('slashCommand'),
      ).toBeNull();
      expect(codeBlockMounted.editor.execute('deleteSlashCommand')).toBe(false);
    } finally {
      codeBlockMounted.unmount();
    }

    const inlineCodeMounted = mountEditor({
      content: '<p><code>/he</code></p>',
      plugins: [InlineCodePlugin, SlashCommandPlugin],
    });

    try {
      placeCursorAfterText(inlineCodeMounted.editor, '/he');

      expect(
        inlineCodeMounted.editor.query<SlashCommandState>('slashCommand'),
      ).toBeNull();
      expect(inlineCodeMounted.editor.execute('deleteSlashCommand')).toBe(
        false,
      );
    } finally {
      inlineCodeMounted.unmount();
    }
  });

  it('exposes immutable defaults and validates configuration', () => {
    const configured = SlashCommandPlugin.configure({
      trigger: '+',
      minQueryLength: 1,
      maxQueryLength: 24,
    });

    expect(Object.isFrozen(SLASH_COMMAND_PLUGIN_DEFAULT_OPTIONS)).toBe(true);
    expect(Object.isFrozen(SlashCommandPlugin.options)).toBe(true);
    expect(SLASH_COMMAND_PLUGIN_DEFAULT_OPTIONS).toEqual({
      trigger: '/',
      minQueryLength: 0,
      maxQueryLength: 64,
    });
    expect(SlashCommandPlugin.options).toEqual(
      SLASH_COMMAND_PLUGIN_DEFAULT_OPTIONS,
    );
    expect(configured.options).toEqual({
      trigger: '+',
      minQueryLength: 1,
      maxQueryLength: 24,
    });
    expect(() =>
      SlashCommandPlugin.configure({
        trigger: '//',
      }),
    ).toThrowError(
      'SlashCommandPlugin trigger must be a single non-whitespace character.',
    );
    expect(() =>
      SlashCommandPlugin.configure({
        minQueryLength: -1,
      }),
    ).toThrowError(
      'SlashCommandPlugin minQueryLength must be a non-negative integer.',
    );
    expect(() =>
      SlashCommandPlugin.configure({
        maxQueryLength: -1,
      }),
    ).toThrowError(
      'SlashCommandPlugin maxQueryLength must be a non-negative integer.',
    );
    expect(() =>
      SlashCommandPlugin.configure({
        minQueryLength: 3,
        maxQueryLength: 2,
      }),
    ).toThrowError(
      'SlashCommandPlugin maxQueryLength must be greater than or equal to minQueryLength.',
    );
  });
});
