import { computed } from '@angular/core';
import { vi } from 'vitest';

import {
  BlockquotePlugin,
  HardBreakPlugin,
  HorizontalRulePlugin,
  ImagePlugin,
  ListsPlugin,
  createQalmaEditor,
} from '../../index';
import { MarkdownPlugin } from '@qalma/editor/markdown';
import { getEditorView, mountEditor } from '../../../testing/editor-test-utils';

describe('QalmaEditorController.getCoordinatesAtPosition', () => {
  it('returns null before the editor view is mounted', () => {
    expect(createQalmaEditor().getCoordinatesAtPosition(1)).toBeNull();
  });

  it('returns editor view coordinates for a mounted document position', () => {
    const mounted = mountEditor({ content: '<p>Hello</p>' });
    const view = getEditorView(mounted.editor);
    const coords = { left: 10, right: 12, top: 20, bottom: 24 };
    const coordsAtPos = vi.spyOn(view, 'coordsAtPos').mockReturnValue(coords);

    try {
      expect(mounted.editor.getCoordinatesAtPosition(3)).toEqual(coords);
      expect(coordsAtPos).toHaveBeenCalledWith(3);
    } finally {
      coordsAtPos.mockRestore();
      mounted.unmount();
    }
  });

  it('returns null for invalid positions and view measurement failures', () => {
    const mounted = mountEditor({ content: '<p>Hello</p>' });
    const view = getEditorView(mounted.editor);
    const coordsAtPos = vi.spyOn(view, 'coordsAtPos').mockImplementation(() => {
      throw new Error('Could not measure position.');
    });

    try {
      expect(mounted.editor.getCoordinatesAtPosition(-1)).toBeNull();
      expect(mounted.editor.getCoordinatesAtPosition(100)).toBeNull();
      expect(mounted.editor.getCoordinatesAtPosition(3)).toBeNull();
    } finally {
      coordsAtPos.mockRestore();
      mounted.unmount();
    }
  });
});

describe('QalmaEditorController.isEmpty', () => {
  it('treats a freshly mounted editor as empty', () => {
    const mounted = mountEditor();

    try {
      expect(mounted.editor.isEmpty()).toBe(true);
    } finally {
      mounted.unmount();
    }
  });

  it('treats text content as non-empty', () => {
    const mounted = mountEditor({ content: '<p>Hello</p>' });

    try {
      expect(mounted.editor.isEmpty()).toBe(false);
    } finally {
      mounted.unmount();
    }
  });

  it('treats multiple empty paragraphs and whitespace as empty', () => {
    const mounted = mountEditor();

    try {
      mounted.editor.setHtml('<p></p><p></p>');
      expect(mounted.editor.isEmpty()).toBe(true);

      mounted.editor.setHtml('<p> </p>');
      expect(mounted.editor.isEmpty()).toBe(true);
    } finally {
      mounted.unmount();
    }
  });

  it('treats a lone hard break as empty', () => {
    const mounted = mountEditor({
      content: '<p><br></p>',
      plugins: [HardBreakPlugin],
    });

    try {
      expect(mounted.editor.isEmpty()).toBe(true);
    } finally {
      mounted.unmount();
    }
  });

  it('treats media atoms as non-empty even without text', () => {
    const mounted = mountEditor({
      content: '<p><img src="https://example.com/a.png"></p>',
      plugins: [ImagePlugin],
    });

    try {
      expect(mounted.editor.isEmpty()).toBe(false);
    } finally {
      mounted.unmount();
    }
  });

  it('treats a block-level leaf (horizontal rule) as non-empty', () => {
    const mounted = mountEditor({
      content: '<hr>',
      plugins: [HorizontalRulePlugin],
    });

    try {
      expect(mounted.editor.isEmpty()).toBe(false);
    } finally {
      mounted.unmount();
    }
  });

  it('stays live inside a computed as the document changes', () => {
    const mounted = mountEditor();

    try {
      const empty = computed(() => mounted.editor.isEmpty());

      expect(empty()).toBe(true);

      mounted.editor.setHtml('<p>Hi</p>');
      expect(empty()).toBe(false);

      mounted.editor.setHtml('<p></p>');
      expect(empty()).toBe(true);
    } finally {
      mounted.unmount();
    }
  });

  it('reports emptiness before the view is mounted', () => {
    expect(createQalmaEditor().isEmpty()).toBe(true);
    expect(createQalmaEditor({ content: '<p></p>' }).isEmpty()).toBe(true);
    expect(createQalmaEditor({ content: '<p>Draft</p>' }).isEmpty()).toBe(
      false,
    );
  });

  it('uses the document model for serialized empty content before mount', () => {
    expect(createQalmaEditor({ content: '<p>&nbsp;</p>' }).isEmpty()).toBe(
      true,
    );
    expect(
      createQalmaEditor({
        content: '<p><br></p>',
        plugins: [HardBreakPlugin],
      }).isEmpty(),
    ).toBe(true);
    expect(
      createQalmaEditor({
        content: '<blockquote><p></p></blockquote>',
        plugins: [BlockquotePlugin],
      }).isEmpty(),
    ).toBe(true);
    expect(
      createQalmaEditor({
        content: '<ul><li><p></p></li></ul>',
        plugins: [ListsPlugin],
      }).isEmpty(),
    ).toBe(true);
  });

  it('keeps the pre-mount empty check safe without a document global', () => {
    const originalDocument = globalThis.document;

    vi.stubGlobal('document', undefined);

    try {
      expect(createQalmaEditor({ content: '<p>&nbsp;</p>' }).isEmpty()).toBe(
        true,
      );
      expect(createQalmaEditor({ content: '<p><br></p>' }).isEmpty()).toBe(
        true,
      );
      expect(createQalmaEditor({ content: '<p>Draft</p>' }).isEmpty()).toBe(
        false,
      );
      expect(
        createQalmaEditor({
          content: '<hr>',
          plugins: [HorizontalRulePlugin],
        }).isEmpty(),
      ).toBe(false);
    } finally {
      vi.stubGlobal('document', originalDocument);
    }
  });
});

describe('QalmaEditorController versioned persistence', () => {
  it('round-trips a stored document with its schema contract', () => {
    const source = createQalmaEditor({
      content: '<blockquote><p>Draft</p></blockquote>',
      plugins: [BlockquotePlugin],
      schemaVersion: 2,
    });
    const stored = source.getStoredDocument();
    const target = createQalmaEditor({
      plugins: [BlockquotePlugin],
      schemaVersion: 2,
    });

    expect(stored).toMatchObject({
      format: 'qalma',
      formatVersion: 1,
      schemaVersion: 2,
      schemaPlugins: ['blockquote'],
    });

    target.setStoredDocument(stored);

    expect(target.getJSON()).toEqual(source.getJSON());
  });

  it('applies consecutive migrations without mutating the stored input', () => {
    const stored = {
      format: 'qalma' as const,
      formatVersion: 1 as const,
      schemaVersion: 1,
      schemaPlugins: [],
      document: {
        type: 'doc',
        content: [
          { type: 'paragraph', content: [{ type: 'text', text: 'v1' }] },
        ],
      },
    };
    const editor = createQalmaEditor({
      schemaVersion: 3,
      migrations: [
        {
          fromVersion: 1,
          toVersion: 2,
          migrate: (document) => ({
            ...document,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'v2' }],
              },
            ],
          }),
        },
        {
          fromVersion: 2,
          toVersion: 3,
          migrate: (document) => ({
            ...document,
            content: [
              {
                type: 'paragraph',
                content: [{ type: 'text', text: 'v3' }],
              },
            ],
          }),
        },
      ],
    });

    editor.setStoredDocument(stored);

    expect(editor.getMarkdown()).toBe('v3');
    expect(stored.document.content?.[0]?.content?.[0]?.text).toBe('v1');
  });

  it('rejects future schemas, missing migrations, and missing schema plugins', () => {
    const future = createQalmaEditor({
      schemaVersion: 2,
    }).getStoredDocument();

    expect(() => createQalmaEditor().setStoredDocument(future)).toThrow(
      /Upgrade the editor first/,
    );

    const old = createQalmaEditor().getStoredDocument();

    expect(() =>
      createQalmaEditor({ schemaVersion: 2 }).setStoredDocument(old),
    ).toThrow(/Missing QALMA document migration/);

    const blockquote = createQalmaEditor({
      plugins: [BlockquotePlugin],
    }).getStoredDocument();

    expect(() => createQalmaEditor().setStoredDocument(blockquote)).toThrow(
      /schema plugins are missing: blockquote/,
    );
  });

  it('validates schema versions and migration chains at construction', () => {
    expect(() => createQalmaEditor({ schemaVersion: 0 })).toThrow(
      /positive integer/,
    );
    expect(() =>
      createQalmaEditor({
        schemaVersion: 3,
        migrations: [
          {
            fromVersion: 1,
            toVersion: 3,
            migrate: (document) => document,
          },
        ],
      }),
    ).toThrow(/advance exactly one schema version/);
  });
});

describe('QalmaEditorController.setMarkdown', () => {
  it('requires the optional Markdown entrypoint', () => {
    const editor = createQalmaEditor();

    expect(editor.hasContentParser('markdown')).toBe(false);
    expect(() => editor.setMarkdown('# Draft')).toThrow(
      /@qalma\/editor\/markdown/,
    );
  });

  it('parses GFM before and after mount through the selected schema', () => {
    const editor = createQalmaEditor({
      plugins: [MarkdownPlugin],
    });

    editor.setMarkdown('# Heading\n\n- [x] shipped');

    expect(editor.hasContentParser('markdown')).toBe(true);
    expect(editor.html()).toContain('<h1>Heading</h1>');
    expect(editor.html()).toContain('shipped');

    const mounted = mountEditor({
      plugins: [MarkdownPlugin],
    });

    try {
      mounted.editor.setMarkdown('**Bold**');
      expect(mounted.editor.html()).toBe('<p>Bold</p>');
    } finally {
      mounted.unmount();
    }
  });
});

describe('QalmaEditorController content limits', () => {
  it('rejects oversized HTML and Markdown before parsing', () => {
    expect(() =>
      createQalmaEditor({
        content: '<p>too long</p>',
        contentLimits: { maxHtmlLength: 8 },
      }),
    ).toThrow(/HTML content exceeds/);

    const editor = createQalmaEditor({
      plugins: [MarkdownPlugin],
      contentLimits: { maxHtmlLength: 20, maxMarkdownLength: 4 },
    });

    expect(() => editor.setHtml('<p>this is too long</p>')).toThrow(
      /HTML content exceeds/,
    );
    expect(() => editor.setMarkdown('12345')).toThrow(
      /Markdown content exceeds/,
    );
  });

  it('rejects oversized or deeply nested JSON before schema parsing', () => {
    const document = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'long' }],
        },
      ],
    };

    expect(() =>
      createQalmaEditor({ contentLimits: { maxJsonNodes: 2 } }).setJSON(
        document,
      ),
    ).toThrow(/limit of 2 values/);
    expect(() =>
      createQalmaEditor({ contentLimits: { maxJsonDepth: 2 } }).setJSON(
        document,
      ),
    ).toThrow(/depth limit of 2/);
    expect(() =>
      createQalmaEditor({ contentLimits: { maxJsonTextLength: 3 } }).setJSON(
        document,
      ),
    ).toThrow(/text limit of 3 characters/);
  });

  it('validates configured limits', () => {
    expect(() =>
      createQalmaEditor({ contentLimits: { maxJsonDepth: 0 } }),
    ).toThrow(/positive safe integer/);
  });

  it('rejects transactions that would grow the live document past a limit', () => {
    const mounted = mountEditor({
      content: '<p>1234</p>',
      contentLimits: { maxJsonTextLength: 5 },
    });
    const view = getEditorView(mounted.editor);

    try {
      expect(() => view.dispatch(view.state.tr.insertText('67', 5))).toThrow(
        /text limit of 5 characters/,
      );
      expect(mounted.editor.html()).toBe('<p>1234</p>');
    } finally {
      mounted.unmount();
    }
  });
});
