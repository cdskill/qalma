import { ChangeDetectionStrategy, Component } from '@angular/core';
import { QalmaButton } from '@qalma/kit';

@Component({
  selector: 'app-kit-button-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QalmaButton],
  template: `
    <div class="flex flex-wrap items-center gap-3">
      <button qalmaBtn type="button">Default</button>
      <button qalmaBtn variant="secondary" type="button">Secondary</button>
      <button qalmaBtn variant="outline" type="button">Outline</button>
      <button qalmaBtn variant="ghost" type="button">Ghost</button>
      <button qalmaBtn variant="accent" type="button">Accent</button>
      <a qalmaBtn variant="link" href="/kit/button">Link</a>
      <button qalmaBtn size="icon" type="button" aria-label="Icon action">
        Aa
      </button>
    </div>
  `,
})
export class KitButtonDemo {}
