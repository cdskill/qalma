import {
  Directive,
  ElementRef,
  computed,
  inject,
  input,
} from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from './cn';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_ng-icon]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        secondary:
          'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        outline:
          'border border-border bg-card text-foreground hover:bg-secondary hover:text-secondary-foreground',
        ghost:
          'text-foreground hover:bg-secondary hover:text-secondary-foreground',
        accent: 'bg-accent text-accent-foreground hover:bg-accent/90',
        link: 'text-accent underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-11 rounded-md px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export type ButtonVariant = NonNullable<
  VariantProps<typeof buttonVariants>['variant']
>;
export type ButtonSize = NonNullable<
  VariantProps<typeof buttonVariants>['size']
>;

/**
 * Headless-styled button directive so it composes onto native `<button>` and
 * `<a>` elements while reading from the host's Tailwind design tokens.
 */
@Directive({
  selector: 'button[qalmaBtn], a[qalmaBtn]',
  host: {
    '[class]': 'computedClass()',
  },
})
export class QalmaButton {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly initialClass =
    this.host.nativeElement.getAttribute('class') ?? '';

  readonly variant = input<ButtonVariant>('default');
  readonly size = input<ButtonSize>('default');

  protected readonly computedClass = computed(() =>
    cn(
      buttonVariants({ variant: this.variant(), size: this.size() }),
      this.initialClass,
    ),
  );
}
