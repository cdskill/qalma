import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCode2, lucideEye } from '@ng-icons/lucide';

import { CodePanel } from '../examples/code-panel';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kit-example',
  imports: [CodePanel, NgIcon],
  providers: [provideIcons({ lucideCode2, lucideEye })],
  host: { class: 'not-prose my-7 block' },
  template: `
    @let isCodeVisible = codeVisible();

    <section class="overflow-hidden rounded-xl border border-border bg-card">
      <header
        class="flex flex-col gap-3 border-b border-border bg-secondary/35 px-4 py-3 sm:flex-row sm:items-start sm:justify-between"
      >
        <div class="min-w-0">
          <h3 class="font-serif text-lg font-medium tracking-tight">
            {{ title() }}
          </h3>
          @if (description()) {
            <p class="mt-1 text-sm leading-relaxed text-muted-foreground">
              {{ description() }}
            </p>
          }
        </div>

        <button
          type="button"
          class="inline-flex h-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border bg-card px-3 text-xs font-medium text-muted-foreground transition-colors hover:border-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          [attr.aria-expanded]="isCodeVisible"
          (click)="toggleCode()"
        >
          <ng-icon
            [name]="isCodeVisible ? 'lucideEye' : 'lucideCode2'"
            class="text-sm"
            aria-hidden="true"
          />
          {{ isCodeVisible ? 'Hide code' : 'Show code' }}
        </button>
      </header>

      <div class="bg-background/70 p-4 sm:p-6">
        <ng-content />
      </div>

      @if (isCodeVisible) {
        <app-code-panel
          class="block border-t border-border"
          [code]="code()"
          [language]="language()"
          [exampleId]="exampleId()"
        />
      }
    </section>
  `,
})
export class KitExample {
  readonly title = input.required<string>();
  readonly description = input('');
  readonly code = input.required<string>();
  readonly language = input('TypeScript');
  readonly exampleId = input('');

  protected readonly codeVisible = signal(false);

  protected toggleCode(): void {
    this.codeVisible.update((visible) => !visible);
  }
}
