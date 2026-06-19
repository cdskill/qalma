import { DragHandlePlugin, DragHandleState } from '../../index';
import { mountEditor, selectEditorRange } from '../../../testing/editor-test-utils';

describe('DragHandlePlugin', () => {
  it('marks top-level blocks with headless drag handle attributes', () => {
    const mounted = mountEditor({
      content: '<p>One</p><p>Two</p>',
      plugins: [DragHandlePlugin],
    });

    try {
      const blocks = Array.from(
        mounted.host.querySelectorAll<HTMLElement>(
          '[data-qalma-drag-handle-block]',
        ),
      );

      expect(DragHandlePlugin.key).toBe('dragHandle');
      expect(
        blocks.map((block) => block.dataset['qalmaDragHandlePos']),
      ).toEqual(['0', '5']);
      expect(blocks.map((block) => block.dataset['qalmaDragHandleTo'])).toEqual(
        ['5', '10'],
      );
      expect(
        blocks.map((block) => block.dataset['qalmaDragHandleType']),
      ).toEqual(['paragraph', 'paragraph']);
    } finally {
      mounted.unmount();
    }
  });

  it('exposes current top-level block state', () => {
    const mounted = mountEditor({
      content: '<p>One</p><p>Two</p>',
      plugins: [DragHandlePlugin],
    });

    try {
      selectEditorRange(mounted.editor, 6, 6);

      expect(mounted.editor.hasQuery('dragHandle')).toBe(true);
      expect(mounted.editor.query<DragHandleState>('dragHandle')).toEqual({
        pos: 5,
        from: 5,
        to: 10,
        type: 'paragraph',
        text: 'Two',
        canMoveUp: true,
        canMoveDown: false,
      });
    } finally {
      mounted.unmount();
    }
  });

  it('selects, duplicates, deletes, and moves target blocks', () => {
    const mounted = mountEditor({
      content: '<p>One</p><p>Two</p>',
      plugins: [DragHandlePlugin],
    });

    try {
      const { editor } = mounted;

      expect(editor.execute('selectBlock', { pos: 5 })).toBe(true);
      expect(editor.query<DragHandleState>('dragHandle')?.text).toBe('Two');
      expect(editor.execute('duplicateBlock', { pos: 0 })).toBe(true);
      expect(editor.html()).toBe('<p>One</p><p>One</p><p>Two</p>');

      expect(editor.execute('moveBlockDown', { pos: 5 })).toBe(true);
      expect(editor.html()).toBe('<p>One</p><p>Two</p><p>One</p>');

      expect(editor.execute('moveBlockUp', { pos: 10 })).toBe(true);
      expect(editor.html()).toBe('<p>One</p><p>One</p><p>Two</p>');

      expect(editor.execute('deleteBlock', { pos: 5 })).toBe(true);
      expect(editor.html()).toBe('<p>One</p><p>Two</p>');
    } finally {
      mounted.unmount();
    }
  });

  it('moves a target block to valid top-level drop boundaries only', () => {
    const mounted = mountEditor({
      content: '<p>One</p><p>Two</p><p>Three</p>',
      plugins: [DragHandlePlugin],
    });

    try {
      const { editor } = mounted;

      expect(editor.canExecute('moveBlockTo', { pos: 0, targetPos: 17 })).toBe(
        true,
      );
      expect(editor.execute('moveBlockTo', { pos: 0, targetPos: 17 })).toBe(
        true,
      );
      expect(editor.html()).toBe('<p>Two</p><p>Three</p><p>One</p>');

      expect(editor.execute('moveBlockTo', { pos: 12, targetPos: 0 })).toBe(
        true,
      );
      expect(editor.html()).toBe('<p>One</p><p>Two</p><p>Three</p>');
      expect(editor.canExecute('moveBlockTo', { pos: 0, targetPos: 0 })).toBe(
        false,
      );
      expect(editor.canExecute('moveBlockTo', { pos: 0, targetPos: 5 })).toBe(
        false,
      );
      expect(editor.canExecute('moveBlockTo', { pos: 0, targetPos: 3 })).toBe(
        false,
      );
      expect(editor.canExecute('moveBlockUp', { pos: 0 })).toBe(false);
      expect(editor.canExecute('moveBlockDown', { pos: 10 })).toBe(false);
    } finally {
      mounted.unmount();
    }
  });

  it('keeps a valid empty paragraph when deleting the only block', () => {
    const mounted = mountEditor({
      content: '<p>Only</p>',
      plugins: [DragHandlePlugin],
    });

    try {
      expect(mounted.editor.execute('deleteBlock', { pos: 0 })).toBe(true);
      expect(mounted.editor.html()).toBe('<p></p>');
    } finally {
      mounted.unmount();
    }
  });
});
