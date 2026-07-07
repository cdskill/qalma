import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

import { DocsCopyButton } from './docs-copy-button';
import { PosthogService } from '../services/posthog.service';

export interface InstallCommand {
  readonly id: string;
  readonly command: string;
}

const DEFAULT_INSTALL_COMMANDS: readonly InstallCommand[] = [
  { id: 'pnpm', command: 'pnpm add @qalma/editor' },
  { id: 'npm', command: 'npm install @qalma/editor' },
  { id: 'yarn', command: 'yarn add @qalma/editor' },
  { id: 'bun', command: 'bun add @qalma/editor' },
];

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
  imports: [DocsCopyButton],
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
          @for (pm of packages(); track pm.id; let i = $index) {
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

        <app-docs-copy-button
          [text]="command()"
          buttonClass="docs-pm-copy"
          (copied)="trackCopied()"
        />
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

  readonly packages = input<readonly InstallCommand[]>(
    DEFAULT_INSTALL_COMMANDS,
  );
  readonly installTarget = input('editor');
  protected readonly active = signal(0);
  protected readonly activePackage = computed(
    () => this.packages()[this.active()] ?? this.packages()[0],
  );
  protected readonly command = computed(
    () => this.activePackage()?.command ?? '',
  );

  protected trackCopied(): void {
    const pm = this.activePackage();
    if (!pm) {
      return;
    }
    this.posthogService.posthog.capture('install_command_copied', {
      command: pm.command,
      package_manager: pm.id,
      target: this.installTarget(),
    });
  }
}
