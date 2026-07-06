import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouteMeta } from '@analogjs/router';

import { CodePanel } from '../../examples/code-panel';
import {
  UI_KIT_CSS_TOKENS,
  UI_KIT_OVERRIDE_HOOKS,
} from '../../kit/ui-kit-docs-data';
import { UI_KIT_SNIPPETS } from '../../kit/ui-kit-snippets';

export const routeMeta: RouteMeta = {
  title: 'UI Kit Theming',
  meta: [
    {
      name: 'description',
      content:
        'Map @qalma/kit components to your Tailwind and CSS variable design tokens.',
    },
  ],
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ui-kit-theming-docs',
  imports: [CodePanel],
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
          Theming API
        </h1>
        <p class="text-base leading-7 text-muted-foreground">
          <code>@qalma/kit</code> is Tailwind-first, but your application owns
          the brand. Provide the token contract once, then override classes or
          data hooks where your design system needs sharper control.
        </p>
      </header>

      <section class="space-y-4">
        <h2 id="css-variables">CSS variables</h2>
        <p class="leading-7 text-muted-foreground">
          The kit reads shadcn-style variables through Tailwind classes. These
          names are the compatibility contract; their values should come from
          your product design system.
        </p>
        <div class="overflow-hidden rounded-xl border border-border">
          <table class="w-full text-left text-sm">
            <thead class="bg-secondary/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th class="px-3 py-2 font-semibold">Token</th>
                <th class="px-3 py-2 font-semibold">Used for</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @for (token of cssTokens; track token.name) {
                <tr class="bg-card/50 align-top">
                  <td class="whitespace-nowrap px-3 py-2 font-mono text-xs">
                    {{ token.name }}
                  </td>
                  <td class="px-3 py-2 text-muted-foreground">
                    {{ token.description }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section class="space-y-4">
        <h2 id="tailwind-mapping">Tailwind mapping</h2>
        <p class="leading-7 text-muted-foreground">
          With Tailwind v4, expose those variables through <code>@theme</code>.
          The palette below is intentionally generic; replace the values with
          your own visual identity.
        </p>
        <app-code-panel
          [code]="snippets.theme"
          language="CSS"
          exampleId="ui-kit-theme"
        />
      </section>

      <section class="space-y-4">
        <h2 id="avoiding-conflicts">Avoiding token conflicts</h2>
        <p class="leading-7 text-muted-foreground">
          These token names (<code>--background</code>, <code>--accent</code>,
          <code>--border</code>…) are the shadcn convention on purpose, so an app
          that already uses that convention themes the kit for free. There is no
          <code>--qalma-*</code> prefix. If your app instead defines those exact
          names on <code>:root</code> for something else, scope the kit's token
          block to a container that wraps your editor rather than <code>:root</code>.
          CSS custom properties inherit, so the Tailwind utilities inside that
          container resolve to your scoped values and never touch the rest of the
          page.
        </p>
        <app-code-panel
          [code]="scopeSnippet"
          language="CSS"
          exampleId="ui-kit-theme-scope"
        />
        <p class="leading-7 text-muted-foreground">
          Then wrap your editor surface with that class —
          <code>&lt;div class="qalma-surface"&gt;&lt;qalma-editor&gt;…&lt;/qalma-editor&gt;&lt;/div&gt;</code>
          — and the kit reads the scoped tokens while your app's own
          <code>:root</code> variables stay untouched.
        </p>
      </section>

      <section class="space-y-4">
        <h2 id="override-hooks">Override hooks</h2>
        <p class="leading-7 text-muted-foreground">
          Most styling should happen through tokens and host classes. These hooks
          exist for the cases where a product needs targeted overrides.
        </p>
        <div class="overflow-hidden rounded-xl border border-border">
          <table class="w-full text-left text-sm">
            <thead class="bg-secondary/60 text-xs uppercase text-muted-foreground">
              <tr>
                <th class="px-3 py-2 font-semibold">Hook</th>
                <th class="px-3 py-2 font-semibold">Use</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @for (hook of overrideHooks; track hook.name) {
                <tr class="bg-card/50 align-top">
                  <td class="whitespace-nowrap px-3 py-2 font-mono text-xs">
                    {{ hook.name }}
                  </td>
                  <td class="px-3 py-2 text-muted-foreground">
                    {{ hook.description }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section class="space-y-4">
        <h2 id="consumer-design-systems">Consumer design systems</h2>
        <p class="leading-7 text-muted-foreground">
          If your application uses PrimeNG, Angular Material, Kendo, ng-zorro,
          or another UI stack, the recommended path is still consumer-owned UI:
          bind your controls directly to <code>editor.execute()</code> and use
          <code>@qalma/kit</code> only for pieces you actually want to inherit.
        </p>
      </section>
    </article>
  `,
})
export default class UiKitThemingDocsPage {
  protected readonly snippets = UI_KIT_SNIPPETS;
  protected readonly cssTokens = UI_KIT_CSS_TOKENS;
  protected readonly overrideHooks = UI_KIT_OVERRIDE_HOOKS;

  /** Scoped-token recipe for apps whose :root already uses these names. */
  protected readonly scopeSnippet = `/* Scope the token contract to the editor surface instead of :root,
   so it never collides with your app's own --background, --accent, etc. */
.qalma-surface {
  --radius: 0.625rem;
  --background: #ffffff;
  --foreground: #18181b;
  --popover: #ffffff;
  --popover-foreground: #18181b;
  --accent: #2563eb;
  --accent-subtle: #dbeafe;
  --border: #e4e4e7;
  --ring: #2563eb;
  /* …the rest of the token contract… */
}

/* The @theme mapping stays global; only the raw values above are scoped. */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-popover: var(--popover);
  --color-accent: var(--accent);
  --color-accent-subtle: var(--accent-subtle);
  --color-border: var(--border);
  --color-ring: var(--ring);
  /* … */
}`;
}
