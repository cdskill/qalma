import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouteMeta } from '@analogjs/router';

import { KitExample } from '../../kit/kit-example';
import { KitMentionMenuDemo } from '../../kit/demos/mention-menu.demo';
import mentionMenuDemoSource from '../../kit/demos/mention-menu.demo.ts?raw';

export const routeMeta: RouteMeta = {
  title: 'UI Kit Mention Menu',
  meta: [
    {
      name: 'description',
      content:
        'Use QalmaMentionMenu to render keyboard-accessible mention suggestions.',
    },
  ],
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ui-kit-mention-menu-docs',
  imports: [KitExample, KitMentionMenuDemo],
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
          Mention Menu
        </h1>
        <p class="text-base leading-7 text-muted-foreground">
          <code>QalmaMentionMenu</code> renders the suggestion surface. Your app
          keeps the controller: filtering, async loading, insertion, and editor
          commands stay outside the kit.
        </p>
      </header>

      <section>
        <h2 id="preview">Preview</h2>
        <app-kit-example
          title="Mention suggestions"
          description="The menu receives placement, options, active index, and pick/dismiss outputs."
          [code]="demoSource"
          exampleId="ui-kit-mention-menu"
        >
          <app-kit-mention-menu-demo />
        </app-kit-example>
      </section>

      <section class="space-y-4">
        <h2 id="api">API</h2>
        <p class="leading-7 text-muted-foreground">
          Inputs are <code>placement</code>, <code>suggestions</code>,
          <code>activeIndex</code>, and <code>loading</code>. Outputs are
          <code>activate</code>, <code>pick</code>, and <code>dismiss</code>.
        </p>
      </section>
    </article>
  `,
})
export default class UiKitMentionMenuDocsPage {
  protected readonly demoSource = mentionMenuDemoSource;
}
