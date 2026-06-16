import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  effect,
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
  lucideListTodo,
  lucidePilcrow,
  lucideSquareCode,
  lucideTextQuote,
} from '@ng-icons/lucide';

import {
  SandboxSlashCommandOption,
  SandboxSlashCommandPlacement,
} from './sandbox-slash-command';

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
      lucideListTodo,
      lucidePilcrow,
      lucideSquareCode,
      lucideTextQuote,
    }),
  ],
  selector: 'app-sandbox-slash-command-menu',
  template: `
    @if (placement(); as placement) {
      <div
        role="listbox"
        aria-label="Slash command suggestions"
        class="fixed z-20 flex w-[min(376px,calc(100vw-24px))] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white text-sm text-slate-900 shadow-xl"
        [style.left.px]="placement.left"
        [style.top.px]="placement.top"
        [style.bottom.px]="placement.bottom"
        [style.max-height.px]="placement.maxHeight"
      >
        <div
          class="shrink-0 px-3 pb-1.5 pt-3 text-xs font-semibold text-slate-500"
        >
          Basic blocks
        </div>
        <div
          data-slash-command-options
          class="min-h-0 flex-1 overflow-y-auto px-1.5 pb-1.5"
        >
          @for (option of options(); track option.id; let index = $index) {
            <button
              type="button"
              role="option"
              [attr.data-slash-command-index]="index"
              class="grid h-10 w-full min-w-0 grid-cols-[28px_minmax(0,1fr)_auto] items-center gap-2 rounded-md px-2 text-left transition hover:bg-slate-100 focus:bg-slate-100 focus:outline-none"
              [class.bg-slate-100]="index === activeIndex()"
              [attr.aria-selected]="index === activeIndex()"
              [attr.tabindex]="index === activeIndex() ? 0 : -1"
              (mouseenter)="activate.emit(index)"
              (mousedown)="preserveSelection($event)"
              (keydown)="handleOptionKeydown($event, option, index)"
              (click)="pick.emit(option)"
            >
              <span
                class="flex size-7 items-center justify-center text-slate-700"
              >
                <ng-icon [name]="option.icon" aria-hidden="true" />
              </span>
              <span class="min-w-0 truncate font-medium">{{
                option.label
              }}</span>
              <span class="pl-3 text-xs text-slate-400">{{
                option.shortcut
              }}</span>
            </button>
          }
        </div>
        <div
          class="flex h-11 shrink-0 items-center justify-between border-t border-slate-200 px-3 text-sm text-slate-700"
        >
          <span>Close menu</span>
          <span class="text-xs text-slate-400">esc</span>
        </div>
      </div>
    }
  `,
})
export class SandboxSlashCommandMenu {
  readonly placement = input<SandboxSlashCommandPlacement | null>(null);
  readonly options = input<readonly SandboxSlashCommandOption[]>([]);
  readonly activeIndex = input(0);

  readonly activate = output<number>();
  readonly pick = output<SandboxSlashCommandOption>();
  readonly dismiss = output<void>();

  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  constructor() {
    effect(() => {
      const activeIndex = this.activeIndex();

      this.options();
      queueMicrotask(() => this.scrollOptionIntoView(activeIndex));
    });
  }

  protected preserveSelection(event: MouseEvent): void {
    event.preventDefault();
  }

  protected handleOptionKeydown(
    event: KeyboardEvent,
    option: SandboxSlashCommandOption,
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
    const length = this.options().length;

    return length > 0 ? (index + delta + length) % length : index;
  }

  private focusOption(index: number): void {
    const option = this.getOptionElement(index);

    option?.focus();
    this.scrollOptionIntoView(index);
  }

  private scrollOptionIntoView(index: number): void {
    const scroller = this.getOptionsScroller();
    const option = this.getOptionElement(index);

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

  private getOptionElement(index: number): HTMLButtonElement | null {
    return this.elementRef.nativeElement.querySelector<HTMLButtonElement>(
      `[data-slash-command-index="${index}"]`,
    );
  }

  private getOptionsScroller(): HTMLElement | null {
    return this.elementRef.nativeElement.querySelector<HTMLElement>(
      '[data-slash-command-options]',
    );
  }
}
