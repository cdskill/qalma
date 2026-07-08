import {
  Directive,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
} from '@angular/core';
import { QalmaEditorController } from '@qalma/editor';

import { QalmaSelectionToolbarController } from './selection-toolbar-controller';

@Directive({
  exportAs: 'qalmaSelectionToolbar',
  selector: '[qalmaSelectionToolbar]',
})
export class QalmaSelectionToolbarDirective {
  readonly editor = input.required<QalmaEditorController>({
    alias: 'qalmaSelectionToolbar',
  });

  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly controller = new QalmaSelectionToolbarController(() =>
    this.editor(),
  );

  readonly placement = this.controller.placement;

  constructor() {
    afterNextRender(() => {
      this.controller.connect(this.host.nativeElement, this.destroyRef);
    });
  }

  refresh(): void {
    this.controller.refresh();
  }

  hide(): void {
    this.controller.hide();
  }
}
