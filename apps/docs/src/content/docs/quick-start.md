---
title: Quick Start
description: Build a working Qalma editor — controller, toolbar, content surface, and live HTML output — in a few minutes.
---

# Quick Start

This guide builds a small but real editor: headings, text formatting, lists,
history, a toolbar wired to commands, and a live view of the serialized HTML.
It assumes you've finished [Installation](/docs/installation).

## 1. Create the controller

Everything starts with a `QalmaEditorController`, created by
`createQalmaEditor()`. You give it optional starting `content` and the list of
`plugins` to enable.

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  createQalmaEditor,
  HeadingsPlugin,
  HistoryPlugin,
  ListsPlugin,
  PlaceholderPlugin,
  TextFormattingKit,
} from '@qalma/editor';

@Component({
  selector: 'app-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: ``,
})
export class EditorComponent {
  protected readonly editor = createQalmaEditor({
    content: '<h2>Welcome</h2><p>Start typing to edit this document.</p>',
    plugins: [
      HeadingsPlugin,
      ...TextFormattingKit,
      ListsPlugin,
      HistoryPlugin,
      PlaceholderPlugin.configure({ placeholder: 'Start writing…' }),
    ],
  });
}
```

A few things to notice:

- `TextFormattingKit` is a bundle — it spreads into the bold, italic,
  underline and strike plugins.
- Configurable plugins expose `.configure(options)`, like
  `PlaceholderPlugin.configure({ placeholder: '…' })`. Calling it returns a new
  configured plugin; it never mutates the original.
- The controller is a plain object — create it as a field, no `inject()`
  needed.

## 2. Render the editor

`&lt;qalma-editor&gt;` takes the controller as an input and provides it to everything
projected inside it. `&lt;qalma-content&gt;` is the editable surface.

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  createQalmaEditor,
  HeadingsPlugin,
  HistoryPlugin,
  ListsPlugin,
  PlaceholderPlugin,
  QalmaContent,
  QalmaEditor,
  TextFormattingKit,
} from '@qalma/editor';

@Component({
  selector: 'app-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QalmaEditor, QalmaContent],
  template: `
    <qalma-editor [editor]="editor" class="block rounded-lg border">
      <qalma-content class="block min-h-48 p-4 [&_.ProseMirror]:outline-none" />
    </qalma-editor>
  `,
})
export class EditorComponent {
  protected readonly editor = createQalmaEditor({
    content: '<h2>Welcome</h2><p>Start typing to edit this document.</p>',
    plugins: [
      HeadingsPlugin,
      ...TextFormattingKit,
      ListsPlugin,
      HistoryPlugin,
      PlaceholderPlugin.configure({ placeholder: 'Start writing…' }),
    ],
  });
}
```

At this point you have a fully editable document. Typing, `Enter`, `Backspace`,
and the plugin shortcuts (`Cmd/Ctrl + B`, `Cmd/Ctrl + Z`, `Cmd/Ctrl + Alt + 2`
for H2…) all work already.

## 3. Add a toolbar

Toolbar buttons use the `qalmaCommand` directive. Put them **inside**
`&lt;qalma-editor&gt;` so they pick up the editor from context. Each button
auto-disables when its command can't run and gets a `.qalma-command-active`
class plus `aria-pressed` when the command is active — so you only style state,
never track it.

```html
<qalma-editor [editor]="editor" class="block rounded-lg border">
  <qalma-toolbar class="flex flex-wrap gap-1 border-b p-2">
    <button type="button" qalmaCommand="toggleHeading2">H2</button>
    <button type="button" qalmaCommand="toggleBold">Bold</button>
    <button type="button" qalmaCommand="toggleItalic">Italic</button>
    <button type="button" qalmaCommand="toggleBulletList">• List</button>
    <button type="button" qalmaCommand="toggleOrderedList">1. List</button>
    <button type="button" qalmaCommand="undo">Undo</button>
    <button type="button" qalmaCommand="redo">Redo</button>
  </qalma-toolbar>

  <qalma-content class="block min-h-48 p-4 [&_.ProseMirror]:outline-none" />
</qalma-editor>
```

Remember to add `QalmaToolbar` and `QalmaCommand` to the component's `imports`:

```typescript
imports: [QalmaEditor, QalmaContent, QalmaToolbar, QalmaCommand],
```

Style the active state however you like — for example, with Tailwind on the
button:

```html
<button
  type="button"
  qalmaCommand="toggleBold"
  class="rounded px-2 py-1 [&.qalma-command-active]:bg-accent-subtle"
>
  Bold
</button>
```

## 4. Read and react to content

The controller exposes the serialized document as the `html()` **signal**, so
you can bind it directly in a template and it updates as the user types:

```html
<pre class="mt-3 overflow-auto rounded bg-muted p-3 text-xs"><code>{{ editor.html() }}</code></pre>
```

Because it's a signal, it also composes with `computed()` and `effect()`:

```typescript
import { computed, effect } from '@angular/core';

protected readonly wordCount = computed(
  () => this.editor.html().replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length,
);

constructor() {
  effect(() => console.log('Document changed:', this.editor.html()));
}
```

## 5. Drive the editor from code

The controller has a small imperative API for the things you can't express as
toolbar buttons:

```typescript
// Run any command by name (returns true if it applied).
this.editor.execute('toggleBold');

// Replace the whole document.
this.editor.setHtml('<p>Loaded from the server.</p>');

// Toggle read-only mode.
this.editor.setEditable(false);

// Move focus into the editing surface.
this.editor.focus();

// Ask the editor a question (used by link/image/mention UIs).
const isBold = this.editor.isCommandActive('toggleBold');
const canUndo = this.editor.canExecute('undo');
```

## Command reference

These are the command names available from the plugins used above:

| Command            | Plugin            | Shortcut            |
| ------------------ | ----------------- | ------------------- |
| `setParagraph`     | `HeadingsPlugin`  | —                   |
| `toggleHeading1`   | `HeadingsPlugin`  | `Cmd/Ctrl + Alt + 1`|
| `toggleHeading2`   | `HeadingsPlugin`  | `Cmd/Ctrl + Alt + 2`|
| `toggleHeading3`   | `HeadingsPlugin`  | `Cmd/Ctrl + Alt + 3`|
| `toggleBold`       | `TextFormattingKit` | `Cmd/Ctrl + B`    |
| `toggleItalic`     | `TextFormattingKit` | `Cmd/Ctrl + I`    |
| `toggleUnderline`  | `TextFormattingKit` | `Cmd/Ctrl + U`    |
| `toggleStrike`     | `TextFormattingKit` | —                 |
| `toggleBulletList` | `ListsPlugin`     | —                   |
| `toggleOrderedList`| `ListsPlugin`     | —                   |
| `undo`             | `HistoryPlugin`   | `Cmd/Ctrl + Z`      |
| `redo`             | `HistoryPlugin`   | `Cmd/Ctrl + Shift + Z` |

## Next steps

- [Plugins](/docs/plugins) — add links, mentions, images, code blocks, color,
  text alignment and more.
- [Architecture](/docs/architecture) — how the controller, schema and plugins
  fit together under the hood.
- [Live Playground](/#playground) — a fully-featured editor you can read the
  source of.
