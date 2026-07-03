import { Directionality } from '@angular/cdk/bidi';
import {
  computed,
  Directive,
  ElementRef,
  inject,
  input,
} from '@angular/core';
import {
  BrnProgress,
  BrnProgressIndicator,
  injectBrnProgress,
} from '@spartan-ng/brain/progress';

import { cn } from './cn';

const PROGRESS_BASE =
  'qalma-progress relative inline-flex w-full overflow-hidden';

const PROGRESS_INDICATOR_BASE =
  'qalma-progress-indicator h-full w-full flex-1 transition-all';

@Directive({
  selector: '[qalmaProgress]',
  hostDirectives: [
    {
      directive: BrnProgress,
      inputs: ['value', 'max', 'getValueLabel'],
    },
  ],
  host: {
    '[class]': 'computedClass()',
  },
})
export class QalmaProgress {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly initialClass =
    this.host.nativeElement.getAttribute('class') ?? '';

  protected readonly computedClass = computed(() =>
    cn(PROGRESS_BASE, this.initialClass),
  );
}

@Directive({
  selector: '[qalmaProgressIndicator]',
  hostDirectives: [BrnProgressIndicator],
  host: {
    '[class]': 'computedClass()',
    '[style.transform]': 'transform()',
  },
})
export class QalmaProgressIndicator {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly progress = injectBrnProgress();
  private readonly dir = inject(Directionality, { optional: true });
  private readonly initialClass =
    this.host.nativeElement.getAttribute('class') ?? '';

  readonly class = input<string>('');

  private readonly direction = computed(() => this.dir?.valueSignal() ?? 'ltr');
  private readonly progressValue = computed(() => {
    const value = this.progress.value();
    const max = this.progress.max();

    if (value === null || value === undefined) {
      return null;
    }

    return (value / max) * 100;
  });

  protected readonly computedClass = computed(() =>
    cn(
      PROGRESS_INDICATOR_BASE,
      this.progressValue() === null && 'animate-indeterminate',
      this.initialClass,
      this.class(),
    ),
  );

  protected readonly transform = computed(() => {
    const progress = this.progressValue();

    if (progress === null) {
      return undefined;
    }

    const translate = 100 - progress;

    return this.direction() === 'rtl'
      ? `translateX(${translate}%)`
      : `translateX(-${translate}%)`;
  });
}

export const QalmaProgressImports = [
  QalmaProgress,
  QalmaProgressIndicator,
] as const;
