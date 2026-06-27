import {
  ApplicationConfig,
  provideZonelessChangeDetection,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from '@angular/common/http';
import { provideClientHydration } from '@angular/platform-browser';
import { provideFileRouter, requestContextInterceptor } from '@analogjs/router';
import { provideContent, withMarkdownRenderer } from '@analogjs/content';
import { TitleStrategy, withPreloading } from '@angular/router';

import { SeoTitleStrategy } from './services/seo-title-strategy';
import { CriticalDocsPreloadingStrategy } from './services/critical-docs-preloading-strategy';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideFileRouter(withPreloading(CriticalDocsPreloadingStrategy)),
    { provide: TitleStrategy, useClass: SeoTitleStrategy },
    provideClientHydration(),
    provideContent(withMarkdownRenderer()),
    provideHttpClient(
      withFetch(),
      withInterceptors([requestContextInterceptor])
    ),
  ],
};
