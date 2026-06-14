import { Injectable, signal } from '@angular/core';

export interface DocsTocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

/**
 * Bridges the active `/docs/:slug` content page (which owns the rendered
 * headings) and the layout's right-hand "On This Page" column.
 */
@Injectable({ providedIn: 'root' })
export class DocsTocService {
  readonly items = signal<DocsTocItem[]>([]);

  setItems(items: DocsTocItem[]): void {
    this.items.set(items);
  }

  clear(): void {
    this.items.set([]);
  }
}
