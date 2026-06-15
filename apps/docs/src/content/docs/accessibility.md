---
title: Accessibility
description: Build accessible rich-text UI with Qalma's headless primitives and consumer-owned controls.
---

# Accessibility

Qalma provides structural accessibility for the primitives it owns, and leaves
product UI accessibility to the components you build around the controller.

## Library primitives

| Primitive | Accessibility behavior |
| --------- | ---------------------- |
| `&lt;qalma-toolbar&gt;` | Renders `role="toolbar"` and an `aria-label` from the `label` input. |
| `button[qalmaCommand]` | Preserves editor selection on mouse down, disables itself through `canExecute()`, and sets `aria-pressed` only for commands with active state. |
| `&lt;qalma-content&gt;` | Mounts the ProseMirror view after browser render. The editor view receives `aria-label="Rich text editor"`. |
| `ListsPlugin` | Handles `Escape` and `Shift+Escape` to move focus to adjacent focusable elements outside the editor, or blur when none exist. |

Use native buttons for toolbar controls whenever possible. `QalmaCommand`
targets `button[qalmaCommand]` specifically.

## Toolbar labels

```html
<qalma-toolbar label="Text formatting">
  <button type="button" qalmaCommand="toggleBold">Bold</button>
  <button type="button" qalmaCommand="toggleItalic">Italic</button>
</qalma-toolbar>
```

If a page has multiple toolbars, give each one a specific label.

## Active and disabled state

`QalmaCommand` connects command state to native button semantics:

```html
<button type="button" qalmaCommand="toggleBold">
  Bold
</button>
```

When `toggleBold` is active, the button gets `aria-pressed="true"` and
`.qalma-command-active`. When the command cannot run, it is disabled.

Commands without active state do not get `aria-pressed`; this avoids announcing
one-shot actions such as undo as toggles.

## Menus and popovers

Mention and slash command menus are consumer-owned. The plugins provide
cancelable DOM events so your menu can own keyboard behavior.

```typescript
handleSlashCommandKeydown(event: Event): void {
  if (!(event instanceof CustomEvent)) {
    return;
  }

  if (event.detail.key === 'ArrowDown') {
    this.moveActiveOption(1);
    event.preventDefault();
  }
}
```

If your handler calls `preventDefault()` on the custom event, Qalma prevents the
original editor keydown too.

Use normal ARIA patterns in your menu component. The docs playground uses a
`role="listbox"` container, `role="option"` buttons, `aria-selected`, roving
`tabindex`, and mouse-down selection preservation.

## Link popovers

For link preview and edit UI, use dialog or popover semantics in your app. The
playground link popover uses `role="dialog"` and `aria-label="Link preview"`,
then calls `setLink`, `selectLink`, and `unsetLink` on the editor controller.

## Styling focus

Do not remove focus indicators without replacing them. Qalma does not style
focus rings for you.

```css
.toolbar button:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```
