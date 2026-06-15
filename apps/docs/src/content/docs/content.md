---
title: Content & Serialization
description: How Qalma parses initial HTML, keeps editor.html() in sync, and serializes the ProseMirror document.
---

# Content & Serialization

Qalma accepts and emits HTML strings. Internally, that HTML is parsed into a
ProseMirror document using the schema produced by your selected plugins.

```typescript
const editor = createQalmaEditor({
  content: '<h2>Plan</h2><p><strong>Ship the docs.</strong></p>',
  plugins: [HeadingsPlugin, ...TextFormattingKit],
});
```

## Initial content

`content` is optional. If you omit it, Qalma starts from `'&lt;p&gt;&lt;/p&gt;'`.

```typescript
const emptyEditor = createQalmaEditor();
```

When the editor mounts, the controller parses `editor.html()` with the active
schema and creates the ProseMirror state. Unsupported tags are handled by
ProseMirror's DOM parser according to the current schema. For example, a
document can only keep headings when `HeadingsPlugin` is present.

```typescript
const editor = createQalmaEditor({
  content: '<h1>Kept as a heading</h1>',
  plugins: [HeadingsPlugin],
});
```

## Serialized HTML signal

`editor.html` is an Angular signal. It updates after transactions that change
the document.

```html
<qalma-editor [editor]="editor">
  <qalma-content class="block min-h-40 p-4 [&_.ProseMirror]:outline-none" />
</qalma-editor>

<pre><code>{{ editor.html() }}</code></pre>
```

Qalma serializes the document content, not the outer `doc` node. Newline
characters inside serialized output are escaped as `&#10;`.

## Replacing content

Use `setHtml(html)` when the app loads a saved document or restores a draft.

```typescript
loadSavedDocument(html: string): void {
  this.editor.setHtml(html);
  this.editor.focus();
}
```

Before the content surface is mounted, `setHtml()` updates only the signal.
After mount, it rebuilds the editor state with the same schema, plugins, and
base keymaps.

## Saving content

Because `html` is a signal, you can bind it directly or react to it with
Angular reactivity.

```typescript
import { computed, effect } from '@angular/core';

readonly hasContent = computed(() =>
  this.editor.html().replace(/<[^>]+>/g, '').trim().length > 0,
);

constructor() {
  effect(() => {
    localStorage.setItem('qalma-draft', this.editor.html());
  });
}
```

For form-specific synchronization, use the pattern in
[Forms Integration](/docs/forms-integration) so external writes and editor
writes do not loop.

## Plugin-owned serialization

Each plugin decides how its node or mark parses and serializes:

| Plugin | HTML surface |
| ------ | ------------ |
| `TextFormattingKit` | `&lt;strong&gt;`, `&lt;em&gt;`, `&lt;u&gt;`, `&lt;s&gt;` |
| `HeadingsPlugin` | `&lt;h1&gt;` through configured levels |
| `ListsPlugin` | `&lt;ul&gt;`, `&lt;ol&gt;`, `&lt;li&gt;` |
| `BlockquotePlugin` | `&lt;blockquote&gt;` |
| `CodeBlockPlugin` | `&lt;pre&gt;&lt;code class="language-id"&gt;...&lt;/code&gt;&lt;/pre&gt;` |
| `LinkPlugin` | `&lt;a href="..." target="..." rel="..."&gt;` |
| `ImagePlugin` | inline `&lt;img src="..." alt="..." title="..."&gt;` |
| `MentionPlugin` | `&lt;span data-qalma-mention ...&gt;` |
| `ColorPlugin` | `&lt;span style="color: ...; background-color: ..."&gt;` |
| `HighlightPlugin` | `&lt;mark&gt;` or `&lt;mark style="background-color: ..."&gt;` |
| `TextAlignPlugin` | `style="text-align: ..."` on configured nodes, except left alignment serializes as no attribute. |

## Read-only content

`setEditable(false)` leaves serialization active. The editor still exposes
`html()`, `query()`, and command state, but command execution and
`canExecute()` return false while the controller is read-only.
