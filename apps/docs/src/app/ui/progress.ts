/* eslint-disable @angular-eslint/directive-selector */
import { Directionality } from '@angular/cdk/bidi';
import { Directive, ElementRef, computed, inject, input } from '@angular/core';
import {
  BrnProgress,
  BrnProgressIndicator,
  injectBrnProgress,
} from '@spartan-ng/brain/progress';
import { clsx } from 'clsx';

const PROGRESS_BASE =
  'spartan-progress relative inline-flex w-full overflow-hidden';

const PROGRESS_INDICATOR_BASE =
  'spartan-progress-indicator h-full w-full flex-1 transition-all';

@Directive({
  selector: '[hlmProgress]',
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
export class HlmProgress {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly initialClass =
    this.host.nativeElement.getAttribute('class') ?? '';

  protected readonly computedClass = computed(() =>
    clsx(PROGRESS_BASE, this.initialClass),
  );
}

@Directive({
  selector: '[hlmProgressIndicator]',
  hostDirectives: [BrnProgressIndicator],
  host: {
    '[class]': 'computedClass()',
    '[style.transform]': 'transform()',
  },
})
export class HlmProgressIndicator {
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
    clsx(
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

export const HlmProgressImports = [HlmProgress, HlmProgressIndicator] as const;
