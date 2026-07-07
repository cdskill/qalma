import { ChangeDetectionStrategy, Component } from '@angular/core';
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
} from '@qalma/kit';

@Component({
  selector: 'app-kit-contextual-toolbar-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    QalmaEditor,
    QalmaContent,
    QalmaContextualToolbar,
    QalmaSelectionToolbarDirective,
  ],
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

      <qalma-contextual-toolbar
        [editor]="editor"
        [placement]="selection.placement()"
        (requestLink)="onRequestLink()"
        (dismiss)="selection.hide()"
      />
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

  protected onRequestLink(): void {
    // The toolbar's link button asks the app to open its own link editor.
    // A real app would show an input; the other formatting buttons run inline.
  }
}
