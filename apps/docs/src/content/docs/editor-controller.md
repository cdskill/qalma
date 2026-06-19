---
title: Editor & Controller
description: Create, mount, update, query, focus, and drive a Qalma editor through QalmaEditorController.
---

# Editor & Controller

`createQalmaEditor()` returns a `QalmaEditorController`. The controller is the
headless API your Angular components keep and pass into `&lt;qalma-editor&gt;`.

```typescript
import {
  HeadingsPlugin,
  HistoryPlugin,
  TextFormattingKit,
  createQalmaEditor,
} from '@qalma/editor';

const editor = createQalmaEditor({
  content: '<p>Hello Qalma</p>',
  editable: true,
  plugins: [HeadingsPlugin, ...TextFormattingKit, HistoryPlugin],
});
```

## Options

| Option | Type | Default | Description |
| ------ | ---- | ------- | ----------- |
| `content` | `string` | `'&lt;p&gt;&lt;/p&gt;'` | Initial HTML parsed with the schema produced by your plugins. |
| `editable` | `boolean` | `true` | Initial read/write state. |
| `plugins` | `readonly QalmaPlugin[]` | `[]` | Plugins that define the schema, commands, states, queries, shortcuts, and behavior. |

The plugin list is copied when the controller is created. Add all required
plugins up front; a controller does not expose a method for adding plugins later.

## Signals

| Member | Type | Description |
| ------ | ---- | ----------- |
| `html` | `Signal&lt;string&gt;` | Serialized HTML for the current document. It updates after document-changing transactions. |
| `editable` | `Signal&lt;boolean&gt;` | Current editability. It updates when you call `setEditable()`. |

```html
<section>
  <qalma-editor [editor]="editor">
    <qalma-content class="block min-h-40 p-4 [&_.ProseMirror]:outline-none" />
  </qalma-editor>

  <pre><code>{{ editor.html() }}</code></pre>
</section>
```

## Mounting lifecycle

You normally do not call `mount()` yourself. `&lt;qalma-content&gt;` injects the
editor context from `&lt;qalma-editor&gt;`, waits for the browser render pass with
`afterNextRender`, and mounts the ProseMirror view into its internal host.

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  QalmaContent,
  QalmaEditor,
  createQalmaEditor,
} from '@qalma/editor';

@Component({
  selector: 'app-document-editor',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QalmaEditor, QalmaContent],
  template: `
    <qalma-editor [editor]="editor">
      <qalma-content class="block min-h-64 p-4 [&_.ProseMirror]:outline-none" />
    </qalma-editor>
  `,
})
export class DocumentEditor {
  protected readonly editor = createQalmaEditor({
    content: '<p>Draft</p>',
  });
}
```

If the same controller is mounted into the same host twice, it returns early.
If it mounts into a different host, it unmounts the previous view first.

## Commands

Commands are registered by plugins. `execute()` returns `true` when the command
exists, the editor is editable, the view state exists, and the command applies.
When a command succeeds, Qalma focuses the editor view.

```typescript
this.editor.execute('toggleBold');
this.editor.execute('toggleHeading2');
this.editor.execute('setLink', {
  href: 'https://angular.dev',
  target: '_blank',
});
```

Use `canExecute()` to decide whether custom controls should be enabled:

```typescript
readonly canSetLink = computed(() =>
  this.editor.canExecute('setLink', 'https://angular.dev'),
);
```

Use `isCommandActive()` for toggle state. It returns `false` for commands with
no command-state query.

```typescript
readonly boldActive = computed(() =>
  this.editor.isCommandActive('toggleBold'),
);
```

`hasCommandState(commandName)` tells you whether a command exposes active state.
`QalmaCommand` uses it to set `aria-pressed` only for stateful commands.

## Queries

Queries are plugin-provided read models for UI that needs more than a boolean.

```typescript
import { LinkState } from '@qalma/editor';

const link = this.editor.query<LinkState>('link');

if (link) {
  console.log(link.href, link.text, link.from, link.to);
}
```

`query()` returns `null` when the query is not registered or when the query has
no value for the current selection. `hasQuery(queryName)` checks registration.

## Updating content and editability

`setHtml()` replaces the whole document. Before mount it only updates the HTML
signal. After mount it rebuilds the editor state with the same schema and
plugins.

```typescript
loadDocument(html: string): void {
  this.editor.setHtml(html);
  this.editor.focus();
}
```

The controller also reads and writes the document as JSON and Markdown:

| Method | Description |
| ------ | ----------- |
| `getJSON()` | Serializes to ProseMirror's native, **lossless** JSON (`QalmaDocument`). |
| `setJSON(doc)` | Replaces the document from a `QalmaDocument`. Works before and after mount. |
| `getMarkdown()` | Serializes to Markdown (CommonMark + GFM); output-only. |

```typescript
import { QalmaDocument } from '@qalma/editor';

const doc: QalmaDocument = this.editor.getJSON(); // persist losslessly
this.editor.setJSON(doc); // restore later

const markdown = this.editor.getMarkdown(); // export to Markdown
```

See [Content & Serialization](/docs/content) for the format comparison and how
Markdown falls back to inline HTML for marks it cannot express.

`setEditable(false)` makes command execution and `canExecute()` return false,
and updates the ProseMirror `editable` prop.

```typescript
toggleReadOnly(readOnly: boolean): void {
  this.editor.setEditable(!readOnly);
}
```

`focus()` focuses the mounted editor view. If the view has not mounted yet, it
does nothing.
