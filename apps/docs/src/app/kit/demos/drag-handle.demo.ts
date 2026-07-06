import {
  ChangeDetectionStrategy,
  Component,
  afterNextRender,
  signal,
} from '@angular/core';
import {
  DragHandlePlugin,
  HistoryPlugin,
  QalmaContent,
  QalmaEditor,
  createQalmaEditor,
} from '@qalma/editor';
import { QalmaDragHandle, QalmaDragHandleDirective } from '@qalma/kit';

@Component({
  selector: 'app-kit-drag-handle-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    QalmaEditor,
    QalmaContent,
    QalmaDragHandle,
    QalmaDragHandleDirective,
  ],
  template: `
    <qalma-editor [editor]="editor">
      <div
        [qalmaDragHandle]="editor"
        #drag="qalmaDragHandle"
        class="rounded-lg border border-border bg-card py-4 pl-10 pr-4"
      >
        <qalma-content
          class="block min-h-40 text-sm leading-6 [&_.ProseMirror]:outline-none"
        />
      </div>

      <!-- The floating overlay is browser-only; skip it during SSR/prerender. -->
      @if (browserReady()) {
        <qalma-drag-handle
          [editor]="editor"
          [handle]="drag.handle()"
          [dropIndicator]="drag.dropIndicator()"
          [draggedBlockHighlight]="drag.draggedBlockHighlight()"
          (dismiss)="drag.hide()"
          (dragStart)="drag.startDrag($event.event, $event.handle)"
        />
      }
    </qalma-editor>
  `,
})
export class KitDragHandleDemo {
  protected readonly browserReady = signal(false);
  protected readonly editor = createQalmaEditor({
    content:
      '<p>Hover a block to reveal the handle on its left.</p><p>Open the handle menu to move, duplicate, or delete this paragraph.</p><p>Drag the handle itself to reorder blocks directly.</p>',
    plugins: [DragHandlePlugin, HistoryPlugin],
  });

  constructor() {
    afterNextRender(() => this.browserReady.set(true));
  }
}
