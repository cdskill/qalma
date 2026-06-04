import {
  ChangeDetectionStrategy,
  Component,
  forwardRef,
  input,
} from '@angular/core';

import { RTE_EDITOR_CONTEXT, RteEditorContext } from './editor-context';
import { RteEditorController } from './rte-editor-controller';

@Component({
  selector: 'rte-editor',
  imports: [],
  providers: [
    {
      provide: RTE_EDITOR_CONTEXT,
      useExisting: forwardRef(() => RteEditor),
    },
  ],
  template: `<ng-content />`,
  host: {
    '[class.rte-editor]': 'true',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RteEditor implements RteEditorContext {
  readonly editor = input.required<RteEditorController>();
}
