import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouteMeta } from '@analogjs/router';

import { KitExample } from '../../kit/kit-example';
import { KitContextualToolbarDemo } from '../../kit/demos/contextual-toolbar.demo';
import contextualToolbarDemoSource from '../../kit/demos/contextual-toolbar.demo.ts?raw';

export const routeMeta: RouteMeta = {
  title: 'UI Kit Contextual Toolbar',
  meta: [
    {
      name: 'description',
      content:
        'Use QalmaContextualToolbar to render inline formatting controls near selected text.',
    },
  ],
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ui-kit-contextual-toolbar-docs',
  imports: [KitExample, KitContextualToolbarDemo],
  template: `
    <article class="space-y-10">
      <header class="space-y-4">
        <p
          class="text-xs font-semibold uppercase tracking-[0.12em] text-accent"
        >
          UI Kit component
        </p>
        <h1
          class="font-serif text-4xl font-medium leading-[1.1] tracking-tight"
        >
          Contextual Toolbar
        </h1>
        <p class="text-base leading-7 text-muted-foreground">
          <code>QalmaContextualToolbar</code> is a floating container that
          positions itself above the selection and dismisses on Escape — you
          project the controls. Pair it with
          <code>QalmaSelectionToolbarDirective</code> so placement follows the
          browser selection in a real editor.
        </p>
      </header>

      <section>
        <h2 id="preview">Preview</h2>
        <app-kit-example
          title="Selection toolbar"
          description="Select any text in the editor — the toolbar appears above the selection and follows it."
          [code]="demoSource"
          exampleId="ui-kit-contextual-toolbar"
        >
          <app-kit-contextual-toolbar-demo />
        </app-kit-example>
      </section>

      <section class="space-y-4">
        <h2 id="api">API</h2>
        <p class="leading-7 text-muted-foreground">
          The only input is <code>placement</code> (plus an optional
          <code>label</code>); the only output is <code>dismiss</code>. It ships
          no buttons: drop <code>&lt;qalma-toolbar-button&gt;</code> for commands
          and your own buttons for app actions (like link entry) inside it.
        </p>
      </section>
    </article>
  `,
})
export default class UiKitContextualToolbarDocsPage {
  protected readonly demoSource = contextualToolbarDemoSource;
}
