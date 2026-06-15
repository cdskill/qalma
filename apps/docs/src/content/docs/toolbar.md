---
title: Toolbar
description: Build accessible consumer-owned toolbars with QalmaToolbar, QalmaCommand, and controller state.
---

# Toolbar

Qalma provides a small structural toolbar primitive and a command directive. It
does not provide toolbar layouts, icons, menus, or visual variants. Your app
chooses those pieces.

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
  selector: 'app-basic-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QalmaEditor, QalmaContent, QalmaToolbar, QalmaCommand],
  template: `
    <qalma-editor [editor]="editor">
      <qalma-toolbar label="Formatting">
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
export class BasicToolbar {
  protected readonly editor = createQalmaEditor({
    plugins: [HeadingsPlugin, ...TextFormattingKit, HistoryPlugin],
  });
}
```

## QalmaToolbar

`&lt;qalma-toolbar&gt;` projects your controls and adds:

| Attribute | Value |
| --------- | ----- |
| CSS class | `qalma-toolbar` |
| `role` | `toolbar` |
| `aria-label` | `label()` input, defaulting to `Editor toolbar` |

Use the `label` input when a page has more than one toolbar or when a more
specific label helps screen-reader users.

```html
<qalma-toolbar label="Block formatting">
  <button type="button" qalmaCommand="toggleBulletList">Bullet list</button>
</qalma-toolbar>
```

## QalmaCommand

`button[qalmaCommand]` must be inside `&lt;qalma-editor&gt;` so it can read the
controller from context.

```html
<button
  type="button"
  qalmaCommand="setTextColor"
  [qalmaCommandValue]="'rgb(67, 56, 202)'"
>
  Indigo
</button>
```

The directive handles selection preservation, disabled state, active class, and
`aria-pressed` for commands that expose active state. Style
`.qalma-command-active` from your app.

```css
.toolbar button.qalma-command-active {
  border-color: var(--accent);
  background: var(--accent-subtle);
}
```

## Custom controls

Not every control should use `qalmaCommand`. Inputs, selects, upload buttons,
popover triggers, and color swatches often need command values or extra app
state. Use the controller directly for those.

```typescript
readonly codeBlockLanguage = computed(
  () => this.editor.query<string>('codeBlockLanguage') ?? 'plaintext',
);

setCodeBlockLanguage(event: Event): void {
  const target = event.target;

  if (target instanceof HTMLSelectElement) {
    this.editor.execute('setCodeBlockLanguage', target.value);
  }
}
```

```html
<select
  [value]="codeBlockLanguage()"
  (change)="setCodeBlockLanguage($event)"
  aria-label="Code block language"
>
  <option value="plaintext">Plain text</option>
  <option value="typescript">TypeScript</option>
</select>
```

## Complex toolbar UI

The docs playground toolbar is intentionally app code. It uses icons, Tailwind
classes, color swatches, an image upload input, a link popover trigger, and a
language select. Those controls call the same public API:

```typescript
protected setTextColor(color: string): void {
  this.editor().execute('setTextColor', color);
}

protected canSetTextColor(color: string): boolean {
  return this.editor().canExecute('setTextColor', color);
}

protected isTextColorActive(color: string): boolean {
  return this.editor().query<string>('textColor') === color;
}
```

When you use a component system such as Spartan/helm or another shadcn-style
set of primitives, keep it in the application layer. Qalma's library primitives
stay unstyled so the same editor can fit any design system.
