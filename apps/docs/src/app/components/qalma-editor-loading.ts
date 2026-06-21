import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { QalmaLogoLoader } from './qalma-logo-loader';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-qalma-editor-loading',
  imports: [QalmaLogoLoader],
  template: `
    <div
      class="grid place-items-center overflow-hidden rounded-xl border border-border bg-card px-6 text-center"
      [style.min-height]="height()"
    >
      <div class="flex max-w-md flex-col items-center gap-5">
        <app-qalma-logo-loader
          [label]="label()"
          style="--qalma-logo-loader-size: 8rem"
        />
        <span
          class="inline-flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-1 font-mono text-[0.6875rem] font-medium uppercase text-muted-foreground"
        >
          <span
            class="size-1.5 rounded-full bg-accent shadow-[0_0_0_3px_var(--color-accent-subtle)]"
            aria-hidden="true"
          ></span>
          {{ eyebrow() }}
        </span>
        <p
          class="max-w-sm font-serif text-2xl font-medium leading-tight text-foreground sm:text-[1.7rem]"
        >
          <ng-content />
        </p>
      </div>
    </div>
  `,
})
export class QalmaEditorLoading {
  readonly height = input('32.5rem');
  readonly eyebrow = input('Loading editor');
  readonly label = input('Loading Qalma editor');
}
