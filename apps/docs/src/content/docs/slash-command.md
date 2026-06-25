---
title: Slash Commands
description: Build a consumer-owned slash command menu from the headless SlashCommandPlugin state, commands, and keyboard events.
---

# Slash Commands

`SlashCommandPlugin` detects a `/query` typed at a block boundary and exposes
the range to your Angular UI. It does not render a menu. Your app decides which
commands to show, how to filter them, and what the overlay looks like.

```typescript
import { createQalmaEditor, HeadingsPlugin, ListsPlugin, SlashCommandPlugin } from '@qalma/editor';

const editor = createQalmaEditor({
  plugins: [HeadingsPlugin, ListsPlugin, SlashCommandPlugin],
});
```

## Public API

| Contract                                         | Description                                                                    |
| ------------------------------------------------ | ------------------------------------------------------------------------------ |
| `query&lt;SlashCommandState&gt;('slashCommand')` | Returns `{ from, to, query, trigger }` while a slash command is active.        |
| `deleteSlashCommand`                             | Deletes the active `/query` range before you execute the selected command.     |
| `dismissSlashCommand`                            | Closes the active slash command without changing document content.             |
| `splitSlashCommandBlock`                         | Splits a non-empty block before applying a picked command on its own line.     |
| `qalma-slash-command-update`                     | DOM event emitted from the editor view when the slash state may have changed.  |
| `qalma-slash-command-keydown`                    | Cancelable DOM event for `ArrowUp`, `ArrowDown`, `Enter`, `Tab`, and `Escape`. |

## Consumer Menu Pattern

Keep the menu in your app or docs playground. A typical selection flow is:

1. Read `editor.query&lt;SlashCommandState&gt;('slashCommand')`.
2. Filter your own command list with `state.query`.
3. Render an Angular overlay near `editor.getCoordinatesAtPosition(state.to)`.
4. On pick, run `editor.execute('deleteSlashCommand')`.
5. Optionally run `editor.execute('splitSlashCommandBlock')` for non-empty
   paragraphs when the selected command creates a block.
6. Run the selected command, such as `editor.execute('toggleHeading1')`.

```typescript
function pickHeading1() {
  if (editor.execute('deleteSlashCommand')) {
    editor.execute('splitSlashCommandBlock');
    editor.execute('toggleHeading1');
  }
}
```

Inline commands should stay at the slash position instead of splitting the
block:

```typescript
function pickInlineCode() {
  if (editor.execute('deleteSlashCommand')) {
    editor.execute('toggleInlineCode');
  }
}
```

## Options

`SlashCommandPlugin` is configurable:

```typescript
SlashCommandPlugin.configure({
  trigger: '/',
  minQueryLength: 0,
  maxQueryLength: 64,
});
```

| Option           | Default | Description                                           |
| ---------------- | ------- | ----------------------------------------------------- |
| `trigger`        | `'/'`   | Single non-whitespace character that starts the menu. |
| `minQueryLength` | `0`     | Minimum query length before state is exposed.         |
| `maxQueryLength` | `64`    | Maximum query length before the state is ignored.     |

Slash commands are ignored inside code blocks, inline code marks, and when the
selection is not collapsed.

## Playground

The live playground uses this plugin to offer text, headings, lists, quotes,
inline code, code blocks, dividers, and tables from a Notion-style menu. Its
menu is ordinary Angular code composed on top of `SlashCommandPlugin`, not
library-rendered UI.
