import { HIGHLIGHT_PLUGIN_DEFAULT_OPTIONS, HighlightPlugin } from '../../index';
import { mountEditor, selectText } from '../../../testing/editor-test-utils';

describe('HighlightPlugin', () => {
  it('exposes stable highlight commands, command state, and query state', () => {
    const mounted = mountEditor({
      content: '<p>Qalma</p>',
      plugins: [HighlightPlugin],
    });

    try {
      const { editor } = mounted;

      selectText(editor, 'Qalma');

      expect(HighlightPlugin.key).toBe('highlight');
      expect(editor.hasCommandState('setHighlight')).toBe(true);
      expect(editor.hasQuery('highlightColor')).toBe(true);
      expect(editor.execute('unsetHighlight')).toBe(false);
      expect(editor.execute('setHighlight', 'not-a-color')).toBe(false);

      expect(editor.execute('setHighlight')).toBe(true);
      expect(editor.isCommandActive('setHighlight')).toBe(true);
      expect(editor.query<string>('highlightColor')).toBe('rgb(254, 240, 138)');
      expect(editor.html()).toBe('<p><mark>Qalma</mark></p>');

      expect(editor.execute('setHighlight', '#bae6fd')).toBe(true);
      expect(editor.query<string>('highlightColor')).toBe('rgb(186, 230, 253)');
      expect(editor.html()).toBe(
        '<p><mark style="background-color: rgb(186, 230, 253);">Qalma</mark></p>',
      );

      expect(editor.execute('unsetHighlight')).toBe(true);
      expect(editor.isCommandActive('setHighlight')).toBe(false);
      expect(editor.query<string>('highlightColor')).toBeNull();
      expect(editor.html()).toBe('<p>Qalma</p>');
    } finally {
      mounted.unmount();
    }
  });

  it('parses serialized highlights with default and custom colors', () => {
    const mounted = mountEditor({
      content:
        '<p><mark>Default highlight</mark></p><p><mark style="background-color: #bae6fd;">Sky highlight</mark></p>',
      plugins: [HighlightPlugin],
    });

    try {
      expect(mounted.editor.html()).toBe(
        '<p><mark>Default highlight</mark></p><p><mark style="background-color: rgb(186, 230, 253);">Sky highlight</mark></p>',
      );
    } finally {
      mounted.unmount();
    }
  });

  it('exposes immutable defaults and validates configuration', () => {
    const configured = HighlightPlugin.configure({
      defaultColor: '#bae6fd',
    });

    expect(Object.isFrozen(HIGHLIGHT_PLUGIN_DEFAULT_OPTIONS)).toBe(true);
    expect(Object.isFrozen(HighlightPlugin.options)).toBe(true);
    expect(HIGHLIGHT_PLUGIN_DEFAULT_OPTIONS).toEqual({
      defaultColor: 'rgb(254, 240, 138)',
    });
    expect(HighlightPlugin.options).toEqual(HIGHLIGHT_PLUGIN_DEFAULT_OPTIONS);
    expect(configured.options).toEqual({
      defaultColor: '#bae6fd',
    });
    expect(() =>
      HighlightPlugin.configure({
        defaultColor: 'not-a-color',
      }),
    ).toThrowError('HighlightPlugin defaultColor must be a valid CSS color.');
  });
});
