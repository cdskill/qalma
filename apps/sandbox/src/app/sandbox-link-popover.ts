import { Component, input, output } from '@angular/core';

import { LinkPopover } from './link-popover.model';

@Component({
  selector: 'app-sandbox-link-popover',
  template: `
    @if (popover(); as popover) {
      <div
        data-link-popover
        role="dialog"
        aria-label="Link preview"
        class="fixed z-20 w-[min(360px,calc(100vw-32px))] rounded-lg border border-slate-300 bg-white p-2 text-sm text-slate-800 shadow-lg"
        [style.left.px]="popover.left"
        [style.top.px]="popover.top"
        (mouseenter)="keepOpen.emit()"
        (mouseleave)="scheduleHide.emit()"
        (focusin)="keepOpen.emit()"
        (focusout)="scheduleHide.emit()"
      >
        @if (popover.editing) {
          <div class="flex items-center gap-2">
            <input
              class="min-h-8 min-w-0 flex-1 rounded-md border border-slate-300 px-2 text-sm outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100"
              type="url"
              aria-label="Edit link URL"
              [value]="href()"
              (input)="updateHref($event)"
            />
            <button
              type="button"
              class="min-h-8 rounded-md bg-slate-900 px-2.5 text-sm font-semibold text-white disabled:opacity-45"
              [disabled]="!href().trim()"
              (click)="save.emit(popover)"
            >
              Save
            </button>
            <button
              type="button"
              class="min-h-8 rounded-md border border-slate-300 px-2.5 text-sm font-semibold text-slate-700"
              (click)="dismiss.emit()"
            >
              Cancel
            </button>
          </div>
        } @else {
          <div class="flex items-center gap-2">
            <a
              class="min-w-0 flex-1 truncate font-medium text-[#0000ee] underline visited:text-[#551a8b]"
              [href]="popover.href"
              [target]="popover.target ?? '_blank'"
              [rel]="popover.rel ?? 'noopener noreferrer'"
            >
              {{ popover.href }}
            </a>
            <button
              type="button"
              class="min-h-8 rounded-md border border-slate-300 px-2.5 text-sm font-semibold text-slate-700"
              (click)="edit.emit(popover)"
            >
              Edit
            </button>
            <button
              type="button"
              class="min-h-8 rounded-md border border-slate-300 px-2.5 text-sm font-semibold text-slate-700"
              (click)="remove.emit(popover)"
            >
              Unlink
            </button>
          </div>
        }
      </div>
    }
  `,
})
export class SandboxLinkPopover {
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
