import { ChangeDetectionStrategy, Component } from '@angular/core';

import { DocsHeader } from '../components/docs-header';
import { Hero } from '../components/hero';
import { QalmaEditorLoading } from '../components/qalma-editor-loading';
import { Playground } from '../playground/playground';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-home',
  imports: [DocsHeader, Hero, Playground, QalmaEditorLoading],
  template: `
    <app-docs-header />

    <main>
      <app-hero />

      <section
        id="playground"
        class="mx-auto max-w-6xl px-4 pb-24 sm:px-6"
        aria-label="Live editor playground"
      >
        @defer (on viewport; prefetch on idle) {
          <app-playground />
        } @placeholder {
          <app-qalma-editor-loading eyebrow="Playground loading">
            Your favorite editor is sharpening its qalam...
          </app-qalma-editor-loading>
        } @loading (minimum 300ms) {
          <app-qalma-editor-loading eyebrow="Playground loading">
            Your favorite editor is sharpening its qalam...
          </app-qalma-editor-loading>
        }
      </section>
    </main>

    <footer
      class="border-t border-border/60 py-8 text-center text-sm text-muted-foreground"
    >
      <p>Qalma — the qalam for Angular. Built on ProseMirror.</p>
    </footer>
  `,
})
export default class HomeComponent {}
