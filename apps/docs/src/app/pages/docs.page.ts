import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
} from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { DocsContent } from '../docs/docs-content.directive';
import { DocsHeader } from '../components/docs-header';
import { DocsSidebar } from '../docs/docs-sidebar';
import { DocsToc } from '../docs/docs-toc';
import { DocsTocItem, DocsTocService } from '../docs/docs-toc.service';

/**
 * Shared layout for every `/docs/*` route: header, desktop left-nav, content
 * outlet and a right-hand "On This Page" column.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-docs-layout',
  imports: [
    DocsHeader,
    DocsSidebar,
    DocsToc,
    DocsContent,
    RouterOutlet,
  ],
  template: `
    <app-docs-header />

    <div
      class="mx-auto flex w-full max-w-[90rem] items-start gap-10 px-4 sm:px-6 lg:px-8"
    >
      <aside
        class="sticky top-14 hidden h-[calc(100svh-10rem)] w-56 shrink-0 overscroll-none md:block"
      >
        <app-docs-sidebar />
      </aside>

      <main class="min-w-0 flex-1 py-10">
        <div appDocsContent class="mx-auto max-w-3xl">
          <router-outlet />
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
export default class DocsLayout implements AfterViewChecked {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly tocService = inject(DocsTocService);
  private headingsKey = '';

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
