import { ColorPlugin } from '../../index';
import { mountEditor, selectText } from '../../../testing/editor-test-utils';

describe('ColorPlugin', () => {
  it('exposes stable text and background color commands, states, and queries', () => {
    const mounted = mountEditor({
      content: '<p>Qalma</p>',
      plugins: [ColorPlugin],
    });

    try {
      const { editor } = mounted;

      selectText(editor, 'Qalma');

      expect(ColorPlugin.key).toBe('color');
      expect(editor.hasCommandState('unsetTextColor')).toBe(true);
      expect(editor.hasCommandState('unsetBackgroundColor')).toBe(true);
      expect(editor.hasQuery('textColor')).toBe(true);
      expect(editor.hasQuery('backgroundColor')).toBe(true);
      expect(editor.execute('setTextColor', 'not-a-color')).toBe(false);
      expect(editor.execute('unsetTextColor')).toBe(false);

      expect(editor.execute('setTextColor', '#0e7490')).toBe(true);
      expect(editor.query<string>('textColor')).toBe('rgb(14, 116, 144)');
      expect(editor.isCommandActive('unsetTextColor')).toBe(true);
      expect(editor.html()).toBe(
        '<p><span style="color: rgb(14, 116, 144);">Qalma</span></p>',
      );

      expect(editor.execute('setBackgroundColor', '#fef08a')).toBe(true);
      expect(editor.query<string>('backgroundColor')).toBe(
        'rgb(254, 240, 138)',
      );
      expect(editor.isCommandActive('unsetBackgroundColor')).toBe(true);
      expect(editor.html()).toBe(
        '<p><span style="color: rgb(14, 116, 144); background-color: rgb(254, 240, 138);">Qalma</span></p>',
      );

      expect(editor.execute('unsetTextColor')).toBe(true);
      expect(editor.query<string>('textColor')).toBeNull();
      expect(editor.html()).toBe(
        '<p><span style="background-color: rgb(254, 240, 138);">Qalma</span></p>',
      );
      expect(editor.execute('unsetBackgroundColor')).toBe(true);
      expect(editor.query<string>('backgroundColor')).toBeNull();
      expect(editor.html()).toBe('<p>Qalma</p>');
    } finally {
      mounted.unmount();
    }
  });

  it('parses style spans and legacy font colors into stable textStyle marks', () => {
    const mounted = mountEditor({
      content:
        '<p><span style="color: #0e7490; background-color: #fef08a;">Qalma</span></p><p><font color="#be123c">Legacy color</font></p>',
      plugins: [ColorPlugin],
    });

    try {
      expect(mounted.editor.html()).toBe(
        '<p><span style="color: rgb(14, 116, 144); background-color: rgb(254, 240, 138);">Qalma</span></p><p><span style="color: rgb(190, 18, 60);">Legacy color</span></p>',
      );
    } finally {
      mounted.unmount();
    }
  });
});
