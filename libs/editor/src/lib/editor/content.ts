import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
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
export class RteContent {
  private readonly context = inject(RTE_EDITOR_CONTEXT);
  private readonly destroyRef = inject(DestroyRef);

  private readonly editorHost =
    viewChild.required<ElementRef<HTMLDivElement>>('editorHost');

  private mountedHost?: HTMLElement;

  constructor() {
    afterNextRender(() => {
      const host = this.editorHost().nativeElement;

      this.context.editor().mount(host);
      this.mountedHost = host;
    });

    this.destroyRef.onDestroy(() => {
      if (this.mountedHost) {
        this.context.editor().unmount(this.mountedHost);
      }
    });
  }
}
