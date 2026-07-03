export interface AnchorRect {
  readonly top: number;
  readonly bottom: number;
  readonly left: number;
  readonly right: number;
}

export interface AnchorSize {
  readonly width: number;
  readonly height: number;
}

export type AnchorPlacement = 'top' | 'bottom' | 'left' | 'right';
export type AnchorAlign = 'start' | 'center' | 'end';

export interface AnchorToRectOptions {
  /** Which side of the anchor rect the floating element renders on. */
  readonly placement: AnchorPlacement;
  /** Rect (viewport or scroll surface) the result is clamped within. */
  readonly boundary: AnchorRect;
  /** Size of the floating element being positioned. */
  readonly size: AnchorSize;
  /** Distance between the anchor rect and the floating element. Default 8. */
  readonly gap?: number;
  /** Minimum distance kept from the boundary edges. Default 8. */
  readonly edgeMargin?: number;
  /**
   * Cross-axis alignment relative to the anchor rect. `start` | `center` |
   * `end` align to the anchor rect itself; a number instead pins the
   * floating element's center to that viewport coordinate (clamped within
   * the anchor rect), e.g. to follow a pointer's Y while hovering a tall
   * block. Defaults to `start`.
   */
  readonly align?: AnchorAlign | number;
}

export interface AnchorPosition {
  readonly top: number;
  readonly left: number;
}

const DEFAULT_GAP = 8;
const DEFAULT_EDGE_MARGIN = 8;

export function anchorToRect(
  anchor: AnchorRect,
  options: AnchorToRectOptions,
): AnchorPosition {
  const gap = options.gap ?? DEFAULT_GAP;
  const edgeMargin = options.edgeMargin ?? DEFAULT_EDGE_MARGIN;
  const { boundary, size } = options;

  if (options.placement === 'left' || options.placement === 'right') {
    const mainAxis =
      options.placement === 'left'
        ? anchor.left - gap - size.width
        : anchor.right + gap;
    const crossAxis = resolveCrossAxis(
      options.align,
      anchor.top,
      anchor.bottom,
      size.height,
    );

    return {
      left: clamp(
        mainAxis,
        boundary.left + edgeMargin,
        boundary.right - edgeMargin - size.width,
      ),
      top: clamp(
        crossAxis,
        boundary.top + edgeMargin,
        boundary.bottom - edgeMargin - size.height,
      ),
    };
  }

  const mainAxis =
    options.placement === 'bottom'
      ? anchor.bottom + gap
      : anchor.top - gap - size.height;
  const crossAxis = resolveCrossAxis(
    options.align,
    anchor.left,
    anchor.right,
    size.width,
  );

  return {
    top: clamp(
      mainAxis,
      boundary.top + edgeMargin,
      boundary.bottom - edgeMargin - size.height,
    ),
    left: clamp(
      crossAxis,
      boundary.left + edgeMargin,
      boundary.right - edgeMargin - size.width,
    ),
  };
}

function resolveCrossAxis(
  align: AnchorAlign | number | undefined,
  start: number,
  end: number,
  size: number,
): number {
  const span = end - start;

  if (size >= span) {
    // The floating element doesn't fit within the anchor (e.g. a
    // single-line block shorter than the button anchored to it). Center it
    // instead of clamping to an arbitrary edge.
    return start + span / 2 - size / 2;
  }

  if (typeof align === 'number') {
    return clamp(align - size / 2, start, end - size);
  }

  switch (align) {
    case 'end':
      return end - size;
    case 'center':
      return start + (end - start) / 2 - size / 2;
    case 'start':
    default:
      return start;
  }
}

function clamp(value: number, min: number, max: number): number {
  const lo = Math.min(min, max);
  const hi = Math.max(min, max);

  return Math.min(Math.max(value, lo), hi);
}
