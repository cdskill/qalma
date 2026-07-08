import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { QalmaToolbar } from '@qalma/editor';

import { QalmaContextualToolbarPlacement } from '@qalma/kit/headless';

/**
 * Floating, selection-anchored toolbar container. It owns the hard parts — the
 * fixed-position `transform` from a {@link QalmaContextualToolbarPlacement}
 * (see `QalmaSelectionToolbarDirective`), preserving the editor selection on
 * pointer-down, and Escape-to-dismiss — and projects whatever controls you put
 * inside it. Nothing about the button set is baked in: compose
 * `<qalma-toolbar-button>` for commands and your own buttons for app actions
 * (opening a link editor, a color picker, an AI action…).
 *
 * The container's `mousedown` handler preserves the selection for every
 * projected control via event bubbling, so inner buttons don't each need to.
 *
 * ```html
 * <qalma-contextual-toolbar
 *   [placement]="selection.placement()"
 *   (dismiss)="selection.hide()"
 * >
 *   <qalma-toolbar-button command="toggleBold" icon="lucideBold" label="Bold" />
 *   <qalma-toolbar-button command="toggleItalic" icon="lucideItalic" label="Italic" />
 *   <button type="button" [class]="TOOLBAR_BUTTON_CLASS" (click)="openLinkEditor()">…</button>
 * </qalma-contextual-toolbar>
 * ```
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QalmaToolbar],
  selector: 'qalma-contextual-toolbar',
  template: `
    @if (placement(); as placement) {
      <qalma-toolbar
        [label]="label()"
        class="fixed left-0 top-0 z-30 flex items-center gap-0.5 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg will-change-transform"
        [style.transform]="placement.transform"
        (mousedown)="preserveSelection($event)"
        (keydown.escape)="dismissFromKeyboard($event)"
      >
        <ng-content />
      </qalma-toolbar>
    }
  `,
})
export class QalmaContextualToolbar {
  readonly placement = input<QalmaContextualToolbarPlacement | null>(null);
  /** Accessible name for the toolbar region. */
  readonly label = input('Selection formatting');
  readonly dismiss = output<void>();

  protected preserveSelection(event: MouseEvent): void {
    event.preventDefault();
  }

  protected dismissFromKeyboard(event: Event): void {
    event.preventDefault();
    this.dismiss.emit();
  }
}
