import { DestroyRef } from '@angular/core';
import {
  DragHandlePlugin,
  DragHandleState,
  QalmaEditorController,
  QalmaPlugin,
  createQalmaEditor,
} from '@qalma/editor';
import { TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { QalmaDragHandleController } from './drag-handle-controller';

afterEach(() => {
  document.body.replaceChildren();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('DragHandlePlugin', () => {
  it('marks top-level blocks with headless drag handle attributes', () => {
    const { editor, host } = mountEditor('<p>One</p><p>Two</p>', [
      DragHandlePlugin,
    ]);

    const blocks = Array.from(
      host.querySelectorAll<HTMLElement>('[data-qalma-drag-handle-block]'),
    );

    expect(blocks.map((block) => block.dataset['qalmaDragHandlePos'])).toEqual([
      '0',
      '5',
    ]);
    expect(blocks.map((block) => block.dataset['qalmaDragHandleTo'])).toEqual([
      '5',
      '10',
    ]);
    expect(blocks.map((block) => block.dataset['qalmaDragHandleType'])).toEqual(
      ['paragraph', 'paragraph'],
    );

    editor.unmount(host);
  });

  it('exposes the current top-level block state', () => {
    const { editor, host } = mountEditor('<p>One</p><p>Two</p>', [
      DragHandlePlugin,
    ]);

    selectRange(editor, 6, 6);

    expect(editor.query<DragHandleState>('dragHandle')).toEqual({
      pos: 5,
      from: 5,
      to: 10,
      type: 'paragraph',
      text: 'Two',
      canMoveUp: true,
      canMoveDown: false,
    });

    editor.unmount(host);
  });

  it('duplicates, deletes, and moves target blocks', () => {
    const { editor, host } = mountEditor('<p>One</p><p>Two</p>', [
      DragHandlePlugin,
    ]);

    expect(editor.execute('duplicateBlock', { pos: 0 })).toBe(true);
    expect(editor.html()).toBe('<p>One</p><p>One</p><p>Two</p>');

    expect(editor.execute('moveBlockDown', { pos: 0 })).toBe(true);
    expect(editor.html()).toBe('<p>One</p><p>One</p><p>Two</p>');

    expect(editor.execute('moveBlockDown', { pos: 5 })).toBe(true);
    expect(editor.html()).toBe('<p>One</p><p>Two</p><p>One</p>');

    expect(editor.execute('moveBlockUp', { pos: 10 })).toBe(true);
    expect(editor.html()).toBe('<p>One</p><p>One</p><p>Two</p>');

    expect(editor.execute('deleteBlock', { pos: 5 })).toBe(true);
    expect(editor.html()).toBe('<p>One</p><p>Two</p>');

    editor.unmount(host);
  });

  it('moves a target block to a top-level drop boundary', () => {
    const { editor, host } = mountEditor(
      '<p>One</p><p>Two</p><p>Three</p>',
      [DragHandlePlugin],
    );

    expect(editor.canExecute('moveBlockTo', { pos: 0, targetPos: 17 })).toBe(
      true,
    );
    expect(editor.execute('moveBlockTo', { pos: 0, targetPos: 17 })).toBe(true);
    expect(editor.html()).toBe('<p>Two</p><p>Three</p><p>One</p>');

    expect(editor.execute('moveBlockTo', { pos: 12, targetPos: 0 })).toBe(true);
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

    editor.unmount(host);
  });

  it('keeps a valid empty paragraph when deleting the only block', () => {
    const { editor, host } = mountEditor('<p>Only</p>', [DragHandlePlugin]);

    expect(editor.execute('deleteBlock', { pos: 0 })).toBe(true);
    expect(editor.html()).toBe('<p></p>');

    editor.unmount(host);
  });

  it('prevents moving beyond document boundaries', () => {
    const { editor, host } = mountEditor('<p>One</p><p>Two</p>', [
      DragHandlePlugin,
    ]);

    expect(editor.canExecute('moveBlockUp', { pos: 0 })).toBe(false);
    expect(editor.canExecute('moveBlockDown', { pos: 5 })).toBe(false);
    expect(editor.canExecute('moveBlockDown', { pos: 0 })).toBe(true);
    expect(editor.canExecute('moveBlockUp', { pos: 5 })).toBe(true);

    editor.unmount(host);
  });

  it('selects a target block', () => {
    const { editor, host } = mountEditor('<p>One</p><p>Two</p>', [
      DragHandlePlugin,
    ]);

    expect(editor.execute('selectBlock', { pos: 5 })).toBe(true);

    const state = editor.query<DragHandleState>('dragHandle');

    expect(state?.pos).toBe(5);
    expect(state?.text).toBe('Two');

    editor.unmount(host);
  });

  it('keeps the visible handle while the pointer crosses the gutter', () => {
    const flushAnimationFrames = stubAnimationFrameQueue();
    const destroyRef = createDestroyRef();
    const { editor, host } = mountEditor('<p>One</p><p>Two</p>', [
      DragHandlePlugin,
    ]);
    const surface = document.createElement('div');
    const block = document.createElement('p');
    const controller = new QalmaDragHandleController(() => editor);

    block.dataset['qalmaDragHandleBlock'] = '';
    block.dataset['qalmaDragHandlePos'] = '0';
    block.dataset['qalmaDragHandleType'] = 'paragraph';
    surface.append(block);
    document.body.append(surface);
    setRect(surface, {
      left: 100,
      top: 50,
      right: 700,
      bottom: 350,
      width: 600,
      height: 300,
    });
    setRect(block, {
      left: 180,
      top: 80,
      right: 680,
      bottom: 104,
      width: 500,
      height: 24,
    });

    controller.connect(surface, destroyRef.destroyRef);
    block.dispatchEvent(createPointerMoveEvent());
    flushAnimationFrames();

    const handle = controller.handle();

    expect(handle?.target).toEqual({ pos: 0 });
    expect(handle?.transform).toContain('translate3d(142px, 77px, 0)');

    surface.dispatchEvent(createPointerMoveEvent());

    expect(controller.handle()).toEqual(handle);

    destroyRef.destroy();
    editor.unmount(host);
  });

  it('moves a dragged block when the pointer is released on a drop boundary', () => {
    const destroyRef = createDestroyRef();
    const { editor, host } = mountEditor(
      '<p>One</p><p>Two</p><p>Three</p>',
      [DragHandlePlugin],
    );
    const surface = document.createElement('div');
    const content = document.createElement('div');
    const blockOne = createDragHandleBlock(0, 5);
    const blockTwo = createDragHandleBlock(5, 10);
    const blockThree = createDragHandleBlock(10, 17);
    const controller = new QalmaDragHandleController(() => editor);

    content.className = 'ProseMirror';
    content.append(blockOne, blockTwo, blockThree);
    surface.append(content);
    document.body.append(surface);
    setRect(surface, {
      left: 100,
      top: 50,
      right: 700,
      bottom: 350,
      width: 600,
      height: 300,
    });
    setRect(content, {
      left: 140,
      top: 70,
      right: 660,
      bottom: 250,
      width: 520,
      height: 180,
    });
    setRect(blockOne, {
      left: 140,
      top: 80,
      right: 660,
      bottom: 104,
      width: 520,
      height: 24,
    });
    setRect(blockTwo, {
      left: 140,
      top: 116,
      right: 660,
      bottom: 140,
      width: 520,
      height: 24,
    });
    setRect(blockThree, {
      left: 140,
      top: 152,
      right: 660,
      bottom: 176,
      width: 520,
      height: 24,
    });

    controller.connect(surface, destroyRef.destroyRef);
    controller.startDrag(createPointerEvent('pointerdown', {
      clientX: 126,
      clientY: 92,
      button: 0,
    }), {
      target: { pos: 0 },
      transform: '',
      blockType: 'paragraph',
      canMoveUp: false,
      canMoveDown: true,
    });
    window.dispatchEvent(
      createPointerEvent('pointermove', {
        clientX: 126,
        clientY: 190,
      }),
    );

    expect(controller.draggedBlockHighlight()).toEqual({
      transform: 'translate3d(140px, 80px, 0)',
      width: 520,
      height: 24,
    });
    expect(controller.dropIndicator()).toEqual({
      target: { pos: 0, targetPos: 17 },
      transform: 'translate3d(148px, 176px, 0)',
      width: 504,
    });

    window.dispatchEvent(
      createPointerEvent('pointerup', {
        clientX: 126,
        clientY: 190,
      }),
    );

    expect(editor.html()).toBe('<p>Two</p><p>Three</p><p>One</p>');
    expect(controller.dropIndicator()).toBeNull();
    expect(controller.draggedBlockHighlight()).toBeNull();

    destroyRef.destroy();
    editor.unmount(host);
  });

  it('can show the same block again after the handle is hidden', () => {
    const flushAnimationFrames = stubAnimationFrameQueue();
    const destroyRef = createDestroyRef();
    const { editor, host } = mountEditor('<p>One</p><p>Two</p>', [
      DragHandlePlugin,
    ]);
    const surface = document.createElement('div');
    const block = document.createElement('p');
    const controller = new QalmaDragHandleController(() => editor);

    block.dataset['qalmaDragHandleBlock'] = '';
    block.dataset['qalmaDragHandlePos'] = '0';
    block.dataset['qalmaDragHandleType'] = 'paragraph';
    surface.append(block);
    document.body.append(surface);
    setRect(surface, {
      left: 100,
      top: 50,
      right: 700,
      bottom: 350,
      width: 600,
      height: 300,
    });
    setRect(block, {
      left: 180,
      top: 80,
      right: 680,
      bottom: 104,
      width: 500,
      height: 24,
    });

    controller.connect(surface, destroyRef.destroyRef);
    block.dispatchEvent(createPointerMoveEvent());
    flushAnimationFrames();

    expect(controller.handle()).not.toBeNull();

    surface.dispatchEvent(new MouseEvent('mouseleave'));

    expect(controller.handle()).toBeNull();

    block.dispatchEvent(createPointerMoveEvent());
    flushAnimationFrames();

    expect(controller.handle()?.target).toEqual({ pos: 0 });

    destroyRef.destroy();
    editor.unmount(host);
  });
});

function mountEditor(
  content: string,
  plugins: readonly QalmaPlugin[],
): { editor: QalmaEditorController; host: HTMLElement } {
  const editor = createQalmaEditor({ content, plugins });
  const host = document.createElement('div');

  editor.mount(host);

  return { editor, host };
}

function selectRange(
  editor: QalmaEditorController,
  from: number,
  to: number,
): void {
  const view = (editor as unknown as { editorView: EditorView | undefined })
    .editorView;

  if (!view) {
    throw new Error('Editor view is not mounted.');
  }

  view.dispatch(
    view.state.tr.setSelection(TextSelection.create(view.state.doc, from, to)),
  );
}

function createDragHandleBlock(pos: number, to: number): HTMLElement {
  const block = document.createElement('p');

  block.dataset['qalmaDragHandleBlock'] = '';
  block.dataset['qalmaDragHandlePos'] = String(pos);
  block.dataset['qalmaDragHandleTo'] = String(to);
  block.dataset['qalmaDragHandleType'] = 'paragraph';

  return block;
}

function createDestroyRef(): {
  destroyRef: DestroyRef;
  destroy: () => void;
} {
  let onDestroy: (() => void) | null = null;

  return {
    destroyRef: {
      onDestroy(callback: () => void) {
        onDestroy = callback;
      },
    } as DestroyRef,
    destroy: () => onDestroy?.(),
  };
}

function stubAnimationFrameQueue(): () => void {
  const callbacks: FrameRequestCallback[] = [];

  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callbacks.push(callback);

    return callbacks.length;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());

  return () => {
    for (const callback of callbacks.splice(0)) {
      callback(0);
    }
  };
}

function setRect(
  element: Element,
  rect: Pick<DOMRect, 'left' | 'top' | 'right' | 'bottom' | 'width' | 'height'>,
): void {
  Object.defineProperty(element, 'getBoundingClientRect', {
    configurable: true,
    value: () =>
      ({
        ...rect,
        x: rect.left,
        y: rect.top,
        toJSON: () => rect,
      }) as DOMRect,
  });
}

function createPointerMoveEvent(): MouseEvent {
  return createPointerEvent('pointermove');
}

function createPointerEvent(
  type: string,
  options: MouseEventInit = {},
): PointerEvent {
  return new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    ...options,
  }) as PointerEvent;
}
