import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { flipAbovePlacement } from './flip-above-placement';

const BASE_OPTIONS = {
  width: 280,
  desiredHeight: 200,
  minHeight: 44,
  margin: 12,
  gap: 8,
};

describe('flipAbovePlacement', () => {
  let originalWidth: number;
  let originalHeight: number;

  beforeEach(() => {
    originalWidth = window.innerWidth;
    originalHeight = window.innerHeight;
    window.innerWidth = 1000;
    window.innerHeight = 800;
  });

  afterEach(() => {
    window.innerWidth = originalWidth;
    window.innerHeight = originalHeight;
  });

  it('opens below the anchor when there is room', () => {
    const placement = flipAbovePlacement(
      { top: 100, bottom: 120, left: 50 },
      BASE_OPTIONS,
    );

    expect(placement).toEqual({
      left: 50,
      top: 128, // rect.bottom + gap
      bottom: null,
      maxHeight: 200, // full desiredHeight fits
    });
  });

  it('flips above the anchor when there is not enough room below', () => {
    const placement = flipAbovePlacement(
      { top: 700, bottom: 720, left: 50 },
      BASE_OPTIONS,
    );

    expect(placement).toEqual({
      left: 50,
      top: null,
      bottom: 108, // innerHeight - rect.top + gap
      maxHeight: 200,
    });
  });

  it('clamps left within the viewport near the right edge', () => {
    const placement = flipAbovePlacement(
      { top: 100, bottom: 120, left: 900 },
      BASE_OPTIONS,
    );

    // leftBoundary = innerWidth - width - margin = 1000 - 280 - 12
    expect(placement.left).toBe(708);
  });

  it('never shrinks max-height below minHeight when space is tight', () => {
    const placement = flipAbovePlacement(
      { top: 30, bottom: 770, left: 50 },
      BASE_OPTIONS,
    );

    expect(placement.maxHeight).toBe(44); // floored at minHeight
  });
});
