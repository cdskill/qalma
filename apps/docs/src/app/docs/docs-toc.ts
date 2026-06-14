import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  signal,
} from '@angular/core';

import { DocsTocService } from './docs-toc.service';

/**
 * Right-hand "On This Page" column. Lists the `h2`/`h3` headings of the
 * active doc (populated by `[slug].page.ts` via `DocsTocService`) and
 * highlights the section currently in view.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-docs-toc',
  template: `
    @if (items().length) {
      <p
        class="mb-3 px-2 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
      >
        On This Page
      </p>
      <ul class="space-y-1.5 border-l border-border text-xs">
        @for (item of items(); track item.id) {
          <li>
            <a
              [href]="'#' + item.id"
              (click)="scrollTo($event, item.id)"
              class="-ml-px block border-l-2 border-transparent py-0.5 text-muted-foreground transition-colors hover:text-foreground"
              [class.pl-3]="item.level === 2"
              [class.pl-6]="item.level === 3"
              [class.border-accent]="activeId() === item.id"
              [class.text-accent]="activeId() === item.id"
              [class.font-medium]="activeId() === item.id"
            >
              {{ item.text }}
            </a>
          </li>
        }
      </ul>
    }
  `,
})
export class DocsToc {
  private readonly tocService = inject(DocsTocService);

  protected readonly items = this.tocService.items;
  protected readonly activeId = signal<string | null>(null);

  private observer?: IntersectionObserver;

  constructor() {
    effect(() => {
      const items = this.items();

      this.observer?.disconnect();
      this.activeId.set(items[0]?.id ?? null);

      // `IntersectionObserver` doesn't exist during SSR/prerender; the scroll
      // spy is a browser-only enhancement.
      if (!items.length || typeof IntersectionObserver === 'undefined') {
        return;
      }

      this.observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              this.activeId.set(entry.target.id);
              break;
            }
          }
        },
        { rootMargin: '-80px 0px -80% 0px' },
      );

      for (const item of items) {
        const el = document.getElementById(item.id);
        if (el) {
          this.observer.observe(el);
        }
      }
    });

    inject(DestroyRef).onDestroy(() => this.observer?.disconnect());
  }

  /**
   * Scrolls the target heading into view with an offset for the sticky
   * header, then reflects the section in the URL. Done in JS rather than a
   * native `#fragment` jump so the heading clears the header and the active
   * item updates immediately.
   */
  protected scrollTo(event: MouseEvent, id: string): void {
    const el = document.getElementById(id);
    if (!el) {
      return;
    }

    event.preventDefault();

    const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;
    window.scrollTo({ top, behavior: 'smooth' });
    history.replaceState(null, '', `#${id}`);
    this.activeId.set(id);
  }
}

/** Sticky header height (3.5rem) plus a little breathing room. */
const HEADER_OFFSET = 80;
