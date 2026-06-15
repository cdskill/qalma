---
title: Text Align
description: Add alignment attributes and commands to paragraphs, headings, list items, and blockquotes.
---

# Text Align

`TextAlignPlugin` extends configured nodes with a `textAlign` attribute and
adds alignment commands.

```typescript
import {
  BlockquotePlugin,
  HeadingsPlugin,
  ListsPlugin,
  TextAlignPlugin,
  createQalmaEditor,
} from '@qalma/editor';

const editor = createQalmaEditor({
  plugins: [HeadingsPlugin, ListsPlugin, BlockquotePlugin, TextAlignPlugin],
});
```

The plugin can extend only nodes that exist in the editor schema. For example,
`heading` alignment works when `HeadingsPlugin` is present.

## Commands and query

| Contract | Description |
| -------- | ----------- |
| `setTextAlignLeft` | Clears the `textAlign` attribute, making the node resolve as left-aligned. |
| `setTextAlignCenter` | Sets `textAlign: 'center'`. |
| `setTextAlignRight` | Sets `textAlign: 'right'`. |
| `setTextAlignJustify` | Sets `textAlign: 'justify'`. |
| `query&lt;TextAlignment&gt;('textAlign')` | Returns the active alignment, usually `'left'`, or `null` when no configured target is selected. |

```html
<qalma-toolbar label="Alignment">
  <button type="button" qalmaCommand="setTextAlignLeft">Left</button>
  <button type="button" qalmaCommand="setTextAlignCenter">Center</button>
  <button type="button" qalmaCommand="setTextAlignRight">Right</button>
  <button type="button" qalmaCommand="setTextAlignJustify">Justify</button>
</qalma-toolbar>
```

All configured alignment commands expose active state, so `qalmaCommand`
applies `.qalma-command-active` and `aria-pressed`.

## Options

```typescript
const editor = createQalmaEditor({
  plugins: [
    HeadingsPlugin,
    TextAlignPlugin.configure({
      alignments: ['left', 'center', 'right'],
      nodes: ['paragraph', 'heading'],
    }),
  ],
});
```

| Option | Default | Supported values |
| ------ | ------- | ---------------- |
| `alignments` | `['left', 'center', 'right', 'justify']` | `left`, `center`, `right`, `justify` |
| `nodes` | `['paragraph', 'heading', 'listItem', 'blockquote']` | `paragraph`, `heading`, `listItem`, `blockquote` |

Both arrays must be non-empty, contain only supported values, and contain no
duplicates.

## Selection behavior

When the selection is collapsed, Qalma aligns the closest configured node around
the cursor. When a range is selected, it collects configured textblock targets
across the selection and updates each one.

```typescript
readonly textAlign = computed(
  () => this.editor.query<'left' | 'center' | 'right' | 'justify'>('textAlign'),
);
```

## Serialization

Left alignment serializes as no style. Other alignments add
`style="text-align: ..."` to the node's DOM output.

```html
<h2 style="text-align: center;">Centered heading</h2>
<p>Left paragraph without a text-align style.</p>
```
