import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { EMPTY, Observable, Subscription } from 'rxjs';

const CRITICAL_DOC_SLUGS = new Set([
  'introduction',
  'installation',
  'quick-start',
]);

type IdleWindow = Window & {
  requestIdleCallback?: (
    callback: IdleRequestCallback,
    options?: IdleRequestOptions,
  ) => number;
  cancelIdleCallback?: (handle: number) => void;
};

@Injectable({ providedIn: 'root' })
export class CriticalDocsPreloadingStrategy implements PreloadingStrategy {
  private readonly platformId = inject(PLATFORM_ID);

  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (
      !isPlatformBrowser(this.platformId) ||
      !route.path ||
      !CRITICAL_DOC_SLUGS.has(route.path)
    ) {
      return EMPTY;
    }

    return new Observable((subscriber) => {
      const browserWindow = window as IdleWindow;
      let loadSubscription: Subscription | undefined;
      let timeoutId: ReturnType<typeof globalThis.setTimeout> | undefined;
      let idleId: number | undefined;

      const start = () => {
        loadSubscription = load().subscribe(subscriber);
      };

      if (browserWindow.requestIdleCallback) {
        idleId = browserWindow.requestIdleCallback(start, { timeout: 2000 });
      } else {
        timeoutId = globalThis.setTimeout(start, 800);
      }

      return () => {
        loadSubscription?.unsubscribe();

        if (idleId !== undefined && browserWindow.cancelIdleCallback) {
          browserWindow.cancelIdleCallback(idleId);
        }

        if (timeoutId !== undefined) {
          globalThis.clearTimeout(timeoutId);
        }
      };
    });
  }
}
