---
title: Horizontal Rule
description: Insert thematic breaks with HorizontalRulePlugin, a command, and a markdown input rule.
---

# Horizontal Rule

`HorizontalRulePlugin` adds a block-level `horizontalRule` leaf node that
serializes to `<hr>`, a command to insert it, and a markdown input rule.

```typescript
import { HorizontalRulePlugin, createQalmaEditor } from '@qalma/editor';

const editor = createQalmaEditor({
  plugins: [HorizontalRulePlugin],
});
```

## Defaults

| Contract | Default |
| -------- | ------- |
| `inputRules` | `true` |
| Command | `insertHorizontalRule` |
| Input rules | `---`, `___`, `***` |

```html
<button type="button" qalmaCommand="insertHorizontalRule">
  Divider
</button>
```

## insertHorizontalRule

`insertHorizontalRule` inserts a horizontal rule at the current selection. The
selection is split when it sits inside text, so the rule lands between the two
halves. After inserting, the cursor is placed in the textblock that follows the
rule — an empty paragraph is appended when none exists — so the leaf node never
traps the caret.

The command returns `false` when a horizontal rule cannot be inserted at the
current position.

The horizontal rule node:

| Property | Value |
| -------- | ----- |
| Group | `block` |
| Content | None (leaf) |
| HTML parse | `<hr>` |
| HTML serialize | `<hr>` |

## Input rules

At the start of an empty textblock, typing `---`, `___`, or `***` inserts a
horizontal rule. The conversion is one-way, not a toggle: pressing `Backspace`
immediately after reverts to the literal characters you typed, matching the
editor-wide input-rule undo.

Disable the shortcut while keeping the command and toolbar button:

```typescript
const editor = createQalmaEditor({
  plugins: [HorizontalRulePlugin.configure({ inputRules: false })],
});
```

| Validation | Error condition |
| ---------- | --------------- |
| `inputRules` must be a boolean | Non-boolean value. |

## Styling

Style the rule like any `<hr>` in your content. Qalma renders a plain `<hr>`
element and adds no default CSS.
