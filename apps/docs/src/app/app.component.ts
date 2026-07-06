import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  PLATFORM_ID,
  inject,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterOutlet } from '@angular/router';

import { PosthogService } from './services/posthog.service';
import { environment } from '../environments/environment';
import { NavigationProgress } from './components/navigation-progress';

@Component({
  selector: 'app-root',
  imports: [NavigationProgress, RouterOutlet],
  template: `
    <app-navigation-progress />
    <router-outlet />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  private readonly posthogService = inject(PosthogService);
  private readonly platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    // Analytics is browser-only; ngOnInit also runs during SSG prerender,
    // where `window` is undefined.
    if (!isPlatformBrowser(this.platformId) || !environment.posthogKey) {
      return;
    }

    // Never track local development: analytics from localhost pollutes prod data.
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1' || host === '[::1]') {
      return;
    }

    // Defer analytics out of the critical path: PostHog pulls several modules
    // (recorder, surveys, …) that compete with hydration. Wait until the
    // browser is idle so they never delay first paint or interactivity.
    const start = () =>
      this.posthogService.init(environment.posthogKey, {
        api_host: environment.posthogHost,
        defaults: '2026-01-30',
        capture_exceptions: true,
        persistence: 'memory', // cookieless: no consent banner needed (RGPD)
        // Trim the payload to what a docs site actually needs: session replay
        // and surveys add ~75 KiB of mostly-unused JS with short third-party
        // cache TTLs, for no analytics value here.
        disable_session_recording: true,
        disable_surveys: true,
      });

    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(start, { timeout: 3000 });
    } else {
      setTimeout(start, 1500);
    }
  }
}
