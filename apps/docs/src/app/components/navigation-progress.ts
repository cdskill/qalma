import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationSkipped,
  NavigationStart,
  Router,
} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { QalmaProgressImports } from '@qalma/kit';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-navigation-progress',
  imports: [...QalmaProgressImports],
  template: `
    @if (isNavigating()) {
      <div
        aria-hidden="true"
        class="pointer-events-none fixed inset-x-0 top-0 z-[70] h-1 overflow-hidden"
      >
        <div
          qalmaProgress
          class="h-full rounded-none bg-accent-subtle"
          style="display: flex"
        >
          <div
            qalmaProgressIndicator
            class="origin-left rounded-r-full bg-accent shadow-[0_0_18px_color-mix(in_srgb,var(--accent)_60%,transparent)]"
          ></div>
        </div>
      </div>
    }
  `,
  styles: `
    @media (prefers-reduced-motion: reduce) {
      [qalmaProgressIndicator] {
        animation: none;
        transform: none !important;
      }
    }
  `,
})
export class NavigationProgress {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isNavigating = signal(false);

  constructor() {
    this.router.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          this.isNavigating.set(true);
          return;
        }

        if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError ||
          event instanceof NavigationSkipped
        ) {
          this.isNavigating.set(false);
        }
      });
  }
}
