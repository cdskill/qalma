import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';

import { PosthogService } from '../services/posthog.service';

interface PackageManager {
  readonly id: string;
  readonly command: string;
}

/**
 * The same package-manager picker the docs render (see DocsContent's `.docs-pm`
 * card), but as a first-class component for use outside the markdown pipeline —
 * e.g. the home hero. Reuses the global `.docs-pm` / `.docs-copy` styles so it
 * stays visually identical; the `<pre>` panel gets local styling because the
 * shared rule keys off a `.qalma-prose` ancestor that doesn't exist here.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-install-tabs',
  template: `
    <div class="docs-pm">
      <div class="docs-pm-head">
        <span class="docs-pm-glyph" aria-hidden="true">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m4 17 6-6-6-6" />
            <path d="M12 19h8" />
          </svg>
        </span>

        <div class="docs-pm-tabs" role="tablist" aria-label="Package manager">
          @for (pm of packages; track pm.id; let i = $index) {
            <button
              type="button"
              class="docs-pm-tab"
              role="tab"
              [class.is-active]="active() === i"
              [attr.aria-selected]="active() === i"
              (click)="active.set(i)"
            >
              {{ pm.id }}
            </button>
          }
        </div>

        <button
          type="button"
          class="docs-copy docs-pm-copy"
          [class.is-copied]="copied()"
          [attr.aria-label]="copied() ? 'Copied' : 'Copy to clipboard'"
          (click)="copy()"
        >
          <span class="docs-copy-idle" aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
              <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
            </svg>
          </span>
          <span class="docs-copy-done" aria-hidden="true">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path d="M20 6 9 17l-5-5" />
            </svg>
          </span>
        </button>
      </div>

      <div class="docs-pm-body">
        <pre class="docs-pm-panel"><code>{{ command() }}</code></pre>
      </div>
    </div>
  `,
  styles: `
    :host {
      display: block;
    }

    /* The shared pre styling lives under a .qalma-prose ancestor; replicate the
       parts the card doesn't already provide (border/background come from the
       global .docs-pm rules). */
    .docs-pm-panel {
      margin: 0;
      overflow-x: auto;
      padding: 0.85rem 1rem;
      font-family: var(--font-mono);
      font-size: 0.8125rem;
      line-height: 1.55;
      color: var(--color-foreground);
    }

    .docs-pm-panel code {
      background: transparent;
      padding: 0;
    }
  `,
})
export class InstallTabs {
  private readonly posthogService = inject(PosthogService);

  protected readonly packages: readonly PackageManager[] = [
    { id: 'pnpm', command: 'pnpm add @qalma/editor' },
    { id: 'npm', command: 'npm install @qalma/editor' },
    { id: 'yarn', command: 'yarn add @qalma/editor' },
    { id: 'bun', command: 'bun add @qalma/editor' },
  ];

  protected readonly active = signal(0);
  protected readonly copied = signal(false);
  protected readonly command = computed(() => this.packages[this.active()].command);

  private resetTimer?: ReturnType<typeof setTimeout>;

  protected copy(): void {
    const pm = this.packages[this.active()];

    void navigator.clipboard?.writeText(pm.command).then(() => {
      this.copied.set(true);
      clearTimeout(this.resetTimer);
      this.resetTimer = setTimeout(() => this.copied.set(false), 1600);
    });

    this.posthogService.posthog.capture('install_command_copied', {
      command: pm.command,
      package_manager: pm.id,
    });
  }
}
