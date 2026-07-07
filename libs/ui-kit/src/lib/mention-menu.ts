import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { QalmaSuggestionMenu } from './suggestion-menu-base';

export interface QalmaMentionOption {
  readonly id: string;
  readonly label: string;
  readonly description: string;
}

/**
 * Caret-anchored mention suggestion menu: an avatar-initial list with a loading
 * state. Positioning, keyboard handling and active highlighting come from
 * {@link QalmaSuggestionMenu}; feed it a `placement` (see `flipAbovePlacement`)
 * and the filtered `suggestions`.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'qalma-mention-menu',
  template: `
    @if (placement(); as placement) {
      <div
        role="listbox"
        aria-label="Mention suggestions"
        class="fixed z-20 w-[min(280px,calc(100vw-24px))] overflow-hidden rounded-md border border-border bg-popover p-1 text-sm text-popover-foreground shadow-lg outline-none"
        [style.left.px]="placement.left"
        [style.top.px]="placement.top"
        [style.bottom.px]="placement.bottom"
        [style.max-height.px]="placement.maxHeight"
      >
        @if (loading()) {
          <div
            class="flex items-center gap-2 px-2 py-2 text-sm text-muted-foreground"
          >
            <span
              class="size-7 animate-pulse rounded-sm border border-border bg-secondary"
              aria-hidden="true"
            ></span>
            <span>Loading…</span>
          </div>
        } @else {
          <div class="max-h-full overflow-y-auto">
            @for (
              option of suggestions();
              track option.id;
              let index = $index
            ) {
              <button
                type="button"
                role="option"
                [attr.data-suggestion-index]="index"
                class="group grid h-12 w-full min-w-0 cursor-pointer grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-2 rounded-sm px-2 text-left transition-colors hover:bg-accent-subtle hover:text-foreground focus:bg-accent-subtle focus:text-foreground focus:outline-none"
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
                  class="flex size-7 items-center justify-center rounded-sm border border-border bg-card text-xs font-semibold text-foreground"
                  [class.border-accent]="index === activeIndex()"
                  [class.bg-background]="index === activeIndex()"
                  [class.text-accent]="index === activeIndex()"
                  aria-hidden="true"
                >
                  {{ option.label.slice(0, 1) }}
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
              </button>
            }
          </div>
        }
      </div>
    }
  `,
})
export class QalmaMentionMenu extends QalmaSuggestionMenu<QalmaMentionOption> {
  readonly suggestions = input<readonly QalmaMentionOption[]>([]);
  readonly loading = input(false);

  protected readonly optionList = this.suggestions;
}
