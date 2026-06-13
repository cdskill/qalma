import { ChangeDetectionStrategy, Component } from '@angular/core';

import { DocsHeader } from '../components/docs-header';
import { Hero } from '../components/hero';
import { Playground } from '../playground/playground';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home',
  imports: [DocsHeader, Hero, Playground],
  template: `
    <app-docs-header />

    <main>
      <app-hero />

      <section
        id="playground"
        class="mx-auto max-w-5xl px-4 pb-24 sm:px-6"
        aria-label="Live editor playground"
      >
        @defer (on idle) {
          <app-playground />
        } @placeholder {
          <div
            class="h-[520px] animate-pulse rounded-xl border border-border bg-card"
          ></div>
        } @loading (minimum 300ms) {
          <div
            class="h-[520px] animate-pulse rounded-xl border border-border bg-card"
          ></div>
        }
      </section>
    </main>

    <footer class="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
      <p>Qalma — the qalam for Angular. Built on ProseMirror.</p>
    </footer>
  `,
})
export default class HomeComponent {}
