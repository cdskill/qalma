export interface KeyboardNavigableListOptions<T> {
  items: () => readonly T[];
  activeIndex: () => number;
  setActiveIndex: (index: number) => void;
  onSelect: (item: T, index: number) => void;
}

/**
 * Circular index step: move `index` by `delta` within `[0, length)`, wrapping
 * around both ends; returns `index` unchanged for an empty list. This is the
 * single source of truth for wrap-around list navigation — both
 * `KeyboardNavigableList` (BYO-markup lists) and `QalmaSuggestionMenu` (the
 * shipped mention/slash menus) delegate their arrow-key math to it.
 */
export function wrapIndex(index: number, delta: number, length: number): number {
  return length > 0 ? (index + delta + length) % length : index;
}

/**
 * Arrow-key navigation + Enter-to-select for autocomplete-style popovers
 * (mention menu, slash command menu). Shared so both features stop
 * reimplementing the same wrap-around index math.
 *
 * Takes a plain key string rather than a `KeyboardEvent` — some callers
 * relay keys through a `CustomEvent` (no real `KeyboardEvent` to read),
 * so preventing the default action is left to the caller.
 */
export class KeyboardNavigableList<T> {
  constructor(private readonly options: KeyboardNavigableListOptions<T>) {}

  /** Returns true when the key was handled (caller should stop further propagation / preventDefault). */
  handleKey(key: string): boolean {
    const items = this.options.items();

    if (items.length === 0) {
      return false;
    }

    switch (key) {
      case 'ArrowDown':
        this.options.setActiveIndex(
          wrapIndex(this.options.activeIndex(), 1, items.length),
        );

        return true;
      case 'ArrowUp':
        this.options.setActiveIndex(
          wrapIndex(this.options.activeIndex(), -1, items.length),
        );

        return true;
      case 'Enter': {
        const index = this.options.activeIndex();
        const item = items[index];

        if (item === undefined) {
          return false;
        }

        this.options.onSelect(item, index);

        return true;
      }
      default:
        return false;
    }
  }
}
