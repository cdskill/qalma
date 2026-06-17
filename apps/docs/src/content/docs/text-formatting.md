---
title: Text Formatting
description: Enable bold, italic, underline, and strike formatting with TextFormattingKit or individual mark plugins.
---

# Text Formatting

`TextFormattingKit` bundles the four inline formatting plugins:
`BoldPlugin`, `ItalicPlugin`, `UnderlinePlugin`, and `StrikePlugin`.

```typescript
import {
  QalmaCommand,
  QalmaContent,
  QalmaEditor,
  QalmaToolbar,
  TextFormattingKit,
  createQalmaEditor,
} from '@qalma/editor';

const editor = createQalmaEditor({
  content: '<p>Select text and apply inline formatting.</p>',
  plugins: [...TextFormattingKit],
});
```

## Commands

| Command           | Mark        | Parses                                                                           | Serializes       | Shortcut |
| ----------------- | ----------- | -------------------------------------------------------------------------------- | ---------------- | -------- |
| `toggleBold`      | `strong`    | `&lt;strong&gt;`, `&lt;b&gt;`, and bold `font-weight` styles                     | `&lt;strong&gt;` | `Mod-b`  |
| `toggleItalic`    | `em`        | `&lt;em&gt;`, `&lt;i&gt;`, and `font-style: italic`                              | `&lt;em&gt;`     | `Mod-i`  |
| `toggleUnderline` | `underline` | `&lt;u&gt;` and underline `text-decoration`                                      | `&lt;u&gt;`      | `Mod-u`  |
| `toggleStrike`    | `strike`    | `&lt;s&gt;`, `&lt;strike&gt;`, `&lt;del&gt;`, and line-through `text-decoration` | `&lt;s&gt;`      | None     |

Each command has command-state support, so `qalmaCommand` adds
`.qalma-command-active` and `aria-pressed` when the current selection has the
mark.

```html
<qalma-editor [editor]="editor">
  <qalma-toolbar label="Inline formatting">
    <button type="button" qalmaCommand="toggleBold">Bold</button>
    <button type="button" qalmaCommand="toggleItalic">Italic</button>
    <button type="button" qalmaCommand="toggleUnderline">Underline</button>
    <button type="button" qalmaCommand="toggleStrike">Strike</button>
  </qalma-toolbar>

  <qalma-content class="block min-h-40 p-4 [&_.ProseMirror]:outline-none" />
</qalma-editor>
```

## Individual plugins

Use individual plugins when you want a narrower editor.

```typescript
import {
  BoldPlugin,
  ItalicPlugin,
  StrikePlugin,
  UnderlinePlugin,
  createQalmaEditor,
} from '@qalma/editor';

const editor = createQalmaEditor({
  plugins: [BoldPlugin, ItalicPlugin, UnderlinePlugin, StrikePlugin],
});
```

The kit is only a `readonly QalmaPlugin[]`. It does not add behavior beyond
spreading those four plugins into the editor.

For semantic inline snippets, add `InlineCodePlugin` separately. It exposes
`toggleInlineCode`, `Mod-e`, and the single-backtick input rule documented on
the Inline Code page.

## Styling

The plugin serializes semantic inline tags. It does not ship CSS. Most browsers
style these tags by default, but your product can override them inside the
content surface.

```css
qalma-content .ProseMirror strong {
  font-weight: 700;
}

qalma-content .ProseMirror s {
  text-decoration-thickness: 0.08em;
}
```

## Interaction notes

When the selection is collapsed, ProseMirror stores the toggled mark for future
typing. When a range is selected, the command adds or removes the mark across
the selected inline content.
