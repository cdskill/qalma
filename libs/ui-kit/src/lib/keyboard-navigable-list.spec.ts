import { describe, expect, it, vi } from 'vitest';

import { KeyboardNavigableList } from './keyboard-navigable-list';

function createEvent(key: string): KeyboardEvent {
  return new KeyboardEvent('keydown', { key, cancelable: true });
}

describe('KeyboardNavigableList', () => {
  it('moves the active index forward on ArrowDown and wraps at the end', () => {
    let activeIndex = 0;
    const setActiveIndex = vi.fn((index: number) => {
      activeIndex = index;
    });
    const list = new KeyboardNavigableList({
      items: () => ['a', 'b', 'c'],
      activeIndex: () => activeIndex,
      setActiveIndex,
      onSelect: vi.fn(),
    });

    expect(list.handleKeydown(createEvent('ArrowDown'))).toBe(true);
    expect(setActiveIndex).toHaveBeenLastCalledWith(1);

    activeIndex = 2;
    expect(list.handleKeydown(createEvent('ArrowDown'))).toBe(true);
    expect(setActiveIndex).toHaveBeenLastCalledWith(0);
  });

  it('moves the active index backward on ArrowUp and wraps at the start', () => {
    let activeIndex = 0;
    const setActiveIndex = vi.fn((index: number) => {
      activeIndex = index;
    });
    const list = new KeyboardNavigableList({
      items: () => ['a', 'b', 'c'],
      activeIndex: () => activeIndex,
      setActiveIndex,
      onSelect: vi.fn(),
    });

    expect(list.handleKeydown(createEvent('ArrowUp'))).toBe(true);
    expect(setActiveIndex).toHaveBeenLastCalledWith(2);
  });

  it('selects the active item on Enter', () => {
    const onSelect = vi.fn();
    const list = new KeyboardNavigableList({
      items: () => ['a', 'b', 'c'],
      activeIndex: () => 1,
      setActiveIndex: vi.fn(),
      onSelect,
    });

    expect(list.handleKeydown(createEvent('Enter'))).toBe(true);
    expect(onSelect).toHaveBeenCalledWith('b', 1);
  });

  it('ignores unrelated keys', () => {
    const onSelect = vi.fn();
    const setActiveIndex = vi.fn();
    const list = new KeyboardNavigableList({
      items: () => ['a', 'b'],
      activeIndex: () => 0,
      setActiveIndex,
      onSelect,
    });

    expect(list.handleKeydown(createEvent('a'))).toBe(false);
    expect(onSelect).not.toHaveBeenCalled();
    expect(setActiveIndex).not.toHaveBeenCalled();
  });

  it('does nothing when the list is empty', () => {
    const list = new KeyboardNavigableList({
      items: () => [],
      activeIndex: () => 0,
      setActiveIndex: vi.fn(),
      onSelect: vi.fn(),
    });

    expect(list.handleKeydown(createEvent('ArrowDown'))).toBe(false);
    expect(list.handleKeydown(createEvent('Enter'))).toBe(false);
  });
});
