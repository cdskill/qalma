import { DestroyRef, signal } from '@angular/core';
import {
  QalmaEditorController,
  SelectionState,
} from '@qalma/editor';

import { PlaygroundContextualToolbarPlacement } from './contextual-toolbar';

const TOOLBAR_EDGE_MARGIN = 16;
const TOOLBAR_GAP = 8;

export class PlaygroundSelectionToolbarController {
  private readonly placementState =
    signal<PlaygroundContextualToolbarPlacement | null>(null);
  readonly placement = this.placementState.asReadonly();

  private surface: HTMLElement | null = null;
  private refreshFrame: number | null = null;
  private placementKey: string | null = null;

  constructor(private readonly editor: () => QalmaEditorController) {}

  connect(surface: HTMLElement, destroyRef: DestroyRef): void {
    this.surface = surface;

    const refresh = () => this.refresh();
    const scheduleRefresh = () => this.scheduleRefresh();
    const handleKeydown = (event: Event) => this.handleKeydown(event);

    surface.addEventListener('qalma-selection-update', refresh);
    surface.addEventListener('keydown', handleKeydown);
    surface.addEventListener('keyup', refresh);
    surface.addEventListener('mouseup', refresh);
    surface.addEventListener('scroll', scheduleRefresh, {
      passive: true,
    });
    window.addEventListener('scroll', scheduleRefresh, {
      passive: true,
    });
    window.addEventListener('resize', scheduleRefresh, {
      passive: true,
    });

    destroyRef.onDestroy(() => {
      this.cancelScheduledRefresh();
      this.surface = null;
      surface.removeEventListener('qalma-selection-update', refresh);
      surface.removeEventListener('keydown', handleKeydown);
      surface.removeEventListener('keyup', refresh);
      surface.removeEventListener('mouseup', refresh);
      surface.removeEventListener('scroll', scheduleRefresh);
      window.removeEventListener('scroll', scheduleRefresh);
      window.removeEventListener('resize', scheduleRefresh);
    });
  }

  refresh(): void {
    const surface = this.surface;
    const selection = this.editor().query<SelectionState>('selection');

    if (
      !surface ||
      !selection ||
      selection.empty ||
      selection.text.trim().length === 0
    ) {
      this.hide();

      return;
    }

    const domSelection = window.getSelection();

    if (
      !domSelection ||
      domSelection.rangeCount === 0 ||
      !isSelectionInsideSurface(domSelection, surface)
    ) {
      this.hide();

      return;
    }

    const rect = getVisibleSelectionRect(domSelection.getRangeAt(0));

    if (!rect || !isRectVisibleInsideSurface(rect, surface)) {
      this.hide();

      return;
    }

    const viewportWidth =
      document.documentElement.clientWidth || window.innerWidth;
    const x = Math.round(
      clamp(
        rect.left + rect.width / 2,
        TOOLBAR_EDGE_MARGIN,
        viewportWidth - TOOLBAR_EDGE_MARGIN,
      ),
    );
    const y = Math.round(Math.max(TOOLBAR_EDGE_MARGIN, rect.top - TOOLBAR_GAP));

    this.setPlacement({
      transform: `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%)`,
    });
  }

  hide(): void {
    this.setPlacement(null);
  }

  handleKeydown(event: Event): void {
    if (
      !(event instanceof KeyboardEvent) ||
      event.key !== 'Escape' ||
      !this.placement()
    ) {
      return;
    }

    event.preventDefault();
    this.hide();
  }

  private scheduleRefresh(): void {
    if (!this.placement() || this.refreshFrame !== null) {
      return;
    }

    this.refreshFrame = requestAnimationFrame(() => {
      this.refreshFrame = null;
      this.refresh();
    });
  }

  private cancelScheduledRefresh(): void {
    if (this.refreshFrame === null) {
      return;
    }

    cancelAnimationFrame(this.refreshFrame);
    this.refreshFrame = null;
  }

  private setPlacement(
    placement: PlaygroundContextualToolbarPlacement | null,
  ): void {
    const nextKey = placement?.transform ?? null;

    if (nextKey === this.placementKey) {
      return;
    }

    this.placementKey = nextKey;
    this.placementState.set(placement);
  }
}

function getVisibleSelectionRect(range: Range): DOMRect | null {
  const rect = range.getBoundingClientRect();

  if (rect.width > 0 || rect.height > 0) {
    return rect;
  }

  for (const clientRect of Array.from(range.getClientRects())) {
    if (clientRect.width > 0 || clientRect.height > 0) {
      return clientRect;
    }
  }

  return null;
}

function isSelectionInsideSurface(
  selection: globalThis.Selection,
  surface: HTMLElement,
): boolean {
  return (
    isNodeInsideSurface(selection.anchorNode, surface) &&
    isNodeInsideSurface(selection.focusNode, surface)
  );
}

function isNodeInsideSurface(node: Node | null, surface: HTMLElement): boolean {
  const element = node instanceof Element ? node : node?.parentElement;

  return Boolean(element && surface.contains(element));
}

function isRectVisibleInsideSurface(
  rect: DOMRect,
  surface: HTMLElement,
): boolean {
  const surfaceRect = surface.getBoundingClientRect();

  return (
    rect.bottom > surfaceRect.top &&
    rect.top < surfaceRect.bottom &&
    rect.right > surfaceRect.left &&
    rect.left < surfaceRect.right
  );
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
