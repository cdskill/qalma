import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  HistoryPlugin,
  LinkPlugin,
  QalmaContent,
  QalmaEditor,
  TextFormattingKit,
  createQalmaEditor,
} from '@qalma/editor';
import { LinkPopoverController, QalmaLinkPopover } from '@qalma/kit';

@Component({
  selector: 'app-kit-link-popover-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QalmaEditor, QalmaContent, QalmaLinkPopover],
  template: `
    <qalma-editor [editor]="editor">
      <div
        class="rounded-lg border border-border bg-card p-4"
        (mouseover)="linkPopover.showPreview($event)"
        (mouseout)="linkPopover.scheduleHideFromEvent($event)"
        (focus)="linkPopover.showPreview($event)"
        (blur)="linkPopover.scheduleHideFromEvent($event)"
        (focusin)="linkPopover.showPreview($event)"
        (focusout)="linkPopover.scheduleHideFromEvent($event)"
      >
        <qalma-content
          class="block min-h-32 text-sm leading-6 [&_.ProseMirror]:outline-none [&_a]:text-accent [&_a]:underline"
        />
      </div>

      <qalma-link-popover
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
    </qalma-editor>
  `,
})
export class KitLinkPopoverDemo {
  protected readonly editor = createQalmaEditor({
    content:
      '<p>Hover the <a href="https://qalma.dev/docs">Qalma documentation</a> link to preview, edit, or remove it.</p>',
    plugins: [...TextFormattingKit, LinkPlugin, HistoryPlugin],
  });

  protected readonly linkPopover = new LinkPopoverController(this.editor);
}
