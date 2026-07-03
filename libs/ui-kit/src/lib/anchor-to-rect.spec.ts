import { describe, expect, it } from 'vitest';

import { anchorToRect } from './anchor-to-rect';

const boundary = { top: 0, bottom: 720, left: 0, right: 1280 };

describe('anchorToRect', () => {
  it('follows a pointer position clamped within the anchor for left placement', () => {
    // Reproduces the drag-handle scenario: a short block hovered near its
    // bottom edge, the handle should track the pointer, not the block top.
    // The scrollable surface is taller than the viewport, so its own
    // boundary (not the 720px default) is what matters here.
    const anchor = { top: 767.75, bottom: 791.75, left: 133, right: 1117 };
    const tallSurface = { top: 0, bottom: 900, left: 0, right: 1280 };

    const position = anchorToRect(anchor, {
      placement: 'left',
      boundary: tallSurface,
      size: { width: 30, height: 30 },
      gap: 8,
      align: 779.75,
    });

    expect(position.left).toBe(anchor.left - 8 - 30);
    expect(position.top).toBeCloseTo(779.75 - 15, 5);
  });

  it('clamps the pointer align within the anchor bounds when it points elsewhere', () => {
    const anchor = { top: 100, bottom: 160, left: 50, right: 200 };

    const position = anchorToRect(anchor, {
      placement: 'left',
      boundary,
      size: { width: 20, height: 40 },
      align: 500, // far outside the anchor rect
    });

    // Cross axis must stay clamped within [anchor.top, anchor.bottom - size].
    expect(position.top).toBeLessThanOrEqual(anchor.bottom - 40);
    expect(position.top).toBeGreaterThanOrEqual(anchor.top);
  });

  it('clamps vertically for bottom placement near the viewport edge (the link-popover bug)', () => {
    const anchor = { top: 700, bottom: 710, left: 100, right: 300 };

    const position = anchorToRect(anchor, {
      placement: 'bottom',
      boundary,
      size: { width: 360, height: 120 },
      align: 'start',
    });

    // Anchor is near the bottom of a 720px-tall boundary; naive
    // `anchor.bottom + gap` would render past 720. It must stay on-screen.
    expect(position.top + 120).toBeLessThanOrEqual(boundary.bottom);
  });

  it('centers on the anchor for top placement with align "center"', () => {
    const anchor = { top: 200, bottom: 220, left: 400, right: 500 };

    const position = anchorToRect(anchor, {
      placement: 'top',
      boundary,
      size: { width: 40, height: 30 },
      gap: 8,
      align: 'center',
    });

    expect(position.top).toBe(200 - 8 - 30);
    expect(position.left).toBe(400 + (500 - 400) / 2 - 40 / 2);
  });

  it('aligns to the end of the anchor for right placement', () => {
    const anchor = { top: 50, bottom: 90, left: 600, right: 700 };

    const position = anchorToRect(anchor, {
      placement: 'right',
      boundary,
      size: { width: 24, height: 24 },
      gap: 4,
      align: 'end',
    });

    expect(position.left).toBe(700 + 4);
    expect(position.top).toBe(90 - 24);
  });

  it('keeps the floating element within the horizontal boundary', () => {
    const anchor = { top: 300, bottom: 320, left: 1250, right: 1270 };

    const position = anchorToRect(anchor, {
      placement: 'bottom',
      boundary,
      size: { width: 200, height: 40 },
      align: 'start',
    });

    expect(position.left + 200).toBeLessThanOrEqual(boundary.right - 8);
  });
});
