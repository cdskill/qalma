---
title: Plugins
description: Browse the first-party Qalma plugins, kits, commands, and UI responsibilities.
---

# Plugins

Qalma features are opt-in. Add plugins to `createQalmaEditor({ plugins })` to
contribute schema, commands, command state, queries, shortcuts, or ProseMirror
behavior.

Plugins describe editing capability, not presentation. Toolbars, popovers,
menus, and styling remain consumer-owned Angular code.

## Authoring Essentials

| Plugin                  | What it adds                          | Commands                                                                                                         |
| ----------------------- | ------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `TextFormattingKit`     | Bold, italic, underline, strike marks | `toggleBold`, `toggleItalic`, `toggleUnderline`, `toggleStrike`                                                  |
| `InlineCodePlugin`      | Semantic inline code mark             | `toggleInlineCode`                                                                                               |
| `HeadingsPlugin`        | Paragraph and heading blocks          | `setParagraph`, `toggleHeading1` through configured heading levels                                               |
| `ListsPlugin`           | Bullet and ordered lists              | `toggleBulletList`, `toggleOrderedList`, `splitListItem`, `liftListItem`, `sinkListItem`                         |
| `TaskListPlugin`        | Checked and unchecked task lists      | `toggleTaskList`, `toggleTaskItemChecked`, `setTaskItemChecked`, `splitTaskItem`, `liftTaskItem`, `sinkTaskItem` |
| `BlockquotePlugin`      | Quote blocks                          | `toggleBlockquote`                                                                                               |
| `CodeBlockPlugin`       | Code blocks with language metadata    | `toggleCodeBlock`, `setCodeBlockLanguage`                                                                        |
| `HistoryPlugin`         | Undo and redo stack                   | `undo`, `redo`                                                                                                   |
| `ClearFormattingPlugin` | Mark and block cleanup                | `clearFormatting`                                                                                                |

## Rich Content

| Plugin               | What it adds                                         | Commands                                                              |
| -------------------- | ---------------------------------------------------- | --------------------------------------------------------------------- |
| `LinkPlugin`         | Links with protocol validation                       | `setLink`, `selectLink`, `unsetLink`                                  |
| `ImagePlugin`        | Inline images with alt/title metadata                | `insertImage`, `updateImage`, `removeImage`                           |
| `MentionPlugin`      | Inline mention nodes and trigger state               | `insertMention`                                                       |
| `SlashCommandPlugin` | Slash trigger state for consumer-owned command menus | `deleteSlashCommand`, `dismissSlashCommand`, `splitSlashCommandBlock` |
| `DragHandlePlugin`   | Block metadata and action commands for custom handles | `selectBlock`, `deleteBlock`, `duplicateBlock`, `moveBlockTo`, `moveBlockUp`, `moveBlockDown` |

## Styling And Layout

| Plugin                       | What it adds                             | Commands                                                                             |
| ---------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------ |
| `ColorPlugin`                | Text and background color marks          | `setTextColor`, `unsetTextColor`, `setBackgroundColor`, `unsetBackgroundColor`       |
| `HighlightPlugin`            | Highlight mark                           | `setHighlight`, `unsetHighlight`                                                     |
| `SubscriptSuperscriptPlugin` | Subscript and superscript marks          | `toggleSubscript`, `toggleSuperscript`                                               |
| `TextAlignPlugin`            | Alignment attributes on configured nodes | `setTextAlignLeft`, `setTextAlignCenter`, `setTextAlignRight`, `setTextAlignJustify` |

## Editing Behavior

| Plugin                    | What it adds                                             | Commands          |
| ------------------------- | -------------------------------------------------------- | ----------------- |
| `HardBreakPlugin`         | Inline hard breaks                                       | `insertHardBreak` |
| `PasteRulesPlugin`        | Paste cleanup and autolink behavior                      | None              |
| `PlaceholderPlugin`       | Placeholder decorations for empty documents              | None              |
| `SelectionPlugin`         | Selection read model and update event for contextual UI  | None              |
| `TrailingParagraphPlugin` | Ensures a final editable paragraph after terminal blocks | None              |

## Configurable Plugins

Configurable plugins expose `.configure(options)` and return a new plugin
instance. The base plugin is not mutated.

```typescript
const editor = createQalmaEditor({
  plugins: [HeadingsPlugin.configure({ levels: [1, 2, 3] }), PlaceholderPlugin.configure({ placeholder: 'Start writing...' }), SlashCommandPlugin.configure({ trigger: '/' })],
});
```

Use the dedicated plugin pages for integration details such as public queries,
DOM events, keyboard behavior, and consumer-owned overlays.
