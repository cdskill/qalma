import {
  Directive,
  ElementRef,
  Signal,
  inject,
  input,
  output,
} from '@angular/core';

import { SuggestionMenuPlacement } from './flip-above-placement';

/** Option buttons carry this attribute so the base can focus/scroll to one by index. */
export const SUGGESTION_OPTION_INDEX_ATTR = 'data-suggestion-index';
/** The scrollable options container carries this attribute (optional). */
export const SUGGESTION_OPTIONS_SCROLLER_ATTR = 'data-suggestion-options';

/**
 * Shared behavior for caret-anchored suggestion menus (mention, slash command):
 * flip-above placement input, active-option highlighting, and in-menu keyboard
 * handling (Escape dismisses, Arrow moves + focuses, Enter/Space picks) with
 * wrap-around and optional scroll-into-view. Concrete menus only supply their
 * own item markup and expose their option list via `optionList`.
 */
@Directive()
export abstract class QalmaSuggestionMenu<TOption extends { readonly id: string }> {
  protected readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly placement = input<SuggestionMenuPlacement | null>(null);
  readonly activeIndex = input(0);

  readonly activate = output<number>();
  readonly pick = output<TOption>();
  readonly dismiss = output<void>();

  /** The rendered options, bound by the concrete menu (`options`/`suggestions`). */
  protected abstract readonly optionList: Signal<readonly TOption[]>;

  protected preserveSelection(event: MouseEvent): void {
    event.preventDefault();
  }

  protected handleOptionKeydown(
    event: KeyboardEvent,
    option: TOption,
    index: number,
  ): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.dismiss.emit();

      return;
    }

    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();

      const nextIndex = this.getNextIndex(
        index,
        event.key === 'ArrowDown' ? 1 : -1,
      );

      this.activate.emit(nextIndex);
      queueMicrotask(() => this.focusOption(nextIndex));

      return;
    }

    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      this.pick.emit(option);
    }
  }

  protected focusOption(index: number): void {
    this.optionElement(index)?.focus();
    // No-op for menus without a marked scroller (native focus handles scroll).
    this.scrollOptionIntoView(index);
  }

  protected scrollOptionIntoView(index: number): void {
    const scroller = this.optionsScroller();
    const option = this.optionElement(index);

    if (!scroller || !option) {
      return;
    }

    const optionTop = option.offsetTop - scroller.offsetTop;
    const optionBottom = optionTop + option.offsetHeight;
    const visibleTop = scroller.scrollTop;
    const visibleBottom = visibleTop + scroller.clientHeight;

    if (optionTop < visibleTop) {
      scroller.scrollTop = optionTop;
    } else if (optionBottom > visibleBottom) {
      scroller.scrollTop = optionBottom - scroller.clientHeight;
    }
  }

  private getNextIndex(index: number, delta: number): number {
    const length = this.optionList().length;

    return length > 0 ? (index + delta + length) % length : index;
  }

  private optionElement(index: number): HTMLElement | null {
    return this.elementRef.nativeElement.querySelector<HTMLElement>(
      `[${SUGGESTION_OPTION_INDEX_ATTR}="${index}"]`,
    );
  }

  private optionsScroller(): HTMLElement | null {
    return this.elementRef.nativeElement.querySelector<HTMLElement>(
      `[${SUGGESTION_OPTIONS_SCROLLER_ATTR}]`,
    );
  }
}
