import {
  HORIZONTAL_RULE_PLUGIN_DEFAULT_OPTIONS,
  HorizontalRulePlugin,
} from '../../index';
import {
  mountEditor,
  placeCursorAfterText,
  selectEditorRange,
  typeText,
} from '../../../testing/editor-test-utils';

describe('HorizontalRulePlugin', () => {
  it('exposes a stable insert command that leaves an editable paragraph after the rule', () => {
    const mounted = mountEditor({
      content: '<p>Before</p>',
      plugins: [HorizontalRulePlugin],
    });

    try {
      const { editor } = mounted;

      placeCursorAfterText(editor, 'Before');

      expect(HorizontalRulePlugin.key).toBe('horizontalRule');
      expect(editor.canExecute('insertHorizontalRule')).toBe(true);
      expect(editor.execute('insertHorizontalRule')).toBe(true);
      expect(editor.html()).toBe('<p>Before</p><hr><p></p>');
    } finally {
      mounted.unmount();
    }
  });

  it('parses serialized rules and converts markdown rule input', () => {
    const parsedMounted = mountEditor({
      content: '<hr>',
      plugins: [HorizontalRulePlugin],
    });

    try {
      expect(parsedMounted.editor.html()).toBe('<hr>');
    } finally {
      parsedMounted.unmount();
    }

    const inputRuleMounted = mountEditor({
      content: '<p>--</p>',
      plugins: [HorizontalRulePlugin],
    });

    try {
      selectEditorRange(inputRuleMounted.editor, 3, 3);

      expect(typeText(inputRuleMounted.editor, '-')).toBe(true);
      expect(inputRuleMounted.editor.html()).toBe('<hr><p></p>');
    } finally {
      inputRuleMounted.unmount();
    }
  });

  it('exposes immutable defaults and validates configuration', () => {
    const configured = HorizontalRulePlugin.configure({
      inputRules: false,
    });

    expect(Object.isFrozen(HORIZONTAL_RULE_PLUGIN_DEFAULT_OPTIONS)).toBe(true);
    expect(Object.isFrozen(HorizontalRulePlugin.options)).toBe(true);
    expect(HORIZONTAL_RULE_PLUGIN_DEFAULT_OPTIONS).toEqual({
      inputRules: true,
    });
    expect(HorizontalRulePlugin.options).toEqual(
      HORIZONTAL_RULE_PLUGIN_DEFAULT_OPTIONS,
    );
    expect(configured.options).toEqual({
      inputRules: false,
    });
    expect(() =>
      HorizontalRulePlugin.configure({
        inputRules: 'yes' as never,
      }),
    ).toThrowError('HorizontalRulePlugin inputRules must be a boolean.');
  });
});
