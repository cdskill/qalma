import type { DestroyRef } from '@angular/core';

export interface DismissibleOverlayOptions {
  /** Returns true when the event target is part of the overlay/trigger and should not dismiss it. */
  isInside: (target: EventTarget | null) => boolean;
  onDismiss: () => void;
}

/**
 * Shared outside-click / Escape dismiss behavior for floating overlays
 * (popovers, contextual menus, autocomplete lists). Generalizes the
 * ad-hoc click-outside/Escape handling that used to be reimplemented
 * separately per feature.
 */
export class DismissibleOverlay {
  private readonly pointerDown = (event: PointerEvent): void => {
    if (!this.options.isInside(event.target)) {
      this.options.onDismiss();
    }
  };

  private readonly keydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      this.options.onDismiss();
    }
  };

  constructor(private readonly options: DismissibleOverlayOptions) {}

  connect(destroyRef: DestroyRef): void {
    document.addEventListener('pointerdown', this.pointerDown, true);
    document.addEventListener('keydown', this.keydown);

    destroyRef.onDestroy(() => {
      document.removeEventListener('pointerdown', this.pointerDown, true);
      document.removeEventListener('keydown', this.keydown);
    });
  }
}
