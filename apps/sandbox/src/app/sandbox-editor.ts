import { Component } from '@angular/core';
import {
  HeadingsPlugin,
  HistoryPlugin,
  LinkPlugin,
  ListsPlugin,
  RteContent,
  RteEditor,
  createRteEditor,
  TextFormattingKit,
} from '@angular-rte/editor';

import { LinkPopoverController } from './link-popover-controller';
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
        class="block min-h-64 p-4 [&_.ProseMirror]:min-h-56 [&_.ProseMirror]:break-words [&_.ProseMirror]:whitespace-pre-wrap [&_.ProseMirror]:outline-none [&_.ProseMirror_h1]:mb-3 [&_.ProseMirror_h1]:text-3xl [&_.ProseMirror_h1]:font-extrabold [&_.ProseMirror_h2]:mb-3 [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h3]:mb-2.5 [&_.ProseMirror_h3]:text-xl [&_.ProseMirror_h3]:font-bold [&_.ProseMirror_li>p]:mb-1 [&_.ProseMirror_ol]:mb-3 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6 [&_.ProseMirror_p]:mb-3 [&_.ProseMirror_ul]:mb-3 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6"
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

    <section class="mt-6" aria-label="Serialized HTML">
      <h2 class="mb-2.5 text-lg font-bold text-slate-900">Serialized HTML</h2>
      <pre
        class="m-0 overflow-auto rounded-lg border border-slate-300 bg-white p-4 font-mono text-sm leading-6 text-slate-700"
        >{{ editor.html() }}</pre
      >
    </section>
  `,
})
export class SandboxEditor {
  protected readonly editor = createRteEditor({
    content:
      '<h1><strong>Angular RTE</strong></h1><p>Build headless editing primitives with a plugin stack that remains fully selected by the consumer.</p><p>Use the toolbar to shape content without surrendering UI ownership: try <em>italic</em>, <u>underline</u>, <s>strikethrough</s>, and <a href="https://angular.dev" target="_blank" rel="noopener noreferrer">links</a>.</p><ul><li><p>Compose plugins in TypeScript.</p></li><li><p>Keep toolbar markup in the consuming app.</p></li></ul><ol><li><p>Pick capabilities for the current product surface.</p></li><li><p>Render controls with Angular templates and rteCommand.</p></li></ol><p>Switch paragraphs into lists, nest items with Tab, and lift them back out with Shift+Tab.</p>',
    placeholder: 'Start writing...',
    plugins: [
      HeadingsPlugin,
      ...TextFormattingKit,
      LinkPlugin,
      ListsPlugin,
      HistoryPlugin.configure({
        depth: 200,
        newGroupDelay: 750,
      }),
    ],
  });

  protected readonly linkPopover = new LinkPopoverController(this.editor);
}
