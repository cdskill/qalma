import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouteMeta } from '@analogjs/router';

import { KitExample } from '../../kit/kit-example';
import { KitLinkPopoverDemo } from '../../kit/demos/link-popover.demo';
import linkPopoverDemoSource from '../../kit/demos/link-popover.demo.ts?raw';

export const routeMeta: RouteMeta = {
  title: 'UI Kit Link Popover',
  meta: [
    {
      name: 'description',
      content:
        'Use QalmaLinkPopover to preview, edit, save, and remove Qalma link marks.',
    },
  ],
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ui-kit-link-popover-docs',
  imports: [KitExample, KitLinkPopoverDemo],
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
          Link Popover
        </h1>
        <p class="text-base leading-7 text-muted-foreground">
          <code>QalmaLinkPopover</code> is the presentation component for link
          preview and edit state. Pair it with
          <code>LinkPopoverController</code>
          or your own controller.
        </p>
      </header>

      <section>
        <h2 id="preview">Preview</h2>
        <app-kit-example
          title="Preview and edit"
          description="Hover the link in the editor to preview it, then edit or remove it — driven by LinkPopoverController."
          [code]="demoSource"
          exampleId="ui-kit-link-popover"
        >
          <app-kit-link-popover-demo />
        </app-kit-example>
      </section>

      <section class="space-y-4">
        <h2 id="api">API</h2>
        <p class="leading-7 text-muted-foreground">
          The component receives <code>popover</code> and <code>href</code>. It
          emits <code>hrefChange</code>, <code>edit</code>, <code>save</code>,
          <code>remove</code>, <code>dismiss</code>, <code>keepOpen</code>, and
          <code>scheduleHide</code>. The app decides how those events map to
          editor commands.
        </p>
      </section>
    </article>
  `,
})
export default class UiKitLinkPopoverDocsPage {
  protected readonly demoSource = linkPopoverDemoSource;
}
