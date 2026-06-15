---
title: Blockquote
description: Add quote blocks with BlockquotePlugin and the toggleBlockquote command.
---

# Blockquote

`BlockquotePlugin` adds a `blockquote` block node and one command:
`toggleBlockquote`.

```typescript
import {
  BlockquotePlugin,
  QalmaCommand,
  QalmaContent,
  QalmaEditor,
  QalmaToolbar,
  createQalmaEditor,
} from '@qalma/editor';

const editor = createQalmaEditor({
  content: '<p>Select a paragraph and turn it into a quote.</p>',
  plugins: [BlockquotePlugin],
});
```

## Command

| Command | Description |
| ------- | ----------- |
| `toggleBlockquote` | Wraps the selection in a blockquote, or lifts it out when already inside one. |

```html
<qalma-editor [editor]="editor">
  <qalma-toolbar label="Blocks">
    <button type="button" qalmaCommand="toggleBlockquote">Quote</button>
  </qalma-toolbar>

  <qalma-content class="block min-h-40 p-4 [&_.ProseMirror]:outline-none" />
</qalma-editor>
```

The command uses ProseMirror's wrapping and lifting behavior. It returns
`false` when the current selection cannot be wrapped or lifted.

## Active state

`toggleBlockquote` is active when the selection is inside a blockquote at any
ancestor depth.

```typescript
readonly quoteActive = computed(() =>
  this.editor.isCommandActive('toggleBlockquote'),
);
```

`button[qalmaCommand]` uses the same state for `.qalma-command-active` and
`aria-pressed`.

## Styling

The plugin serializes to `&lt;blockquote&gt;`. The library does not style it.

```css
qalma-content .ProseMirror blockquote {
  border-left: 4px solid var(--accent);
  margin: 1rem 0;
  padding-left: 1rem;
  color: var(--muted-foreground);
}
```
