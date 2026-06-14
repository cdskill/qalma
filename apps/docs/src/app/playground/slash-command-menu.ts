import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  output,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideHeading1,
  lucideHeading2,
  lucideHeading3,
  lucideList,
  lucideListOrdered,
  lucidePilcrow,
  lucideSquareCode,
  lucideTextQuote,
} from '@ng-icons/lucide';

import {
  PlaygroundSlashCommandOption,
  PlaygroundSlashCommandPlacement,
} from './slash-command';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [
    provideIcons({
      lucideHeading1,
      lucideHeading2,
      lucideHeading3,
      lucideList,
      lucideListOrdered,
      lucidePilcrow,
      lucideSquareCode,
      lucideTextQuote,
    }),
  ],
  selector: 'app-playground-slash-command-menu',
  template: `
    @if (placement(); as placement) {
      <div
        role="listbox"
        aria-label="Slash command suggestions"
        class="fixed z-20 flex w-[min(320px,calc(100vw-24px))] flex-col overflow-hidden rounded-lg border border-border bg-popover text-xs text-popover-foreground shadow-lg"
        [style.left.px]="placement.left"
        [style.top.px]="placement.top"
        [style.bottom.px]="placement.bottom"
        [style.max-height.px]="placement.maxHeight"
      >
        <div
          class="shrink-0 px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Basic blocks
        </div>
        <div class="min-h-0 flex-1 overflow-y-auto px-1.5 pb-1.5">
          @for (option of options(); track option.id; let index = $index) {
            <button
              type="button"
              role="option"
              [attr.data-slash-command-index]="index"
              class="grid h-8 w-full min-w-0 grid-cols-[18px_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-2 text-left transition hover:bg-secondary focus:bg-secondary focus:outline-none"
              [class.bg-secondary]="index === activeIndex()"
              [attr.aria-selected]="index === activeIndex()"
              [attr.tabindex]="index === activeIndex() ? 0 : -1"
              (mouseenter)="activate.emit(index)"
              (mousedown)="preserveSelection($event)"
              (keydown)="handleOptionKeydown($event, option, index)"
              (click)="pick.emit(option)"
            >
              <span
                class="flex size-[18px] items-center justify-center text-[14px] text-foreground"
              >
                <ng-icon [name]="option.icon" aria-hidden="true" />
              </span>
              <span class="min-w-0 truncate font-medium">{{
                option.label
              }}</span>
              <span class="pl-3 text-[11px] text-muted-foreground">{{
                option.shortcut
              }}</span>
            </button>
          }
        </div>
        <div
          class="flex h-8 shrink-0 items-center justify-between border-t border-border px-2.5 text-[11px] text-muted-foreground"
        >
          <span>Close menu</span>
          <span>esc</span>
        </div>
      </div>
    }
  `,
})
export class PlaygroundSlashCommandMenu {
  readonly placement = input<PlaygroundSlashCommandPlacement | null>(null);
  readonly options = input<readonly PlaygroundSlashCommandOption[]>([]);
  readonly activeIndex = input(0);

  readonly activate = output<number>();
  readonly pick = output<PlaygroundSlashCommandOption>();
  readonly dismiss = output<void>();

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  protected preserveSelection(event: MouseEvent): void {
    event.preventDefault();
  }

  protected handleOptionKeydown(
    event: KeyboardEvent,
    option: PlaygroundSlashCommandOption,
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

  private getNextIndex(index: number, delta: number): number {
    const length = this.options().length;

    return length > 0 ? (index + delta + length) % length : index;
  }

  private focusOption(index: number): void {
    this.elementRef.nativeElement
      .querySelector<HTMLButtonElement>(`[data-slash-command-index="${index}"]`)
      ?.focus();
  }
}
