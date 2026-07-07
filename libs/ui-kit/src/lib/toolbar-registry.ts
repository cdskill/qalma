import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  input,
} from '@angular/core';

import { QalmaToolbarButton } from './toolbar-button';
import {
  ToolbarCommandItem,
  ToolbarGroup,
  ToolbarItem,
  ToolbarTemplateItem,
  isToolbarCommandItem,
} from './toolbar-commands';

/** Vertical divider rendered between non-empty toolbar groups. */
export const TOOLBAR_SEPARATOR_CLASS =
  'mx-0.5 h-5 w-px shrink-0 self-center bg-border';

/**
 * Renders a declarative toolbar registry: an ordered list of groups, each a
 * list of command buttons and/or inline custom-control templates, with a
 * separator drawn between non-empty groups.
 *
 * Meant to sit inside the editor's `<qalma-toolbar>` (which owns the
 * `role="toolbar"` semantics); the host uses `display: contents` so the
 * rendered buttons participate directly in that container's flex layout.
 *
 * ```html
 * <qalma-toolbar class="flex …">
 *   <ng-template #colors> … custom controls … </ng-template>
 *   <qalma-toolbar-registry [groups]="[headings, marks, [{ template: colors }]]" />
 * </qalma-toolbar>
 * ```
 */
@Component({
  selector: 'qalma-toolbar-registry',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgTemplateOutlet, QalmaToolbarButton],
  host: {
    class: 'contents',
  },
  template: `
    @for (group of visibleGroups(); track $index; let first = $first) {
      @if (!first) {
        <span [class]="separatorClass()" aria-hidden="true"></span>
      }
      @for (item of group; track $index) {
        @if (asCommand(item); as command) {
          <qalma-toolbar-button
            [command]="command.command"
            [value]="command.value"
            [icon]="command.icon"
            [label]="command.label"
          />
        } @else {
          <ng-container [ngTemplateOutlet]="asTemplate(item)" />
        }
      }
    }
  `,
})
export class QalmaToolbarRegistry {
  readonly groups = input.required<readonly ToolbarGroup[]>();
  readonly separatorClass = input(TOOLBAR_SEPARATOR_CLASS);

  /** Drop empty groups so they neither render content nor a dangling separator. */
  protected readonly visibleGroups = computed(() =>
    this.groups().filter((group) => group.length > 0),
  );

  protected asCommand(item: ToolbarItem): ToolbarCommandItem | null {
    return isToolbarCommandItem(item) ? item : null;
  }

  protected asTemplate(item: ToolbarItem): TemplateRef<unknown> {
    return (item as ToolbarTemplateItem).template;
  }
}
