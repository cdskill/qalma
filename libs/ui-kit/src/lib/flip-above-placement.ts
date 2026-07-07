/**
 * Fixed-position coordinates for a suggestion menu anchored to a caret/range
 * rect. Exactly one of `top`/`bottom` is a number (the other is `null`): the
 * menu is pinned below the anchor by `top`, or above it by `bottom`.
 */
export interface SuggestionMenuPlacement {
  readonly left: number;
  readonly top: number | null;
  readonly bottom: number | null;
  readonly maxHeight: number;
}

export interface FlipAbovePlacementOptions {
  /** Menu width, used to clamp `left` within the viewport. */
  readonly width: number;
  /** Ideal menu height for the current option count. */
  readonly desiredHeight: number;
  /** Floor for the computed `maxHeight` (e.g. one option / a loading row). */
  readonly minHeight: number;
  /** Viewport edge margin (default 12). */
  readonly margin?: number;
  /** Gap between the anchor and the menu (default 8). */
  readonly gap?: number;
}

const DEFAULT_MARGIN = 12;
const DEFAULT_GAP = 8;

/**
 * Positions a floating list under an anchor rect, flipping it above when there
 * is not enough room below, and clamping its height and horizontal position to
 * the viewport. Shared by the mention and slash-command menus, whose flip
 * behavior `anchorToRect` does not cover (it has no flip / dynamic max-height).
 */
export function flipAbovePlacement(
  rect: { readonly top: number; readonly bottom: number; readonly left: number },
  options: FlipAbovePlacementOptions,
): SuggestionMenuPlacement {
  const {
    width,
    desiredHeight,
    minHeight,
    margin = DEFAULT_MARGIN,
    gap = DEFAULT_GAP,
  } = options;

  const availableBelow = window.innerHeight - rect.bottom - margin - gap;
  const availableAbove = rect.top - margin - gap;
  const openAbove =
    availableBelow < desiredHeight && availableAbove > availableBelow;
  const availableHeight = Math.max(
    minHeight,
    openAbove ? availableAbove : availableBelow,
  );
  const maxHeight = Math.min(desiredHeight, availableHeight);
  const leftBoundary = Math.max(margin, window.innerWidth - width - margin);

  return {
    left: Math.min(Math.max(rect.left, margin), leftBoundary),
    top: openAbove ? null : rect.bottom + gap,
    bottom: openAbove ? window.innerHeight - rect.top + gap : null,
    maxHeight,
  };
}
