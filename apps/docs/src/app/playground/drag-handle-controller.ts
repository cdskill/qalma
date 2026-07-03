import { DestroyRef, signal } from '@angular/core';
import {
  DragHandleCommandValue,
  DragHandleMoveCommandValue,
  QalmaEditorController,
} from '@qalma/editor';
import { anchorToRect } from '@qalma/kit';

const DRAG_START_DISTANCE = 8;
const HANDLE_EDGE_MARGIN = 8;
const HANDLE_GAP = 8;
const HANDLE_BUTTON_SIZE = 30;
const DROP_LINE_EDGE_MARGIN = 8;

export interface PlaygroundDragHandleView {
  target: DragHandleCommandValue;
  transform: string;
  blockType: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

export interface PlaygroundDragDropIndicator {
  target: DragHandleMoveCommandValue;
  transform: string;
  width: number;
}

export interface PlaygroundDragBlockHighlight {
  transform: string;
  width: number;
  height: number;
}

interface PlaygroundDragSession {
  handle: PlaygroundDragHandleView;
  sourceBlock: HTMLElement;
  originX: number;
  originY: number;
  dragging: boolean;
  previousBodyCursor: string;
  previousBodyUserSelect: string;
  pointerMove: (event: Event) => void;
  pointerUp: (event: Event) => void;
  pointerCancel: (event: Event) => void;
}

interface DragHandleBlockRange extends DragHandleCommandValue {
  to: number;
}

interface DragDropCandidate {
  target: DragHandleMoveCommandValue;
  lineX: number;
  lineY: number;
  lineWidth: number;
}

export class PlaygroundDragHandleController {
  private readonly handleState = signal<PlaygroundDragHandleView | null>(null);
  private readonly dropIndicatorState =
    signal<PlaygroundDragDropIndicator | null>(null);
  private readonly draggedBlockHighlightState =
    signal<PlaygroundDragBlockHighlight | null>(null);

  readonly handle = this.handleState.asReadonly();
  readonly dropIndicator = this.dropIndicatorState.asReadonly();
  readonly draggedBlockHighlight = this.draggedBlockHighlightState.asReadonly();

  private surface: HTMLElement | null = null;
  private currentBlock: HTMLElement | null = null;
  private pendingBlock: HTMLElement | null = null;
  private lastPointerClientY: number | null = null;
  private refreshFrame: number | null = null;
  private handleKey: string | null = null;
  private dragSession: PlaygroundDragSession | null = null;

  constructor(private readonly editor: () => QalmaEditorController) {}

  connect(surface: HTMLElement, destroyRef: DestroyRef): void {
    this.surface = surface;

    const pointerMove = (event: Event) => this.handlePointerMove(event);
    const pointerLeave = (event: Event) => this.handlePointerLeave(event);
    const scheduleRefresh = () => this.scheduleRefresh();

    surface.addEventListener('pointermove', pointerMove, {
      passive: true,
    });
    surface.addEventListener('mouseleave', pointerLeave);
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
      this.finishDrag(false);
      this.cancelScheduledRefresh();
      this.surface = null;
      this.currentBlock = null;
      this.pendingBlock = null;
      surface.removeEventListener('pointermove', pointerMove);
      surface.removeEventListener('mouseleave', pointerLeave);
      surface.removeEventListener('scroll', scheduleRefresh);
      window.removeEventListener('scroll', scheduleRefresh);
      window.removeEventListener('resize', scheduleRefresh);
    });
  }

  hide(): void {
    this.currentBlock = null;
    this.pendingBlock = null;
    this.lastPointerClientY = null;
    this.cancelScheduledRefresh();
    this.setHandle(null);
  }

  startDrag(event: PointerEvent, handle: PlaygroundDragHandleView): void {
    if (event.button !== 0 || this.dragSession) {
      return;
    }

    const surface = this.surface;
    const sourceBlock =
      surface && findDragHandleBlockByPos(surface, handle.target.pos);

    if (!surface || !sourceBlock) {
      return;
    }

    event.preventDefault();

    const session: PlaygroundDragSession = {
      handle,
      sourceBlock,
      originX: event.clientX,
      originY: event.clientY,
      dragging: false,
      previousBodyCursor: document.body.style.cursor,
      previousBodyUserSelect: document.body.style.userSelect,
      pointerMove: (moveEvent) => this.handleDragPointerMove(moveEvent),
      pointerUp: (upEvent) => this.handleDragPointerUp(upEvent),
      pointerCancel: () => this.finishDrag(false),
    };

    this.dragSession = session;
    window.addEventListener('pointermove', session.pointerMove, {
      passive: false,
    });
    window.addEventListener('pointerup', session.pointerUp, {
      passive: false,
    });
    window.addEventListener('pointercancel', session.pointerCancel);
  }

  private handlePointerMove(event: Event): void {
    if (this.dragSession?.dragging) {
      return;
    }

    const surface = this.surface;
    const target = event.target;

    if (!surface || !(target instanceof Element)) {
      return;
    }

    const block = findDragHandleBlock(target, surface);

    if (!block) {
      return;
    }

    if (event instanceof MouseEvent) {
      this.lastPointerClientY = event.clientY;
    }

    this.pendingBlock = block;
    this.scheduleRefresh();
  }

  private handlePointerLeave(event: Event): void {
    if (this.dragSession?.dragging) {
      return;
    }

    const relatedTarget =
      event instanceof MouseEvent ? event.relatedTarget : null;

    if (
      relatedTarget instanceof Element &&
      relatedTarget.closest('[data-playground-drag-handle]')
    ) {
      return;
    }

    this.hide();
  }

  private handleDragPointerMove(event: Event): void {
    const session = this.dragSession;

    if (!session || !(event instanceof MouseEvent)) {
      return;
    }

    const distance = Math.hypot(
      event.clientX - session.originX,
      event.clientY - session.originY,
    );

    if (!session.dragging && distance < DRAG_START_DISTANCE) {
      return;
    }

    event.preventDefault();

    if (!session.dragging) {
      this.activateDragSession(session);
    }

    this.updateDropIndicator(event.clientY);
  }

  private handleDragPointerUp(event: Event): void {
    if (this.dragSession?.dragging && event instanceof MouseEvent) {
      event.preventDefault();
    }

    this.finishDrag(true);
  }

  private activateDragSession(session: PlaygroundDragSession): void {
    session.dragging = true;
    this.surface?.setAttribute('data-playground-drag-active', 'true');
    document.body.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
    this.updateDraggedBlockHighlight(session.sourceBlock);
  }

  private updateDropIndicator(clientY: number): void {
    const surface = this.surface;
    const session = this.dragSession;
    const candidate =
      surface && session
        ? findDragDropCandidate(surface, session.handle.target.pos, clientY)
        : null;

    if (
      !candidate ||
      !this.editor().canExecute('moveBlockTo', candidate.target)
    ) {
      this.setDropIndicator(null);

      return;
    }

    this.setDropIndicator({
      target: candidate.target,
      transform: `translate3d(${Math.round(candidate.lineX)}px, ${Math.round(candidate.lineY)}px, 0)`,
      width: Math.round(candidate.lineWidth),
    });
  }

  private updateDraggedBlockHighlight(block: HTMLElement): void {
    const rect = block.getBoundingClientRect();

    this.draggedBlockHighlightState.set({
      transform: `translate3d(${Math.round(rect.left)}px, ${Math.round(rect.top)}px, 0)`,
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    });
  }

  private finishDrag(shouldDrop: boolean): void {
    const session = this.dragSession;

    if (!session) {
      return;
    }

    const dropTarget = this.dropIndicatorState()?.target ?? null;

    window.removeEventListener('pointermove', session.pointerMove);
    window.removeEventListener('pointerup', session.pointerUp);
    window.removeEventListener('pointercancel', session.pointerCancel);
    this.surface?.removeAttribute('data-playground-drag-active');
    document.body.style.cursor = session.previousBodyCursor;
    document.body.style.userSelect = session.previousBodyUserSelect;
    this.dragSession = null;
    this.setDropIndicator(null);
    this.draggedBlockHighlightState.set(null);

    if (shouldDrop && session.dragging && dropTarget) {
      this.editor().execute('moveBlockTo', dropTarget);
      this.hide();
    }
  }

  private scheduleRefresh(): void {
    if (this.refreshFrame !== null) {
      return;
    }

    this.refreshFrame = requestAnimationFrame(() => {
      this.refreshFrame = null;
      this.refresh();
    });
  }

  private refresh(): void {
    const block = this.pendingBlock ?? this.currentBlock;
    this.pendingBlock = null;

    if (!block) {
      this.hide();

      return;
    }

    this.updateFromBlock(block);
  }

  private updateFromBlock(block: HTMLElement): void {
    const surface = this.surface;
    const target = parseDragHandleTarget(block);

    if (!surface || !target) {
      this.hide();

      return;
    }

    const rect = block.getBoundingClientRect();

    if (!isRectVisibleInsideSurface(rect, surface)) {
      this.hide();

      return;
    }

    const surfaceRect = surface.getBoundingClientRect();
    const position = anchorToRect(rect, {
      placement: 'left',
      boundary: surfaceRect,
      size: { width: HANDLE_BUTTON_SIZE, height: HANDLE_BUTTON_SIZE },
      gap: HANDLE_GAP,
      edgeMargin: HANDLE_EDGE_MARGIN,
      align: this.lastPointerClientY ?? rect.top + rect.height / 2,
    });
    const canMoveUp = this.editor().canExecute('moveBlockUp', target);
    const canMoveDown = this.editor().canExecute('moveBlockDown', target);

    this.currentBlock = block;
    this.setHandle({
      target,
      transform: `translate3d(${Math.round(position.left)}px, ${Math.round(position.top)}px, 0)`,
      blockType: block.dataset['qalmaDragHandleType'] ?? 'block',
      canMoveUp,
      canMoveDown,
    });
  }

  private cancelScheduledRefresh(): void {
    if (this.refreshFrame === null) {
      return;
    }

    cancelAnimationFrame(this.refreshFrame);
    this.refreshFrame = null;
  }

  private setHandle(handle: PlaygroundDragHandleView | null): void {
    const nextKey = handle
      ? [
          handle.target.pos,
          handle.transform,
          handle.blockType,
          handle.canMoveUp,
          handle.canMoveDown,
        ].join(':')
      : null;

    if (nextKey === this.handleKey) {
      return;
    }

    this.handleKey = nextKey;
    this.handleState.set(handle);
  }

  private setDropIndicator(
    indicator: PlaygroundDragDropIndicator | null,
  ): void {
    this.dropIndicatorState.set(indicator);
  }
}

function findDragDropCandidate(
  surface: HTMLElement,
  sourcePos: number,
  clientY: number,
): DragDropCandidate | null {
  const blocks = Array.from(
    surface.querySelectorAll<HTMLElement>('[data-qalma-drag-handle-block]'),
  );
  const lineRect = getDropLineRect(surface);
  let lastCandidate: DragDropCandidate | null = null;

  for (const block of blocks) {
    const range = parseDragHandleBlockRange(block);

    if (!range) {
      continue;
    }

    const rect = block.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;

    if (clientY < midpoint) {
      return {
        target: {
          pos: sourcePos,
          targetPos: range.pos,
        },
        lineX: lineRect.left,
        lineY: rect.top,
        lineWidth: lineRect.width,
      };
    }

    lastCandidate = {
      target: {
        pos: sourcePos,
        targetPos: range.to,
      },
      lineX: lineRect.left,
      lineY: rect.bottom,
      lineWidth: lineRect.width,
    };
  }

  return lastCandidate;
}

function getDropLineRect(surface: HTMLElement): {
  left: number;
  width: number;
} {
  const content = surface.querySelector<HTMLElement>('.ProseMirror') ?? surface;
  const rect = content.getBoundingClientRect();
  const width = Math.max(0, rect.width - DROP_LINE_EDGE_MARGIN * 2);

  return {
    left: rect.left + DROP_LINE_EDGE_MARGIN,
    width,
  };
}

function findDragHandleBlock(
  target: Element,
  surface: HTMLElement,
): HTMLElement | null {
  const block = target.closest<HTMLElement>('[data-qalma-drag-handle-block]');

  return block && surface.contains(block) ? block : null;
}

function findDragHandleBlockByPos(
  surface: HTMLElement,
  pos: number,
): HTMLElement | null {
  const blocks = Array.from(
    surface.querySelectorAll<HTMLElement>('[data-qalma-drag-handle-block]'),
  );

  return (
    blocks.find((block) => parseDragHandleTarget(block)?.pos === pos) ?? null
  );
}

function parseDragHandleTarget(
  block: HTMLElement,
): DragHandleCommandValue | null {
  const pos = Number(block.dataset['qalmaDragHandlePos']);

  return Number.isInteger(pos) ? { pos } : null;
}

function parseDragHandleBlockRange(
  block: HTMLElement,
): DragHandleBlockRange | null {
  const target = parseDragHandleTarget(block);
  const to = Number(block.dataset['qalmaDragHandleTo']);

  return target && Number.isInteger(to) ? { ...target, to } : null;
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
