import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  BlockquotePlugin,
  ClearFormattingPlugin,
  CodeBlockPlugin,
  ColorPlugin,
  DragHandlePlugin,
  HardBreakPlugin,
  HeadingsPlugin,
  HighlightPlugin,
  HistoryPlugin,
  HorizontalRulePlugin,
  ImageCommandValue,
  ImagePlugin,
  InlineCodePlugin,
  LinkPlugin,
  ListsPlugin,
  MentionPlugin,
  MonospacePlugin,
  PasteRulesPlugin,
  PlaceholderPlugin,
  QalmaContent,
  QalmaEditor,
  SelectionPlugin,
  SlashCommandPlugin,
  SubscriptSuperscriptPlugin,
  TaskListPlugin,
  TextAlignPlugin,
  TextFormattingKit,
  TrailingParagraphPlugin,
  createQalmaEditor,
} from '@qalma/editor';
import { TablePlugin } from '@qalma/editor/table';
import { BrnToggleGroupImports } from '@spartan-ng/brain/toggle-group';

import {
  PLAYGROUND_CODE_BLOCK_LANGUAGE_VALUES,
  PLAYGROUND_DEFAULT_CODE_BLOCK_LANGUAGE,
} from './code-block';
import { PlaygroundCodeHighlightPlugin } from './code-highlight-plugin';
import { PLAYGROUND_DEMO_CONTENT } from './demo-content';
import { PlaygroundContextualToolbar } from './contextual-toolbar';
import { PlaygroundDragHandle } from './drag-handle';
import { PlaygroundDragHandleDirective } from './drag-handle-directive';
import {
  PLAYGROUND_EXAMPLE_IMAGE_ALT,
  PLAYGROUND_EXAMPLE_IMAGE_SRC,
  PLAYGROUND_EXAMPLE_IMAGE_TITLE,
} from './image';
import { LinkPopoverController } from './link-popover-controller';
import { PlaygroundLinkPopover } from './link-popover';
import { LinkPopover } from './link-popover.model';
import {
  PlaygroundMentionController,
  PlaygroundMentionOption,
  createPlaygroundMentionSource,
} from './mention';
import { PlaygroundMentionMenu } from './mention-menu';
import {
  PlaygroundSlashCommandController,
  PlaygroundSlashCommandOption,
} from './slash-command';
import { PlaygroundSlashCommandMenu } from './slash-command-menu';
import { PlaygroundSelectionToolbarDirective } from './selection-toolbar-directive';
import { PlaygroundToolbar } from './toolbar';
import { PosthogService } from '../services/posthog.service';

type PlaygroundOutputFormat = 'html' | 'json' | 'markdown';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ...BrnToggleGroupImports,
    QalmaContent,
    QalmaEditor,
    PlaygroundLinkPopover,
    PlaygroundContextualToolbar,
    PlaygroundDragHandle,
    PlaygroundDragHandleDirective,
    PlaygroundMentionMenu,
    PlaygroundSelectionToolbarDirective,
    PlaygroundSlashCommandMenu,
    PlaygroundToolbar,
  ],
  selector: 'app-playground',
  template: `
    <qalma-editor
      class="block overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm"
      [editor]="editor"
    >
      <app-playground-toolbar
        [editor]="editor"
        (requestImageLink)="insertImageFromUrl()"
        (requestImageUpload)="chooseImageFile()"
        (requestLink)="linkPopover.showToolbarEditor($event)"
      />

      <input
        #imageUpload
        class="sr-only"
        type="file"
        accept="image/*"
        aria-label="Upload image file"
        (change)="insertUploadedImage($event)"
      />

      <qalma-content
        #mentionSurface
        #dragHandle="appPlaygroundDragHandle"
        #selectionToolbar="appPlaygroundSelectionToolbar"
        class="block max-h-[56vh] overflow-y-auto p-5 [&_.ProseMirror]:mx-auto [&_.ProseMirror]:min-h-72 [&_.ProseMirror]:max-w-[61.5rem] [&_.ProseMirror]:break-words [&_.ProseMirror]:whitespace-pre-wrap [&_.ProseMirror]:outline-none"
        [appPlaygroundDragHandle]="editor"
        [appPlaygroundSelectionToolbar]="editor"
        (mouseover)="linkPopover.showPreview($event)"
        (mouseout)="linkPopover.scheduleHideFromEvent($event)"
        (focus)="
          linkPopover.showPreview($event);
          selectionToolbar.refresh();
          mentionController.refresh();
          slashCommandController.refresh()
        "
        (blur)="linkPopover.scheduleHideFromEvent($event)"
        (focusin)="linkPopover.showPreview($event)"
        (focusout)="linkPopover.scheduleHideFromEvent($event)"
        (click)="mentionController.refresh()"
      />

      <app-playground-contextual-toolbar
        [editor]="editor"
        [placement]="selectionToolbar.placement()"
        (dismiss)="selectionToolbar.hide()"
        (requestLink)="showContextualLinkEditor($event, selectionToolbar)"
      />

      <app-playground-drag-handle
        [editor]="editor"
        [handle]="dragHandle.handle()"
        [dropIndicator]="dragHandle.dropIndicator()"
        [draggedBlockHighlight]="dragHandle.draggedBlockHighlight()"
        (dragStart)="dragHandle.startDrag($event.event, $event.handle)"
        (dismiss)="dragHandle.hide()"
      />
    </qalma-editor>

    @if (slashCommandController.open()) {
      <app-playground-slash-command-menu
        [placement]="slashCommandController.placement()"
        [options]="slashCommandController.options()"
        [activeIndex]="slashCommandController.activeIndex()"
        (activate)="slashCommandController.setActiveIndex($event)"
        (pick)="onSlashCommandPick($event)"
        (dismiss)="slashCommandController.dismiss()"
      />
    }

    @if (mentionController.open()) {
      <app-playground-mention-menu
        [placement]="mentionController.placement()"
        [suggestions]="mentionController.suggestions()"
        [loading]="mentionController.loading()"
        [activeIndex]="mentionController.activeIndex()"
        (activate)="mentionController.setActiveIndex($event)"
        (pick)="onMentionPick($event)"
        (dismiss)="mentionController.hide()"
      />
    }

    <app-playground-link-popover
      [popover]="linkPopover.popover()"
      [href]="linkPopover.href()"
      (hrefChange)="linkPopover.href.set($event)"
      (edit)="linkPopover.edit($event)"
      (save)="onLinkSave($event)"
      (remove)="linkPopover.remove($event)"
      (dismiss)="linkPopover.hide()"
      (keepOpen)="linkPopover.keepOpen()"
      (scheduleHide)="linkPopover.scheduleHide()"
    />

    <details class="group mt-3 rounded-xl border border-border bg-card">
      <summary
        class="flex cursor-pointer items-center justify-between px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
      >
        Serialized output
        <span class="font-mono text-xs">{{ serializedOutput().length }} chars</span>
      </summary>
      <div class="border-t border-border px-4 pt-3">
        <brn-toggle-group
          type="single"
          [nullable]="false"
          [value]="outputFormat()"
          (valueChange)="onOutputFormatChange($event)"
          aria-label="Serialization format"
          class="inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1"
        >
          @for (format of outputFormats; track format.value) {
            <button
              brnToggleGroupItem
              [value]="format.value"
              class="rounded-md px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground data-[state=on]:bg-background data-[state=on]:text-foreground data-[state=on]:shadow-sm"
            >
              {{ format.label }}
            </button>
          }
        </brn-toggle-group>
      </div>
      <pre
        class="m-0 max-h-72 overflow-y-auto whitespace-pre-wrap break-words px-4 py-3 font-mono text-xs leading-5 text-muted-foreground [overflow-wrap:anywhere]"
      ><code>{{ serializedOutput() }}</code></pre>
    </details>
  `,
})
export class Playground {
  private readonly destroyRef = inject(DestroyRef);
  private readonly posthogService = inject(PosthogService);
  // `#mentionSurface` sits on the <qalma-content> component, so without an
  // explicit `read` the query resolves to the component instance (whose
  // `.nativeElement` is undefined). Read the host ElementRef instead.
  private readonly mentionSurface = viewChild.required<
    HTMLElement,
    ElementRef<HTMLElement>
  >('mentionSurface', { read: ElementRef });
  private readonly imageUpload =
    viewChild.required<ElementRef<HTMLInputElement>>('imageUpload');

  protected readonly editor = createQalmaEditor({
    content: PLAYGROUND_DEMO_CONTENT,
    plugins: [
      HeadingsPlugin,
      PlaceholderPlugin.configure({
        placeholder: 'Start writing…',
      }),
      TextAlignPlugin,
      ...TextFormattingKit,
      InlineCodePlugin,
      MonospacePlugin,
      DragHandlePlugin,
      SelectionPlugin,
      SubscriptSuperscriptPlugin,
      HighlightPlugin,
      ColorPlugin,
      ImagePlugin,
      LinkPlugin,
      MentionPlugin.configure({
        trigger: '@',
      }),
      SlashCommandPlugin,
      PasteRulesPlugin,
      ListsPlugin,
      TaskListPlugin,
      BlockquotePlugin,
      HorizontalRulePlugin,
      TablePlugin,
      CodeBlockPlugin.configure({
        languages: PLAYGROUND_CODE_BLOCK_LANGUAGE_VALUES,
        defaultLanguage: PLAYGROUND_DEFAULT_CODE_BLOCK_LANGUAGE,
      }),
      HardBreakPlugin,
      ClearFormattingPlugin,
      TrailingParagraphPlugin,
      PlaygroundCodeHighlightPlugin,
      HistoryPlugin.configure({
        depth: 200,
        newGroupDelay: 750,
      }),
    ],
  });

  protected readonly outputFormats: readonly {
    value: PlaygroundOutputFormat;
    label: string;
  }[] = [
    { value: 'html', label: 'HTML' },
    { value: 'json', label: 'JSON' },
    { value: 'markdown', label: 'Markdown' },
  ];
  protected readonly outputFormat = signal<PlaygroundOutputFormat>('html');
  // Reads `editor.html()` so it recomputes on every edit, then renders the
  // currently selected format. JSON/Markdown are pulled fresh on each change.
  protected readonly serializedOutput = computed(() => {
    const html = this.editor.html();

    switch (this.outputFormat()) {
      case 'json':
        return JSON.stringify(this.editor.getJSON(), null, 2);
      case 'markdown':
        return this.editor.getMarkdown();
      default:
        return html;
    }
  });

  protected readonly linkPopover = new LinkPopoverController(this.editor);
  protected readonly mentionController = new PlaygroundMentionController(
    this.editor,
    createPlaygroundMentionSource('lazy'),
  );
  protected readonly slashCommandController =
    new PlaygroundSlashCommandController(this.editor);
  private readonly imagePreviewUrls: string[] = [];

  constructor() {
    effect(() => {
      this.editor.query('slashCommand');
      queueMicrotask(() => this.slashCommandController.refresh());
    });

    afterNextRender(() => {
      const surface = this.mentionSurface().nativeElement;
      const refreshMentions = () => this.mentionController.refresh();
      const handleMentionKeydown = (event: Event) =>
        this.mentionController.handleMentionKeydown(event);
      const refreshSlashCommands = () => this.slashCommandController.refresh();
      const handleSlashCommandKeydown = (event: Event) =>
        this.slashCommandController.handleSlashCommandKeydown(event);

      surface.addEventListener('qalma-mention-update', refreshMentions);
      surface.addEventListener('qalma-mention-keydown', handleMentionKeydown);
      surface.addEventListener(
        'qalma-slash-command-update',
        refreshSlashCommands,
      );
      surface.addEventListener(
        'qalma-slash-command-keydown',
        handleSlashCommandKeydown,
      );

      this.destroyRef.onDestroy(() => {
        surface.removeEventListener('qalma-mention-update', refreshMentions);
        surface.removeEventListener(
          'qalma-mention-keydown',
          handleMentionKeydown,
        );
        surface.removeEventListener(
          'qalma-slash-command-update',
          refreshSlashCommands,
        );
        surface.removeEventListener(
          'qalma-slash-command-keydown',
          handleSlashCommandKeydown,
        );
        this.revokeImagePreviewUrls();
      });
    });
  }

  protected onOutputFormatChange(value: unknown): void {
    // `nullable=false` keeps a selection, so `value` is always a single format.
    if (value === 'html' || value === 'json' || value === 'markdown') {
      this.outputFormat.set(value);
    }
  }

  protected insertImageFromUrl(): void {
    const currentImage = this.editor.query<ImageCommandValue>('image');
    const src = window.prompt(
      'Image URL',
      currentImage?.src ?? PLAYGROUND_EXAMPLE_IMAGE_SRC,
    );

    if (!src) {
      return;
    }

    const alt = window.prompt(
      'Alt text',
      currentImage?.alt ?? PLAYGROUND_EXAMPLE_IMAGE_ALT,
    );
    const title =
      window.prompt(
        'Title',
        currentImage?.title ?? PLAYGROUND_EXAMPLE_IMAGE_TITLE,
      ) || null;
    const commandValue: ImageCommandValue = {
      src,
      alt: alt ?? '',
      title,
    };

    this.editor.execute(
      currentImage ? 'updateImage' : 'insertImage',
      commandValue,
    );

    this.posthogService.posthog.capture('playground_image_inserted', {
      type: 'url',
    });
  }

  protected chooseImageFile(): void {
    const input = this.imageUpload().nativeElement;

    input.value = '';
    input.click();
  }

  protected insertUploadedImage(event: Event): void {
    const input = event.target;

    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const file = input.files?.item(0);

    if (!file || !file.type.startsWith('image/')) {
      return;
    }

    const previewSrc = URL.createObjectURL(file);

    this.imagePreviewUrls.push(previewSrc);
    this.editor.execute('insertImage', {
      src: createUploadedImageSrc(file),
      alt: createImageAltText(file),
      title: file.name,
      previewSrc,
    });

    this.posthogService.posthog.capture('playground_image_uploaded', {
      mime_type: file.type,
    });
  }

  protected onLinkSave(popover: LinkPopover): void {
    this.linkPopover.save(popover);
    this.posthogService.posthog.capture('playground_link_saved');
  }

  protected showContextualLinkEditor(
    event: MouseEvent,
    selectionToolbar: PlaygroundSelectionToolbarDirective,
  ): void {
    selectionToolbar.hide();
    this.linkPopover.showToolbarEditor(event);
  }

  protected onMentionPick(option: PlaygroundMentionOption): void {
    this.mentionController.insert(option);
    this.posthogService.posthog.capture('playground_mention_inserted');
  }

  protected onSlashCommandPick(option: PlaygroundSlashCommandOption): void {
    this.slashCommandController.insert(option);
    this.posthogService.posthog.capture('playground_slash_command_inserted', {
      command: option.command,
    });
  }

  private revokeImagePreviewUrls(): void {
    for (const url of this.imagePreviewUrls) {
      URL.revokeObjectURL(url);
    }

    this.imagePreviewUrls.length = 0;
  }
}

function createImageAltText(file: File): string {
  return file.name
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .trim();
}

function createUploadedImageSrc(file: File): string {
  const basename = file.name.trim() || 'image';
  const safeName = basename
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return `/uploads/${Date.now()}-${encodeURIComponent(safeName || 'image')}`;
}
