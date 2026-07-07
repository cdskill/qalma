import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { DocsShell } from '../docs/docs-shell';
import { DOCS_NAV } from '../docs/docs-nav';

/** Layout for every `/docs/*` route: the editor documentation section. */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-docs-layout',
  imports: [DocsShell, RouterOutlet],
  template: `
    <app-docs-shell [groups]="nav" section="docs">
      <router-outlet />
    </app-docs-shell>
  `,
})
export default class DocsLayout {
  protected readonly nav = DOCS_NAV;
}
