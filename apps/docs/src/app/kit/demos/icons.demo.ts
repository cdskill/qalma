import { ChangeDetectionStrategy, Component } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  HistoryPlugin,
  QalmaContent,
  QalmaEditor,
  QalmaToolbar,
  TextFormattingKit,
  createQalmaEditor,
} from '@qalma/editor';
import { QalmaToolbarButton, provideQalmaToolbarIcons } from '@qalma/kit';

// Any SVG string registers as a named icon; reuse that name in `icon="…"`.
const sparkle =
  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.9 4.7L18.5 9l-4.6 2 L12 15l-1.9-4L5.5 9l4.6-1.3z"/></svg>';

@Component({
  selector: 'app-kit-icons-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QalmaEditor, QalmaContent, QalmaToolbar, QalmaToolbarButton],
  providers: [
    // Kit defaults first, then override `lucideBold` and register a custom
    // name — later registrations win, so no fork of the toolbar is needed.
    provideQalmaToolbarIcons(),
    provideIcons({ lucideBold: sparkle, appSparkle: sparkle }),
  ],
  template: `
    <qalma-editor [editor]="editor">
      <div class="overflow-hidden rounded-lg border border-border bg-card">
        <qalma-toolbar
          class="flex flex-wrap items-center gap-0.5 border-b border-border bg-secondary/40 px-1.5 py-1.5"
        >
          <!-- Same command + name, but "lucideBold" now renders the sparkle. -->
          <qalma-toolbar-button
            command="toggleBold"
            icon="lucideBold"
            label="Bold (custom icon)"
          />
          <qalma-toolbar-button
            command="toggleItalic"
            icon="lucideItalic"
            label="Italic (kit default)"
          />
          <!-- A custom-named icon works exactly the same way. -->
          <qalma-toolbar-button
            command="toggleUnderline"
            icon="appSparkle"
            label="Underline (custom name)"
          />
        </qalma-toolbar>
        <qalma-content
          class="block min-h-24 px-4 py-3 text-sm leading-6 [&_.ProseMirror]:outline-none"
        />
      </div>
    </qalma-editor>
  `,
})
export class KitIconsDemo {
  protected readonly editor = createQalmaEditor({
    content:
      '<p>The <strong>bold</strong> button uses a custom icon; italic keeps the kit default.</p>',
    plugins: [...TextFormattingKit, HistoryPlugin],
  });
}
