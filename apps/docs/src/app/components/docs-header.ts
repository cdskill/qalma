import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideGithub,
  lucideMenu,
  lucideSearch,
  lucideX,
} from '@ng-icons/lucide';

import { HlmButton } from '../ui/button';
import { ThemeToggle } from './theme-toggle';
import { PosthogService } from '../services/posthog.service';

/**
 * Minimal top bar in the shadcn / plate spirit: short height, no dividing
 * border, backdrop blur. The art direction lives in the page, not the chrome.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-docs-header',
  imports: [RouterLink, RouterLinkActive, NgIcon, HlmButton, ThemeToggle],
  providers: [
    provideIcons({
      lucideGithub,
      lucideMenu,
      lucideSearch,
      lucideX,
    }),
  ],
  template: `
    <header class="sticky top-0 z-40 w-full bg-background/70 backdrop-blur-md">
      <div
        class="relative mx-auto flex h-14 max-w-6xl items-center gap-6 px-4 sm:px-6"
      >
        <a href="/" class="flex items-center gap-2" aria-label="Qalma home">
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
            class="transition-colors hover:text-foreground"
            href="/#playground"
          >
            Playground
          </a>
          <a
            routerLink="/docs/introduction"
            routerLinkActive="text-foreground"
            class="transition-colors hover:text-foreground"
          >
            Docs
          </a>
        </nav>

        <div class="ml-auto flex items-center gap-1.5">
          <button
            type="button"
            class="hidden h-9 items-center gap-2 rounded-md border border-border bg-card px-3 text-xs text-muted-foreground transition-colors hover:bg-secondary sm:inline-flex"
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
            appBtn
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
            appBtn
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

          <button
            appBtn
            variant="ghost"
            size="icon"
            type="button"
            class="md:hidden"
            [attr.aria-label]="mobileNavOpen() ? 'Close menu' : 'Open menu'"
            [attr.aria-expanded]="mobileNavOpen()"
            (click)="toggleMobileNav()"
          >
            <ng-icon
              [name]="mobileNavOpen() ? 'lucideX' : 'lucideMenu'"
              aria-hidden="true"
            />
          </button>
        </div>

        @if (mobileNavOpen()) {
          <nav
            class="absolute inset-x-0 top-full flex flex-col gap-1 border-b border-border bg-card px-4 py-3 shadow-lg sm:px-6 md:hidden"
          >
            <a
              class="rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              href="/#playground"
              (click)="mobileNavOpen.set(false)"
            >
              Playground
            </a>
            <a
              routerLink="/docs/introduction"
              routerLinkActive="bg-accent-subtle !text-accent"
              class="rounded-md px-2 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              (click)="mobileNavOpen.set(false)"
            >
              Docs
            </a>
          </nav>
        }
      </div>
    </header>
  `,
})
export class DocsHeader {
  private readonly posthogService = inject(PosthogService);

  protected readonly mobileNavOpen = signal(false);

  protected toggleMobileNav(): void {
    const opening = !this.mobileNavOpen();
    this.mobileNavOpen.set(opening);
    if (opening) {
      this.posthogService.posthog.capture('mobile_nav_opened');
    }
  }

  protected trackNpmClick(): void {
    this.posthogService.posthog.capture('npm_link_clicked');
  }

  protected trackGithubClick(): void {
    this.posthogService.posthog.capture('github_link_clicked');
  }
}
