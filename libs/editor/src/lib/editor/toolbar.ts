import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'rte-toolbar',
  imports: [],
  template: `<ng-content />`,
  host: {
    '[class.rte-toolbar]': 'true',
    role: 'toolbar',
    '[attr.aria-label]': 'label()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RteToolbar {
  readonly label = input('Editor toolbar');
}
