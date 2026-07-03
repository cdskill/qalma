import { describe, expect, it } from 'vitest';

import { cn } from './cn';

describe('cn', () => {
  it('joins truthy class values', () => {
    const disabled = false;

    expect(cn('a', disabled && 'b', undefined, 'c')).toBe('a c');
  });

  it('resolves conflicting tailwind utilities to the last one', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });
});
