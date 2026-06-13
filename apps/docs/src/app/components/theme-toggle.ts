import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  signal,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideMoon, lucideSun } from '@ng-icons/lucide';

import { HlmButton } from '../ui/button';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-theme-toggle',
  imports: [NgIcon, HlmButton],
  providers: [provideIcons({ lucideMoon, lucideSun })],
  template: `
    <button
      appBtn
      variant="ghost"
      size="icon"
      type="button"
      (click)="toggle()"
      [attr.aria-label]="isDark() ? 'Switch to light theme' : 'Switch to dark theme'"
      title="Toggle theme"
    >
      @if (isDark()) {
        <ng-icon name="lucideSun" aria-hidden="true" />
      } @else {
        <ng-icon name="lucideMoon" aria-hidden="true" />
      }
    </button>
  `,
})
export class ThemeToggle {
  protected readonly isDark = signal(false);

  constructor() {
    afterNextRender(() => {
      this.isDark.set(document.documentElement.classList.contains('dark'));
    });
  }

  protected toggle(): void {
    const root = document.documentElement;
    const next = !root.classList.contains('dark');

    root.classList.toggle('dark', next);

    try {
      localStorage.setItem('qalma-theme', next ? 'dark' : 'light');
    } catch {
      // Ignore storage failures (private mode, disabled cookies, etc.).
    }

    this.isDark.set(next);
  }
}
