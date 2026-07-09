import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RouteMeta } from '@analogjs/router';

import { CodePanel } from '../../examples/code-panel';
import { InstallTabs } from '../../components/install-tabs';
import { UI_KIT_COMPONENT_DOCS } from '../../kit/ui-kit-docs-data';
import {
  UI_KIT_INSTALL_COMMANDS,
  UI_KIT_SNIPPETS,
} from '../../kit/ui-kit-snippets';

export const routeMeta: RouteMeta = {
  title: 'UI Kit',
  meta: [
    {
      name: 'description',
      content:
        'Install and compose the optional @qalma/kit UI components for Qalma editor surfaces.',
    },
  ],
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ui-kit-docs',
  imports: [CodePanel, InstallTabs, RouterLink],
  template: `
    <article class="space-y-12">
      <header class="space-y-4">
        <p
          class="text-xs font-semibold uppercase tracking-[0.12em] text-accent"
        >
          UI Kit
        </p>
        <h1
          class="font-serif text-4xl font-medium leading-[1.1] tracking-tight"
        >
          Optional components for Qalma editor surfaces
        </h1>
        <p class="text-base leading-7 text-muted-foreground">
          <code>@qalma/editor</code> stays headless. <code>@qalma/kit</code>
          is the optional Tailwind-first layer for teams that want ready-made
          buttons, toolbar pieces, floating menus, and editor popovers without
          giving up ownership of their product UI.
        </p>
      </header>

      <section class="space-y-4">
        <h2 id="when-to-use-it">When to use it</h2>
        <p class="leading-7 text-muted-foreground">
          Use the kit when Qalma's default interaction pieces match your editor
          surface. Skip it, or use only part of it, when your application already
          owns controls through PrimeNG, Material, Kendo, ng-zorro, or a private
          design system.
        </p>
        <div class="grid gap-3 sm:grid-cols-3">
          @for (item of positioning; track item.title) {
            <div class="rounded-lg border border-border bg-card p-4">
              <h3 class="font-serif text-base font-medium">
                {{ item.title }}
              </h3>
              <p class="mt-2 text-sm leading-6 text-muted-foreground">
                {{ item.description }}
              </p>
            </div>
          }
        </div>
      </section>

      <section class="space-y-4">
        <h2 id="installation">Installation</h2>
        <p class="leading-7 text-muted-foreground">
          Install the kit next to the headless editor. The package expects your
          app to provide Tailwind utilities and the CSS token contract described
          in the theming page.
        </p>
        <app-install-tabs
          class="block"
          [packages]="installCommands"
          installTarget="ui-kit"
        />
        <p class="leading-7 text-muted-foreground">
          The kit does not ship a stylesheet to import. With Tailwind v4, point
          Tailwind at the installed package so it generates the utilities used
          inside kit components.
        </p>
        <app-code-panel
          [code]="snippets.tailwindSource"
          language="CSS"
          exampleId="ui-kit-tailwind-source"
        />
      </section>

      <section class="space-y-4">
        <h2 id="theming">Theming</h2>
        <p class="leading-7 text-muted-foreground">
          The kit reads normal Tailwind classes such as
          <code>bg-popover</code>, <code>text-muted-foreground</code>,
          <code>border-border</code>, and <code>ring-ring</code>. Map those to
          your app tokens once, then override individual components where your
          product needs a stronger opinion.
        </p>
        <a
          routerLink="/kit/theming"
          class="inline-flex rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
        >
          View the theming API
        </a>
      </section>

      <section class="space-y-4">
        <h2 id="components">Components</h2>
        <p class="leading-7 text-muted-foreground">
          Each component has its own page with a live preview, expandable source
          snippet, API notes, and integration guidance.
        </p>
        <div class="grid gap-3 sm:grid-cols-2">
          @for (component of components; track component.href) {
            <a
              [routerLink]="component.href"
              class="rounded-lg border border-border bg-card p-4 transition-colors hover:border-accent hover:bg-secondary/60"
            >
              <h3 class="font-serif text-base font-medium">
                {{ component.title }}
              </h3>
              <p class="mt-2 text-sm leading-6 text-muted-foreground">
                {{ component.description }}
              </p>
            </a>
          }
        </div>
      </section>

      <section class="space-y-4">
        <h2 id="behavior-primitives">Behavior primitives</h2>
        <p class="leading-7 text-muted-foreground">
          Some exports are not visible components, but are still public because
          consumers may need the same placement, dismissal, or keyboard behavior
          for custom surfaces.
        </p>
        <a
          routerLink="/kit/primitives"
          class="inline-flex rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:border-accent hover:text-accent"
        >
          View behavior primitives
        </a>
      </section>
    </article>
  `,
})
export default class UiKitDocsPage {
  protected readonly installCommands = UI_KIT_INSTALL_COMMANDS;
  protected readonly snippets = UI_KIT_SNIPPETS;
  protected readonly components = UI_KIT_COMPONENT_DOCS;
  protected readonly positioning = [
    {
      title: 'Headless first',
      description:
        'The editor contract remains commands, queries, plugins, and Angular templates.',
    },
    {
      title: 'Token driven',
      description:
        'The kit reads app-owned CSS variables through Tailwind utilities.',
    },
    {
      title: 'Replaceable',
      description:
        'Every visual piece can be swapped for your own design-system component.',
    },
  ] as const;
}
