import {
  Directive,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
} from '@angular/core';
import { QalmaEditorController } from '@qalma/editor';

import {
  PlaygroundDragHandleController,
  PlaygroundDragHandleView,
} from './drag-handle-controller';

@Directive({
  exportAs: 'appPlaygroundDragHandle',
  selector: '[appPlaygroundDragHandle]',
})
export class PlaygroundDragHandleDirective {
  readonly editor = input.required<QalmaEditorController>({
    alias: 'appPlaygroundDragHandle',
  });

  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly controller = new PlaygroundDragHandleController(() =>
    this.editor(),
  );

  readonly handle = this.controller.handle;
  readonly dropIndicator = this.controller.dropIndicator;
  readonly draggedBlockHighlight = this.controller.draggedBlockHighlight;

  constructor() {
    afterNextRender(() => {
      this.controller.connect(this.host.nativeElement, this.destroyRef);
    });
  }

  hide(): void {
    this.controller.hide();
  }

  startDrag(event: PointerEvent, handle: PlaygroundDragHandleView): void {
    this.controller.startDrag(event, handle);
  }
}
