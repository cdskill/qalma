import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { RouteMeta } from '@analogjs/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideFileText,
  lucideLayoutDashboard,
  lucideMail,
  lucideMessageSquare,
  lucideStar,
} from '@ng-icons/lucide';
import { BrnTabsImports } from '@spartan-ng/brain/tabs';

import { CodePanel } from '../examples/code-panel';
import { CommentBox } from '../examples/comment-box';
import { DocsHeader } from '../components/docs-header';
import { EXAMPLES, type ExampleId } from '../examples/examples-registry';
import { MailBox } from '../examples/mail-box';
import { MarkdownNotes } from '../examples/markdown-notes';
import { NotionDoc } from '../examples/notion-doc';
import { ProductReview } from '../examples/product-review';

export const routeMeta: RouteMeta = {
  title: 'Examples',
  meta: [
    {
      name: 'description',
      content:
        'See Qalma in real-world shapes — a comment box, email composer, product review form, block document, and Markdown notes editor. One engine, every surface.',
    },
  ],
};

/**
 * `/examples` — the showcase. One engine, every surface: a use-case selector
 * picks one example at a time (so a single editor is ever mounted), shown
 * side-by-side with the recipe that built it. Built to grow: add an entry to
 * the registry + a `@case` below.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-examples',
  imports: [
    BrnTabsImports,
    NgIcon,
    DocsHeader,
    CodePanel,
    CommentBox,
    MailBox,
    MarkdownNotes,
    NotionDoc,
    ProductReview,
  ],
  providers: [
    provideIcons({
      lucideFileText,
      lucideLayoutDashboard,
      lucideMail,
      lucideMessageSquare,
      lucideStar,
    }),
  ],
  template: `
    <app-docs-header />

    <main class="mx-auto max-w-[84rem] px-4 pb-24 sm:px-6">
      <section class="pb-8 pt-12 text-center sm:pt-16">
        <p
          class="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-accent"
        >
          Examples
        </p>
        <h1
          class="mx-auto max-w-2xl font-serif text-4xl font-medium leading-[1.1] tracking-tight sm:text-[2.75rem]"
        >
          One engine, every surface
        </h1>
        <p
          class="mx-auto mt-4 max-w-xl text-base leading-relaxed text-muted-foreground"
        >
          The same Qalma editor, dressed for the job. Pick a use case — each one
          ships with the recipe that built it.
        </p>
      </section>

      @let currentId = activeId();
      @let currentExample = activeExample();

      <div
        brnTabs
        [brnTabs]="currentId"
        (brnTabsChange)="select($event)"
        class="lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10"
      >
        <div
          brnTabsList
          aria-label="Examples"
          class="mb-6 flex gap-2 overflow-x-auto pb-1 lg:mb-0 lg:flex-col lg:overflow-visible lg:pb-0 lg:sticky lg:top-20 lg:self-start"
        >
          @for (example of examples; track example.id) {
            <button
              [brnTabsTrigger]="example.id"
              type="button"
              class="group flex shrink-0 items-center gap-2.5 rounded-lg border px-3 py-2 text-left transition-colors lg:w-full"
              [class]="
                currentId === example.id ? activeTabClass : idleTabClass
              "
            >
              <ng-icon
                [name]="example.icon"
                class="shrink-0 text-base"
                [class.text-accent]="currentId === example.id"
                aria-hidden="true"
              />
              <span class="min-w-0">
                <span class="block text-sm font-medium">{{
                  example.title
                }}</span>
                <span
                  class="hidden truncate text-xs text-muted-foreground lg:block"
                  >{{ example.tagline }}</span
                >
              </span>
            </button>
          }
        </div>

        <section class="min-w-0">
          <div class="mb-3">
            <h2 class="font-serif text-xl font-medium tracking-tight">
              {{ currentExample.title }}
            </h2>
            <p class="text-sm text-muted-foreground">
              {{ currentExample.tagline }}
            </p>
          </div>

          <div class="min-w-0">
            @defer (on viewport) {
              @switch (currentId) {
                @case ('comment-box') {
                  <app-comment-box />
                }
                @case ('mail-box') {
                  <app-mail-box />
                }
                @case ('product-review') {
                  <app-product-review />
                }
                @case ('notion-doc') {
                  <app-notion-doc />
                }
                @case ('markdown-notes') {
                  <app-markdown-notes />
                }
              }
            } @placeholder {
              <div
                class="h-[460px] animate-pulse rounded-xl border border-border bg-card"
              ></div>
            } @loading (minimum 300ms) {
              <div
                class="h-[460px] animate-pulse rounded-xl border border-border bg-card"
              ></div>
            }
          </div>

          <app-code-panel
            class="mt-5 block"
            [code]="currentExample.recipe"
            [exampleId]="currentId"
          />
        </section>
      </div>
    </main>

    <footer
      class="border-t border-border/60 py-8 text-center text-sm text-muted-foreground"
    >
      <p>Qalma — the qalam for Angular. Built on ProseMirror.</p>
    </footer>
  `,
})
export default class ExamplesComponent {
  protected readonly examples = EXAMPLES;
  protected readonly activeId = signal<ExampleId>(EXAMPLES[0].id);
  protected readonly activeExample = computed(
    () =>
      this.examples.find((example) => example.id === this.activeId()) ??
      this.examples[0],
  );

  protected readonly activeTabClass =
    'border-accent/40 bg-accent-subtle text-foreground';
  protected readonly idleTabClass =
    'border-transparent text-muted-foreground hover:border-border hover:bg-secondary hover:text-foreground';

  protected select(id: string | undefined): void {
    if (isExampleId(id)) {
      this.activeId.set(id);
    }
  }
}

function isExampleId(id: string | undefined): id is ExampleId {
  return EXAMPLES.some((example) => example.id === id);
}
