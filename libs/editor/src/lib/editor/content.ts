import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  inject,
  viewChild,
} from '@angular/core';

import { RTE_EDITOR_CONTEXT } from './editor-context';

@Component({
  selector: 'rte-content',
  imports: [],
  template: `<div #editorHost class="rte-content-surface"></div>`,
  host: {
    '[class.rte-content]': 'true',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RteContent implements AfterViewInit, OnDestroy {
  private readonly context = inject(RTE_EDITOR_CONTEXT);

  private readonly editorHost =
    viewChild.required<ElementRef<HTMLDivElement>>('editorHost');

  ngAfterViewInit(): void {
    this.context.editor().mount(this.editorHost().nativeElement);
  }

  ngOnDestroy(): void {
    this.context.editor().unmount(this.editorHost().nativeElement);
  }
}
