import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

const SITE = 'https://qalma.dev';
const BRAND = 'Qalma';
// Home (no route title) — targets the head query "angular rich text editor".
const HOME_TITLE = 'Qalma — Headless rich text editor for Angular';

/**
 * Runs on every navigation (including SSR/prerender, so social scrapers that
 * don't execute JS still see the tags). Brands the page title, sets the
 * canonical URL, and mirrors title/description into Open Graph + Twitter tags.
 * Per-page <meta name="description"> (from markdown frontmatter, once set) is
 * picked up automatically; otherwise the global default in index.html stands.
 */
@Injectable()
export class SeoTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly doc = inject(DOCUMENT);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const routeTitle = this.buildTitle(snapshot);
    const fullTitle = routeTitle ? `${routeTitle} — ${BRAND}` : HOME_TITLE;
    this.title.setTitle(fullTitle);

    const path = snapshot.url.split('#')[0].split('?')[0];
    const url = `${SITE}${path === '/' ? '/' : path.replace(/\/$/, '')}`;
    this.setCanonical(url);

    const description = this.meta.getTag('name="description"')?.content;

    this.meta.updateTag({ property: 'og:title', content: fullTitle });
    this.meta.updateTag({ property: 'og:url', content: url });
    this.meta.updateTag({ name: 'twitter:title', content: fullTitle });
    if (description) {
      this.meta.updateTag({ property: 'og:description', content: description });
      this.meta.updateTag({
        name: 'twitter:description',
        content: description,
      });
    }
  }

  private setCanonical(url: string): void {
    let link = this.doc.head.querySelector<HTMLLinkElement>(
      'link[rel="canonical"]',
    );
    if (!link) {
      link = this.doc.createElement('link');
      link.setAttribute('rel', 'canonical');
      this.doc.head.appendChild(link);
    }
    link.setAttribute('href', url);
  }
}
