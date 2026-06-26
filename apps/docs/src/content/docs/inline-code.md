---
title: Inline Code
description: Add semantic inline code marks with a toolbar command, Mod-e shortcut, and Markdown-style backtick input rule.
---

# Inline Code

`InlineCodePlugin` adds a semantic `code` mark for snippets inside paragraphs,
list items, headings, and other inline-content blocks. It serializes to
`&lt;code&gt;...&lt;/code&gt;` and stays fully headless: your Angular app owns the
button, icon, menu item, and styling.

For typography-only monospace text, use `MonospacePlugin` instead. Inline code
keeps code semantics, `Mod-e`, and the optional single-backtick input rule.

```typescript
import { InlineCodePlugin, QalmaCommand, QalmaContent, QalmaEditor, QalmaToolbar, createQalmaEditor } from '@qalma/editor';

const editor = createQalmaEditor({
  content: '<p>Use <code>createQalmaEditor</code> to start.</p>',
  plugins: [InlineCodePlugin],
});
```

## Commands And Shortcuts

| Contract           | Description                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `toggleInlineCode` | Toggles the `code` mark across the current selection, or stores it for future typed text when the selection is collapsed. |
| `Mod-e`            | Runs `toggleInlineCode`.                                                                                                  |
| `` `code` ``       | With input rules enabled, typing matching single backticks converts the wrapped text to inline code.                      |

The command exposes command-state support, so `qalmaCommand` adds
`.qalma-command-active` and `aria-pressed` when the current selection has inline
code.

```html
<qalma-editor [editor]="editor">
  <qalma-toolbar label="Inline formatting">
    <button type="button" qalmaCommand="toggleInlineCode">Code</button>
  </qalma-toolbar>

  <qalma-content class="block min-h-40 p-4 [&_.ProseMirror]:outline-none" />
</qalma-editor>
```

## Options

`InlineCodePlugin` is configurable:

```typescript
InlineCodePlugin.configure({
  inputRules: false,
});
```

| Option       | Default | Description                             |
| ------------ | ------- | --------------------------------------- |
| `inputRules` | `true`  | Enables the single-backtick input rule. |

## Slash Menus

Slash menus stay consumer-owned. If your menu includes inline commands, apply
them without splitting the block:

```typescript
function pickInlineCode() {
  if (editor.execute('deleteSlashCommand')) {
    editor.execute('toggleInlineCode');
  }
}
```

For block commands such as headings or code blocks, you can still run
`splitSlashCommandBlock` before executing the selected command.

## Styling

The plugin does not ship CSS. Style inline code inside your content surface:

```css
qalma-content .ProseMirror :not(pre) > code {
  border-radius: 0.25rem;
  background: var(--muted);
  padding: 0.125rem 0.3rem;
  font-family: var(--font-mono);
}
```
