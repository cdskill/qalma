import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { NgIcon } from '@ng-icons/core';
import { QalmaCommand } from '@qalma/editor';

/**
 * Default styling for a toolbar command button. Icon-only, square, and driven
 * entirely by the host's shadcn-style design tokens (`text-muted-foreground`,
 * `bg-secondary`, `bg-accent-subtle`…) so it themes with the surrounding app.
 * The `qalma-command-active` class is toggled by the `QalmaCommand` directive
 * when the underlying command is active.
 */
export const TOOLBAR_BUTTON_CLASS =
  'inline-flex h-[1.85rem] w-[1.85rem] cursor-pointer items-center justify-center rounded-[0.4rem] border border-transparent text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45 [&.qalma-command-active]:border-accent/40 [&.qalma-command-active]:bg-accent-subtle [&.qalma-command-active]:text-accent';

/**
 * Generic, declarative toolbar button for a single editor command.
 *
 * Renders a native `<button>` wired to the `QalmaCommand` directive (execute /
 * active / disabled / aria) with an `<ng-icon>`, so a whole toolbar becomes a
 * list of `<qalma-toolbar-button command icon label />` instead of the
 * six-line `<button qalmaCommand><ng-icon></button>` block repeated per
 * command. The host uses `display: contents` so the inner button participates
 * directly in the surrounding toolbar's flex layout.
 *
 * Icons resolve from the `NgIcon` provider scope of the surrounding component
 * (register them with `provideIcons({ … })` as usual).
 */
@Component({
  selector: 'qalma-toolbar-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, QalmaCommand],
  host: {
    class: 'contents',
  },
  template: `
    <button
      type="button"
      [qalmaCommand]="command()"
      [qalmaCommandValue]="value()"
      [class]="buttonClass"
      [title]="label()"
      [attr.aria-label]="label()"
    >
      <ng-icon [class]="iconClass()" [name]="icon()" aria-hidden="true" />
    </button>
  `,
})
export class QalmaToolbarButton {
  /** Command name to execute, e.g. `toggleBold`. */
  readonly command = input.required<string>();
  /** Optional command payload (forwarded to `qalmaCommandValue`). */
  readonly value = input<unknown>();
  /** Lucide (or any registered) icon name, e.g. `lucideBold`. */
  readonly icon = input.required<string>();
  /** Accessible name — used for both `title` and `aria-label`. */
  readonly label = input.required<string>();
  /** Optional icon-size class override (default: `text-[0.9rem]`). */
  readonly iconClass = input('text-[0.9rem]');

  protected readonly buttonClass = TOOLBAR_BUTTON_CLASS;
}
