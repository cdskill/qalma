import { Component } from '@angular/core';
import {
  HistoryPlugin,
  LinkPlugin,
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
        class="block min-h-64 p-4 [&_.ProseMirror]:min-h-56 [&_.ProseMirror]:break-words [&_.ProseMirror]:whitespace-pre-wrap [&_.ProseMirror]:outline-none [&_.ProseMirror_p]:mb-3"
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
      '<p><strong>Angular RTE</strong> starts with inline text formatting.</p><p>Try <em>italic</em>, <u>underline</u>, <s>strikethrough</s>, and <a href="https://angular.dev" target="_blank" rel="noopener noreferrer">links</a> from a consumer-owned toolbar.</p>',
    placeholder: 'Start writing...',
    plugins: [
      ...TextFormattingKit,
      LinkPlugin,
      HistoryPlugin.configure({
        depth: 200,
        newGroupDelay: 750,
      }),
    ],
  });

  protected readonly linkPopover = new LinkPopoverController(this.editor);
}
