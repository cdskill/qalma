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
 */
export class KeyboardNavigableList<T> {
  constructor(private readonly options: KeyboardNavigableListOptions<T>) {}

  /** Returns true when the key was handled (caller should stop further propagation). */
  handleKeydown(event: KeyboardEvent): boolean {
    const items = this.options.items();

    if (items.length === 0) {
      return false;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.options.setActiveIndex(
          (this.options.activeIndex() + 1) % items.length,
        );

        return true;
      case 'ArrowUp':
        event.preventDefault();
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

        event.preventDefault();
        this.options.onSelect(item, index);

        return true;
      }
      default:
        return false;
    }
  }
}
