import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
} from '@angular/core';

import { DocsContent } from './docs-content.directive';
import { DocsNavGroup, DocsSection } from './docs-nav';
import { DocsSidebar } from './docs-sidebar';
import { DocsToc } from './docs-toc';
import { DocsTocItem, DocsTocService } from './docs-toc.service';
import { DocsHeader } from '../components/docs-header';

/**
 * Shared chrome for every documentation section: header, desktop left-nav
 * (scoped to the section's own tree), the projected content column, and the
 * right-hand "On This Page" TOC. The concrete `/docs/*` and `/kit/*` layouts
 * wrap their `<router-outlet>` with this and only supply the nav `groups` and
 * the active `section`.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-docs-shell',
  imports: [DocsHeader, DocsSidebar, DocsToc, DocsContent],
  template: `
    <app-docs-header />

    <div
      class="mx-auto flex w-full max-w-[90rem] items-start gap-10 px-4 sm:px-6 lg:px-8"
    >
      <aside
        class="sticky top-14 hidden h-[calc(100svh-10rem)] w-56 shrink-0 overscroll-none md:block"
      >
        <app-docs-sidebar [groups]="groups()" [section]="section()" />
      </aside>

      <main class="min-w-0 flex-1 py-10">
        <span
          class="sr-only"
          data-pagefind-meta="section"
          data-pagefind-filter="section"
        >
          {{ section() === 'kit' ? 'UI Kit' : 'Docs' }}
        </span>
        <div
          appDocsContent
          data-pagefind-body
          class="qalma-docs-content mx-auto max-w-3xl"
        >
          <ng-content />
        </div>
      </main>

      <aside
        class="scrollbar-hide sticky top-14 hidden h-[calc(100svh-10rem)] w-56 shrink-0 overflow-y-auto overscroll-none py-10 xl:block"
      >
        <app-docs-toc />
      </aside>
    </div>
  `,
})
export class DocsShell implements AfterViewChecked {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly tocService = inject(DocsTocService);
  private headingsKey = '';

  readonly groups = input.required<readonly DocsNavGroup[]>();
  readonly section = input.required<DocsSection['id']>();

  ngAfterViewChecked(): void {
    const headings = this.host.nativeElement.querySelectorAll(
      'main h2, main h3',
    ) as NodeListOf<HTMLElement>;

    const key = Array.from(headings)
      .map((heading) => heading.id || heading.textContent)
      .join('|');

    if (key === this.headingsKey) {
      return;
    }

    this.headingsKey = key;

    const slugCounts = new Map<string, number>();
    const items: DocsTocItem[] = Array.from(headings).map((heading) => {
      const text = (heading.textContent ?? '').trim();
      const id = heading.id || uniqueSlug(slugify(text), slugCounts);
      heading.id = id;

      return {
        id,
        text,
        level: heading.tagName === 'H2' ? 2 : 3,
      };
    });

    this.tocService.setItems(items);
  }
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function uniqueSlug(base: string, counts: Map<string, number>): string {
  const count = counts.get(base) ?? 0;
  counts.set(base, count + 1);

  return count === 0 ? base : `${base}-${count}`;
}
