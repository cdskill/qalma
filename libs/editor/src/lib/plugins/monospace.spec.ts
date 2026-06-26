import { InlineCodePlugin, MonospacePlugin } from '../../index';
import {
  mountEditor,
  selectText,
} from '../../../testing/editor-test-utils';

describe('MonospacePlugin', () => {
  it('exposes stable commands and command state', () => {
    const mounted = mountEditor({
      content: '<p>Use PRODUCT_TOKEN as a label.</p>',
      plugins: [MonospacePlugin],
    });

    try {
      const { editor } = mounted;

      selectText(editor, 'PRODUCT_TOKEN');

      expect(MonospacePlugin.key).toBe('monospace');
      expect(editor.hasCommandState('toggleMonospace')).toBe(true);
      expect(editor.canExecute('toggleMonospace')).toBe(true);
      expect(editor.execute('toggleMonospace')).toBe(true);
      expect(editor.isCommandActive('toggleMonospace')).toBe(true);
      expect(editor.html()).toBe(
        '<p>Use <span data-qalma-monospace="">PRODUCT_TOKEN</span> as a label.</p>',
      );

      expect(editor.execute('toggleMonospace')).toBe(true);
      expect(editor.isCommandActive('toggleMonospace')).toBe(false);
      expect(editor.html()).toBe('<p>Use PRODUCT_TOKEN as a label.</p>');
    } finally {
      mounted.unmount();
    }
  });

  it('round-trips serialized monospace without code semantics', () => {
    const mounted = mountEditor({
      content:
        '<p>Use <span data-qalma-monospace="">PRODUCT_TOKEN</span> as a label.</p>',
      plugins: [MonospacePlugin],
    });

    try {
      const { editor } = mounted;

      selectText(editor, 'PRODUCT_TOKEN');

      expect(editor.html()).toBe(
        '<p>Use <span data-qalma-monospace="">PRODUCT_TOKEN</span> as a label.</p>',
      );
      expect(editor.isCommandActive('toggleMonospace')).toBe(true);
      expect(editor.getJSON()).toEqual({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Use ' },
              {
                type: 'text',
                marks: [{ type: 'monospace' }],
                text: 'PRODUCT_TOKEN',
              },
              { type: 'text', text: ' as a label.' },
            ],
          },
        ],
      });
      expect(editor.getMarkdown().trim()).toBe(
        'Use <span data-qalma-monospace="">PRODUCT_TOKEN</span> as a label.',
      );
    } finally {
      mounted.unmount();
    }
  });

  it('coexists with inline code as a distinct mark', () => {
    const mounted = mountEditor({
      content: '<p>Use PRODUCT_TOKEN and createQalmaEditor.</p>',
      plugins: [MonospacePlugin, InlineCodePlugin],
    });

    try {
      const { editor } = mounted;

      selectText(editor, 'PRODUCT_TOKEN');
      expect(editor.execute('toggleMonospace')).toBe(true);

      selectText(editor, 'createQalmaEditor');
      expect(editor.execute('toggleInlineCode')).toBe(true);

      expect(editor.html()).toBe(
        '<p>Use <span data-qalma-monospace="">PRODUCT_TOKEN</span> and <code>createQalmaEditor</code>.</p>',
      );
      expect(editor.getJSON()).toEqual({
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: 'Use ' },
              {
                type: 'text',
                marks: [{ type: 'monospace' }],
                text: 'PRODUCT_TOKEN',
              },
              { type: 'text', text: ' and ' },
              {
                type: 'text',
                marks: [{ type: 'code' }],
                text: 'createQalmaEditor',
              },
              { type: 'text', text: '.' },
            ],
          },
        ],
      });
    } finally {
      mounted.unmount();
    }
  });
});
