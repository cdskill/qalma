import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouteMeta } from '@analogjs/router';
import { RouterLink } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowLeft,
  lucideBookOpen,
  lucideLayers,
} from '@ng-icons/lucide';

import { DocsHeader } from '../components/docs-header';
import { QalmaButton } from '../ui/button';

export const routeMeta: RouteMeta = {
  title: 'Page not found',
  meta: [
    {
      name: 'robots',
      content: 'noindex',
    },
    {
      name: 'description',
      content:
        'The requested Qalma page could not be found. Return home, open the docs, or browse the examples.',
    },
  ],
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-not-found',
  imports: [RouterLink, NgIcon, DocsHeader, QalmaButton],
  providers: [
    provideIcons({
      lucideArrowLeft,
      lucideBookOpen,
      lucideLayers,
    }),
  ],
  template: `
    <app-docs-header />

    <main class="relative min-h-[calc(100svh-3.5rem)] overflow-hidden">
      <section
        class="mx-auto grid w-full max-w-6xl content-start gap-8 px-4 pb-14 pt-10 sm:gap-10 sm:px-6 sm:py-16 lg:min-h-[calc(100svh-3.5rem)] lg:grid-cols-[minmax(0,1fr)_26rem] lg:content-center lg:items-center lg:gap-12 lg:py-20"
        aria-labelledby="not-found-title"
      >
        <div class="max-w-2xl">
          <p
            class="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-accent"
          >
            404 · Unknown route
          </p>

          <h1
            id="not-found-title"
            class="font-serif text-4xl font-medium leading-[1.08] sm:text-5xl lg:text-6xl"
          >
            This page slipped out of the document.
          </h1>

          <p
            class="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg"
          >
            The URL does not match a Qalma page. Head back to the editor story,
            jump into the docs, or browse the examples from a known path.
          </p>

          <div class="mt-8 flex flex-col gap-3 sm:flex-row">
            <a qalmaBtn routerLink="/" variant="accent" size="lg">
              <ng-icon name="lucideArrowLeft" aria-hidden="true" />
              Back home
            </a>
            <a qalmaBtn routerLink="/docs/introduction" variant="outline" size="lg">
              <ng-icon name="lucideBookOpen" aria-hidden="true" />
              Read the docs
            </a>
          </div>
        </div>

        <aside
          class="relative mx-auto w-full max-w-2xl lg:max-w-none"
          aria-label="Qalma route recovery"
        >
          <div
            class="relative overflow-hidden rounded-lg border border-border bg-card p-6 shadow-sm"
          >
            <div class="flex items-center justify-between gap-4">
              <div class="flex items-center gap-3">
                <span
                  class="grid size-12 place-items-center rounded-md border border-border bg-background"
                  aria-hidden="true"
                >
                  <img
                    src="/qalma-mark-light.svg"
                    class="size-7 dark:hidden"
                    alt=""
                  />
                  <img
                    src="/qalma-mark-dark.svg"
                    class="hidden size-7 dark:block"
                    alt=""
                  />
                </span>
                <div>
                  <p class="text-sm font-medium text-foreground">Qalma</p>
                  <p class="text-xs text-muted-foreground">Route fallback</p>
                </div>
              </div>

              <span
                class="rounded-md border border-border px-2.5 py-1 font-mono text-xs text-muted-foreground"
              >
                404
              </span>
            </div>

            <div class="mt-8 space-y-3">
              <a
                routerLink="/docs/introduction"
                class="group flex items-center justify-between rounded-md border border-border bg-background px-4 py-3 text-sm transition-colors hover:border-accent/50 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                <span>
                  <span class="block font-medium text-foreground">
                    Documentation
                  </span>
                  <span class="mt-0.5 block text-muted-foreground">
                    Start from the core concepts.
                  </span>
                </span>
                <ng-icon
                  name="lucideBookOpen"
                  class="text-base text-muted-foreground transition-colors group-hover:text-accent"
                  aria-hidden="true"
                />
              </a>

              <a
                routerLink="/examples"
                class="group flex items-center justify-between rounded-md border border-border bg-background px-4 py-3 text-sm transition-colors hover:border-accent/50 hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
              >
                <span>
                  <span class="block font-medium text-foreground">
                    Examples
                  </span>
                  <span class="mt-0.5 block text-muted-foreground">
                    See Qalma in real UI surfaces.
                  </span>
                </span>
                <ng-icon
                  name="lucideLayers"
                  class="text-base text-muted-foreground transition-colors group-hover:text-accent"
                  aria-hidden="true"
                />
              </a>
            </div>
          </div>
        </aside>
      </section>
    </main>
  `,
})
export default class NotFoundPage {}
