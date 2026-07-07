import type { DestroyRef } from '@angular/core';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DismissibleOverlay } from './dismissible-overlay';

afterEach(() => {
  document.body.replaceChildren();
});

describe('DismissibleOverlay', () => {
  it('dismisses on a pointerdown outside the overlay', () => {
    const inside = document.createElement('div');
    const outside = document.createElement('div');
    document.body.append(inside, outside);

    const onDismiss = vi.fn();
    const overlay = new DismissibleOverlay({
      isInside: (target) => target instanceof Node && inside.contains(target),
      onDismiss,
    });
    const { destroyRef } = createDestroyRef();

    overlay.connect(destroyRef);

    outside.dispatchEvent(createPointerDownEvent());

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not dismiss on a pointerdown inside the overlay', () => {
    const inside = document.createElement('div');
    document.body.append(inside);

    const onDismiss = vi.fn();
    const overlay = new DismissibleOverlay({
      isInside: (target) => target instanceof Node && inside.contains(target),
      onDismiss,
    });
    const { destroyRef } = createDestroyRef();

    overlay.connect(destroyRef);

    inside.dispatchEvent(createPointerDownEvent());

    expect(onDismiss).not.toHaveBeenCalled();
  });

  it('dismisses on Escape', () => {
    const onDismiss = vi.fn();
    const overlay = new DismissibleOverlay({
      isInside: () => true,
      onDismiss,
    });
    const { destroyRef } = createDestroyRef();

    overlay.connect(destroyRef);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('stops listening once destroyed', () => {
    const outside = document.createElement('div');
    document.body.append(outside);

    const onDismiss = vi.fn();
    const overlay = new DismissibleOverlay({
      isInside: () => false,
      onDismiss,
    });
    const { destroyRef, destroy } = createDestroyRef();

    overlay.connect(destroyRef);
    destroy();

    outside.dispatchEvent(createPointerDownEvent());
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(onDismiss).not.toHaveBeenCalled();
  });
});

function createPointerDownEvent(): PointerEvent {
  // jsdom does not implement PointerEvent; a plain MouseEvent has every
  // property `DismissibleOverlay` reads (`target`) and matches how
  // `drag-handle.spec.ts` fakes pointer events for the same reason.
  return new MouseEvent('pointerdown', { bubbles: true }) as PointerEvent;
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
