---
title: Table
description: Insert and edit resizable tables with TablePlugin, header cells, cell navigation, and structural commands.
---

# Table

`TablePlugin` adds `table`, `table_row`, `table_cell`, and `table_header` nodes
backed by [`prosemirror-tables`](https://github.com/ProseMirror/prosemirror-tables),
plus commands to insert and edit tables. Cells hold block content, so
paragraphs, lists, and headings can live inside them.

```typescript
import { TablePlugin, createQalmaEditor } from '@qalma/editor';

const editor = createQalmaEditor({
  plugins: [TablePlugin],
});
```

Tables are headless: Qalma renders plain `<table>` markup and ships no CSS. See
[Styling](#styling) for the styles the editing affordances need.

## Defaults

| Option | Default |
| ------ | ------- |
| `resizable` | `true` |
| `defaultRows` | `3` |
| `defaultColumns` | `3` |
| `defaultWithHeaderRow` | `true` |

```typescript
const editor = createQalmaEditor({
  plugins: [
    TablePlugin.configure({
      resizable: false,
      defaultRows: 2,
      defaultColumns: 4,
      defaultWithHeaderRow: false,
    }),
  ],
});
```

| Validation | Error condition |
| ---------- | --------------- |
| `resizable` must be a boolean | Non-boolean value. |
| `defaultWithHeaderRow` must be a boolean | Non-boolean value. |
| `defaultRows` must be an integer ≥ 1 | Non-integer or less than 1. |
| `defaultColumns` must be an integer ≥ 1 | Non-integer or less than 1. |

## Commands

| Command | Description |
| ------- | ----------- |
| `insertTable` | Inserts a table at the selection and places the cursor in the first cell. |
| `addRowBefore`, `addRowAfter` | Adds a row relative to the selected cell. |
| `addColumnBefore`, `addColumnAfter` | Adds a column relative to the selected cell. |
| `deleteRow`, `deleteColumn` | Removes the row or column at the selection. |
| `deleteTable` | Removes the whole table. |
| `mergeCells`, `splitCell` | Merges the selected cells or splits a merged cell. |
| `toggleHeaderRow`, `toggleHeaderColumn`, `toggleHeaderCell` | Toggles header cells for the row, column, or cell. |

Every command except `insertTable` returns `false` when the selection is not
inside a table, so toolbar buttons can use `canExecute` to enable themselves.

```html
<button type="button" qalmaCommand="insertTable">Table</button>
<button type="button" qalmaCommand="addRowAfter">Add row</button>
<button type="button" qalmaCommand="deleteTable">Delete table</button>
```

### Sizing insertTable

`insertTable` uses the plugin defaults, or a value that overrides any of them:

```typescript
editor.execute('insertTable', { rows: 4, columns: 2, withHeaderRow: false });
```

`rows` and `columns` are clamped to a minimum of `1`; omitted fields fall back to
`defaultRows`, `defaultColumns`, and `defaultWithHeaderRow`.

## Cell navigation

`Tab` moves to the next cell and `Shift-Tab` to the previous one. These keys are
bound only while the selection is inside a table, so outside a table they fall
through to other plugins (for example list indentation).

## Column resizing

When `resizable` is `true`, columns can be resized by dragging their right
border. This installs the `prosemirror-tables` column-resizing node view and
adds a `column-resize-handle` element you style yourself.

## isInTable query

Use the `isInTable` query to drive contextual UI, such as showing table controls
only when the cursor is inside a table.

```typescript
readonly inTable = computed(() => this.editor.query<boolean>('isInTable'));
```

## Styling

`prosemirror-tables` ships no styles. At a minimum, give the editor borders, a
header treatment, the selected-cell highlight, and the resize handle:

```css
.ProseMirror table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

.ProseMirror th,
.ProseMirror td {
  position: relative;
  border: 1px solid var(--border);
  padding: 0.45rem 0.6rem;
  vertical-align: top;
}

.ProseMirror th {
  background-color: var(--muted);
  font-weight: 600;
  text-align: left;
}

.ProseMirror .selectedCell::after {
  content: '';
  position: absolute;
  inset: 0;
  background-color: var(--accent-subtle);
  pointer-events: none;
}

.ProseMirror .column-resize-handle {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 2px;
  background-color: var(--accent);
  pointer-events: none;
}
```

The `.column-resize-handle` must stay inside the cell (`right: 0`, not a negative
offset). A handle that overflows the last column adds a horizontal scrollbar to
the table wrapper, which shifts the layout while resizing.
