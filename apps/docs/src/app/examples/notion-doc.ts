import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import {
  BlockquotePlugin,
  CodeBlockPlugin,
  DragHandlePlugin,
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
  SelectionPlugin,
  SlashCommandPlugin,
  TaskListPlugin,
  TextFormattingKit,
  TrailingParagraphPlugin,
  createQalmaEditor,
} from '@qalma/editor';
import { TablePlugin } from '@qalma/editor/table';
import { QalmaDragHandle, QalmaDragHandleDirective } from '@qalma/kit';

import {
  PLAYGROUND_CODE_BLOCK_LANGUAGE_VALUES,
  PLAYGROUND_DEFAULT_CODE_BLOCK_LANGUAGE,
} from '../playground/code-block';
import { PlaygroundCodeHighlightPlugin } from '../playground/code-highlight-plugin';
import {
  PlaygroundSlashCommandController,
  PlaygroundSlashCommandOption,
} from '../playground/slash-command';
import { PlaygroundSlashCommandMenu } from '../playground/slash-command-menu';
import { PosthogService } from '../services/posthog.service';

const SEED = `<h2>Product brief</h2>
<p>A block-based document. Type <strong>/</strong> for blocks, or grab the handle on the left to drag a block around.</p>
<ul><li><p>Hover a block to reveal its drag handle</p></li><li><p>Press <code>/</code> to insert a heading, list, quote or table</p></li></ul>
<blockquote><p>Ship something small, then iterate.</p></blockquote>`;

/**
 * Example: a Notion-style block editor. No top toolbar — composition happens
 * through a slash menu and a drag handle, the two block-editing primitives that
 * make Qalma feel like a document tool. Reuses the playground's slash + drag
 * controllers so there is a single source of truth.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-notion-doc',
  imports: [
    QalmaContent,
    QalmaEditor,
    QalmaDragHandle,
    QalmaDragHandleDirective,
    PlaygroundSlashCommandMenu,
  ],
  template: `
    @let slashMenuOpen = slashCommandController.open();

    <div
      class="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm"
    >
      <div
        class="flex items-center gap-2 border-b border-border px-4 py-2.5 text-sm"
      >
        <span class="font-medium">Untitled doc</span>
        <span class="ml-auto text-xs text-muted-foreground">
          Type <span class="font-mono text-foreground">/</span> for blocks
        </span>
      </div>

      <qalma-editor [editor]="editor">
        <qalma-content
          #surface
          #dragHandle="qalmaDragHandle"
          class="block max-h-[26rem] overflow-y-auto px-6 py-4 [&_.ProseMirror]:min-h-64 [&_.ProseMirror]:break-words [&_.ProseMirror]:outline-none"
          [qalmaDragHandle]="editor"
          (focus)="slashCommandController.refresh()"
          (click)="slashCommandController.refresh()"
        />

        <qalma-drag-handle
          [editor]="editor"
          [handle]="dragHandle.handle()"
          [dropIndicator]="dragHandle.dropIndicator()"
          [draggedBlockHighlight]="dragHandle.draggedBlockHighlight()"
          (dragStart)="dragHandle.startDrag($event.event, $event.handle)"
          (dismiss)="dragHandle.hide()"
        />
      </qalma-editor>
    </div>

    @if (slashMenuOpen) {
      <app-playground-slash-command-menu
        [placement]="slashCommandController.placement()"
        [options]="slashCommandController.options()"
        [activeIndex]="slashCommandController.activeIndex()"
        (activate)="slashCommandController.setActiveIndex($event)"
        (pick)="onSlashCommandPick($event)"
        (dismiss)="slashCommandController.dismiss()"
      />
    }
  `,
})
export class NotionDoc {
  private readonly destroyRef = inject(DestroyRef);
  private readonly posthogService = inject(PosthogService);

  private readonly surface = viewChild.required<
    HTMLElement,
    ElementRef<HTMLElement>
  >('surface', { read: ElementRef });

  protected readonly editor = createQalmaEditor({
    content: SEED,
    plugins: [
      HeadingsPlugin,
      ...TextFormattingKit,
      InlineCodePlugin,
      LinkPlugin,
      ListsPlugin,
      TaskListPlugin,
      BlockquotePlugin,
      HorizontalRulePlugin,
      TablePlugin,
      CodeBlockPlugin.configure({
        languages: PLAYGROUND_CODE_BLOCK_LANGUAGE_VALUES,
        defaultLanguage: PLAYGROUND_DEFAULT_CODE_BLOCK_LANGUAGE,
      }),
      PlaygroundCodeHighlightPlugin,
      SlashCommandPlugin,
      DragHandlePlugin,
      SelectionPlugin,
      HardBreakPlugin,
      PasteRulesPlugin,
      PlaceholderPlugin.configure({ placeholder: "Type '/' for blocks…" }),
      HistoryPlugin,
      TrailingParagraphPlugin,
    ],
  });

  protected readonly slashCommandController =
    new PlaygroundSlashCommandController(this.editor);

  constructor() {
    // Keep the slash menu in sync with the document, mirroring the playground.
    effect(() => {
      this.editor.query('slashCommand');
      queueMicrotask(() => this.slashCommandController.refresh());
    });

    afterNextRender(() => {
      const surface = this.surface().nativeElement;
      const refresh = () => this.slashCommandController.refresh();
      const handleKeydown = (event: Event) =>
        this.slashCommandController.handleSlashCommandKeydown(event);

      surface.addEventListener('qalma-slash-command-update', refresh);
      surface.addEventListener('qalma-slash-command-keydown', handleKeydown);

      this.destroyRef.onDestroy(() => {
        surface.removeEventListener('qalma-slash-command-update', refresh);
        surface.removeEventListener('qalma-slash-command-keydown', handleKeydown);
      });
    });
  }

  protected onSlashCommandPick(option: PlaygroundSlashCommandOption): void {
    this.slashCommandController.insert(option);
    this.posthogService.posthog.capture('example_slash_command_inserted', {
      command: option.command,
    });
  }
}
