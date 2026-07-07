import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCode,
  lucideHeading1,
  lucideHeading2,
  lucideHeading3,
  lucideList,
  lucideListOrdered,
  lucideListTodo,
  lucideMinus,
  lucidePilcrow,
  lucideSquareCode,
  lucideTable,
  lucideTextQuote,
} from '@ng-icons/lucide';
import { QalmaCommandValue } from '@qalma/editor';

import { QalmaSuggestionMenu } from './suggestion-menu-base';

export interface QalmaSlashCommandOption {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly icon: string;
  readonly shortcut: string;
  /** Editor command to run when the option is picked. */
  readonly command: string;
  readonly value?: QalmaCommandValue;
  readonly placement?: 'block' | 'inline';
  /** Extra terms the consumer can match against when filtering. */
  readonly keywords: readonly string[];
}

/**
 * Caret-anchored slash-command menu: an icon + shortcut list with a "Commands"
 * header and an Escape hint footer, scrolling the active option into view.
 * Positioning, keyboard handling and active highlighting come from
 * {@link QalmaSuggestionMenu}; feed it a `placement` (see `flipAbovePlacement`)
 * and the filtered `options`. Ships the default block-command icon set.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon],
  providers: [
    provideIcons({
      lucideCode,
      lucideHeading1,
      lucideHeading2,
      lucideHeading3,
      lucideList,
      lucideListOrdered,
      lucideListTodo,
      lucideMinus,
      lucidePilcrow,
      lucideSquareCode,
      lucideTable,
      lucideTextQuote,
    }),
  ],
  selector: 'qalma-slash-command-menu',
  template: `
    @if (placement(); as placement) {
      <div
        role="listbox"
        aria-label="Slash command suggestions"
        class="fixed z-20 flex w-[min(320px,calc(100vw-24px))] flex-col overflow-hidden rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none"
        [style.left.px]="placement.left"
        [style.top.px]="placement.top"
        [style.bottom.px]="placement.bottom"
        [style.max-height.px]="placement.maxHeight"
      >
        <div
          class="shrink-0 px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground"
        >
          Commands
        </div>
        <div data-suggestion-options class="min-h-0 flex-1 overflow-y-auto">
          @for (option of options(); track option.id; let index = $index) {
            <button
              type="button"
              role="option"
              [attr.data-suggestion-index]="index"
              class="group grid h-11 w-full min-w-0 cursor-pointer grid-cols-[1.75rem_minmax(0,1fr)_auto] items-center gap-2 rounded-sm px-2 text-left text-sm transition-colors hover:bg-accent-subtle hover:text-foreground focus:bg-accent-subtle focus:text-foreground focus:outline-none"
              [class.bg-accent-subtle]="index === activeIndex()"
              [class.text-foreground]="index === activeIndex()"
              [attr.aria-selected]="index === activeIndex()"
              [attr.tabindex]="index === activeIndex() ? 0 : -1"
              (mouseenter)="activate.emit(index)"
              (mousedown)="preserveSelection($event)"
              (keydown)="handleOptionKeydown($event, option, index)"
              (click)="pick.emit(option)"
            >
              <span
                class="flex size-7 items-center justify-center rounded-sm border border-border bg-card text-[14px] text-foreground"
                [class.border-accent]="index === activeIndex()"
                [class.bg-background]="index === activeIndex()"
                [class.text-accent]="index === activeIndex()"
              >
                <ng-icon [name]="option.icon" aria-hidden="true" />
              </span>
              <span class="min-w-0">
                <span class="block truncate font-medium leading-5">{{
                  option.label
                }}</span>
                @if (index === activeIndex()) {
                  <span
                    class="block truncate text-xs leading-4 text-foreground"
                  >
                    {{ option.description }}
                  </span>
                } @else {
                  <span
                    class="block truncate text-xs leading-4 text-muted-foreground group-hover:text-foreground group-focus:text-foreground"
                  >
                    {{ option.description }}
                  </span>
                }
              </span>
              <kbd
                class="rounded-sm border border-border bg-card px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground"
                [class.border-accent]="index === activeIndex()"
                [class.bg-background]="index === activeIndex()"
                [class.text-accent]="index === activeIndex()"
              >
                {{ option.shortcut }}
              </kbd>
            </button>
          }
        </div>
        <div
          class="mt-1 flex h-8 shrink-0 items-center justify-between border-t border-border px-2 text-[11px] text-muted-foreground"
        >
          <span>Close menu</span>
          <kbd
            class="rounded-sm border border-border bg-card px-1.5 py-0.5 font-mono"
            >esc</kbd
          >
        </div>
      </div>
    }
  `,
})
export class QalmaSlashCommandMenu extends QalmaSuggestionMenu<QalmaSlashCommandOption> {
  readonly options = input<readonly QalmaSlashCommandOption[]>([]);

  protected readonly optionList = this.options;

  constructor() {
    super();

    effect(() => {
      const activeIndex = this.activeIndex();

      this.options();
      queueMicrotask(() => this.scrollOptionIntoView(activeIndex));
    });
  }
}
