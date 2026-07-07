import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouteMeta } from '@analogjs/router';

import { KitExample } from '../../kit/kit-example';
import { KitSlashCommandMenuDemo } from '../../kit/demos/slash-command-menu.demo';
import slashCommandMenuDemoSource from '../../kit/demos/slash-command-menu.demo.ts?raw';

export const routeMeta: RouteMeta = {
  title: 'UI Kit Slash Command Menu',
  meta: [
    {
      name: 'description',
      content:
        'Use QalmaSlashCommandMenu to render a caret-anchored slash-command palette.',
    },
  ],
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ui-kit-slash-command-menu-docs',
  imports: [KitExample, KitSlashCommandMenuDemo],
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
          Slash Command Menu
        </h1>
        <p class="text-base leading-7 text-muted-foreground">
          <code>QalmaSlashCommandMenu</code> renders command options with icons,
          descriptions, shortcuts, and keyboard navigation. Your controller owns
          filtering and command execution.
        </p>
      </header>

      <section>
        <h2 id="preview">Preview</h2>
        <app-kit-example
          title="Block commands"
          description="The menu ships the default Lucide icon provider for first-party block commands."
          [code]="demoSource"
          exampleId="ui-kit-slash-command-menu"
        >
          <app-kit-slash-command-menu-demo />
        </app-kit-example>
      </section>

      <section class="space-y-4">
        <h2 id="api">API</h2>
        <p class="leading-7 text-muted-foreground">
          Inputs are <code>placement</code>, <code>options</code>, and
          <code>activeIndex</code>. Outputs are <code>activate</code>,
          <code>pick</code>, and <code>dismiss</code>. Each option includes the
          editor command name and optional command value; the app decides how to
          run it.
        </p>
      </section>
    </article>
  `,
})
export default class UiKitSlashCommandMenuDocsPage {
  protected readonly demoSource = slashCommandMenuDemoSource;
}
