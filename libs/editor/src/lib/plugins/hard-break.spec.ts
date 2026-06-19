import { CodeBlockPlugin, HardBreakPlugin } from '../../index';
import {
  dispatchKey,
  mountEditor,
  placeCursorAfterText,
} from '../../../testing/editor-test-utils';

describe('HardBreakPlugin', () => {
  it('exposes a stable hard break insertion command', () => {
    const mounted = mountEditor({
      content: '<p>Line one</p>',
      plugins: [HardBreakPlugin],
    });

    try {
      const { editor } = mounted;

      placeCursorAfterText(editor, 'Line');

      expect(HardBreakPlugin.key).toBe('hardBreak');
      expect(editor.canExecute('insertHardBreak')).toBe(true);
      expect(editor.execute('insertHardBreak')).toBe(true);
      expect(editor.html()).toBe('<p>Line<br> one</p>');
    } finally {
      mounted.unmount();
    }
  });

  it('parses serialized hard breaks and maps Shift+Enter', () => {
    const mounted = mountEditor({
      content: '<p>Line one<br>Line two</p>',
      plugins: [HardBreakPlugin],
    });

    try {
      const { editor } = mounted;

      expect(editor.html()).toBe('<p>Line one<br>Line two</p>');

      placeCursorAfterText(editor, 'Line two');

      const event = dispatchKey(editor, 'Enter', { shiftKey: true });

      expect(event.defaultPrevented).toBe(true);
      expect(editor.html()).toBe('<p>Line one<br>Line two<br></p>');
    } finally {
      mounted.unmount();
    }
  });

  it('stays disabled where a hard break cannot be inserted', () => {
    const mounted = mountEditor({
      content:
        '<pre><code class="language-plaintext">const answer = 42;</code></pre>',
      plugins: [CodeBlockPlugin, HardBreakPlugin],
    });

    try {
      expect(mounted.editor.canExecute('insertHardBreak')).toBe(false);

      const event = dispatchKey(mounted.editor, 'Enter', { shiftKey: true });

      expect(event.defaultPrevented).toBe(false);
      expect(mounted.editor.html()).toBe(
        '<pre><code class="language-plaintext">const answer = 42;</code></pre>',
      );
    } finally {
      mounted.unmount();
    }
  });
});
