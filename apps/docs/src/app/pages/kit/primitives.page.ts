import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouteMeta } from '@analogjs/router';

import { UI_KIT_BEHAVIOR_PRIMITIVES } from '../../kit/ui-kit-docs-data';

export const routeMeta: RouteMeta = {
  title: 'UI Kit Primitives',
  meta: [
    {
      name: 'description',
      content:
        'Behavior primitives exported by @qalma/kit for custom Qalma editor UI.',
    },
  ],
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ui-kit-primitives-docs',
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
          Behavior primitives
        </h1>
        <p class="text-base leading-7 text-muted-foreground">
          These exports are not visible components, but they are public because
          consumers often need the same placement, dismissal, and keyboard
          behavior for custom surfaces.
        </p>
      </header>

      <section class="space-y-4">
        <h2 id="exports">Exports</h2>
        <div class="overflow-hidden rounded-xl border border-border">
          <table class="w-full text-left text-sm">
            <thead
              class="bg-secondary/60 text-xs uppercase text-muted-foreground"
            >
              <tr>
                <th class="px-3 py-2 font-semibold">Export</th>
                <th class="px-3 py-2 font-semibold">Purpose</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-border">
              @for (primitive of primitives; track primitive.name) {
                <tr class="bg-card/50 align-top">
                  <td class="whitespace-nowrap px-3 py-2 font-mono text-xs">
                    {{ primitive.name }}
                  </td>
                  <td class="px-3 py-2 text-muted-foreground">
                    {{ primitive.description }}
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>

      <section class="space-y-4">
        <h2 id="guidance">Guidance</h2>
        <p class="leading-7 text-muted-foreground">
          Prefer the ready-made kit components when their UI fits. Reach for
          primitives when your product owns the visual shell but still needs
          reliable caret placement, outside dismissal, or list navigation.
        </p>
      </section>
    </article>
  `,
})
export default class UiKitPrimitivesDocsPage {
  protected readonly primitives = UI_KIT_BEHAVIOR_PRIMITIVES;
}
