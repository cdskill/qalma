import {
  ChangeDetectionStrategy,
  Component,
  computed,
  HostListener,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
} from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideGithub,
  lucideMenu,
  lucideSearch,
  lucideX,
} from '@ng-icons/lucide';
import { filter, map } from 'rxjs';

import { QalmaButton } from '../ui/button';
import { ThemeToggle } from './theme-toggle';
import { PosthogService } from '../services/posthog.service';
import { DOCS_NAV } from '../docs/docs-nav';
import { KIT_NAV } from '../docs/kit-nav';

interface HeaderNavItem {
  readonly title: string;
  readonly href: string;
}

const HEADER_NAV: readonly HeaderNavItem[] = [
  { title: 'Home', href: '/' },
  { title: 'Docs', href: '/docs/introduction' },
  { title: 'UI Kit', href: '/kit' },
  { title: 'Examples', href: '/examples' },
  { title: 'Playground', href: '/#playground' },
];

/**
 * Minimal top bar in the shadcn / plate spirit: short height, no dividing
 * border, backdrop blur. The art direction lives in the page, not the chrome.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-docs-header',
  imports: [RouterLink, RouterLinkActive, NgIcon, QalmaButton, ThemeToggle],
  providers: [
    provideIcons({
      lucideGithub,
      lucideMenu,
      lucideSearch,
      lucideX,
    }),
  ],
  template: `
    @let isMobileNavOpen = mobileNavOpen();

    <header
      [class]="
        isMobileNavOpen
          ? 'sticky top-0 z-50 w-full bg-card/95 backdrop-blur-md transition-colors'
          : 'sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md transition-colors'
      "
    >
      <div
        class="relative mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6 md:gap-6"
      >
        <button
          type="button"
          class="-ml-2 flex h-10 items-center gap-2 rounded-md px-2 text-base font-medium text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background md:hidden"
          aria-controls="mobile-navigation"
          [attr.aria-label]="isMobileNavOpen ? 'Close menu' : 'Open menu'"
          [attr.aria-expanded]="isMobileNavOpen"
          (click)="toggleMobileNav()"
        >
          <span
            class="relative grid size-5 shrink-0 place-items-center"
            aria-hidden="true"
          >
            <ng-icon name="lucideMenu" [class]="menuIconClass()" />
            <ng-icon name="lucideX" [class]="closeIconClass()" />
          </span>
          <span>Menu</span>
        </button>

        <a
          href="/"
          class="hidden items-center gap-2 sm:flex"
          aria-label="Qalma home"
        >
          <img
            src="/qalma-mark-light.svg"
            class="size-5 dark:hidden"
            alt=""
            aria-hidden="true"
          />
          <img
            src="/qalma-mark-dark.svg"
            class="hidden size-5 dark:block"
            alt=""
            aria-hidden="true"
          />
          <span class="font-serif text-lg font-medium tracking-tight">
            Qalma
          </span>
        </a>

        <nav
          class="hidden items-center gap-5 text-sm text-muted-foreground md:flex"
        >
          <a
            routerLink="/docs/introduction"
            routerLinkActive="text-foreground"
            class="transition-colors hover:text-foreground"
          >
            Docs
          </a>
          <a
            routerLink="/kit"
            routerLinkActive="text-foreground"
            class="transition-colors hover:text-foreground"
          >
            UI Kit
          </a>
          <a
            routerLink="/examples"
            routerLinkActive="text-foreground"
            class="transition-colors hover:text-foreground"
          >
            Examples
          </a>
          <a
            class="transition-colors hover:text-foreground"
            href="/#playground"
          >
            Playground
          </a>
        </nav>

        <div class="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            class="hidden h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-xs text-muted-foreground transition-colors hover:bg-secondary lg:inline-flex"
          >
            <ng-icon name="lucideSearch" class="text-sm" aria-hidden="true" />
            <span>Search docs…</span>
            <kbd
              class="ml-2 rounded border border-border px-1.5 font-mono text-[10px]"
            >
              ⌘K
            </kbd>
          </button>

          <a
            qalmaBtn
            variant="ghost"
            size="icon"
            href="https://www.npmjs.com/package/@qalma/editor"
            target="_blank"
            rel="noreferrer"
            aria-label="@qalma/editor on npm"
            (click)="trackNpmClick()"
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              class="h-[1.05em] w-[1.05em]"
              aria-hidden="true"
            >
              <path
                d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"
              />
            </svg>
          </a>

          <a
            qalmaBtn
            variant="ghost"
            size="icon"
            href="https://github.com/cdskill/qalma"
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
            (click)="trackGithubClick()"
          >
            <ng-icon name="lucideGithub" aria-hidden="true" />
          </a>

          <app-theme-toggle />
        </div>
      </div>

      @if (isMobileNavOpen) {
        <nav
          id="mobile-navigation"
          class="absolute inset-x-0 top-full z-40 h-[calc(100svh-3.5rem)] overflow-y-auto overscroll-contain bg-card px-5 pb-12 pt-6 shadow-[0_20px_80px_rgba(0,0,0,0.12)] md:hidden"
          aria-label="Mobile navigation"
          animate.enter="mobile-nav-enter"
          animate.leave="mobile-nav-leave"
        >
          <div class="mx-auto max-w-6xl space-y-9">
            <section aria-labelledby="mobile-main-menu-title">
              <h2
                id="mobile-main-menu-title"
                class="text-sm font-medium text-muted-foreground"
              >
                Menu
              </h2>
              <ul class="mt-4 space-y-3">
                @for (item of headerNav; track item.href) {
                  <li>
                    @if (isRouterRoute(item.href)) {
                      <a
                        [routerLink]="item.href"
                        routerLinkActive="!text-accent"
                        [routerLinkActiveOptions]="{
                          exact: item.href === '/',
                        }"
                        class="block rounded-sm py-0.5 text-2xl font-semibold leading-8 text-foreground transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-card"
                        (click)="
                          onMobileNavItemClick(item.title, item.href, 'Menu')
                        "
                      >
                        {{ item.title }}
                      </a>
                    } @else {
                      <a
                        [href]="item.href"
                        class="block rounded-sm py-0.5 text-2xl font-semibold leading-8 text-foreground transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-card"
                        (click)="
                          onMobileNavItemClick(item.title, item.href, 'Menu')
                        "
                      >
                        {{ item.title }}
                      </a>
                    }
                  </li>
                }
              </ul>
            </section>

            @for (group of docsGroups(); track group.title) {
              <section [attr.aria-labelledby]="'mobile-docs-' + $index">
                <h2
                  [id]="'mobile-docs-' + $index"
                  class="text-sm font-medium text-muted-foreground"
                >
                  {{ group.title }}
                </h2>
                <ul class="mt-4 space-y-3">
                  @for (item of group.items; track item.href) {
                    <li>
                      @if (isRouterRoute(item.href)) {
                        <a
                          [routerLink]="item.href"
                          routerLinkActive="!text-accent"
                          [routerLinkActiveOptions]="{ exact: true }"
                          class="block rounded-sm py-0.5 text-2xl font-semibold leading-8 text-foreground transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-card"
                          (click)="
                            onMobileNavItemClick(
                              item.title,
                              item.href,
                              group.title
                            )
                          "
                        >
                          {{ item.title }}
                        </a>
                      } @else {
                        <a
                          [href]="item.href"
                          class="block rounded-sm py-0.5 text-2xl font-semibold leading-8 text-foreground transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-card"
                          (click)="
                            onMobileNavItemClick(
                              item.title,
                              item.href,
                              group.title
                            )
                          "
                        >
                          {{ item.title }}
                        </a>
                      }
                    </li>
                  }
                </ul>
              </section>
            }
          </div>
        </nav>
      }
    </header>
  `,
  styles: `
    .mobile-nav-enter {
      animation: mobile-nav-in 180ms cubic-bezier(0.22, 1, 0.36, 1);
    }

    .mobile-nav-leave {
      animation: mobile-nav-out 140ms ease-in forwards;
    }

    @keyframes mobile-nav-in {
      from {
        opacity: 0;
        transform: translateY(-0.5rem);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes mobile-nav-out {
      from {
        opacity: 1;
        transform: translateY(0);
      }

      to {
        opacity: 0;
        transform: translateY(-0.375rem);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .mobile-nav-enter,
      .mobile-nav-leave {
        animation: none;
      }
    }
  `,
})
export class DocsHeader {
  private readonly posthogService = inject(PosthogService);
  private readonly router = inject(Router);

  protected readonly mobileNavOpen = signal(false);
  protected readonly headerNav = HEADER_NAV;

  /** Current URL, tracked so the mobile detail nav can scope to its section. */
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
    ),
    { initialValue: this.router.url },
  );

  /** Detailed groups shown on mobile — the current section's own tree. */
  protected readonly docsGroups = computed(() =>
    this.url().startsWith('/kit') ? KIT_NAV : DOCS_NAV,
  );
  protected readonly menuIconClass = computed(() =>
    this.mobileNavOpen()
      ? 'absolute inset-0 text-xl opacity-0 rotate-90 scale-75 transition-all duration-200 ease-out'
      : 'absolute inset-0 text-xl opacity-100 rotate-0 scale-100 transition-all duration-200 ease-out',
  );
  protected readonly closeIconClass = computed(() =>
    this.mobileNavOpen()
      ? 'absolute inset-0 text-xl opacity-100 rotate-0 scale-100 transition-all duration-200 ease-out'
      : 'absolute inset-0 text-xl opacity-0 -rotate-90 scale-75 transition-all duration-200 ease-out',
  );

  protected toggleMobileNav(): void {
    const opening = !this.mobileNavOpen();
    this.mobileNavOpen.set(opening);
    if (opening) {
      this.posthogService.posthog.capture('mobile_nav_opened');
    }
  }

  protected closeMobileNav(): void {
    this.mobileNavOpen.set(false);
  }

  protected onMobileNavItemClick(
    title: string,
    href: string,
    group: string,
  ): void {
    this.closeMobileNav();
    this.posthogService.posthog.capture('mobile_nav_clicked', {
      title,
      href,
      group,
    });
  }

  @HostListener('document:keydown.escape')
  protected closeMobileNavOnEscape(): void {
    this.closeMobileNav();
  }

  protected trackNpmClick(): void {
    this.posthogService.posthog.capture('npm_link_clicked');
  }

  protected trackGithubClick(): void {
    this.posthogService.posthog.capture('github_link_clicked');
  }

  protected isRouterRoute(href: string): boolean {
    return href.startsWith('/') && !href.includes('#');
  }
}
