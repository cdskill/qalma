import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideArrowRight, lucideSparkles } from '@ng-icons/lucide';

import { HlmButton } from '../ui/button';
import { InstallTabs } from './install-tabs';
import { PosthogService } from '../services/posthog.service';

/**
 * Compact hero. Keeps vertical footprint small so the live playground sits
 * high on the page. The only ornament is the calligraphic accent word and the
 * pen stroke that draws itself underneath it.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-hero',
  imports: [NgIcon, HlmButton, InstallTabs],
  providers: [provideIcons({ lucideArrowRight, lucideSparkles })],
  template: `
    <section
      class="mx-auto max-w-3xl px-4 pb-10 pt-12 text-center sm:pb-12 sm:pt-16"
    >
      <span
        class="mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
      >
        <ng-icon name="lucideSparkles" class="text-accent" aria-hidden="true" />
        Now in alpha on npm
      </span>

      <h1
        class="mx-auto max-w-2xl font-serif text-4xl font-medium leading-[1.1] tracking-tight sm:text-5xl"
      >
        Rich text editing,
        <span class="relative whitespace-nowrap text-accent">
          <span class="font-script text-[1.35em] leading-[0]">beautifully</span>
          <svg
            class="qalma-swash absolute -bottom-3 left-[-4%] h-5 w-[108%] overflow-visible"
            viewBox="0 0 240 24"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d="M6 17 C 62 24, 132 20, 196 9 C 210 6, 219 8, 210 13 C 202 17, 214 18, 234 11"
              fill="none"
              stroke="currentColor"
              stroke-width="2.4"
              stroke-linecap="round"
            />
          </svg>
        </span>
        crafted for Angular.
      </h1>

      <p
        class="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground"
      >
        A headless, plugin-based editor built on ProseMirror. Composable
        primitives, Tailwind-first styling, and zero opinions about your design.
      </p>

      <div class="mt-7 flex justify-center">
        <a appBtn size="lg" href="#playground" (click)="trackGetStarted()">
          Get started
          <ng-icon name="lucideArrowRight" aria-hidden="true" />
        </a>
      </div>

      <app-install-tabs class="mx-auto mt-5 w-full max-w-md text-left" />
    </section>
  `,
})
export class Hero {
  private readonly posthogService = inject(PosthogService);

  protected trackGetStarted(): void {
    this.posthogService.posthog.capture('get_started_clicked');
  }
}
