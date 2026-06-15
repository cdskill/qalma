---
title: Lists
description: Add bullet lists, ordered lists, list item splitting, indentation, shortcuts, and focus escape behavior.
---

# Lists

`ListsPlugin` adds `bulletList`, `orderedList`, and `listItem` nodes.

```typescript
import {
  ListsPlugin,
  QalmaCommand,
  QalmaContent,
  QalmaEditor,
  QalmaToolbar,
  createQalmaEditor,
} from '@qalma/editor';

const editor = createQalmaEditor({
  plugins: [ListsPlugin],
});
```

## Commands

| Command | Description | Shortcut |
| ------- | ----------- | -------- |
| `toggleBulletList` | Wraps the selection in a bullet list, lifts out of a bullet list, or converts the closest ordered list to a bullet list. | `Mod-Shift-8` |
| `toggleOrderedList` | Wraps the selection in an ordered list, lifts out of an ordered list, or converts the closest bullet list to an ordered list. | `Mod-Shift-7` |
| `splitListItem` | Splits the current list item while keeping active marks. | `Enter` |
| `liftListItem` | Lifts the current list item up one nesting level. | `Shift-Tab` |
| `sinkListItem` | Nests the current list item one level deeper. | `Tab` |

```html
<qalma-editor [editor]="editor">
  <qalma-toolbar label="Lists">
    <button type="button" qalmaCommand="toggleBulletList">Bullets</button>
    <button type="button" qalmaCommand="toggleOrderedList">Numbers</button>
    <button type="button" qalmaCommand="liftListItem">Outdent</button>
    <button type="button" qalmaCommand="sinkListItem">Indent</button>
  </qalma-toolbar>

  <qalma-content class="block min-h-40 p-4 [&_.ProseMirror]:outline-none" />
</qalma-editor>
```

## Active state

`toggleBulletList` is active when the closest list around the selection is a
bullet list. `toggleOrderedList` is active when the closest list is an ordered
list.

```typescript
readonly inList = computed(
  () =>
    this.editor.isCommandActive('toggleBulletList') ||
    this.editor.isCommandActive('toggleOrderedList'),
);
```

The indentation commands do not expose active state; use `canExecute()` when
you need custom disabled state.

## Keyboard behavior

The plugin registers a small accessibility behavior for `Escape`. When focus is
inside the editor and the user presses `Escape`, Qalma looks for the next
focusable element outside the editor. With `Shift+Escape`, it looks backward.
If no adjacent focusable element exists, it blurs the editor.

This behavior is especially useful when a long list has focus and the next
toolbar or form control is outside the editor surface.

## Schema notes

`listItem` content is `paragraph block*`, matching the ProseMirror list schema
shape used by the plugin. Ordered lists are serialized as `&lt;ol&gt;`, bullet lists
as `&lt;ul&gt;`, and list items as `&lt;li&gt;`.
