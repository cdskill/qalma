import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMouse } from '@ng-icons/lucide';

import { DOCS_NAV } from './docs-nav';
import { PosthogService } from '../services/posthog.service';

/**
 * Left-nav for the docs site. Plain grouped link list (no collapsible
 * sections) so the full table of contents stays scannable, in the spirit of
 * the Tiptap / Plate.js docs sidebars. Top/bottom edges fade out when the
 * list overflows, with a small scroll hint on hover (shadcn-style).
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-docs-sidebar',
  host: { class: 'group relative block h-full' },
  imports: [RouterLink, RouterLinkActive, NgIcon],
  providers: [provideIcons({ lucideMouse })],
  template: `
    <nav
      #scrollEl
      (scroll)="updateFades()"
      aria-label="Documentation"
      class="scrollbar-hide h-full space-y-6 overflow-y-auto overscroll-none py-8 pr-1"
    >
      @for (group of groups; track group.title) {
        <div>
          <h3
            class="mb-2 px-2 font-sans text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
          >
            {{ group.title }}
          </h3>
          <ul class="space-y-0.5">
            @for (item of group.items; track item.href) {
              <li>
                @if (isDocsRoute(item.href)) {
                  <a
                    [routerLink]="item.href"
                    routerLinkActive="bg-accent-subtle !text-accent font-medium"
                    [routerLinkActiveOptions]="{ exact: true }"
                    (click)="onLinkClick(item.title, item.href)"
                    class="block rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    {{ item.title }}
                  </a>
                } @else {
                  <a
                    [href]="item.href"
                    (click)="onLinkClick(item.title, item.href)"
                    class="block rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  >
                    {{ item.title }}
                  </a>
                }
              </li>
            }
          </ul>
        </div>
      }
    </nav>

    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-background to-transparent transition-opacity duration-200"
      [class.opacity-0]="!showTopFade()"
    ></div>

    <div
      aria-hidden="true"
      class="pointer-events-none absolute inset-x-0 bottom-0 flex h-10 items-end justify-center bg-gradient-to-t from-background to-transparent pb-1 transition-opacity duration-200"
      [class.opacity-0]="!showBottomFade()"
    >
      <ng-icon
        name="lucideMouse"
        class="animate-bounce text-sm text-muted-foreground opacity-0 transition-opacity duration-200 group-hover:opacity-100"
      />
    </div>
  `,
})
export class DocsSidebar implements AfterViewInit {
  private readonly posthogService = inject(PosthogService);

  protected readonly groups = DOCS_NAV;

  private readonly scrollEl =
    viewChild.required<ElementRef<HTMLElement>>('scrollEl');

  protected readonly showTopFade = signal(false);
  protected readonly showBottomFade = signal(false);

  /** Emitted when a link is activated — lets the mobile sheet close itself. */
  readonly linkClick = output<void>();

  ngAfterViewInit(): void {
    this.updateFades();
  }

  @HostListener('window:resize')
  protected updateFades(): void {
    const el = this.scrollEl().nativeElement;

    this.showTopFade.set(el.scrollTop > 4);
    this.showBottomFade.set(
      el.scrollTop + el.clientHeight < el.scrollHeight - 4,
    );
  }

  protected onLinkClick(title: string, href: string): void {
    this.linkClick.emit();
    this.posthogService.posthog.capture('docs_sidebar_clicked', {
      title,
      href,
    });
  }

  protected isDocsRoute(href: string): boolean {
    return href.startsWith('/docs/');
  }
}
