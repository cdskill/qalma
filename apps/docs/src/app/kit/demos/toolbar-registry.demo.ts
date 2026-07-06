import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  HeadingsPlugin,
  HistoryPlugin,
  InlineCodePlugin,
  MonospacePlugin,
  QalmaContent,
  QalmaEditor,
  QalmaToolbar,
  TextFormattingKit,
  createQalmaEditor,
} from '@qalma/editor';
import {
  QALMA_TOOLBAR_HEADINGS,
  QALMA_TOOLBAR_HISTORY,
  QALMA_TOOLBAR_INLINE_MARKS,
  QalmaToolbarRegistry,
  ToolbarGroup,
  provideQalmaToolbarIcons,
} from '@qalma/kit';

@Component({
  selector: 'app-kit-toolbar-registry-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QalmaEditor, QalmaContent, QalmaToolbar, QalmaToolbarRegistry],
  providers: [provideQalmaToolbarIcons()],
  template: `
    <qalma-editor [editor]="editor">
      <div class="overflow-hidden rounded-lg border border-border bg-card">
        <qalma-toolbar
          class="flex flex-wrap items-center gap-0.5 border-b border-border bg-secondary/40 px-1.5 py-1.5"
        >
          <qalma-toolbar-registry [groups]="toolbarGroups" />
        </qalma-toolbar>
        <qalma-content
          class="block min-h-32 px-4 py-3 text-sm leading-6 [&_.ProseMirror]:outline-none"
        />
      </div>
    </qalma-editor>
  `,
})
export class KitToolbarRegistryDemo {
  protected readonly editor = createQalmaEditor({
    content:
      '<p><strong>Reusable toolbar.</strong> Compose commands from data.</p>',
    plugins: [
      HeadingsPlugin,
      ...TextFormattingKit,
      InlineCodePlugin,
      MonospacePlugin,
      HistoryPlugin,
    ],
  });

  protected readonly toolbarGroups: readonly ToolbarGroup[] = [
    QALMA_TOOLBAR_HEADINGS,
    QALMA_TOOLBAR_INLINE_MARKS,
    QALMA_TOOLBAR_HISTORY,
  ];
}
