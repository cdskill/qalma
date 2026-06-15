---
title: Code Block
description: Add code blocks with language metadata, indentation behavior, and consumer-owned syntax highlighting.
---

# Code Block

`CodeBlockPlugin` adds a `codeBlock` node that serializes as
`&lt;pre&gt;&lt;code class="language-id"&gt;...&lt;/code&gt;&lt;/pre&gt;`.

```typescript
import {
  CodeBlockPlugin,
  QalmaCommand,
  QalmaContent,
  QalmaEditor,
  QalmaToolbar,
  createQalmaEditor,
} from '@qalma/editor';

const editor = createQalmaEditor({
  plugins: [
    CodeBlockPlugin.configure({
      languages: ['plaintext', 'typescript', 'javascript'],
      defaultLanguage: 'typescript',
    }),
  ],
});
```

## Commands, query, and shortcut

| Contract | Description |
| -------- | ----------- |
| `toggleCodeBlock` | Toggles the current block between paragraph and code block. Accepts an optional language value. |
| `setCodeBlockLanguage` | Updates the active code block language. |
| `query&lt;string&gt;('codeBlockLanguage')` | Returns the active code block language or `null`. |
| `Mod-Alt-c` | Runs `toggleCodeBlock`. |

```html
<qalma-toolbar label="Code">
  <button type="button" qalmaCommand="toggleCodeBlock">Code</button>
</qalma-toolbar>
```

## Language select

Use the query and command directly for a language picker.

```typescript
readonly language = computed(
  () => this.editor.query<string>('codeBlockLanguage') ?? 'plaintext',
);

setLanguage(event: Event): void {
  const target = event.target;

  if (target instanceof HTMLSelectElement) {
    this.editor.execute('setCodeBlockLanguage', target.value);
  }
}
```

```html
@if (editor.isCommandActive('toggleCodeBlock')) {
  <select
    [value]="language()"
    (change)="setLanguage($event)"
    aria-label="Code block language"
  >
    <option value="plaintext">Plain text</option>
    <option value="typescript">TypeScript</option>
    <option value="javascript">JavaScript</option>
  </select>
}
```

## Options

| Option | Default | Validation |
| ------ | ------- | ---------- |
| `languages` | `['plaintext']` | Non-empty unique lowercase identifiers matching `^[a-z][a-z0-9-]*$`. |
| `defaultLanguage` | `'plaintext'` | Same identifier format and included in `languages`. |
| `languageClassPrefix` | `'language-'` | Non-empty string without whitespace. |
| `indentText` | Two spaces | Non-empty string containing only spaces or tabs. |

The command language value is trimmed and lowercased before it is checked
against `languages`.

## Keyboard behavior

Inside a code block, `Tab` indents each selected line with `indentText`.
`Shift+Tab` outdents each selected line. Outdent removes `indentText`, one tab,
or up to the same number of leading spaces as `indentText.length`.

## Syntax highlighting

The first-party plugin stores language metadata and code text. It does not
perform syntax highlighting. The docs playground adds a separate consumer-owned
plugin for highlighting because the app controls which highlighter and theme it
wants.

Style code blocks from your app:

```css
qalma-content .ProseMirror pre {
  overflow-x: auto;
  border-radius: 0.5rem;
  padding: 1rem;
  background: var(--muted);
}
```
