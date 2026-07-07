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
  QalmaDragHandleController,
  QalmaDragHandleView,
} from './drag-handle-controller';

@Directive({
  exportAs: 'qalmaDragHandle',
  selector: '[qalmaDragHandle]',
})
export class QalmaDragHandleDirective {
  readonly editor = input.required<QalmaEditorController>({
    alias: 'qalmaDragHandle',
  });

  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly controller = new QalmaDragHandleController(() =>
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

  startDrag(event: PointerEvent, handle: QalmaDragHandleView): void {
    this.controller.startDrag(event, handle);
  }
}
