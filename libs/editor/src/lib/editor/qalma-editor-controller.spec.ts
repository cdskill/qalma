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
import {
  getEditorView,
  mountEditor,
} from '../../../testing/editor-test-utils';

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
    expect(createQalmaEditor({ content: '<p>Draft</p>' }).isEmpty()).toBe(false);
  });

  it('uses the document model for serialized empty content before mount', () => {
    expect(createQalmaEditor({ content: '<p>&nbsp;</p>' }).isEmpty()).toBe(true);
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
