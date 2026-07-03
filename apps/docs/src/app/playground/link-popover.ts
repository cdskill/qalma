import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCheck,
  lucideExternalLink,
  lucideLink,
  lucidePencil,
  lucideUnlink,
  lucideX,
} from '@ng-icons/lucide';

import { LinkPopover } from './link-popover.model';
import { QalmaButton } from '@qalma/kit';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, QalmaButton],
  providers: [
    provideIcons({
      lucideCheck,
      lucideExternalLink,
      lucideLink,
      lucidePencil,
      lucideUnlink,
      lucideX,
    }),
  ],
  selector: 'app-playground-link-popover',
  template: `
    @if (popover(); as popover) {
      <div
        data-link-popover
        role="dialog"
        aria-label="Link preview"
        class="fixed z-20 w-[min(360px,calc(100vw-32px))] rounded-md border border-border bg-popover p-1.5 text-sm text-popover-foreground shadow-lg outline-none"
        [style.left.px]="popover.left"
        [style.top.px]="popover.top"
        (mouseenter)="keepOpen.emit()"
        (mouseleave)="scheduleHide.emit()"
        (focusin)="keepOpen.emit()"
        (focusout)="scheduleHide.emit()"
      >
        @if (popover.editing) {
          <div class="flex items-center gap-1.5">
            <label
              class="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-input bg-background px-2 text-sm transition focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/30"
            >
              <ng-icon
                class="shrink-0 text-muted-foreground"
                name="lucideLink"
                aria-hidden="true"
              />
              <input
                class="min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-muted-foreground"
                type="url"
                aria-label="Edit link URL"
                [value]="href()"
                (input)="updateHref($event)"
              />
            </label>
            <button
              qalmaBtn
              size="icon"
              type="button"
              [disabled]="!href().trim()"
              (click)="save.emit(popover)"
              title="Save link"
              aria-label="Save link"
            >
              <ng-icon name="lucideCheck" aria-hidden="true" />
            </button>
            <button
              qalmaBtn
              variant="outline"
              size="icon"
              type="button"
              (click)="dismiss.emit()"
              title="Cancel"
              aria-label="Cancel"
            >
              <ng-icon name="lucideX" aria-hidden="true" />
            </button>
          </div>
        } @else {
          <div class="flex items-center gap-1.5">
            <a
              class="inline-flex h-9 min-w-0 flex-1 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-accent transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              [href]="popover.href"
              [target]="popover.target ?? '_blank'"
              [rel]="popover.rel ?? 'noopener noreferrer'"
              title="Open link"
            >
              <span class="min-w-0 truncate font-medium">{{
                popover.href
              }}</span>
              <ng-icon
                class="shrink-0 text-base"
                name="lucideExternalLink"
                aria-hidden="true"
              />
            </a>
            <button
              qalmaBtn
              variant="outline"
              size="icon"
              type="button"
              (click)="edit.emit(popover)"
              title="Edit link"
              aria-label="Edit link"
            >
              <ng-icon name="lucidePencil" aria-hidden="true" />
            </button>
            <button
              qalmaBtn
              variant="ghost"
              size="icon"
              type="button"
              class="text-destructive hover:bg-destructive/10 hover:text-destructive"
              (click)="remove.emit(popover)"
              title="Unlink"
              aria-label="Unlink"
            >
              <ng-icon name="lucideUnlink" aria-hidden="true" />
            </button>
          </div>
        }
      </div>
    }
  `,
})
export class PlaygroundLinkPopover {
  readonly popover = input<LinkPopover | null>(null);
  readonly href = input.required<string>();

  readonly hrefChange = output<string>();
  readonly edit = output<LinkPopover>();
  readonly save = output<LinkPopover>();
  readonly remove = output<LinkPopover>();
  readonly dismiss = output<void>();
  readonly keepOpen = output<void>();
  readonly scheduleHide = output<void>();

  protected updateHref(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.hrefChange.emit(target.value);
    }
  }
}
