import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouteMeta } from '@analogjs/router';

import { KitExample } from '../../kit/kit-example';
import { KitToolbarButtonDemo } from '../../kit/demos/toolbar-button.demo';
import toolbarButtonDemoSource from '../../kit/demos/toolbar-button.demo.ts?raw';

export const routeMeta: RouteMeta = {
  title: 'UI Kit Toolbar Button',
  meta: [
    {
      name: 'description',
      content:
        'Use QalmaToolbarButton to render an icon command button for Qalma editor toolbars.',
    },
  ],
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ui-kit-toolbar-button-docs',
  imports: [KitExample, KitToolbarButtonDemo],
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
          Toolbar Button
        </h1>
        <p class="text-base leading-7 text-muted-foreground">
          <code>QalmaToolbarButton</code> renders a token-styled icon button and
          wires it to <code>QalmaCommand</code>. It must live inside a
          <code>&lt;qalma-editor&gt;</code> context.
        </p>
      </header>

      <section>
        <h2 id="preview">Preview</h2>
        <app-kit-example
          title="Inline command buttons"
          description="Type in the editor, then toggle marks — active and disabled state come from the command registry."
          [code]="demoSource"
          exampleId="ui-kit-toolbar-button"
        >
          <app-kit-toolbar-button-demo />
        </app-kit-example>
      </section>

      <section class="space-y-4">
        <h2 id="api">API</h2>
        <p class="leading-7 text-muted-foreground">
          Required inputs are <code>command</code>, <code>icon</code>, and
          <code>label</code>. Pass <code>value</code> for command payloads, and
          override <code>iconClass</code> when the surrounding toolbar uses a
          different icon scale.
        </p>
      </section>
    </article>
  `,
})
export default class UiKitToolbarButtonDocsPage {
  protected readonly demoSource = toolbarButtonDemoSource;
}
