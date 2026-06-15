---
title: Subscript & Superscript
description: Add mutually exclusive subscript and superscript marks to inline content.
---

# Subscript & Superscript

`SubscriptSuperscriptPlugin` adds two inline marks: `subscript` and
`superscript`.

```typescript
import {
  QalmaCommand,
  QalmaContent,
  QalmaEditor,
  QalmaToolbar,
  SubscriptSuperscriptPlugin,
  TextFormattingKit,
  createQalmaEditor,
} from '@qalma/editor';

const editor = createQalmaEditor({
  plugins: [...TextFormattingKit, SubscriptSuperscriptPlugin],
});
```

## Commands

| Command | Mark | Parses | Serializes | Shortcut |
| ------- | ---- | ------ | ---------- | -------- |
| `toggleSubscript` | `subscript` | `&lt;sub&gt;` and `vertical-align: sub` | `&lt;sub&gt;` | None |
| `toggleSuperscript` | `superscript` | `&lt;sup&gt;` and `vertical-align: super` | `&lt;sup&gt;` | None |

The marks exclude each other. Applying subscript removes superscript at the same
range, and applying superscript removes subscript.

```html
<qalma-editor [editor]="editor">
  <qalma-toolbar label="Script">
    <button type="button" qalmaCommand="toggleSubscript">Subscript</button>
    <button type="button" qalmaCommand="toggleSuperscript">Superscript</button>
  </qalma-toolbar>

  <qalma-content class="block min-h-32 p-4 [&_.ProseMirror]:outline-none" />
</qalma-editor>
```

## Active state

Both commands expose command-state queries. That means `qalmaCommand` applies
`.qalma-command-active` and `aria-pressed` when the cursor or selection is
inside the corresponding mark.

```typescript
readonly subscriptActive = computed(() =>
  this.editor.isCommandActive('toggleSubscript'),
);

readonly superscriptActive = computed(() =>
  this.editor.isCommandActive('toggleSuperscript'),
);
```

## Kit export

The plugin also exports `SubscriptSuperscriptKit`, currently containing the
same single plugin. Use the direct plugin when that reads clearer.
