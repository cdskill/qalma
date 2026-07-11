import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

const PAGEFIND_BUNDLE_PATH = '/pagefind/pagefind.js';
const MAX_PAGE_RESULTS = 8;
const MAX_RESULTS = 10;

export type DocsSearchSection = 'Docs' | 'UI Kit';

export interface DocsSearchResult {
  readonly id: string;
  readonly url: string;
  readonly pageTitle: string;
  readonly sectionTitle: string | null;
  readonly section: DocsSearchSection;
  readonly excerpt: string;
}

interface PagefindSubResult {
  readonly title: string;
  readonly url: string;
  readonly excerpt: string;
}

interface PagefindResultData {
  readonly url: string;
  readonly excerpt: string;
  readonly meta: Readonly<Record<string, string>>;
  readonly sub_results?: readonly PagefindSubResult[];
}

interface PagefindResultReference {
  readonly id: string;
  data(): Promise<PagefindResultData>;
}

interface PagefindSearchResponse {
  readonly results: readonly PagefindResultReference[];
}

interface PagefindApi {
  init(): Promise<void> | void;
  debouncedSearch(
    query: string,
    options?: Readonly<Record<string, unknown>>,
    debounceTimeout?: number,
  ): Promise<PagefindSearchResponse | null>;
}

@Injectable({ providedIn: 'root' })
export class PagefindSearch {
  private readonly platformId = inject(PLATFORM_ID);
  private apiPromise: Promise<PagefindApi> | null = null;

  warm(): Promise<void> {
    if (!isPlatformBrowser(this.platformId)) {
      return Promise.resolve();
    }

    return this.loadApi().then(() => undefined);
  }

  async search(query: string): Promise<readonly DocsSearchResult[] | null> {
    const normalizedQuery = query.trim();

    if (!isPlatformBrowser(this.platformId) || normalizedQuery.length < 2) {
      return [];
    }

    const api = await this.loadApi();
    const response = await api.debouncedSearch(normalizedQuery, {}, 180);

    if (response === null) {
      return null;
    }

    return mapPagefindResults(response);
  }

  private loadApi(): Promise<PagefindApi> {
    if (this.apiPromise) {
      return this.apiPromise;
    }

    this.apiPromise = import(
      /* @vite-ignore */ PAGEFIND_BUNDLE_PATH
    ) as Promise<PagefindApi>;
    this.apiPromise = this.apiPromise
      .then(async (api) => {
        await api.init();
        return api;
      })
      .catch((error: unknown) => {
        this.apiPromise = null;
        throw error;
      });

    return this.apiPromise;
  }
}

export async function mapPagefindResults(
  response: PagefindSearchResponse,
): Promise<readonly DocsSearchResult[]> {
  const pageResults = await Promise.all(
    response.results.slice(0, MAX_PAGE_RESULTS).map(async (reference) => {
      const data = await reference.data();
      const pageTitle = data.meta['title'] || 'Qalma documentation';
      const section = resolveSection(data.meta['section'], data.url);
      const subResults = data.sub_results?.length
        ? data.sub_results
        : [
            {
              title: pageTitle,
              url: data.url,
              excerpt: data.excerpt,
            },
          ];

      return subResults.slice(0, 3).map((subResult, index) => ({
        id: `${reference.id}-${index}`,
        url: normalizePagefindUrl(subResult.url),
        pageTitle,
        sectionTitle:
          subResult.title && subResult.title !== pageTitle
            ? subResult.title
            : null,
        section,
        excerpt: subResult.excerpt || data.excerpt,
      }));
    }),
  );

  const uniqueResults = new Map<string, DocsSearchResult>();

  for (const result of pageResults.flat()) {
    if (!uniqueResults.has(result.url)) {
      uniqueResults.set(result.url, result);
    }
  }

  return Array.from(uniqueResults.values()).slice(0, MAX_RESULTS);
}

function resolveSection(
  metadata: string | undefined,
  url: string,
): DocsSearchSection {
  return metadata === 'UI Kit' || url.startsWith('/kit') ? 'UI Kit' : 'Docs';
}

function normalizePagefindUrl(url: string): string {
  const hashIndex = url.indexOf('#');
  const path = hashIndex === -1 ? url : url.slice(0, hashIndex);
  const hash = hashIndex === -1 ? '' : url.slice(hashIndex);
  const normalizedPath = path.length > 1 ? path.replace(/\/$/, '') : path;

  return `${normalizedPath}${hash}`;
}
