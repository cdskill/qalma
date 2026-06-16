---
title: Task List
description: Add checked and unchecked task items with consumer-owned checkbox styling.
---

# Task List

`TaskListPlugin` adds `taskList` and `taskItem` nodes. It serializes to
`&lt;ul data-type="task-list"&gt;` and
`&lt;li data-type="task-item"&gt;`, with a checked state stored on each task
item.

```typescript
import { QalmaCommand, QalmaContent, QalmaEditor, QalmaToolbar, TaskListPlugin, createQalmaEditor } from '@qalma/editor';

const editor = createQalmaEditor({
  plugins: [TaskListPlugin],
});
```

## Commands

| Command                 | Description                                                                   |
| ----------------------- | ----------------------------------------------------------------------------- |
| `toggleTaskList`        | Wraps the selection in a task list or lifts the current task item out of one. |
| `toggleTaskItemChecked` | Toggles the checked state of the current task item.                           |
| `setTaskItemChecked`    | Sets the current task item checked state from a boolean command value.        |
| `splitTaskItem`         | Splits the current task item and starts the new item unchecked.               |
| `liftTaskItem`          | Lifts the current task item up one nesting level.                             |
| `sinkTaskItem`          | Nests the current task item one level deeper.                                 |

```html
<qalma-editor [editor]="editor">
  <qalma-toolbar label="Tasks">
    <button type="button" qalmaCommand="toggleTaskList">Tasks</button>
    <button type="button" qalmaCommand="toggleTaskItemChecked">Toggle checked</button>
  </qalma-toolbar>

  <qalma-content class="block min-h-40 p-4 [&_.ProseMirror]:outline-none" />
</qalma-editor>
```

## Query

Use the `taskItem` query when custom UI needs the checked state for the current
item.

```typescript
import { TaskItemState } from '@qalma/editor';

const taskItem = editor.query<TaskItemState>('taskItem');
const checked = taskItem?.checked ?? false;
```

## Keyboard and checkbox behavior

Inside a task item, `Enter` splits the item, `Tab` nests it, and `Shift+Tab`
lifts it. These behaviors are scoped to task items so the plugin can be used
alongside `ListsPlugin` without shortcut-name collisions.

The rendered checkbox updates the document state when clicked. Styling remains
the consuming app's responsibility; target the serialized attributes in your
CSS.

```css
qalma-content .ProseMirror ul[data-type='task-list'] {
  padding-left: 0;
  list-style: none;
}

qalma-content .ProseMirror li[data-type='task-item'] {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  column-gap: 0.5rem;
}
```
