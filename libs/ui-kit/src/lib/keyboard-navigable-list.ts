export interface KeyboardNavigableListOptions<T> {
  items: () => readonly T[];
  activeIndex: () => number;
  setActiveIndex: (index: number) => void;
  onSelect: (item: T, index: number) => void;
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
          (this.options.activeIndex() + 1) % items.length,
        );

        return true;
      case 'ArrowUp':
        this.options.setActiveIndex(
          (this.options.activeIndex() - 1 + items.length) % items.length,
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
