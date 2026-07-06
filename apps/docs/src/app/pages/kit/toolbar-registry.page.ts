import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouteMeta } from '@analogjs/router';

import { KitExample } from '../../kit/kit-example';
import { KitToolbarRegistryDemo } from '../../kit/demos/toolbar-registry.demo';
import toolbarRegistryDemoSource from '../../kit/demos/toolbar-registry.demo.ts?raw';

export const routeMeta: RouteMeta = {
  title: 'UI Kit Toolbar Registry',
  meta: [
    {
      name: 'description',
      content:
        'Use QalmaToolbarRegistry to compose command groups and custom templates in a Qalma toolbar.',
    },
  ],
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ui-kit-toolbar-registry-docs',
  imports: [KitExample, KitToolbarRegistryDemo],
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
          Toolbar Registry
        </h1>
        <p class="text-base leading-7 text-muted-foreground">
          <code>QalmaToolbarRegistry</code> renders command groups from data,
          draws separators between non-empty groups, and still lets consumers
          interleave custom <code>ng-template</code> controls.
        </p>
      </header>

      <section>
        <h2 id="preview">Preview</h2>
        <app-kit-example
          title="Command fragments"
          description="Compose first-party command arrays into a toolbar that still belongs to the app."
          [code]="demoSource"
          exampleId="ui-kit-toolbar-registry"
        >
          <app-kit-toolbar-registry-demo />
        </app-kit-example>
      </section>

      <section class="space-y-4">
        <h2 id="api">API</h2>
        <p class="leading-7 text-muted-foreground">
          Pass a <code>ToolbarGroup[]</code>. Each item can be a
          <code>ToolbarCommandItem</code> or a <code>ToolbarTemplateItem</code>.
          Register icons with <code>provideQalmaToolbarIcons()</code>, then add
          your own <code>provideIcons()</code> call for custom controls.
        </p>
      </section>
    </article>
  `,
})
export default class UiKitToolbarRegistryDocsPage {
  protected readonly demoSource = toolbarRegistryDemoSource;
}
