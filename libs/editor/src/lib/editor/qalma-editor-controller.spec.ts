import { computed } from '@angular/core';

import { HardBreakPlugin, HorizontalRulePlugin, ImagePlugin } from '../../index';
import { createQalmaEditor } from '../../index';
import { mountEditor } from '../../../testing/editor-test-utils';

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
});
