---
title: Monospace
description: Add monospace text formatting without inline code semantics.
---

# Monospace

`MonospacePlugin` adds a dedicated `monospace` mark for typography-only inline
text. It does not reuse the `code` mark, does not set ProseMirror code
semantics, and does not serialize to `&lt;code&gt;`.

Use it for labels, identifiers, UI tokens, placeholders, or product-specific
text styles where monospace is visual rather than semantic code.

```typescript
import {
  MonospacePlugin,
  QalmaCommand,
  QalmaContent,
  QalmaEditor,
  QalmaToolbar,
  createQalmaEditor,
} from '@qalma/editor';

const editor = createQalmaEditor({
  content:
    '<p>Use <span data-qalma-monospace="">PRODUCT_TOKEN</span> as a label.</p>',
  plugins: [MonospacePlugin],
});
```

## Command

| Contract            | Description                                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `toggleMonospace`   | Toggles the `monospace` mark across the current selection, or stores it for future typed text when the selection is empty. |
| Shortcut/input rule | None. Backticks remain reserved for `InlineCodePlugin`.                                                                    |

The command exposes command-state support, so `qalmaCommand` adds
`.qalma-command-active` and `aria-pressed` when the current selection has
monospace text.

```html
<qalma-editor [editor]="editor">
  <qalma-toolbar label="Inline formatting">
    <button type="button" qalmaCommand="toggleMonospace">Monospace</button>
  </qalma-toolbar>

  <qalma-content class="block min-h-40 p-4 [&_.ProseMirror]:outline-none" />
</qalma-editor>
```

## DOM Contract

Monospace serializes to a neutral span:

```html
<span data-qalma-monospace="">PRODUCT_TOKEN</span>
```

The same representation parses back into the `monospace` mark, so HTML and JSON
round-trip distinctly from inline code.

## Styling

The editor library stays headless and ships no CSS for this mark. Style it from
your app:

```css
qalma-content .ProseMirror [data-qalma-monospace] {
  font-family:
    ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}
```

## Monospace Vs Inline Code

Use `InlineCodePlugin` for actual inline code. It serializes to `&lt;code&gt;`,
sets ProseMirror code semantics, maps `Mod-e`, and can convert single backticks
into code.

Use `MonospacePlugin` when the text should look monospace but remain regular
inline content. Both plugins can be enabled in the same editor:

```typescript
import { InlineCodePlugin, MonospacePlugin, createQalmaEditor } from '@qalma/editor';

const editor = createQalmaEditor({
  plugins: [InlineCodePlugin, MonospacePlugin],
});
```
