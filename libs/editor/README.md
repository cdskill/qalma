<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/cdskill/qalma/main/apps/docs/public/qalma-mark-dark.svg" />
    <img src="https://raw.githubusercontent.com/cdskill/qalma/main/apps/docs/public/qalma-mark-light.svg" alt="Qalma" width="56" height="56" />
  </picture>
</p>

# @qalma/editor

Angular-first, headless rich text editor toolkit built on [ProseMirror](https://prosemirror.net/).

Qalma gives you a typed editor controller, signal-based state, and a small set
of unstyled Angular primitives (`<qalma-editor>`, `<qalma-content>`,
`<qalma-toolbar>`, `qalmaCommand`). Everything else — toolbar UI, styling,
menus, popovers — stays in your app. You choose the plugins, you own the
markup.

> **Status:** alpha (`0.0.x`). The public API may still change between
> releases.

## Installation

```sh
npm install @qalma/editor
```

`@angular/core` `>=21 <22` is a peer dependency.

## Quick start

```ts
import { createQalmaEditor, HistoryPlugin, TextFormattingKit } from '@qalma/editor';

const editor = createQalmaEditor({
  content: '<p>Hello world</p>',
  plugins: [
    ...TextFormattingKit,
    HistoryPlugin.configure({
      depth: 200,
      newGroupDelay: 750,
    }),
  ],
});
```

```html
<qalma-editor [editor]="editor">
  <qalma-toolbar>
    <button qalmaCommand="toggleBold">Bold</button>
    <button qalmaCommand="undo">Undo</button>
    <button qalmaCommand="redo">Redo</button>
  </qalma-toolbar>

  <qalma-content />
</qalma-editor>
```

## Core concepts

### `createQalmaEditor(options)`

Builds a `QalmaEditorController`, the headless API your components bind to:

| Member                        | Description                                                            |
| ----------------------------- | ---------------------------------------------------------------------- |
| `html: Signal<string>`        | Serialized HTML of the current document, kept in sync with every edit. |
| `editable: Signal<boolean>`   | Whether the document can be edited.                                    |
| `execute(command, value?)`    | Runs a registered command, e.g. `editor.execute('toggleBold')`.        |
| `canExecute(command, value?)` | Whether a command would currently succeed.                             |
| `isCommandActive(command)`    | Whether a toggleable command is active for the current selection.      |
| `query<T>(name)`              | Reads plugin-provided state, e.g. the link or image under the cursor.  |
| `setHtml(html)`               | Replaces the document content.                                         |
| `setEditable(editable)`       | Toggles editability at runtime.                                        |
| `focus()`                     | Focuses the editor view.                                               |

`options.content` accepts an initial HTML string, and `options.plugins`
accepts the list of `QalmaPlugin`s that define the schema, commands, and
behavior available to the editor.

### Components and directives

- `<qalma-editor [editor]="editor">` — root container that shares the
  controller with its content.
- `<qalma-content />` — mounts the ProseMirror view. Style its
  `.qalma-content` / `.ProseMirror` descendants from your app's CSS.
- `<qalma-toolbar>` — an accessible (`role="toolbar"`) wrapper for your
  toolbar controls. Purely structural.
- `button[qalmaCommand]` — binds a button to a command by name. It calls
  `execute()` on click, reflects `isCommandActive()` via
  `.qalma-command-active` and `aria-pressed`, and disables itself when
  `canExecute()` is false. Pass a command argument with `[qalmaCommandValue]`.

### Plugins and kits

A `QalmaPlugin` contributes schema nodes/marks, commands, command-state
queries, shortcuts, and ProseMirror plugins. A **kit** (e.g.
`TextFormattingKit`) is just a `readonly QalmaPlugin[]` bundling related
plugins — spread it into `plugins` like any other entry.

Configurable plugins expose a `.configure(options)` method that returns a new
plugin instance with merged options, e.g.
`HistoryPlugin.configure({ depth: 200 })`.

## Available plugins

| Plugin                                                                                | Commands                                                                                                                   |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `BoldPlugin`, `ItalicPlugin`, `UnderlinePlugin`, `StrikePlugin` (`TextFormattingKit`) | `toggleBold`, `toggleItalic`, `toggleUnderline`, `toggleStrike`                                                            |
| `InlineCodePlugin`                                                                    | `toggleInlineCode` (`Mod-e`, single-backtick input rule)                                                                   |
| `SubscriptSuperscriptPlugin`                                                          | `toggleSubscript`, `toggleSuperscript`                                                                                     |
| `HeadingsPlugin`                                                                      | `setParagraph`, `toggleHeading1`…`toggleHeading6` (configurable levels)                                                    |
| `BlockquotePlugin`                                                                    | `toggleBlockquote`                                                                                                         |
| `TablePlugin`                                                                         | `insertTable`, `addRow*`/`addColumn*`, `deleteRow`/`deleteColumn`/`deleteTable`, `mergeCells`/`splitCell`, `toggleHeader*` |
| `HorizontalRulePlugin`                                                                | `insertHorizontalRule`                                                                                                     |
| `ListsPlugin`                                                                         | `toggleBulletList`, `toggleOrderedList`, `splitListItem`, `liftListItem`, `sinkListItem`                                   |
| `TaskListPlugin`                                                                      | `toggleTaskList`, `toggleTaskItemChecked`, `setTaskItemChecked`, `splitTaskItem`, `liftTaskItem`, `sinkTaskItem`           |
| `CodeBlockPlugin`                                                                     | `toggleCodeBlock`, `setCodeBlockLanguage`                                                                                  |
| `LinkPlugin`                                                                          | `setLink`, `selectLink`, `unsetLink`                                                                                       |
| `ImagePlugin`                                                                         | `insertImage`, `updateImage`                                                                                               |
| `MentionPlugin`                                                                       | `insertMention`                                                                                                            |
| `SlashCommandPlugin`                                                                  | `deleteSlashCommand`, `dismissSlashCommand`                                                                                |
| `SelectionPlugin`                                                                     | None (`query('selection')`, `qalma-selection-update`)                                                                       |
| `ColorPlugin`                                                                         | `setTextColor`, `unsetTextColor`, `setBackgroundColor`, `unsetBackgroundColor`                                             |
| `HighlightPlugin`                                                                     | `setHighlight`, `unsetHighlight`                                                                                           |
| `TextAlignPlugin`                                                                     | alignment commands for configured node types                                                                               |
| `ClearFormattingPlugin`                                                               | `clearFormatting`                                                                                                          |
| `HardBreakPlugin`                                                                     | `insertHardBreak`                                                                                                          |
| `HistoryPlugin`                                                                       | `undo`, `redo` (`Mod-z`, `Shift-Mod-z`, `Mod-y`)                                                                           |
| `PasteRulesPlugin`                                                                    | normalizes pasted content                                                                                                  |
| `PlaceholderPlugin`                                                                   | shows placeholder text in an empty document                                                                                |
| `TrailingParagraphPlugin`                                                             | keeps a trailing empty paragraph at the end of the document                                                                |

Read each plugin's source under `src/lib/plugins` for configuration options
(e.g. `HeadingsPlugin.configure({ levels: [1, 2, 3] })`,
`InlineCodePlugin.configure({ inputRules: false })`,
`MentionPlugin.configure({ trigger: '@' })`,
`SlashCommandPlugin.configure({ trigger: '/' })`,
`LinkPlugin.configure({ allowedProtocols: [...], onClick })`).

## Learn more

`apps/sandbox` is a full working example: a toolbar, link popover, mention
menu, image upload, and code block highlighting, all built from the public
`@qalma/editor` API.

```sh
npx nx serve sandbox
```
