import {
  CodeBlockPlugin,
  InlineCodePlugin,
  MENTION_PLUGIN_DEFAULT_OPTIONS,
  MentionPlugin,
  MentionState,
} from '../../index';
import {
  dispatchKey,
  getEditorSelectionFrom,
  getEditorView,
  mountEditor,
  placeCursorAfterText,
} from '../../../testing/editor-test-utils';

describe('MentionPlugin', () => {
  it('exposes stable mention query and insertion command', () => {
    const mounted = mountEditor({
      content: '<p>Hello @gr</p>',
      plugins: [MentionPlugin],
    });

    try {
      const { editor } = mounted;

      placeCursorAfterText(editor, '@gr');

      expect(MentionPlugin.key).toBe('mention');
      expect(editor.hasQuery('mention')).toBe(true);
      expect(editor.query<MentionState>('mention')).toEqual({
        from: 7,
        to: 10,
        query: 'gr',
        trigger: '@',
      });
      expect(editor.execute('insertMention', { id: '', label: 'Grace' })).toBe(
        false,
      );
      expect(
        editor.execute('insertMention', {
          id: 'grace-hopper',
          label: ' Grace Hopper ',
        }),
      ).toBe(true);
      expect(editor.html()).toBe(
        '<p>Hello <span data-qalma-mention="" data-mention-id="grace-hopper" data-mention-label="Grace Hopper" data-mention-trigger="@" contenteditable="false">@Grace Hopper</span> </p>',
      );
      expect(getEditorSelectionFrom(editor)).toBe(8);
    } finally {
      mounted.unmount();
    }
  });

  it('parses serialized mentions into atom nodes', () => {
    const mounted = mountEditor({
      content:
        '<p>Ask <span data-qalma-mention data-mention-id="ada-lovelace" data-mention-label="Ada Lovelace" data-mention-trigger="@">@Ada Lovelace</span>.</p>',
      plugins: [MentionPlugin],
    });

    try {
      expect(mounted.editor.html()).toBe(
        '<p>Ask <span data-qalma-mention="" data-mention-id="ada-lovelace" data-mention-label="Ada Lovelace" data-mention-trigger="@" contenteditable="false">@Ada Lovelace</span>.</p>',
      );
    } finally {
      mounted.unmount();
    }
  });

  it('honors configured trigger, query length, and append-space options', () => {
    const mounted = mountEditor({
      content: '<p>Hello #gr</p>',
      plugins: [
        MentionPlugin.configure({
          trigger: '#',
          minQueryLength: 1,
          maxQueryLength: 24,
          appendSpaceOnInsert: false,
        }),
      ],
    });

    try {
      const { editor } = mounted;

      placeCursorAfterText(editor, '#gr');

      expect(editor.query<MentionState>('mention')).toEqual({
        from: 7,
        to: 10,
        query: 'gr',
        trigger: '#',
      });
      expect(
        editor.execute('insertMention', {
          id: 'grace-hopper',
          label: 'Grace Hopper',
        }),
      ).toBe(true);
      expect(editor.html()).toBe(
        '<p>Hello <span data-qalma-mention="" data-mention-id="grace-hopper" data-mention-label="Grace Hopper" data-mention-trigger="#" contenteditable="false">#Grace Hopper</span></p>',
      );
    } finally {
      mounted.unmount();
    }
  });

  it('keeps mention queries and insertion disabled in code contexts', () => {
    const codeBlockMounted = mountEditor({
      content: '<pre><code>@gr</code></pre>',
      plugins: [CodeBlockPlugin, MentionPlugin],
    });

    try {
      const { editor } = codeBlockMounted;

      placeCursorAfterText(editor, '@gr');

      expect(editor.query<MentionState>('mention')).toBeNull();
      expect(
        editor.canExecute('insertMention', {
          id: 'grace-hopper',
          label: 'Grace Hopper',
        }),
      ).toBe(false);
      expect(
        editor.execute('insertMention', {
          id: 'grace-hopper',
          label: 'Grace Hopper',
        }),
      ).toBe(false);
    } finally {
      codeBlockMounted.unmount();
    }

    const inlineCodeMounted = mountEditor({
      content: '<p><code>@gr</code></p>',
      plugins: [InlineCodePlugin, MentionPlugin],
    });

    try {
      const { editor } = inlineCodeMounted;

      placeCursorAfterText(editor, '@gr');

      expect(editor.query<MentionState>('mention')).toBeNull();
      expect(
        editor.canExecute('insertMention', {
          id: 'grace-hopper',
          label: 'Grace Hopper',
        }),
      ).toBe(false);
    } finally {
      inlineCodeMounted.unmount();
    }
  });

  it('dispatches cancellable navigation events for consumer-owned mention UI', () => {
    const mounted = mountEditor({
      content: '<p>Hello @gr</p>',
      plugins: [MentionPlugin],
    });

    try {
      const { editor } = mounted;
      const view = getEditorView(editor);
      const mentionKeydown = vi.fn((event: Event) => event.preventDefault());

      placeCursorAfterText(editor, '@gr');
      view.dom.addEventListener('qalma-mention-keydown', mentionKeydown);

      const event = dispatchKey(editor, 'ArrowDown');

      expect(event.defaultPrevented).toBe(true);
      expect(mentionKeydown).toHaveBeenCalledWith(
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

  it('exposes immutable defaults and validates configuration', () => {
    const configured = MentionPlugin.configure({
      trigger: '#',
      minQueryLength: 1,
      maxQueryLength: 24,
      appendSpaceOnInsert: false,
    });

    expect(Object.isFrozen(MENTION_PLUGIN_DEFAULT_OPTIONS)).toBe(true);
    expect(Object.isFrozen(MentionPlugin.options)).toBe(true);
    expect(MENTION_PLUGIN_DEFAULT_OPTIONS).toEqual({
      trigger: '@',
      minQueryLength: 0,
      maxQueryLength: 64,
      appendSpaceOnInsert: true,
    });
    expect(MentionPlugin.options).toEqual(MENTION_PLUGIN_DEFAULT_OPTIONS);
    expect(configured.options).toEqual({
      trigger: '#',
      minQueryLength: 1,
      maxQueryLength: 24,
      appendSpaceOnInsert: false,
    });
    expect(() =>
      MentionPlugin.configure({
        trigger: '::',
      }),
    ).toThrowError(
      'MentionPlugin trigger must be a single non-whitespace character.',
    );
    expect(() =>
      MentionPlugin.configure({
        minQueryLength: -1,
      }),
    ).toThrowError(
      'MentionPlugin minQueryLength must be a non-negative integer.',
    );
    expect(() =>
      MentionPlugin.configure({
        minQueryLength: 3,
        maxQueryLength: 2,
      }),
    ).toThrowError(
      'MentionPlugin maxQueryLength must be greater than or equal to minQueryLength.',
    );
    expect(() =>
      MentionPlugin.configure({
        appendSpaceOnInsert: 'yes' as never,
      }),
    ).toThrowError('MentionPlugin appendSpaceOnInsert must be a boolean.');
  });
});
