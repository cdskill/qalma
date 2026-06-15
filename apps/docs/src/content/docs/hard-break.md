---
title: Hard Break & Trailing Paragraph
description: Insert inline line breaks and keep terminal blocks editable with HardBreakPlugin and TrailingParagraphPlugin.
---

# Hard Break & Trailing Paragraph

This page covers two small editing-behavior plugins:

| Plugin | Purpose |
| ------ | ------- |
| `HardBreakPlugin` | Adds an inline `hardBreak` node that serializes to `&lt;br&gt;`. |
| `TrailingParagraphPlugin` | Ensures the document ends with an empty paragraph when the last block is not already one. |

```typescript
import {
  HardBreakPlugin,
  TrailingParagraphPlugin,
  createQalmaEditor,
} from '@qalma/editor';

const editor = createQalmaEditor({
  plugins: [HardBreakPlugin, TrailingParagraphPlugin],
});
```

## HardBreakPlugin

`HardBreakPlugin` registers one command and one shortcut.

| Contract | Description |
| -------- | ----------- |
| `insertHardBreak` | Replaces the current selection with a `hardBreak` node when the selection is inside one inline-content parent. |
| `Shift-Enter` | Runs `insertHardBreak`. |

```html
<button type="button" qalmaCommand="insertHardBreak">
  Line break
</button>
```

The hard break node:

| Property | Value |
| -------- | ----- |
| Inline | Yes |
| Selectable | No |
| HTML parse | `&lt;br&gt;` |
| HTML serialize | `&lt;br&gt;` |
| Plain leaf text | `'\n'` |

The command returns `false` when the selection crosses parent boundaries or the
current parent cannot accept an inline hard break.

## TrailingParagraphPlugin

`TrailingParagraphPlugin` has no public commands or queries. It installs a
ProseMirror plugin that appends a paragraph when the final document child is not
already an empty paragraph.

This keeps the cursor reachable after terminal blocks such as code blocks,
blockquotes, lists, or media-heavy paragraphs.

```typescript
const editor = createQalmaEditor({
  content: '<pre><code class="language-typescript">const ok = true;</code></pre>',
  plugins: [CodeBlockPlugin, TrailingParagraphPlugin],
});
```

The inserted paragraph is marked with `addToHistory: false`, so the automatic
trailing paragraph does not become an undo step. The plugin also queues a
microtask on mount and update to ensure the trailing paragraph exists after the
view is ready.

## Styling

No extra CSS is required for the plugin behavior. If your product gives empty
paragraphs a visible min-height, the trailing paragraph will inherit that
styling like any other paragraph.
