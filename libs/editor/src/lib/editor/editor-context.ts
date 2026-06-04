import { InjectionToken, Signal } from '@angular/core';

import { RteEditorController } from './rte-editor-controller';

export interface RteEditorContext {
  readonly editor: Signal<RteEditorController>;
}

export const RTE_EDITOR_CONTEXT = new InjectionToken<RteEditorContext>(
  'RTE_EDITOR_CONTEXT',
);
