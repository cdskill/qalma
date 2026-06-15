---
title: Theming & Styling
description: Style Qalma from the consuming app with CSS, Tailwind, design tokens, and your component system.
---

# Theming & Styling

`@qalma/editor` is headless. It ships no component styles and does not depend on
Tailwind or a design system. The consuming application owns all presentation.

## CSS hooks

| Hook | Where it appears |
| ---- | ---------------- |
| `.qalma-editor` | Host class on `&lt;qalma-editor&gt;`. |
| `.qalma-content` | Host class on `&lt;qalma-content&gt;`. |
| `.qalma-content-surface` | Internal mount element inside `&lt;qalma-content&gt;`. |
| `.qalma-toolbar` | Host class on `&lt;qalma-toolbar&gt;`. |
| `.qalma-command-active` | Added to `button[qalmaCommand]` when command state is active. |
| `.ProseMirror` | The editable ProseMirror element mounted inside the content surface. |

Minimal styles:

```css
qalma-content .ProseMirror {
  outline: none;
  white-space: pre-wrap;
  word-break: break-word;
}
```

## Style document content

Document HTML comes from your plugins, so style the resulting elements.

```css
qalma-content .ProseMirror h2 {
  margin-block: 1rem 0.5rem;
  font-size: 1.5rem;
  font-weight: 700;
}

qalma-content .ProseMirror ul {
  list-style: disc;
  padding-left: 1.5rem;
}

qalma-content .ProseMirror blockquote {
  border-left: 4px solid var(--accent);
  padding-left: 1rem;
}
```

## Tailwind

Tailwind works well because Qalma exposes normal DOM.

```html
<qalma-content
  class="block min-h-64 p-4
    [&_.ProseMirror]:outline-none
    [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-bold
    [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6
    [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:pl-4"
/>
```

Keep Tailwind in the app. Do not move product styling into editor plugins.

## Design tokens and component systems

The docs app uses a shadcn/spartan-ng token contract in `apps/docs/src/styles.css`
and a local `HlmButton` directive in `apps/docs/src/app/ui/button.ts`. That is
application code. It can wrap native `&lt;button&gt;` and `&lt;a&gt;` elements while Qalma's
library primitives stay independent.

The same pattern works for any component system:

```html
<button
  type="button"
  appBtn
  variant="ghost"
  size="icon"
  qalmaCommand="toggleBold"
  aria-label="Bold"
>
  B
</button>
```

## Placeholder styles

`PlaceholderPlugin` adds a class and `data-placeholder`. You render the visible
placeholder text with CSS.

```css
.qalma-placeholder::before {
  content: attr(data-placeholder);
  color: var(--muted-foreground);
  float: left;
  height: 0;
  pointer-events: none;
}
```

## Selected nodes

Selectable nodes such as images use ProseMirror's selected-node class.

```css
qalma-content .ProseMirror .ProseMirror-selectednode {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}
```
