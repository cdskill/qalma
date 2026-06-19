import { HEADINGS_PLUGIN_DEFAULT_OPTIONS, HeadingsPlugin } from '../../index';
import {
  dispatchModKey,
  mountEditor,
  selectEditorRange,
  typeText,
} from '../../../testing/editor-test-utils';

describe('HeadingsPlugin', () => {
  it('exposes stable heading and paragraph commands', () => {
    const mounted = mountEditor({
      content: '<p>Qalma</p>',
      plugins: [HeadingsPlugin],
    });

    try {
      const { editor } = mounted;

      expect(HeadingsPlugin.key).toBe('headings');
      expect(editor.hasCommandState('setParagraph')).toBe(true);
      expect(editor.hasCommandState('toggleHeading1')).toBe(true);
      expect(editor.isCommandActive('setParagraph')).toBe(true);

      expect(editor.execute('toggleHeading1')).toBe(true);
      expect(editor.isCommandActive('toggleHeading1')).toBe(true);
      expect(editor.isCommandActive('setParagraph')).toBe(false);
      expect(editor.html()).toBe('<h1>Qalma</h1>');

      expect(editor.execute('toggleHeading1')).toBe(true);
      expect(editor.isCommandActive('setParagraph')).toBe(true);
      expect(editor.html()).toBe('<p>Qalma</p>');

      editor.setHtml('<h2>Qalma</h2>');

      expect(editor.isCommandActive('toggleHeading2')).toBe(true);
      expect(editor.execute('setParagraph')).toBe(true);
      expect(editor.isCommandActive('setParagraph')).toBe(true);
      expect(editor.html()).toBe('<p>Qalma</p>');
    } finally {
      mounted.unmount();
    }
  });

  it('serializes configured heading levels with stable node attrs', () => {
    const mounted = mountEditor({
      content: '<h2>Two</h2><h4>Four</h4>',
      plugins: [
        HeadingsPlugin.configure({
          levels: [2, 4],
        }),
      ],
    });

    try {
      expect(mounted.editor.html()).toBe('<h2>Two</h2><h4>Four</h4>');
      expect(mounted.editor.execute('toggleHeading4')).toBe(true);
      expect(mounted.editor.html()).toBe('<h4>Two</h4><h4>Four</h4>');
      expect(mounted.editor.execute('toggleHeading4')).toBe(true);
      expect(mounted.editor.html()).toBe('<p>Two</p><h4>Four</h4>');
      expect(mounted.editor.canExecute('toggleHeading1')).toBe(false);
    } finally {
      mounted.unmount();
    }
  });

  it('maps allowed heading levels to Mod-Alt shortcuts', () => {
    const mounted = mountEditor({
      content: '<p>Qalma</p>',
      plugins: [HeadingsPlugin],
    });

    try {
      const event = dispatchModKey(mounted.editor, '2', { altKey: true });

      expect(event.defaultPrevented).toBe(true);
      expect(mounted.editor.isCommandActive('toggleHeading2')).toBe(true);
      expect(mounted.editor.html()).toBe('<h2>Qalma</h2>');
    } finally {
      mounted.unmount();
    }
  });

  it('converts markdown heading input only for configured levels', () => {
    const defaultMounted = mountEditor({
      content: '<p>##</p>',
      plugins: [HeadingsPlugin],
    });

    try {
      selectEditorRange(defaultMounted.editor, 3, 3);

      expect(typeText(defaultMounted.editor, ' ')).toBe(true);
      expect(defaultMounted.editor.html()).toBe('<h2></h2>');
    } finally {
      defaultMounted.unmount();
    }

    const configuredMounted = mountEditor({
      content: '<p>##</p>',
      plugins: [
        HeadingsPlugin.configure({
          levels: [1, 3],
        }),
      ],
    });

    try {
      selectEditorRange(configuredMounted.editor, 3, 3);

      expect(typeText(configuredMounted.editor, ' ')).toBe(false);
      expect(configuredMounted.editor.html()).toBe('<p>## </p>');
    } finally {
      configuredMounted.unmount();
    }
  });

  it('exposes immutable defaults and validates configured levels', () => {
    const configured = HeadingsPlugin.configure({
      levels: [2, 3, 4],
      inputRules: false,
    });

    expect(Object.isFrozen(HEADINGS_PLUGIN_DEFAULT_OPTIONS)).toBe(true);
    expect(Object.isFrozen(HeadingsPlugin.options)).toBe(true);
    expect(HEADINGS_PLUGIN_DEFAULT_OPTIONS).toEqual({
      levels: [1, 2, 3],
      inputRules: true,
    });
    expect(HeadingsPlugin.options).toEqual(HEADINGS_PLUGIN_DEFAULT_OPTIONS);
    expect(configured.options).toEqual({
      levels: [2, 3, 4],
      inputRules: false,
    });
    expect(() =>
      HeadingsPlugin.configure({
        levels: [],
      }),
    ).toThrowError(
      'HeadingsPlugin levels must include at least one heading level.',
    );
    expect(() =>
      HeadingsPlugin.configure({
        levels: [1, 1],
      }),
    ).toThrowError('HeadingsPlugin levels entries must be unique.');
    expect(() =>
      HeadingsPlugin.configure({
        inputRules: 'yes' as never,
      }),
    ).toThrowError('HeadingsPlugin inputRules must be a boolean.');
  });
});
