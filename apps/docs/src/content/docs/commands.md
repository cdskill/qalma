---
title: Commands
description: Execute Qalma commands from Angular templates, imperative code, and custom controls.
---

# Commands

Commands are named operations registered by plugins. They are the main bridge
between consumer-owned UI and the editor state.

```typescript
editor.execute('toggleBold');
editor.execute('toggleHeading2');
editor.execute('setTextColor', 'rgb(190, 18, 60)');
```

`execute(commandName, value?)` returns a boolean. It returns `false` when the
editor is read-only, the command is not registered, the view is not mounted, or
the command cannot apply to the current selection.

## Template buttons

For ordinary buttons inside `&lt;qalma-editor&gt;`, use `qalmaCommand`.

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HistoryPlugin, QalmaCommand, QalmaContent, QalmaEditor, QalmaToolbar, TextFormattingKit, createQalmaEditor } from '@qalma/editor';

@Component({
  selector: 'app-command-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QalmaEditor, QalmaContent, QalmaToolbar, QalmaCommand],
  template: `
    <qalma-editor [editor]="editor">
      <qalma-toolbar>
        <button type="button" qalmaCommand="toggleBold">Bold</button>
        <button type="button" qalmaCommand="toggleItalic">Italic</button>
        <button type="button" qalmaCommand="undo">Undo</button>
        <button type="button" qalmaCommand="redo">Redo</button>
      </qalma-toolbar>

      <qalma-content class="block min-h-40 p-4 [&_.ProseMirror]:outline-none" />
    </qalma-editor>
  `,
})
export class CommandEditor {
  protected readonly editor = createQalmaEditor({
    plugins: [...TextFormattingKit, HistoryPlugin],
  });
}
```

The directive:

| Behavior       | Detail                                                             |
| -------------- | ------------------------------------------------------------------ |
| Click          | Calls `editor.execute(command, qalmaCommandValue)`.                |
| Mouse down     | Prevents default so the editor selection is not lost before click. |
| Disabled state | Binds `[disabled]` to `!editor.canExecute(...)`.                   |
| Active class   | Adds `.qalma-command-active` from `editor.isCommandActive(...)`.   |
| `aria-pressed` | Set only when the command has a command-state query.               |

## Command values

Some commands need a value. Pass it with `[qalmaCommandValue]` when the value is
static or can be computed in the template.

```html
<button type="button" qalmaCommand="toggleHeading2">H2</button>

<button type="button" qalmaCommand="setTextColor" [qalmaCommandValue]="'rgb(190, 18, 60)'">Rose</button>

<button type="button" qalmaCommand="setLink" [qalmaCommandValue]="{ href: 'https://angular.dev', target: '_blank' }">Angular</button>
```

For controls such as color swatches, URL forms, file uploads, and selects,
imperative calls are usually clearer:

```typescript
setCodeBlockLanguage(event: Event): void {
  const target = event.target;

  if (target instanceof HTMLSelectElement) {
    this.editor.execute('setCodeBlockLanguage', target.value);
  }
}
```

## Command state

Use `canExecute()` and `isCommandActive()` when you build controls that are not
native `button[qalmaCommand]`.

```typescript
readonly linkActive = computed(() =>
  this.editor.isCommandActive('setLink'),
);

readonly canSetLink = computed(() =>
  this.editor.canExecute('setLink', 'https://angular.dev'),
);
```

`isCommandActive()` is backed by plugin-provided command-state queries. The
formatting, inline code, monospace, heading, list, task list, blockquote, code
block, link, image, color, highlight, subscript, superscript, and text-align
plugins expose active state for their relevant commands.

## Core command reference

| Plugin                       | Commands                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `TextFormattingKit`          | `toggleBold`, `toggleItalic`, `toggleUnderline`, `toggleStrike`                                                  |
| `InlineCodePlugin`           | `toggleInlineCode`                                                                                               |
| `MonospacePlugin`            | `toggleMonospace`                                                                                                |
| `SubscriptSuperscriptPlugin` | `toggleSubscript`, `toggleSuperscript`                                                                           |
| `HeadingsPlugin`             | `setParagraph`, `toggleHeading1` through configured heading levels                                               |
| `ListsPlugin`                | `toggleBulletList`, `toggleOrderedList`, `splitListItem`, `liftListItem`, `sinkListItem`                         |
| `TaskListPlugin`             | `toggleTaskList`, `toggleTaskItemChecked`, `setTaskItemChecked`, `splitTaskItem`, `liftTaskItem`, `sinkTaskItem` |
| `BlockquotePlugin`           | `toggleBlockquote`                                                                                               |
| `CodeBlockPlugin`            | `toggleCodeBlock`, `setCodeBlockLanguage`                                                                        |
| `LinkPlugin`                 | `setLink`, `selectLink`, `unsetLink`                                                                             |
| `ImagePlugin`                | `insertImage`, `updateImage`, `removeImage`                                                                      |
| `MentionPlugin`              | `insertMention`                                                                                                  |
| `SlashCommandPlugin`         | `deleteSlashCommand`, `dismissSlashCommand`, `splitSlashCommandBlock`                                            |
| `ColorPlugin`                | `setTextColor`, `unsetTextColor`, `setBackgroundColor`, `unsetBackgroundColor`                                   |
| `HighlightPlugin`            | `setHighlight`, `unsetHighlight`                                                                                 |
| `TextAlignPlugin`            | `setTextAlignLeft`, `setTextAlignCenter`, `setTextAlignRight`, `setTextAlignJustify`                             |
| `ClearFormattingPlugin`      | `clearFormatting`                                                                                                |
| `HardBreakPlugin`            | `insertHardBreak`                                                                                                |
| `HistoryPlugin`              | `undo`, `redo`                                                                                                   |

## Duplicate names

Qalma builds one command registry per editor. If two plugins define the same
command name, controller creation throws. The same uniqueness rule applies to
command-state names, query names, and shortcuts.
