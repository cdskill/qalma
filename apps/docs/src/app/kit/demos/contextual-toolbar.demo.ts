import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideLink } from '@ng-icons/lucide';
import {
  HistoryPlugin,
  InlineCodePlugin,
  LinkPlugin,
  MonospacePlugin,
  QalmaContent,
  QalmaEditor,
  SelectionPlugin,
  TextFormattingKit,
  createQalmaEditor,
} from '@qalma/editor';
import {
  QalmaContextualToolbar,
  QalmaSelectionToolbarDirective,
  QalmaToolbarButton,
  TOOLBAR_BUTTON_CLASS,
  provideQalmaToolbarIcons,
} from '@qalma/kit';

@Component({
  selector: 'app-kit-contextual-toolbar-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgIcon,
    QalmaEditor,
    QalmaContent,
    QalmaContextualToolbar,
    QalmaSelectionToolbarDirective,
    QalmaToolbarButton,
  ],
  // The toolbar is a slot: you provide the icons for the controls you drop in.
  providers: [provideQalmaToolbarIcons(), provideIcons({ lucideLink })],
  template: `
    <qalma-editor [editor]="editor">
      <div
        [qalmaSelectionToolbar]="editor"
        #selection="qalmaSelectionToolbar"
        class="rounded-lg border border-border bg-card p-4"
      >
        <qalma-content
          class="block min-h-40 text-sm leading-6 [&_.ProseMirror]:outline-none"
        />
      </div>

      <!--
        QalmaContextualToolbar only positions and dismisses. You compose the
        controls: command buttons via <qalma-toolbar-button>, plus your own
        buttons for app actions (here, opening a link editor).
      -->
      <qalma-contextual-toolbar
        [placement]="selection.placement()"
        (dismiss)="selection.hide()"
      >
        <qalma-toolbar-button command="toggleBold" icon="lucideBold" label="Bold" />
        <qalma-toolbar-button
          command="toggleItalic"
          icon="lucideItalic"
          label="Italic"
        />
        <qalma-toolbar-button
          command="toggleInlineCode"
          icon="lucideCode"
          label="Inline code"
        />
        <qalma-toolbar-button
          command="toggleMonospace"
          icon="lucideLetterText"
          label="Monospace"
        />
        <span
          class="mx-0.5 h-5 w-px shrink-0 self-center bg-border"
          aria-hidden="true"
        ></span>
        <button
          type="button"
          [class]="toolbarButtonClass"
          [class.qalma-command-active]="linkActive()"
          [attr.aria-pressed]="linkActive()"
          [disabled]="!canSetLink()"
          (click)="onRequestLink()"
          title="Link"
          aria-label="Link"
        >
          <ng-icon class="text-[0.9rem]" name="lucideLink" aria-hidden="true" />
        </button>
      </qalma-contextual-toolbar>
    </qalma-editor>
  `,
})
export class KitContextualToolbarDemo {
  protected readonly editor = createQalmaEditor({
    content:
      '<p>Select any part of this sentence to reveal the contextual formatting toolbar above it.</p>',
    plugins: [
      ...TextFormattingKit,
      InlineCodePlugin,
      MonospacePlugin,
      LinkPlugin,
      // The selection toolbar controller reads query('selection'); without
      // SelectionPlugin it never sees a selection and stays hidden.
      SelectionPlugin,
      HistoryPlugin,
    ],
  });

  // Shared toolbar-button styling for the custom (non-command) link control.
  protected readonly toolbarButtonClass = TOOLBAR_BUTTON_CLASS;

  protected readonly canSetLink = computed(() =>
    this.editor.canExecute('setLink', 'https://angular.dev'),
  );
  protected readonly linkActive = computed(() =>
    this.editor.isCommandActive('setLink'),
  );

  protected onRequestLink(): void {
    // The link button asks the app to open its own link editor. A real app
    // would show an input; the other formatting buttons run inline.
  }
}
