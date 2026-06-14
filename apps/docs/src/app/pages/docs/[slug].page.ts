import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MarkdownComponent, injectContent } from '@analogjs/content';

import { findDocsNavItem } from '../../docs/docs-nav';

/**
 * Renders `src/content/docs/<slug>.md` for the active nav item. Pages
 * without a markdown file yet fall back to a "coming soon" placeholder
 * built from the item's title in `docs-nav.ts`.
 *
 * Note: slugs that *do* have a markdown file are actually served by
 * `@analogjs/router`'s auto-generated content route (`analog-markdown-route`,
 * styled via `.analog-markdown-route` in styles.css) rather than this
 * component — this page only handles the fallback case.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-docs-page',
  imports: [MarkdownComponent, AsyncPipe],
  template: `
    @if (doc$ | async; as doc) {
      <article class="qalma-prose">
        <analog-markdown [content]="doc.content" />
      </article>
    }
  `,
})
export default class DocsSlugPage {
  private readonly route = inject(ActivatedRoute);

  private readonly slug = this.route.snapshot.paramMap.get('slug') ?? '';
  private readonly title = findDocsNavItem(this.slug)?.title ?? 'Untitled';

  // `injectContent`'s fallback is inserted as raw HTML (not rendered
  // markdown) by `analog-markdown`, so it has to be valid markup here.
  protected readonly doc$ = injectContent(
    { param: 'slug', subdirectory: 'docs' },
    `<h1>${this.title}</h1><p>This page is on its way — check back soon.</p>`,
  );
}
