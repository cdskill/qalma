import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';

import {
  PlaygroundMentionOption,
  PlaygroundMentionPlacement,
} from './mention';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-playground-mention-menu',
  template: `
    @if (placement(); as placement) {
      <div
        role="listbox"
        aria-label="Mention suggestions"
        class="fixed z-20 w-[min(280px,calc(100vw-24px))] overflow-y-auto rounded-lg border border-border bg-popover p-1.5 text-sm text-popover-foreground shadow-lg"
        [style.left.px]="placement.left"
        [style.top.px]="placement.top"
        [style.bottom.px]="placement.bottom"
        [style.max-height.px]="placement.maxHeight"
      >
        @if (loading()) {
          <div class="px-2.5 py-2 text-sm text-muted-foreground">Loading…</div>
        } @else {
          @for (option of suggestions(); track option.id; let index = $index) {
            <button
              type="button"
              role="option"
              [attr.data-mention-index]="index"
              class="flex w-full min-w-0 flex-col items-start rounded-md px-2.5 py-2 text-left transition hover:bg-secondary focus:bg-secondary focus:outline-none"
              [class.bg-secondary]="index === activeIndex()"
              [attr.aria-selected]="index === activeIndex()"
              [attr.tabindex]="index === activeIndex() ? 0 : -1"
              (mouseenter)="activate.emit(index)"
              (mousedown)="preserveSelection($event)"
              (keydown)="handleOptionKeydown($event, option, index)"
              (click)="pick.emit(option)"
            >
              <span class="w-full truncate font-medium">{{ option.label }}</span>
              <span class="w-full truncate text-xs text-muted-foreground">{{
                option.description
              }}</span>
            </button>
          }
        }
      </div>
    }
  `,
})
export class PlaygroundMentionMenu {
  readonly placement = input<PlaygroundMentionPlacement | null>(null);
  readonly suggestions = input<readonly PlaygroundMentionOption[]>([]);
  readonly loading = input(false);
  readonly activeIndex = input(0);

  readonly activate = output<number>();
  readonly pick = output<PlaygroundMentionOption>();
  readonly dismiss = output<void>();

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  protected preserveSelection(event: MouseEvent): void {
    event.preventDefault();
  }

  protected handleOptionKeydown(
    event: KeyboardEvent,
    option: PlaygroundMentionOption,
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

    if (
      event.key === 'Enter' ||
      event.key === ' ' ||
      event.key === 'Spacebar'
    ) {
      event.preventDefault();
      this.pick.emit(option);
    }
  }

  private getNextIndex(index: number, delta: number): number {
    const length = this.suggestions().length;

    return length > 0 ? (index + delta + length) % length : index;
  }

  private focusOption(index: number): void {
    this.elementRef.nativeElement
      .querySelector<HTMLButtonElement>(`[data-mention-index="${index}"]`)
      ?.focus();
  }
}
