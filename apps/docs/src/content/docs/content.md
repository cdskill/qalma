---
title: Content & Serialization
description: How Qalma parses initial HTML, keeps editor.html() in sync, and serializes the ProseMirror document.
---

# Content & Serialization

Qalma parses initial HTML into a ProseMirror document using the schema produced
by your selected plugins, and can serialize that document back out in three
formats.

```typescript
const editor = createQalmaEditor({
  content: '<h2>Plan</h2><p><strong>Ship the docs.</strong></p>',
  plugins: [HeadingsPlugin, ...TextFormattingKit],
});
```

## Output formats

| Format | Read | Write | Lossless | Best for |
| ------ | ---- | ----- | -------- | -------- |
| HTML | `html()` signal | `setHtml()` | Yes | Rendering, interop with existing HTML |
| JSON | `getJSON()` | `setJSON()` | **Yes** | Persisting and restoring documents |
| Markdown | `getMarkdown()` | — (input rules) | No | Exporting to Markdown, plain-text storage |

JSON is ProseMirror's native document model and the recommended format to
persist content. Markdown is output-only: typing Markdown syntax is handled by
each plugin's [input rules](/docs/plugins), not by a Markdown parser.

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

## JSON

`getJSON()` returns the document as ProseMirror's native JSON — the lossless
format to persist. `setJSON()` restores it. Both work before and after the
content surface mounts.

```typescript
import { QalmaDocument } from '@qalma/editor';

saveDraft(): void {
  const doc: QalmaDocument = this.editor.getJSON();
  localStorage.setItem('qalma-draft', JSON.stringify(doc));
}

restoreDraft(): void {
  const raw = localStorage.getItem('qalma-draft');

  if (raw) {
    this.editor.setJSON(JSON.parse(raw) as QalmaDocument);
  }
}
```

Unlike HTML, JSON preserves every node attribute and mark exactly, so a
`getJSON()` → `setJSON()` round-trip reproduces the document without loss.
Prefer it over HTML when you control both the save and load sides.

## Markdown

`getMarkdown()` serializes the document to Markdown
([CommonMark](https://commonmark.org/) plus GitHub-Flavored extensions: tables,
task lists, and strikethrough).

```typescript
exportMarkdown(): string {
  return this.editor.getMarkdown();
}
```

Marks and nodes that Markdown cannot express fall back to inline HTML — which
CommonMark permits — so the output stays complete instead of silently dropping
content:

| Content | Markdown output |
| ------- | --------------- |
| Bold, italic, strikethrough | `**b**`, `*i*`, `~~s~~` |
| Inline code, code block | `` `code` ``, fenced ` ``` ` with language |
| Links, images | `[text](href)`, `![alt](src)` |
| Headings, blockquote, lists, task lists, tables | `#`, `>`, `-`/`1.`, `- [x]`, GFM pipe table |
| Underline | `&lt;u&gt;...&lt;/u&gt;` |
| Subscript / superscript | `&lt;sub&gt;...&lt;/sub&gt;` / `&lt;sup&gt;...&lt;/sup&gt;` |
| Text color / highlight | `&lt;span style&gt;` / `&lt;mark&gt;` |
| Mention | the mention label as plain text |

Markdown is **output-only**. To restore content, persist
[JSON](#json) instead; to let users *type* Markdown shortcuts, rely on each
plugin's input rules.

## Plugin-owned serialization

Each plugin decides how its node or mark parses and serializes:

| Plugin              | HTML surface                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------ |
| `TextFormattingKit` | `&lt;strong&gt;`, `&lt;em&gt;`, `&lt;u&gt;`, `&lt;s&gt;`                                         |
| `InlineCodePlugin`  | `&lt;code&gt;`                                                                                   |
| `HeadingsPlugin`    | `&lt;h1&gt;` through configured levels                                                           |
| `ListsPlugin`       | `&lt;ul&gt;`, `&lt;ol&gt;`, `&lt;li&gt;`                                                         |
| `BlockquotePlugin`  | `&lt;blockquote&gt;`                                                                             |
| `CodeBlockPlugin`   | `&lt;pre&gt;&lt;code class="language-id"&gt;...&lt;/code&gt;&lt;/pre&gt;`                        |
| `LinkPlugin`        | `&lt;a href="..." target="..." rel="..."&gt;`                                                    |
| `ImagePlugin`       | inline `&lt;img src="..." alt="..." title="..."&gt;`                                             |
| `MentionPlugin`     | `&lt;span data-qalma-mention ...&gt;`                                                            |
| `ColorPlugin`       | `&lt;span style="color: ...; background-color: ..."&gt;`                                         |
| `HighlightPlugin`   | `&lt;mark&gt;` or `&lt;mark style="background-color: ..."&gt;`                                   |
| `TextAlignPlugin`   | `style="text-align: ..."` on configured nodes, except left alignment serializes as no attribute. |

## Read-only content

`setEditable(false)` leaves serialization active. The editor still exposes
`html()`, `query()`, and command state, but command execution and
`canExecute()` return false while the controller is read-only.
