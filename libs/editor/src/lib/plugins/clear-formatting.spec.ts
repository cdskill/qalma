import {
  ClearFormattingPlugin,
  CodeBlockPlugin,
  HardBreakPlugin,
  HeadingsPlugin,
  LinkPlugin,
  TextFormattingKit,
} from '../../index';
import { mountEditor, selectText } from '../../../testing/editor-test-utils';

describe('ClearFormattingPlugin', () => {
  it('clears inline marks, links, and textblock formatting', () => {
    const mounted = mountEditor({
      content:
        '<h2><strong><em><a href="https://angular.dev">Qalma</a></em></strong></h2>',
      plugins: [
        HeadingsPlugin,
        ...TextFormattingKit,
        LinkPlugin,
        ClearFormattingPlugin,
      ],
    });

    try {
      const { editor } = mounted;

      selectText(editor, 'Qalma');

      expect(ClearFormattingPlugin.key).toBe('clearFormatting');
      expect(editor.canExecute('clearFormatting')).toBe(true);
      expect(editor.execute('clearFormatting')).toBe(true);
      expect(editor.html()).toBe('<p>Qalma</p>');
      expect(editor.canExecute('clearFormatting')).toBe(false);
      expect(editor.execute('clearFormatting')).toBe(false);
    } finally {
      mounted.unmount();
    }
  });

  it('converts code blocks to paragraphs and preserves line breaks when hard breaks are available', () => {
    const mounted = mountEditor({
      content:
        '<pre><code class="language-typescript">const first = 1;&#10;const second = 2;</code></pre>',
      plugins: [
        CodeBlockPlugin.configure({
          languages: ['plaintext', 'typescript'],
          defaultLanguage: 'typescript',
        }),
        HardBreakPlugin,
        ClearFormattingPlugin,
      ],
    });

    try {
      expect(mounted.editor.canExecute('clearFormatting')).toBe(true);
      expect(mounted.editor.execute('clearFormatting')).toBe(true);
      expect(mounted.editor.html()).toBe(
        '<p>const first = 1;<br>const second = 2;</p>',
      );
      expect(mounted.editor.isCommandActive('toggleCodeBlock')).toBe(false);
    } finally {
      mounted.unmount();
    }
  });
});
