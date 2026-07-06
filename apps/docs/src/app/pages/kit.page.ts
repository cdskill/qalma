import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { DocsShell } from '../docs/docs-shell';
import { KIT_NAV } from '../docs/kit-nav';

/** Layout for every `/kit/*` route: the optional `@qalma/kit` UI Kit section. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-kit-layout',
  imports: [DocsShell, RouterOutlet],
  template: `
    <app-docs-shell [groups]="nav" section="kit">
      <router-outlet />
    </app-docs-shell>
  `,
})
export default class KitLayout {
  protected readonly nav = KIT_NAV;
}
