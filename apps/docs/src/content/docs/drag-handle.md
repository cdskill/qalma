---
title: Drag Handle
description: Build consumer-owned block handles from DragHandlePlugin metadata and block action commands.
---

# Drag Handle

`DragHandlePlugin` gives Angular UI enough headless block metadata to render a
Notion-style handle beside top-level blocks. It does not render the handle,
menu, icons, or drag UI.

```typescript
import { DragHandlePlugin, createQalmaEditor } from '@qalma/editor';

const editor = createQalmaEditor({
  plugins: [DragHandlePlugin],
});
```

## Public API

| Contract                                      | Description                                                         |
| --------------------------------------------- | ------------------------------------------------------------------- |
| `query&lt;DragHandleState&gt;('dragHandle')` | Returns the current top-level block for the editor selection.       |
| `selectBlock`                                 | Selects a target top-level block.                                   |
| `deleteBlock`                                 | Deletes a target block, keeping a valid empty paragraph if needed.  |
| `duplicateBlock`                              | Duplicates a target block after itself.                             |
| `moveBlockTo`                                 | Moves a target block to a top-level drop boundary.                  |
| `moveBlockUp`                                 | Moves a target block before its previous top-level sibling.         |
| `moveBlockDown`                               | Moves a target block after its next top-level sibling.              |

The commands accept a Qalma-owned target object:

```typescript
editor.execute('moveBlockUp', { pos: 12 });
editor.execute('moveBlockTo', { pos: 12, targetPos: 42 });
```

`moveBlockTo` needs both `pos` and `targetPos`. The `targetPos` value is a
top-level document boundary, such as another block's
`data-qalma-drag-handle-pos` for "drop before" or
`data-qalma-drag-handle-to` for "drop after".

For the other commands, if no value is provided, Qalma uses the top-level block
containing the current selection.

## Block Metadata

The plugin adds data attributes to top-level block DOM nodes through
ProseMirror decorations:

```html
<p
  data-qalma-drag-handle-block
  data-qalma-drag-handle-pos="0"
  data-qalma-drag-handle-to="7"
  data-qalma-drag-handle-type="paragraph"
>
  Hello
</p>
```

Consumer UI can read `data-qalma-drag-handle-pos` and
`data-qalma-drag-handle-to` and pass them to the commands:

```typescript
function moveHoveredBlockUp(block: HTMLElement) {
  const pos = Number(block.dataset['qalmaDragHandlePos']);

  if (Number.isInteger(pos)) {
    editor.execute('moveBlockUp', { pos });
  }
}

function dropHoveredBlockAfter(source: HTMLElement, target: HTMLElement) {
  const pos = Number(source.dataset['qalmaDragHandlePos']);
  const targetPos = Number(target.dataset['qalmaDragHandleTo']);

  if (Number.isInteger(pos) && Number.isInteger(targetPos)) {
    editor.execute('moveBlockTo', { pos, targetPos });
  }
}
```

## Consumer UI Pattern

Attach a directive or controller to your `&lt;qalma-content&gt;` host. A common
pattern is to listen for pointer movement, find the closest
`[data-qalma-drag-handle-block]`, render your own floating handle, then start a
pointer drag from that handle. While dragging, highlight the source block, draw
an insertion line at the nearest top-level boundary, and call `moveBlockTo` on
drop.

```html
<qalma-editor [editor]="editor">
  <qalma-content appBlockHandle [editor]="editor" />

  @if (blockHandle(); as handle) {
    <button
      type="button"
      class="block-handle"
      [style.transform]="handle.transform"
      (mousedown)="$event.preventDefault()"
      (click)="editor.execute('selectBlock', handle.target)"
    >
      Handle
    </button>
  }
</qalma-editor>
```

The docs playground uses this same public API with a Spartan/helm-style handle,
action menu, dragged-block highlight, and insertion line. The editor library
stays responsible only for the block metadata and commands.
