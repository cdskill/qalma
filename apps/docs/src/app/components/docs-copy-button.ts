import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';

/**
 * Shared copy affordance for docs code surfaces. Markdown-enhanced code blocks
 * create the same `.docs-copy` DOM shape in `DocsContent`; Angular-rendered
 * snippets use this component so the visual state and behavior stay aligned.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-docs-copy-button',
  template: `
    <button
      type="button"
      class="docs-copy {{ buttonClass() }}"
      [class.is-copied]="isCopied()"
      [attr.aria-label]="isCopied() ? copiedLabel() : label()"
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
  `,
})
export class DocsCopyButton {
  private readonly destroyRef = inject(DestroyRef);

  readonly text = input.required<string>();
  readonly label = input('Copy to clipboard');
  readonly copiedLabel = input('Copied');
  readonly buttonClass = input('');

  readonly copied = output<void>();

  protected readonly isCopied = signal(false);

  private resetTimer?: ReturnType<typeof setTimeout>;

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.resetTimer));
  }

  protected async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.text().replace(/\n$/, ''));
    } catch {
      return;
    }

    this.isCopied.set(true);
    this.copied.emit();
    clearTimeout(this.resetTimer);
    this.resetTimer = setTimeout(() => this.isCopied.set(false), 1600);
  }
}
