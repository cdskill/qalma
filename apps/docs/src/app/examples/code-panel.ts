import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  afterRenderEffect,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideCheck,
  lucideChevronDown,
  lucideChevronUp,
  lucideCopy,
} from '@ng-icons/lucide';

import { PosthogService } from '../services/posthog.service';

/** Collapsed height (px) before the fade + "show all" control kicks in. */
const CLAMP_PX = 340;

/**
 * The "cookbook" half of an example: the source that produced the demo, with a
 * copy button and a shadcn-style bounded height — past {@link CLAMP_PX} the code
 * is clipped under a fade and a toggle reveals the rest. Reused across every
 * example, so each one doubles as copy-paste integration docs.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-code-panel',
  imports: [NgIcon],
  providers: [
    provideIcons({
      lucideCheck,
      lucideChevronDown,
      lucideChevronUp,
      lucideCopy,
    }),
  ],
  host: { class: 'block' },
  template: `
    <figure class="m-0 flex h-full flex-col overflow-hidden rounded-xl border border-border bg-muted">
      <figcaption
        class="flex items-center justify-between border-b border-border px-4 py-2"
      >
        <span
          class="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
        >
          {{ language() }}
        </span>
        <button
          type="button"
          class="inline-flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          [attr.aria-label]="copied() ? 'Copied' : 'Copy code'"
          (click)="copy()"
        >
          <ng-icon
            [name]="copied() ? 'lucideCheck' : 'lucideCopy'"
            class="text-sm"
            [class.text-accent]="copied()"
            aria-hidden="true"
          />
          {{ copied() ? 'Copied' : 'Copy' }}
        </button>
      </figcaption>

      <div class="relative min-h-0 flex-1">
        <div
          class="overflow-hidden transition-[max-height] duration-300 ease-out"
          [style.maxHeight.px]="expanded() ? null : CLAMP_PX"
        >
          <pre
            #codeEl
            class="m-0 overflow-x-auto px-4 py-3.5 font-mono text-[0.8125rem] leading-relaxed text-foreground"
          ><code>{{ code() }}</code></pre>
        </div>

        @if (collapsible() && !expanded()) {
          <div
            class="pointer-events-none absolute inset-x-0 bottom-0 flex h-24 items-end justify-center bg-gradient-to-t from-muted via-muted/85 to-transparent"
          >
            <button
              type="button"
              class="pointer-events-auto mb-3 inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground shadow-sm transition-colors hover:border-accent hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              (click)="expanded.set(true)"
            >
              <ng-icon name="lucideChevronDown" class="text-sm" aria-hidden="true" />
              Show all
            </button>
          </div>
        }
      </div>

      @if (collapsible() && expanded()) {
        <button
          type="button"
          class="flex items-center justify-center gap-1.5 border-t border-border py-2 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          (click)="expanded.set(false)"
        >
          <ng-icon name="lucideChevronUp" class="text-sm" aria-hidden="true" />
          Show less
        </button>
      }
    </figure>
  `,
})
export class CodePanel {
  private readonly posthogService = inject(PosthogService);

  readonly code = input.required<string>();
  readonly language = input('TypeScript');
  /** Identifies which example was copied, for analytics. */
  readonly exampleId = input('');

  protected readonly CLAMP_PX = CLAMP_PX;
  protected readonly expanded = signal(false);
  protected readonly collapsible = signal(false);
  protected readonly copied = signal(false);

  private readonly codeRef =
    viewChild.required<ElementRef<HTMLElement>>('codeEl');

  private resetTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    // New snippet (e.g. after switching example) → start collapsed again.
    effect(() => {
      this.code();
      this.expanded.set(false);
    });

    // Measure after layout so the fade/toggle only appears when it overflows.
    afterRenderEffect(() => {
      this.code();
      const element = this.codeRef().nativeElement;
      this.collapsible.set(element.scrollHeight > CLAMP_PX + 8);
    });
  }

  protected copy(): void {
    void navigator.clipboard?.writeText(this.code()).then(() => {
      this.copied.set(true);
      clearTimeout(this.resetTimer);
      this.resetTimer = setTimeout(() => this.copied.set(false), 1600);
    });

    this.posthogService.posthog.capture('example_recipe_copied', {
      example: this.exampleId(),
    });
  }
}
