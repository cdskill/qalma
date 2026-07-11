import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  afterNextRender,
  computed,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowDown,
  lucideArrowUp,
  lucideCornerDownLeft,
  lucideSearch,
  lucideX,
} from '@ng-icons/lucide';

import { PosthogService } from '../services/posthog.service';
import { DocsSearchResult, PagefindSearch } from '../search/pagefind-search';

type SearchStatus = 'idle' | 'loading' | 'ready' | 'error';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-docs-search',
  imports: [NgIcon],
  providers: [
    provideIcons({
      lucideArrowDown,
      lucideArrowUp,
      lucideCornerDownLeft,
      lucideSearch,
      lucideX,
    }),
  ],
  template: `
    <button
      #trigger
      type="button"
      class="inline-flex h-9 w-9 items-center justify-center gap-2 rounded-md border border-border bg-card text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background lg:w-56 lg:justify-start lg:px-3"
      aria-haspopup="dialog"
      [attr.aria-expanded]="isOpen()"
      aria-label="Search Qalma documentation"
      (click)="open()"
    >
      <ng-icon name="lucideSearch" class="text-sm" aria-hidden="true" />
      <span class="hidden lg:inline">Search docs…</span>
      <kbd
        class="ml-auto hidden rounded border border-border px-1.5 font-mono text-[10px] lg:inline-flex"
        aria-hidden="true"
      >
        {{ shortcutLabel() }}
      </kbd>
    </button>

    <dialog
      #dialog
      aria-labelledby="docs-search-title"
      class="m-auto max-h-[min(42rem,calc(100svh-2rem))] w-[min(44rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-border bg-popover p-0 text-popover-foreground shadow-2xl backdrop:bg-black/50 backdrop:backdrop-blur-sm"
      (pointerdown)="onDialogPointerDown($event)"
      (close)="onDialogClosed()"
    >
      <div class="flex max-h-[min(42rem,calc(100svh-2rem))] flex-col">
        <div class="flex items-center gap-3 border-b border-border px-4">
          <ng-icon
            name="lucideSearch"
            class="shrink-0 text-lg text-muted-foreground"
            aria-hidden="true"
          />
          <label id="docs-search-title" class="sr-only" for="docs-search-input">
            Search Qalma documentation
          </label>
          <input
            #searchInput
            id="docs-search-input"
            type="text"
            inputmode="search"
            role="combobox"
            autocomplete="off"
            spellcheck="false"
            class="h-14 min-w-0 flex-1 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground"
            placeholder="Search docs and UI Kit…"
            [value]="query()"
            [attr.aria-expanded]="results().length > 0"
            aria-controls="docs-search-results"
            aria-autocomplete="list"
            [attr.aria-activedescendant]="activeDescendant()"
            (input)="onQueryInput($event)"
            (keydown)="onInputKeydown($event)"
          />
          <button
            type="button"
            class="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Close search"
            (click)="close()"
          >
            <ng-icon name="lucideX" aria-hidden="true" />
          </button>
        </div>

        <div class="min-h-40 flex-1 overflow-y-auto p-2 sm:min-h-72">
          @switch (status()) {
            @case ('idle') {
              <div
                class="grid min-h-40 place-items-center px-6 text-center text-sm text-muted-foreground sm:min-h-72"
              >
                <div>
                  <p class="font-medium text-foreground">
                    Search the Qalma docs
                  </p>
                  <p class="mt-1">
                    Type at least two characters to get started.
                  </p>
                </div>
              </div>
            }
            @case ('loading') {
              <div
                class="grid min-h-40 place-items-center text-sm text-muted-foreground sm:min-h-72"
                role="status"
              >
                Searching…
              </div>
            }
            @case ('error') {
              <div
                class="grid min-h-40 place-items-center px-6 text-center text-sm sm:min-h-72"
                role="alert"
              >
                <div>
                  <p class="font-medium text-foreground">
                    Search is unavailable
                  </p>
                  <p class="mt-1 text-muted-foreground">
                    Build the static search index, then try again.
                  </p>
                </div>
              </div>
            }
            @case ('ready') {
              @if (results().length > 0) {
                <ul
                  id="docs-search-results"
                  role="listbox"
                  aria-label="Search results"
                  class="space-y-1"
                >
                  @for (
                    result of results();
                    track result.id;
                    let index = $index
                  ) {
                    <li
                      role="option"
                      [id]="resultDomId(result)"
                      [attr.aria-selected]="activeIndex() === index"
                    >
                      <a
                        [href]="result.url"
                        class="block rounded-lg px-3 py-2.5 outline-none transition-colors hover:bg-secondary"
                        [class.bg-secondary]="activeIndex() === index"
                        (mouseenter)="activeIndex.set(index)"
                        (focus)="activeIndex.set(index)"
                        (click)="selectResult($event, result)"
                      >
                        <div class="flex items-start gap-3">
                          <div class="min-w-0 flex-1">
                            <div class="flex flex-wrap items-center gap-2">
                              <span class="font-medium text-foreground">
                                {{ result.pageTitle }}
                              </span>
                              <span
                                class="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                              >
                                {{ result.section }}
                              </span>
                            </div>
                            @if (result.sectionTitle) {
                              <p class="mt-0.5 text-xs font-medium text-accent">
                                {{ result.sectionTitle }}
                              </p>
                            }
                            <p
                              class="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground [&_mark]:rounded-sm [&_mark]:bg-accent-subtle [&_mark]:px-0.5 [&_mark]:text-accent"
                              [innerHTML]="result.excerpt"
                            ></p>
                          </div>
                          <ng-icon
                            name="lucideCornerDownLeft"
                            class="mt-1 shrink-0 text-sm text-muted-foreground"
                            aria-hidden="true"
                          />
                        </div>
                      </a>
                    </li>
                  }
                </ul>
              } @else {
                <div
                  class="grid min-h-40 place-items-center px-6 text-center text-sm sm:min-h-72"
                  role="status"
                >
                  <div>
                    <p class="font-medium text-foreground">No results</p>
                    <p class="mt-1 text-muted-foreground">
                      Try a plugin, command, or API name.
                    </p>
                  </div>
                </div>
              }
            }
          }
        </div>

        <div
          class="hidden items-center gap-4 border-t border-border px-4 py-2 text-[10px] text-muted-foreground sm:flex"
          aria-hidden="true"
        >
          <span class="inline-flex items-center gap-1">
            <kbd class="rounded border border-border px-1 py-0.5">
              <ng-icon name="lucideArrowUp" />
            </kbd>
            <kbd class="rounded border border-border px-1 py-0.5">
              <ng-icon name="lucideArrowDown" />
            </kbd>
            navigate
          </span>
          <span class="inline-flex items-center gap-1">
            <kbd class="rounded border border-border px-1 py-0.5">↵</kbd>
            open
          </span>
          <span class="ml-auto inline-flex items-center gap-1">
            <kbd class="rounded border border-border px-1 py-0.5">esc</kbd>
            close
          </span>
        </div>
      </div>
    </dialog>

    <span class="sr-only" aria-live="polite">{{ resultAnnouncement() }}</span>
  `,
})
export class DocsSearch {
  private readonly pagefind = inject(PagefindSearch);
  private readonly posthogService = inject(PosthogService);
  private readonly router = inject(Router);
  private readonly dialog =
    viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly searchInput =
    viewChild.required<ElementRef<HTMLInputElement>>('searchInput');
  private readonly trigger =
    viewChild.required<ElementRef<HTMLButtonElement>>('trigger');
  private searchSequence = 0;
  private lastZeroResultLength: number | null = null;

  readonly opened = output<void>();

  protected readonly isOpen = signal(false);
  protected readonly query = signal('');
  protected readonly status = signal<SearchStatus>('idle');
  protected readonly results = signal<readonly DocsSearchResult[]>([]);
  protected readonly activeIndex = signal(0);
  protected readonly shortcutLabel = signal('Ctrl K');
  protected readonly activeDescendant = computed(() => {
    const result = this.results()[this.activeIndex()];
    return result ? this.resultDomId(result) : null;
  });
  protected readonly resultAnnouncement = computed(() => {
    if (this.status() !== 'ready') {
      return '';
    }

    const count = this.results().length;
    return count === 1 ? '1 search result.' : `${count} search results.`;
  });

  constructor() {
    afterNextRender(() => {
      this.shortcutLabel.set(
        /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘ K' : 'Ctrl K',
      );
    });
  }

  @HostListener('document:keydown', ['$event'])
  protected onDocumentKeydown(event: KeyboardEvent): void {
    if (
      (event.metaKey || event.ctrlKey) &&
      !event.altKey &&
      event.key.toLowerCase() === 'k'
    ) {
      event.preventDefault();
      this.open();
    }
  }

  protected open(): void {
    this.opened.emit();

    if (!this.dialog().nativeElement.open) {
      this.dialog().nativeElement.showModal();
      this.isOpen.set(true);
      this.posthogService.posthog.capture('docs_search_opened');
      void this.pagefind.warm().catch(() => undefined);
    }

    requestAnimationFrame(() => this.searchInput().nativeElement.focus());
  }

  protected close(): void {
    if (this.dialog().nativeElement.open) {
      this.dialog().nativeElement.close();
    }
  }

  protected onDialogClosed(): void {
    this.isOpen.set(false);
    this.searchSequence += 1;
    this.query.set('');
    this.results.set([]);
    this.status.set('idle');
    this.activeIndex.set(0);

    if (this.trigger().nativeElement.isConnected) {
      this.trigger().nativeElement.focus();
    }
  }

  protected onDialogPointerDown(event: PointerEvent): void {
    if (event.target === this.dialog().nativeElement) {
      this.close();
    }
  }

  protected onQueryInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.query.set(query);
    this.activeIndex.set(0);

    if (query.trim().length < 2) {
      this.searchSequence += 1;
      this.results.set([]);
      this.status.set('idle');
      return;
    }

    void this.runSearch(query);
  }

  protected onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.moveActive(1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.moveActive(-1);
    } else if (event.key === 'Enter') {
      const result = this.results()[this.activeIndex()];
      if (result) {
        event.preventDefault();
        void this.navigateToResult(result);
      }
    }
  }

  protected selectResult(event: MouseEvent, result: DocsSearchResult): void {
    event.preventDefault();
    void this.navigateToResult(result);
  }

  protected resultDomId(result: DocsSearchResult): string {
    return `docs-search-result-${result.id.replace(/[^a-zA-Z0-9_-]/g, '-')}`;
  }

  private async runSearch(query: string): Promise<void> {
    const sequence = (this.searchSequence += 1);
    this.status.set('loading');

    try {
      const results = await this.pagefind.search(query);

      if (sequence !== this.searchSequence || results === null) {
        return;
      }

      this.results.set(results);
      this.status.set('ready');

      if (results.length === 0 && this.lastZeroResultLength !== query.length) {
        this.lastZeroResultLength = query.length;
        this.posthogService.posthog.capture('docs_search_zero_results', {
          queryLength: query.length,
        });
      }
    } catch {
      if (sequence === this.searchSequence) {
        this.results.set([]);
        this.status.set('error');
      }
    }
  }

  private moveActive(delta: number): void {
    const count = this.results().length;
    if (count === 0) {
      return;
    }

    this.activeIndex.update((index) => (index + delta + count) % count);
    requestAnimationFrame(() => {
      document.getElementById(this.activeDescendant() ?? '')?.scrollIntoView({
        block: 'nearest',
      });
    });
  }

  private async navigateToResult(result: DocsSearchResult): Promise<void> {
    this.posthogService.posthog.capture('docs_search_result_selected', {
      url: result.url,
      section: result.section,
    });
    this.close();
    await this.router.navigateByUrl(result.url);
  }
}
