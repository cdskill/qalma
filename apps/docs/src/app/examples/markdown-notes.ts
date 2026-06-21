import {
  ChangeDetectionStrategy,
  Component,
  computed,
} from '@angular/core';
import {
  BlockquotePlugin,
  CodeBlockPlugin,
  HardBreakPlugin,
  HeadingsPlugin,
  HistoryPlugin,
  HorizontalRulePlugin,
  InlineCodePlugin,
  LinkPlugin,
  ListsPlugin,
  PasteRulesPlugin,
  PlaceholderPlugin,
  QalmaContent,
  QalmaEditor,
  TaskListPlugin,
  TextFormattingKit,
  TrailingParagraphPlugin,
  createQalmaEditor,
} from '@qalma/editor';

const SEED = `<h2>Release notes</h2>
<p>Type <strong>Markdown</strong> and it becomes rich text as you go.</p>
<ul><li>Headings with <code>#</code></li><li>Lists with <code>-</code></li></ul>
<blockquote><p>Quotes with <code>&gt;</code> — try it below.</p></blockquote>`;

/**
 * Example: a Markdown-first notes editor. Plugins ship Markdown input rules by
 * default, so typing `# `, `- `, `> ` or **bold** transforms live — and the
 * vendored serializer round-trips the document straight back to Markdown,
 * shown in the live pane beneath the editor.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-markdown-notes',
  imports: [QalmaContent, QalmaEditor],
  template: `
    @let exportedMarkdown = markdown();

    <div
      class="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm"
    >
      <div
        class="flex items-center gap-2 border-b border-border px-4 py-2.5 text-sm"
      >
        <span class="font-medium">Notes</span>
        <span class="ml-auto text-xs text-muted-foreground">
          Type <span class="font-mono text-foreground">#</span>
          <span class="font-mono text-foreground">-</span>
          <span class="font-mono text-foreground">&gt;</span> to format
        </span>
      </div>

      <qalma-editor [editor]="editor">
        <qalma-content
          class="block max-h-72 overflow-y-auto px-4 py-3 [&_.ProseMirror]:min-h-40 [&_.ProseMirror]:break-words [&_.ProseMirror]:outline-none"
        />
      </qalma-editor>

      <div class="border-t border-border">
        <div
          class="flex items-center gap-2 px-4 pt-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground"
        >
          Live Markdown
        </div>
        <pre
          class="m-0 max-h-44 overflow-auto px-4 py-2.5 font-mono text-xs leading-relaxed text-muted-foreground"
        ><code>{{ exportedMarkdown }}</code></pre>
      </div>
    </div>
  `,
})
export class MarkdownNotes {
  protected readonly editor = createQalmaEditor({
    content: SEED,
    plugins: [
      HeadingsPlugin,
      ListsPlugin,
      TaskListPlugin,
      BlockquotePlugin,
      CodeBlockPlugin,
      HorizontalRulePlugin,
      ...TextFormattingKit,
      InlineCodePlugin,
      LinkPlugin,
      HardBreakPlugin,
      PasteRulesPlugin,
      PlaceholderPlugin.configure({ placeholder: 'Start typing Markdown…' }),
      HistoryPlugin,
      TrailingParagraphPlugin,
    ],
  });

  // Reads `html()` so it recomputes on every edit, then serializes to Markdown.
  protected readonly markdown = computed(() => {
    this.editor.html();

    return this.editor.getMarkdown();
  });
}
