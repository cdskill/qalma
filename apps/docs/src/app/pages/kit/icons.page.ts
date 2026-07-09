import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouteMeta } from '@analogjs/router';

import { KitExample } from '../../kit/kit-example';
import { KitIconsDemo } from '../../kit/demos/icons.demo';
import iconsDemoSource from '../../kit/demos/icons.demo.ts?raw';

export const routeMeta: RouteMeta = {
  title: 'UI Kit Icons',
  meta: [
    {
      name: 'description',
      content:
        'Replace or extend the Lucide icons used by @qalma/kit toolbar and menu components.',
    },
  ],
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ui-kit-icons-docs',
  imports: [KitExample, KitIconsDemo],
  template: `
    <article class="space-y-10">
      <header class="space-y-4">
        <p
          class="text-xs font-semibold uppercase tracking-[0.12em] text-accent"
        >
          UI Kit
        </p>
        <h1
          class="font-serif text-4xl font-medium leading-[1.1] tracking-tight"
        >
          Icons
        </h1>
        <p class="text-base leading-7 text-muted-foreground">
          The kit renders every glyph through
          <code>&#64;ng-icons/core</code>, which resolves icons
          <em>by name</em>. You register a name once with
          <code>provideIcons()</code>, and any kit control that references that
          name renders it — so replacing an icon means registering a different
          SVG under the same name.
        </p>
      </header>

      <section class="space-y-4">
        <h2 id="toolbar-icons">Toolbar icons</h2>
        <p class="leading-7 text-muted-foreground">
          <code>provideQalmaToolbarIcons()</code> registers the Lucide set used
          by the default command fragments (<code>QALMA_TOOLBAR_*</code>).
          Because registrations merge and the last one wins, you override a
          single glyph by adding your own <code>provideIcons()</code> after it —
          no need to fork the toolbar. The <code>icon</code> field on
          <code>QalmaToolbarButton</code> and <code>ToolbarCommandItem</code> is
          just a registered name, so a custom name works the same way.
        </p>
        <app-kit-example
          title="Overriding and adding icons"
          description="lucideBold is remapped to an app SVG; appUnderline is a brand-new name — both render through the same toolbar button."
          [code]="demoSource"
          exampleId="ui-kit-icons"
        >
          <app-kit-icons-demo />
        </app-kit-example>
      </section>

      <section class="space-y-4">
        <h2 id="menu-icons">Menu icons</h2>
        <p class="leading-7 text-muted-foreground">
          <code>QalmaSlashCommandMenu</code> renders each option's
          <code>icon</code> field the same way. The menu ships the default
          Lucide icons for first-party block commands, so those work out of the
          box; register any additional names you reference (custom commands,
          brand glyphs) with your own <code>provideIcons()</code> at or above
          the menu.
        </p>
      </section>

      <section class="space-y-4">
        <h2 id="built-in-icons">Built-in component icons</h2>
        <p class="leading-7 text-muted-foreground">
          The drag-handle action menu and the slash menu's first-party defaults
          register their icons internally, so they render with no setup. Today
          there is no per-icon input to swap those built-in glyphs from outside
          the component. If you need fully custom block chrome, compose it from
          the primitives (<code>anchorToRect</code>,
          <code>flipAbovePlacement</code>, <code>DismissibleOverlay</code>,
          <code>KeyboardNavigableList</code>) and render your own icons — the
          same headless-first path the kit itself uses.
        </p>
      </section>
    </article>
  `,
})
export default class UiKitIconsDocsPage {
  protected readonly demoSource = iconsDemoSource;
}
