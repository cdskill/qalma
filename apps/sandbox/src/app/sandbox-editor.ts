import {
  Component,
  DestroyRef,
  ElementRef,
  HostListener,
  NgZone,
  afterNextRender,
  effect,
  inject,
  viewChild,
} from '@angular/core';
import {
  BlockquotePlugin,
  ClearFormattingPlugin,
  CodeBlockPlugin,
  ColorPlugin,
  HardBreakPlugin,
  HeadingsPlugin,
  HighlightPlugin,
  HistoryPlugin,
  ImageCommandValue,
  ImagePlugin,
  LinkPlugin,
  ListsPlugin,
  MentionPlugin,
  PasteRulesPlugin,
  PlaceholderPlugin,
  QalmaContent,
  QalmaEditor,
  SlashCommandPlugin,
  SubscriptSuperscriptPlugin,
  TaskListPlugin,
  TextAlignPlugin,
  createQalmaEditor,
  TextFormattingKit,
  TrailingParagraphPlugin,
} from '@qalma/editor';

import { LinkPopoverController } from './link-popover-controller';
import {
  SANDBOX_CODE_BLOCK_LANGUAGE_VALUES,
  SANDBOX_DEFAULT_CODE_BLOCK_LANGUAGE,
} from './sandbox-code-block';
import { SandboxCodeHighlightPlugin } from './sandbox-code-highlight-plugin';
import { SandboxLinkPopover } from './sandbox-link-popover';
import {
  createSandboxMentionSource,
  SandboxMentionController,
} from './sandbox-mention';
import {
  SANDBOX_EXAMPLE_IMAGE_ALT,
  SANDBOX_EXAMPLE_IMAGE_SRC,
  SANDBOX_EXAMPLE_IMAGE_TITLE,
} from './sandbox-image';
import { SandboxMentionMenu } from './sandbox-mention-menu';
import { SandboxSlashCommandController } from './sandbox-slash-command';
import { SandboxSlashCommandMenu } from './sandbox-slash-command-menu';
import { SandboxToolbar } from './sandbox-toolbar';

@Component({
  imports: [
    QalmaContent,
    QalmaEditor,
    SandboxLinkPopover,
    SandboxMentionMenu,
    SandboxSlashCommandMenu,
    SandboxToolbar,
  ],
  selector: 'app-sandbox-editor',
  template: `
    <qalma-editor
      class="block overflow-hidden rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm"
      [editor]="editor"
    >
      <app-sandbox-toolbar
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

      <div
        #mentionSurface
        class="block min-h-64 p-4 [&_.ProseMirror]:min-h-56 [&_.ProseMirror]:break-words [&_.ProseMirror]:whitespace-pre-wrap [&_.ProseMirror]:outline-none [&_.ProseMirror_.hljs-attr]:text-sky-300 [&_.ProseMirror_.hljs-built_in]:text-cyan-300 [&_.ProseMirror_.hljs-comment]:text-slate-500 [&_.ProseMirror_.hljs-keyword]:text-violet-300 [&_.ProseMirror_.hljs-literal]:text-orange-300 [&_.ProseMirror_.hljs-meta]:text-slate-400 [&_.ProseMirror_.hljs-number]:text-orange-300 [&_.ProseMirror_.hljs-params]:text-slate-200 [&_.ProseMirror_.hljs-string]:text-emerald-300 [&_.ProseMirror_.hljs-title]:text-amber-200 [&_.ProseMirror_.hljs-type]:text-cyan-200 [&_.ProseMirror_.hljs-variable]:text-sky-200 [&_.ProseMirror_blockquote]:mb-3 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-slate-300 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:text-slate-700 [&_.ProseMirror_h1]:mb-3 [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-extrabold [&_.ProseMirror_h2]:mb-3 [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h3]:mb-2.5 [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_li>p]:mb-1 [&_.ProseMirror_ol]:mb-3 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_p]:mb-3 [&_.ProseMirror_pre]:mb-3 [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:rounded-md [&_.ProseMirror_pre]:bg-slate-950 [&_.ProseMirror_pre]:p-3 [&_.ProseMirror_pre]:font-mono [&_.ProseMirror_pre]:text-sm [&_.ProseMirror_pre]:leading-6 [&_.ProseMirror_pre]:text-slate-100 [&_.ProseMirror_ul]:mb-3 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6"
        (mouseover)="linkPopover.showPreview($event)"
        (mouseout)="linkPopover.scheduleHideFromEvent($event)"
        (focus)="
          linkPopover.showPreview($event);
          mentionController.refresh();
          slashCommandController.refresh()
        "
        (blur)="linkPopover.scheduleHideFromEvent($event)"
        (focusin)="linkPopover.showPreview($event)"
        (focusout)="linkPopover.scheduleHideFromEvent($event)"
      >
        <qalma-content />
      </div>
    </qalma-editor>

    @if (slashCommandController.open()) {
      <app-sandbox-slash-command-menu
        [placement]="slashCommandController.placement()"
        [options]="slashCommandController.options()"
        [activeIndex]="slashCommandController.activeIndex()"
        (activate)="slashCommandController.setActiveIndex($event)"
        (pick)="slashCommandController.insert($event)"
        (dismiss)="slashCommandController.dismiss()"
      />
    }

    @if (mentionController.open()) {
      <app-sandbox-mention-menu
        [placement]="mentionController.placement()"
        [suggestions]="mentionController.suggestions()"
        [loading]="mentionController.loading()"
        [activeIndex]="mentionController.activeIndex()"
        (activate)="mentionController.setActiveIndex($event)"
        (pick)="mentionController.insert($event)"
        (dismiss)="mentionController.hide()"
      />
    }

    <app-sandbox-link-popover
      [popover]="linkPopover.popover()"
      [href]="linkPopover.href()"
      (hrefChange)="linkPopover.href.set($event)"
      (edit)="linkPopover.edit($event)"
      (save)="linkPopover.save($event)"
      (remove)="linkPopover.remove($event)"
      (dismiss)="linkPopover.hide()"
      (keepOpen)="linkPopover.keepOpen()"
      (scheduleHide)="linkPopover.scheduleHide()"
    />

    <section class="mt-3" aria-label="Serialized HTML">
      <h2 class="mb-2.5 text-lg font-bold text-slate-900">Serialized HTML</h2>
      <pre
        class="m-0 max-h-72 overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-slate-800 bg-slate-950 p-3 font-mono text-xs leading-5 text-slate-100 shadow-inner [overflow-wrap:anywhere]"
      ><code>{{ editor.html() }}</code></pre>
    </section>
  `,
})
export class SandboxEditor {
  private readonly destroyRef = inject(DestroyRef);
  private readonly zone = inject(NgZone);
  private readonly mentionSurface =
    viewChild.required<ElementRef<HTMLElement>>('mentionSurface');
  private readonly imageUpload =
    viewChild.required<ElementRef<HTMLInputElement>>('imageUpload');

  protected readonly editor = createQalmaEditor({
    content: `<h1><strong>Qalma</strong></h1><p style="text-align: center;">Build headless editing primitives with a plugin stack that remains fully selected by the consumer.</p><blockquote><p>Quote important passages without taking ownership away from the consuming app.</p></blockquote><img src="${SANDBOX_EXAMPLE_IMAGE_SRC}" alt="${SANDBOX_EXAMPLE_IMAGE_ALT}" title="${SANDBOX_EXAMPLE_IMAGE_TITLE}"><p>Use the toolbar to shape content without surrendering UI ownership: try <em>italic</em>, <u>underline</u>, <s>strikethrough</s>, <mark>highlight</mark>, <span style="color: rgb(14, 116, 144); background-color: rgb(254, 240, 138);">color</span>, formulas like H<sub>2</sub>O and E=mc<sup>2</sup>, <span data-qalma-mention data-mention-id="ada-lovelace" data-mention-label="Ada Lovelace" data-mention-trigger="@">@Ada Lovelace</span>, and <a href="https://angular.dev" target="_blank" rel="noopener noreferrer">links</a>.</p><pre><code class="language-typescript">import { createQalmaEditor } from "@qalma/editor";&#10;&#10;const editor = createQalmaEditor({&#10;  plugins: [CodeBlockPlugin],&#10;});&#10;&#10;editor.execute("setCodeBlockLanguage", "typescript");</code></pre><pre><code class="language-go">package main&#10;&#10;import "fmt"&#10;&#10;func main() {&#10;  fmt.Println("Qalma")&#10;}</code></pre><ul><li><p>Compose plugins in TypeScript.</p></li><li><p>Keep toolbar markup in the consuming app.</p></li></ul><ol><li><p>Pick capabilities for the current product surface.</p></li><li><p>Render controls with Angular templates and qalmaCommand.</p></li></ol><ul data-type="task-list"><li data-type="task-item" data-checked="true"><div data-task-item-content><p>Ship engine behavior from a plugin.</p></div></li><li data-type="task-item" data-checked="false"><div data-task-item-content><p>Style task checkboxes in the consuming app.</p></div></li></ul><p>Switch paragraphs into lists, nest items with Tab, and lift them back out with Shift+Tab.</p>`,
    plugins: [
      HeadingsPlugin,
      PlaceholderPlugin.configure({
        placeholder: 'Start writing...',
      }),
      TextAlignPlugin,
      ...TextFormattingKit,
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
      CodeBlockPlugin.configure({
        languages: SANDBOX_CODE_BLOCK_LANGUAGE_VALUES,
        defaultLanguage: SANDBOX_DEFAULT_CODE_BLOCK_LANGUAGE,
      }),
      HardBreakPlugin,
      ClearFormattingPlugin,
      TrailingParagraphPlugin,
      SandboxCodeHighlightPlugin,
      HistoryPlugin.configure({
        depth: 200,
        newGroupDelay: 750,
      }),
    ],
  });

  protected readonly linkPopover = new LinkPopoverController(this.editor);
  protected readonly mentionController = new SandboxMentionController(
    this.editor,
    createSandboxMentionSource('lazy'),
  );
  protected readonly slashCommandController = new SandboxSlashCommandController(
    this.editor,
  );
  private readonly imagePreviewUrls: string[] = [];

  constructor() {
    effect(() => {
      this.editor.query('slashCommand');
      queueMicrotask(() => this.slashCommandController.refresh());
    });

    afterNextRender(() => {
      const surface = this.mentionSurface().nativeElement;
      const refreshMentions = () =>
        this.zone.run(() => this.mentionController.refresh());
      const refreshSlashCommands = () =>
        this.zone.run(() => this.slashCommandController.refresh());
      const handleMentionKeydown = (event: Event) =>
        this.zone.run(() => this.mentionController.handleMentionKeydown(event));
      const handleSlashCommandKeydown = (event: Event) =>
        this.zone.run(() =>
          this.slashCommandController.handleSlashCommandKeydown(event),
        );

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

  @HostListener('document:keydown', ['$event'])
  protected handleDocumentKeydown(event: KeyboardEvent): void {
    if (event.defaultPrevented) {
      return;
    }

    if (this.editorContainsFocus()) {
      this.slashCommandController.handleEditorKeydown(event);
    }
  }

  protected insertImageFromUrl(): void {
    const currentImage = this.editor.query<ImageCommandValue>('image');
    const src = window.prompt(
      'Image URL',
      currentImage?.src ?? SANDBOX_EXAMPLE_IMAGE_SRC,
    );

    if (!src) {
      return;
    }

    const alt = window.prompt(
      'Alt text',
      currentImage?.alt ?? SANDBOX_EXAMPLE_IMAGE_ALT,
    );
    const title =
      window.prompt(
        'Title',
        currentImage?.title ?? SANDBOX_EXAMPLE_IMAGE_TITLE,
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
  }

  private revokeImagePreviewUrls(): void {
    for (const url of this.imagePreviewUrls) {
      URL.revokeObjectURL(url);
    }

    this.imagePreviewUrls.length = 0;
  }

  private editorContainsFocus(): boolean {
    const activeElement = document.activeElement;

    try {
      return Boolean(
        activeElement &&
          this.mentionSurface().nativeElement.contains(activeElement),
      );
    } catch {
      return false;
    }
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
