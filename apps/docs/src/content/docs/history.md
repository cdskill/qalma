---
title: History (Undo/Redo)
description: Add undo and redo behavior with HistoryPlugin commands, shortcuts, and history options.
---

# History (Undo/Redo)

`HistoryPlugin` wraps ProseMirror history and registers undo/redo commands.

```typescript
import {
  HistoryPlugin,
  QalmaCommand,
  QalmaToolbar,
  createQalmaEditor,
} from '@qalma/editor';

const editor = createQalmaEditor({
  plugins: [
    HistoryPlugin.configure({
      depth: 200,
      newGroupDelay: 750,
    }),
  ],
});
```

## Commands and shortcuts

| Command | Description | Shortcut |
| ------- | ----------- | -------- |
| `undo` | Reverts the previous history event. | `Mod-z` |
| `redo` | Reapplies the next history event. | `Shift-Mod-z`, `Mod-y` |

```html
<qalma-toolbar label="History">
  <button type="button" qalmaCommand="undo">Undo</button>
  <button type="button" qalmaCommand="redo">Redo</button>
</qalma-toolbar>
```

The plugin does not expose command-state queries. `QalmaCommand` still disables
the buttons through `canExecute()`, but it does not set `aria-pressed`.

## Options

| Option | Default | Validation |
| ------ | ------- | ---------- |
| `depth` | `100` | Positive integer. |
| `newGroupDelay` | `500` | Non-negative finite number. |

`depth` controls how many history events ProseMirror keeps. `newGroupDelay`
controls how close transactions must be in time to be grouped together.

## Programmatic usage

Use the controller when you need custom history controls.

```typescript
readonly canUndo = computed(() => this.editor.canExecute('undo'));
readonly canRedo = computed(() => this.editor.canExecute('redo'));

undo(): void {
  this.editor.execute('undo');
}

redo(): void {
  this.editor.execute('redo');
}
```

## Automatic transactions

Some plugins mark maintenance transactions outside the undo stack. For example,
`TrailingParagraphPlugin` inserts its automatic final paragraph with
`addToHistory: false`, so undo stays focused on user edits.
