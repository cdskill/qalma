import { CodeBlockPlugin, TrailingParagraphPlugin } from '../../index';
import { flushMicrotasks, mountEditor } from '../../../testing/editor-test-utils';

describe('TrailingParagraphPlugin', () => {
  it('adds one editable paragraph after a non-paragraph terminal block', async () => {
    const mounted = mountEditor({
      content:
        '<pre><code class="language-typescript">const answer = 42;</code></pre>',
      plugins: [
        CodeBlockPlugin.configure({
          languages: ['plaintext', 'typescript'],
          defaultLanguage: 'typescript',
        }),
        TrailingParagraphPlugin,
      ],
    });

    try {
      expect(TrailingParagraphPlugin.key).toBe('trailingParagraph');

      await flushMicrotasks();

      expect(mounted.editor.html()).toBe(
        '<pre><code class="language-typescript">const answer = 42;</code></pre><p></p>',
      );
    } finally {
      mounted.unmount();
    }
  });

  it('does not duplicate an existing empty trailing paragraph', async () => {
    const mounted = mountEditor({
      content: '<p>Qalma</p><p></p>',
      plugins: [TrailingParagraphPlugin],
    });

    try {
      await flushMicrotasks();

      expect(mounted.editor.html()).toBe('<p>Qalma</p><p></p>');

      mounted.editor.setHtml('<p></p>');
      await flushMicrotasks();

      expect(mounted.editor.html()).toBe('<p></p>');
    } finally {
      mounted.unmount();
    }
  });
});
