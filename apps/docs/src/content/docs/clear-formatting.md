---
title: Clear Formatting
description: Remove inline marks and reset selected text blocks back to paragraphs with ClearFormattingPlugin.
---

# Clear Formatting

`ClearFormattingPlugin` registers one command: `clearFormatting`.

```typescript
import {
  ClearFormattingPlugin,
  HeadingsPlugin,
  QalmaCommand,
  QalmaToolbar,
  TextFormattingKit,
  createQalmaEditor,
} from '@qalma/editor';

const editor = createQalmaEditor({
  plugins: [HeadingsPlugin, ...TextFormattingKit, ClearFormattingPlugin],
});
```

## Command behavior

| Command | Description |
| ------- | ----------- |
| `clearFormatting` | Removes inline marks and resets clearable selected text blocks to paragraphs. |

The command returns `false` when there are no stored marks, no inline marks to
remove, and no selected textblock formatting that can be reset.

```html
<qalma-toolbar label="Formatting">
  <button type="button" qalmaCommand="clearFormatting">
    Clear formatting
  </button>
</qalma-toolbar>
```

## What gets cleared

For inline content, the command removes all marks in the selected ranges. When
the selection is collapsed inside an inline-content parent, Qalma clears marks
across that parent block and clears stored marks for future typing.

For block content, the command uses the base `paragraph` node. Selected
textblocks that can be replaced with paragraphs are reset with
`setBlockType(...)`.

```typescript
clearSelection(): void {
  this.editor.execute('clearFormatting');
}
```

## What stays consumer-owned

The plugin does not decide which toolbar icon, confirmation UI, or keyboard
shortcut your product should use. Add a shortcut in a custom plugin if your
application needs one.

## Related plugins

`clearFormatting` works well with these mark-producing plugins:

| Plugin | Cleared marks |
| ------ | ------------- |
| `TextFormattingKit` | `strong`, `em`, `underline`, `strike` |
| `SubscriptSuperscriptPlugin` | `subscript`, `superscript` |
| `ColorPlugin` | `textStyle` |
| `HighlightPlugin` | `highlight` |
| `LinkPlugin` | `link` |
