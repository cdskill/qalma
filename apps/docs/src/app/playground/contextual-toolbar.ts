import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import {
  QalmaCommand,
  QalmaEditorController,
  QalmaToolbar,
} from '@qalma/editor';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBold,
  lucideCode,
  lucideItalic,
  lucideLetterText,
  lucideLink,
} from '@ng-icons/lucide';

import { QalmaButton } from '@qalma/kit';

export interface PlaygroundContextualToolbarPlacement {
  transform: string;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, QalmaButton, QalmaCommand, QalmaToolbar],
  providers: [
    provideIcons({
      lucideBold,
      lucideCode,
      lucideItalic,
      lucideLetterText,
      lucideLink,
    }),
  ],
  selector: 'app-playground-contextual-toolbar',
  template: `
    @if (placement(); as placement) {
      <qalma-toolbar
        label="Selection formatting"
        class="fixed left-0 top-0 z-30 flex items-center gap-0.5 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg will-change-transform"
        [style.transform]="placement.transform"
        (mousedown)="preserveSelection($event)"
        (keydown.escape)="dismissFromKeyboard($event)"
      >
        <button
          qalmaBtn
          variant="ghost"
          size="icon"
          type="button"
          class="!h-[1.85rem] !w-[1.85rem] cursor-pointer rounded-[0.4rem] disabled:cursor-not-allowed [&.qalma-command-active]:bg-accent-subtle [&.qalma-command-active]:text-accent"
          qalmaCommand="toggleBold"
          title="Bold"
          aria-label="Bold"
        >
          <ng-icon
            class="text-[0.9rem]"
            name="lucideBold"
            aria-hidden="true"
          />
        </button>
        <button
          qalmaBtn
          variant="ghost"
          size="icon"
          type="button"
          class="!h-[1.85rem] !w-[1.85rem] cursor-pointer rounded-[0.4rem] disabled:cursor-not-allowed [&.qalma-command-active]:bg-accent-subtle [&.qalma-command-active]:text-accent"
          qalmaCommand="toggleItalic"
          title="Italic"
          aria-label="Italic"
        >
          <ng-icon
            class="text-[0.9rem]"
            name="lucideItalic"
            aria-hidden="true"
          />
        </button>
        <button
          qalmaBtn
          variant="ghost"
          size="icon"
          type="button"
          class="!h-[1.85rem] !w-[1.85rem] cursor-pointer rounded-[0.4rem] disabled:cursor-not-allowed [&.qalma-command-active]:bg-accent-subtle [&.qalma-command-active]:text-accent"
          qalmaCommand="toggleInlineCode"
          title="Inline code"
          aria-label="Inline code"
        >
          <ng-icon
            class="text-[0.9rem]"
            name="lucideCode"
            aria-hidden="true"
          />
        </button>
        <button
          qalmaBtn
          variant="ghost"
          size="icon"
          type="button"
          class="!h-[1.85rem] !w-[1.85rem] cursor-pointer rounded-[0.4rem] disabled:cursor-not-allowed [&.qalma-command-active]:bg-accent-subtle [&.qalma-command-active]:text-accent"
          qalmaCommand="toggleMonospace"
          title="Monospace"
          aria-label="Monospace"
        >
          <ng-icon
            class="text-[0.9rem]"
            name="lucideLetterText"
            aria-hidden="true"
          />
        </button>
        <span class="mx-0.5 h-5 w-px bg-border" aria-hidden="true"></span>
        <button
          qalmaBtn
          variant="ghost"
          size="icon"
          type="button"
          class="!h-[1.85rem] !w-[1.85rem] cursor-pointer rounded-[0.4rem] disabled:cursor-not-allowed [&.qalma-command-active]:bg-accent-subtle [&.qalma-command-active]:text-accent"
          [class.qalma-command-active]="linkActive()"
          [attr.aria-pressed]="linkActive()"
          [disabled]="!canSetLink()"
          (mousedown)="preserveSelection($event)"
          (click)="requestLink.emit($event)"
          title="Link"
          aria-label="Link"
        >
          <ng-icon
            class="text-[0.9rem]"
            name="lucideLink"
            aria-hidden="true"
          />
        </button>
      </qalma-toolbar>
    }
  `,
})
export class PlaygroundContextualToolbar {
  readonly editor = input.required<QalmaEditorController>();
  readonly placement = input<PlaygroundContextualToolbarPlacement | null>(
    null,
  );
  readonly requestLink = output<MouseEvent>();
  readonly dismiss = output<void>();

  protected readonly canSetLink = computed(() =>
    this.editor().canExecute('setLink', 'https://angular.dev'),
  );
  protected readonly linkActive = computed(() =>
    this.editor().isCommandActive('setLink'),
  );

  protected preserveSelection(event: MouseEvent): void {
    event.preventDefault();
  }

  protected dismissFromKeyboard(event: Event): void {
    event.preventDefault();
    this.dismiss.emit();
  }
}
