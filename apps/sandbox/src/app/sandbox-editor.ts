import { Component } from '@angular/core';
import {
  BlockquotePlugin,
  ClearFormattingPlugin,
  CodeBlockPlugin,
  ColorPlugin,
  HardBreakPlugin,
  HeadingsPlugin,
  HighlightPlugin,
  HistoryPlugin,
  LinkPlugin,
  ListsPlugin,
  PlaceholderPlugin,
  RteContent,
  RteEditor,
  TextAlignPlugin,
  createRteEditor,
  TextFormattingKit,
} from '@angular-rte/editor';

import { LinkPopoverController } from './link-popover-controller';
import {
  SANDBOX_CODE_BLOCK_LANGUAGE_VALUES,
  SANDBOX_DEFAULT_CODE_BLOCK_LANGUAGE,
} from './sandbox-code-block';
import { SandboxCodeHighlightPlugin } from './sandbox-code-highlight-plugin';
import { SandboxLinkPopover } from './sandbox-link-popover';
import { SandboxToolbar } from './sandbox-toolbar';

@Component({
  imports: [RteContent, RteEditor, SandboxLinkPopover, SandboxToolbar],
  selector: 'app-sandbox-editor',
  template: `
    <rte-editor
      class="block overflow-hidden rounded-lg border border-slate-300 bg-white text-slate-900 shadow-sm"
      [editor]="editor"
    >
      <app-sandbox-toolbar
        [editor]="editor"
        (requestLink)="linkPopover.showToolbarEditor($event)"
      />

      <rte-content
        class="block min-h-64 p-4 [&_.ProseMirror]:min-h-56 [&_.ProseMirror]:break-words [&_.ProseMirror]:whitespace-pre-wrap [&_.ProseMirror]:outline-none [&_.ProseMirror_.hljs-attr]:text-sky-300 [&_.ProseMirror_.hljs-built_in]:text-cyan-300 [&_.ProseMirror_.hljs-comment]:text-slate-500 [&_.ProseMirror_.hljs-keyword]:text-violet-300 [&_.ProseMirror_.hljs-literal]:text-orange-300 [&_.ProseMirror_.hljs-meta]:text-slate-400 [&_.ProseMirror_.hljs-number]:text-orange-300 [&_.ProseMirror_.hljs-params]:text-slate-200 [&_.ProseMirror_.hljs-string]:text-emerald-300 [&_.ProseMirror_.hljs-title]:text-amber-200 [&_.ProseMirror_.hljs-type]:text-cyan-200 [&_.ProseMirror_.hljs-variable]:text-sky-200 [&_.ProseMirror_blockquote]:mb-3 [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:border-slate-300 [&_.ProseMirror_blockquote]:pl-4 [&_.ProseMirror_blockquote]:text-slate-700 [&_.ProseMirror_h1]:mb-3 [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-extrabold [&_.ProseMirror_h2]:mb-3 [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h3]:mb-2.5 [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_li>p]:mb-1 [&_.ProseMirror_ol]:mb-3 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_p]:mb-3 [&_.ProseMirror_pre]:mb-3 [&_.ProseMirror_pre]:overflow-x-auto [&_.ProseMirror_pre]:rounded-md [&_.ProseMirror_pre]:bg-slate-950 [&_.ProseMirror_pre]:p-3 [&_.ProseMirror_pre]:font-mono [&_.ProseMirror_pre]:text-sm [&_.ProseMirror_pre]:leading-6 [&_.ProseMirror_pre]:text-slate-100 [&_.ProseMirror_ul]:mb-3 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6"
        (mouseover)="linkPopover.showPreview($event)"
        (mouseout)="linkPopover.scheduleHideFromEvent($event)"
        (focus)="linkPopover.showPreview($event)"
        (blur)="linkPopover.scheduleHideFromEvent($event)"
        (focusin)="linkPopover.showPreview($event)"
        (focusout)="linkPopover.scheduleHideFromEvent($event)"
      />
    </rte-editor>

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
  protected readonly editor = createRteEditor({
    content:
      '<h1><strong>Angular RTE</strong></h1><p style="text-align: center;">Build headless editing primitives with a plugin stack that remains fully selected by the consumer.</p><blockquote><p>Quote important passages without taking ownership away from the consuming app.</p></blockquote><p>Use the toolbar to shape content without surrendering UI ownership: try <em>italic</em>, <u>underline</u>, <s>strikethrough</s>, <mark>highlight</mark>, <span style="color: rgb(14, 116, 144); background-color: rgb(254, 240, 138);">color</span>, and <a href="https://angular.dev" target="_blank" rel="noopener noreferrer">links</a>.</p><pre><code class="language-typescript">import { createRteEditor } from "@angular-rte/editor";&#10;&#10;const editor = createRteEditor({&#10;  plugins: [CodeBlockPlugin],&#10;});&#10;&#10;editor.execute("setCodeBlockLanguage", "typescript");</code></pre><pre><code class="language-go">package main&#10;&#10;import "fmt"&#10;&#10;func main() {&#10;  fmt.Println("Angular RTE")&#10;}</code></pre><ul><li><p>Compose plugins in TypeScript.</p></li><li><p>Keep toolbar markup in the consuming app.</p></li></ul><ol><li><p>Pick capabilities for the current product surface.</p></li><li><p>Render controls with Angular templates and rteCommand.</p></li></ol><p>Switch paragraphs into lists, nest items with Tab, and lift them back out with Shift+Tab.</p>',
    placeholder: 'Start writing...',
    plugins: [
      HeadingsPlugin,
      PlaceholderPlugin.configure({
        placeholder: 'Start writing...',
      }),
      TextAlignPlugin,
      ...TextFormattingKit,
      HighlightPlugin,
      ColorPlugin,
      LinkPlugin,
      ListsPlugin,
      BlockquotePlugin,
      CodeBlockPlugin.configure({
        languages: SANDBOX_CODE_BLOCK_LANGUAGE_VALUES,
        defaultLanguage: SANDBOX_DEFAULT_CODE_BLOCK_LANGUAGE,
      }),
      HardBreakPlugin,
      ClearFormattingPlugin,
      SandboxCodeHighlightPlugin,
      HistoryPlugin.configure({
        depth: 200,
        newGroupDelay: 750,
      }),
    ],
  });

  protected readonly linkPopover = new LinkPopoverController(this.editor);
}
