import { SubscriptSuperscriptPlugin } from '../../index';
import { mountEditor, selectText } from '../../../testing/editor-test-utils';

describe('SubscriptSuperscriptPlugin', () => {
  it('exposes stable subscript and superscript commands with exclusive state', () => {
    const mounted = mountEditor({
      content: '<p>H2O and E=mc2</p>',
      plugins: [SubscriptSuperscriptPlugin],
    });

    try {
      const { editor } = mounted;

      selectText(editor, '2');

      expect(SubscriptSuperscriptPlugin.key).toBe('subscriptSuperscript');
      expect(editor.hasCommandState('toggleSubscript')).toBe(true);
      expect(editor.hasCommandState('toggleSuperscript')).toBe(true);
      expect(editor.execute('toggleSubscript')).toBe(true);
      expect(editor.isCommandActive('toggleSubscript')).toBe(true);
      expect(editor.isCommandActive('toggleSuperscript')).toBe(false);
      expect(editor.html()).toBe('<p>H<sub>2</sub>O and E=mc2</p>');

      selectText(editor, '2');

      expect(editor.execute('toggleSuperscript')).toBe(true);
      expect(editor.isCommandActive('toggleSubscript')).toBe(false);
      expect(editor.isCommandActive('toggleSuperscript')).toBe(true);
      expect(editor.html()).toBe('<p>H<sup>2</sup>O and E=mc2</p>');

      expect(editor.execute('toggleSuperscript')).toBe(true);
      expect(editor.isCommandActive('toggleSuperscript')).toBe(false);
      expect(editor.html()).toBe('<p>H2O and E=mc2</p>');
    } finally {
      mounted.unmount();
    }
  });

  it('parses semantic tags and vertical-align styles', () => {
    const mounted = mountEditor({
      content:
        '<p>Formula H<sub>2</sub>O and E=mc<sup>2</sup></p><p><span style="vertical-align: sub;">sub</span> <span style="vertical-align: super;">sup</span></p>',
      plugins: [SubscriptSuperscriptPlugin],
    });

    try {
      expect(mounted.editor.html()).toBe(
        '<p>Formula H<sub>2</sub>O and E=mc<sup>2</sup></p><p><sub>sub</sub> <sup>sup</sup></p>',
      );
    } finally {
      mounted.unmount();
    }
  });
});
