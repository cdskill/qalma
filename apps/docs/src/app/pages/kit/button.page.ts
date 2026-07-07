import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouteMeta } from '@analogjs/router';

import { KitExample } from '../../kit/kit-example';
import { KitButtonDemo } from '../../kit/demos/button.demo';
import buttonDemoSource from '../../kit/demos/button.demo.ts?raw';

export const routeMeta: RouteMeta = {
  title: 'UI Kit Button',
  meta: [
    {
      name: 'description',
      content:
        'Use QalmaButton to style native buttons and anchors with @qalma/kit tokens.',
    },
  ],
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ui-kit-button-docs',
  imports: [KitExample, KitButtonDemo],
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
          Button
        </h1>
        <p class="text-base leading-7 text-muted-foreground">
          <code>QalmaButton</code> is a directive for native
          <code>&lt;button&gt;</code> and <code>&lt;a&gt;</code> hosts. It
          applies token-driven variants while keeping semantics, routing, and
          click behavior in the consumer app.
        </p>
      </header>

      <section>
        <h2 id="preview">Preview</h2>
        <app-kit-example
          title="Variants"
          description="The directive reads the app's Tailwind token contract and merges consumer classes."
          [code]="demoSource"
          exampleId="ui-kit-button"
        >
          <app-kit-button-demo />
        </app-kit-example>
      </section>

      <section class="space-y-4">
        <h2 id="api">API</h2>
        <div class="overflow-hidden rounded-xl border border-border">
          <table class="w-full text-left text-sm">
            <thead
              class="bg-secondary/60 text-xs uppercase text-muted-foreground"
            >
              <tr>
                <th class="px-3 py-2 font-semibold">Input</th>
                <th class="px-3 py-2 font-semibold">Values</th>
                <th class="px-3 py-2 font-semibold">Default</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              <tr class="bg-card/50 align-top">
                <td class="px-3 py-2 font-mono text-xs">variant</td>
                <td class="px-3 py-2 text-muted-foreground">
                  default, secondary, outline, ghost, accent, link
                </td>
                <td class="px-3 py-2 font-mono text-xs">default</td>
              </tr>
              <tr class="bg-card/50 align-top">
                <td class="px-3 py-2 font-mono text-xs">size</td>
                <td class="px-3 py-2 text-muted-foreground">
                  default, sm, lg, icon
                </td>
                <td class="px-3 py-2 font-mono text-xs">default</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="space-y-4">
        <h2 id="integration-notes">Integration notes</h2>
        <p class="leading-7 text-muted-foreground">
          Use <code>QalmaButton</code> for simple actions and links. For editor
          commands, combine it with <code>QalmaCommand</code> directly, or use
          <code>QalmaToolbarButton</code> when an icon-only command button is
          enough.
        </p>
      </section>
    </article>
  `,
})
export default class UiKitButtonDocsPage {
  protected readonly demoSource = buttonDemoSource;
}
