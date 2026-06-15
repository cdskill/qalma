---
title: Headings
description: Configure paragraph and heading commands, levels, shortcuts, and active state.
---

# Headings

`HeadingsPlugin` adds a `heading` block node and commands for paragraphs and
configured heading levels.

```typescript
import {
  HeadingsPlugin,
  QalmaCommand,
  QalmaContent,
  QalmaEditor,
  QalmaToolbar,
  createQalmaEditor,
} from '@qalma/editor';

const editor = createQalmaEditor({
  content: '<h2>Overview</h2><p>Write the body.</p>',
  plugins: [HeadingsPlugin],
});
```

## Defaults

By default, `HeadingsPlugin` enables heading levels 1, 2, and 3.

| Contract | Default |
| -------- | ------- |
| `levels` | `[1, 2, 3]` |
| Commands | `setParagraph`, `toggleHeading1`, `toggleHeading2`, `toggleHeading3` |
| Shortcuts | `Mod-Alt-1`, `Mod-Alt-2`, `Mod-Alt-3` |

```html
<qalma-editor [editor]="editor">
  <qalma-toolbar label="Blocks">
    <button type="button" qalmaCommand="setParagraph">Paragraph</button>
    <button type="button" qalmaCommand="toggleHeading1">H1</button>
    <button type="button" qalmaCommand="toggleHeading2">H2</button>
    <button type="button" qalmaCommand="toggleHeading3">H3</button>
  </qalma-toolbar>

  <qalma-content class="block min-h-40 p-4 [&_.ProseMirror]:outline-none" />
</qalma-editor>
```

## Configure levels

Use `.configure()` to expose a different subset of heading levels.

```typescript
const editor = createQalmaEditor({
  plugins: [
    HeadingsPlugin.configure({
      levels: [1, 2, 3, 4, 5, 6],
    }),
  ],
});
```

| Validation | Error condition |
| ---------- | --------------- |
| `levels` must be an array | Non-array value. |
| At least one level | Empty array. |
| Levels must be 1 through 6 | Unsupported entry. |
| Levels must be unique | Duplicate entry. |

Commands and shortcuts are created only for configured levels. If you configure
`levels: [2, 3]`, `toggleHeading1` is not registered.

## Toggle behavior

`toggleHeadingN` changes the current block to that heading level. If the same
heading level is already active, it changes the block back to a paragraph.

`setParagraph` returns `true` when the current parent is already a paragraph;
otherwise it tries to set the current textblock to the base paragraph node.

## Active state

All heading commands and `setParagraph` expose command-state queries.

```typescript
readonly h2Active = computed(() =>
  this.editor.isCommandActive('toggleHeading2'),
);
```

That active state powers `.qalma-command-active` and `aria-pressed` on
`button[qalmaCommand]`.
