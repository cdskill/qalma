---
title: Building a Custom Toolbar
description: Compose native controls, design-system components, and Qalma commands into a toolbar you own.
---

# Building a Custom Toolbar

Qalma's toolbar story is intentionally headless. The library gives you:

| Primitive | What it does |
| --------- | ------------ |
| `QalmaToolbar` | Adds `role="toolbar"`, an `aria-label`, and projects your controls. |
| `QalmaCommand` | Wires native buttons to editor commands. |
| `QalmaEditorController` | Provides `execute`, `canExecute`, `isCommandActive`, and `query`. |

Everything visual belongs to your app: icons, layout, grouping, separators,
menus, popovers, colors, tooltips, and responsive behavior.

## Start with command buttons

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  HeadingsPlugin,
  HistoryPlugin,
  QalmaCommand,
  QalmaContent,
  QalmaEditor,
  QalmaToolbar,
  TextFormattingKit,
  createQalmaEditor,
} from '@qalma/editor';

@Component({
  selector: 'app-editor-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QalmaEditor, QalmaContent, QalmaToolbar, QalmaCommand],
  template: `
    <qalma-editor [editor]="editor">
      <qalma-toolbar class="toolbar" label="Editor commands">
        <button type="button" qalmaCommand="setParagraph">P</button>
        <button type="button" qalmaCommand="toggleHeading2">H2</button>
        <button type="button" qalmaCommand="toggleBold">B</button>
        <button type="button" qalmaCommand="toggleItalic">I</button>
        <button type="button" qalmaCommand="undo">Undo</button>
        <button type="button" qalmaCommand="redo">Redo</button>
      </qalma-toolbar>

      <qalma-content class="block min-h-48 p-4 [&_.ProseMirror]:outline-none" />
    </qalma-editor>
  `,
})
export class EditorToolbar {
  protected readonly editor = createQalmaEditor({
    plugins: [HeadingsPlugin, ...TextFormattingKit, HistoryPlugin],
  });
}
```

```css
.toolbar button.qalma-command-active {
  background: var(--accent-subtle);
}
```

## Add value-based controls

Use direct controller calls when a control needs a command value.

```typescript
readonly textColor = computed(() => this.editor.query<string>('textColor'));

setTextColor(color: string): void {
  this.editor.execute('setTextColor', color);
}

canSetTextColor(color: string): boolean {
  return this.editor.canExecute('setTextColor', color);
}
```

```html
@for (color of colors; track color) {
  <button
    type="button"
    [class.qalma-command-active]="textColor() === color"
    [disabled]="!canSetTextColor(color)"
    (mousedown)="$event.preventDefault()"
    (click)="setTextColor(color)"
    [style.background-color]="color"
    [attr.aria-label]="'Set text color ' + color"
  ></button>
}
```

The `mousedown` prevention keeps the editor selection intact before the click
runs.

## Add popover triggers

For link editing, use a normal button and open your app popover. The popover can
read `query&lt;LinkState&gt;('link')`, then call `setLink` or `unsetLink`.

```typescript
openLinkEditor(): void {
  const link = this.editor.query<LinkState>('link');

  this.linkHref.set(link?.href ?? 'https://');
  this.linkEditorOpen.set(true);
}

saveLink(): void {
  this.editor.execute('setLink', this.linkHref());
  this.linkEditorOpen.set(false);
}
```

```html
<button
  type="button"
  [class.qalma-command-active]="editor.isCommandActive('setLink')"
  [disabled]="!editor.canExecute('setLink', 'https://angular.dev')"
  (mousedown)="$event.preventDefault()"
  (click)="openLinkEditor()"
>
  Link
</button>
```

## Design-system components

If your app uses Spartan/helm, Angular Material, PrimeNG, or another component
system, keep that dependency in the app. The docs app uses a Spartan/helm-style
button directive and Tailwind design tokens, while `@qalma/editor` stays
unstyled and independent.

That split is deliberate: Qalma exposes behavior, your toolbar owns the product
experience.
