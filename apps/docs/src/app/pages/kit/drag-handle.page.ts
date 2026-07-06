import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouteMeta } from '@analogjs/router';

import { KitExample } from '../../kit/kit-example';
import { KitDragHandleDemo } from '../../kit/demos/drag-handle.demo';
import dragHandleDemoSource from '../../kit/demos/drag-handle.demo.ts?raw';

export const routeMeta: RouteMeta = {
  title: 'UI Kit Drag Handle',
  meta: [
    {
      name: 'description',
      content:
        'Use QalmaDragHandle to render block controls for Qalma drag handle workflows.',
    },
  ],
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-ui-kit-drag-handle-docs',
  imports: [KitExample, KitDragHandleDemo],
  template: `
    <article class="space-y-10">
      <header class="space-y-4">
        <p
          class="text-xs font-semibold uppercase tracking-[0.12em] text-accent"
        >
          UI Kit component
        </p>
        <h1
          class="font-serif text-4xl font-medium leading-[1.1] tracking-tight"
        >
          Drag Handle
        </h1>
        <p class="text-base leading-7 text-muted-foreground">
          <code>QalmaDragHandle</code> renders the fixed block handle, block
          action menu, dragged-block highlight, and drop indicator.
          <code>QalmaDragHandleDirective</code> tracks the hovered block and
          feeds it the placement.
        </p>
      </header>

      <section>
        <h2 id="preview">Preview</h2>
        <app-kit-example
          title="Block actions"
          description="Hover a paragraph to reveal the handle, open its menu, or drag it to reorder."
          [code]="demoSource"
          exampleId="ui-kit-drag-handle"
        >
          <app-kit-drag-handle-demo />
        </app-kit-example>
      </section>

      <section class="space-y-4">
        <h2 id="api">API</h2>
        <p class="leading-7 text-muted-foreground">
          The <code>QalmaDragHandleDirective</code> wraps the content and
          exposes <code>handle()</code>, <code>dropIndicator()</code>,
          <code>draggedBlockHighlight()</code>, <code>hide()</code>, and
          <code>startDrag()</code>. The
          <code>&lt;qalma-drag-handle&gt;</code> component takes
          <code>editor</code>, <code>handle</code>, <code>dropIndicator</code>,
          and <code>draggedBlockHighlight</code>, and emits
          <code>dismiss</code> and <code>dragStart</code>.
        </p>
      </section>
    </article>
  `,
})
export default class UiKitDragHandleDocsPage {
  protected readonly demoSource = dragHandleDemoSource;
}
