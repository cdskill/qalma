import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  HistoryPlugin,
  QalmaContent,
  QalmaEditor,
  QalmaToolbar,
  TextFormattingKit,
  createQalmaEditor,
} from '@qalma/editor';
import { QalmaToolbarButton, provideQalmaToolbarIcons } from '@qalma/kit';

@Component({
  selector: 'app-kit-toolbar-button-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QalmaEditor, QalmaContent, QalmaToolbar, QalmaToolbarButton],
  providers: [provideQalmaToolbarIcons()],
  template: `
    <qalma-editor [editor]="editor">
      <div class="overflow-hidden rounded-lg border border-border bg-card">
        <qalma-toolbar
          class="flex flex-wrap items-center gap-0.5 border-b border-border bg-secondary/40 px-1.5 py-1.5"
        >
          <qalma-toolbar-button
            command="toggleBold"
            icon="lucideBold"
            label="Bold"
          />
          <qalma-toolbar-button
            command="toggleItalic"
            icon="lucideItalic"
            label="Italic"
          />
          <qalma-toolbar-button
            command="toggleUnderline"
            icon="lucideUnderline"
            label="Underline"
          />
          <qalma-toolbar-button
            command="undo"
            icon="lucideUndo2"
            label="Undo"
          />
        </qalma-toolbar>
        <qalma-content
          class="block min-h-28 px-4 py-3 text-sm leading-6 [&_.ProseMirror]:outline-none"
        />
      </div>
    </qalma-editor>
  `,
})
export class KitToolbarButtonDemo {
  protected readonly editor = createQalmaEditor({
    content:
      '<p><strong>Toolbar buttons</strong> execute editor commands and reflect active state.</p>',
    plugins: [...TextFormattingKit, HistoryPlugin],
  });
}
