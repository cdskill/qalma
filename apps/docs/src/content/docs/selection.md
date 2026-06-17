---
title: Selection
description: Read selection state from SelectionPlugin and render consumer-owned contextual UI.
---

# Selection

`SelectionPlugin` exposes the current editor selection as a read-only query and
emits a DOM event whenever that selection may have changed. It does not render a
contextual toolbar, bubble menu, tooltip, or overlay.

```typescript
import { SelectionPlugin, TextFormattingKit, createQalmaEditor } from '@qalma/editor';

const editor = createQalmaEditor({
  content: '<p>Select text to show your app toolbar.</p>',
  plugins: [SelectionPlugin, ...TextFormattingKit],
});
```

## Public API

| Contract                                      | Description                                                                 |
| --------------------------------------------- | --------------------------------------------------------------------------- |
| `query&lt;SelectionState&gt;('selection')`    | Returns `{ empty, from, to, text }` for the current editor selection.       |
| `qalma-selection-update`                      | Bubbling DOM event emitted from the editor view when selection state moves. |

The event `detail` is the same `SelectionState` shape returned by the query.

## Contextual Toolbar Pattern

Keep the floating UI in your application. The plugin gives you document state;
your app can use the browser DOM selection, CDK overlay, Spartan popover, or
another overlay primitive for placement.

```typescript
afterNextRender(() => {
  const surface = this.contentHost().nativeElement;
  const refresh = () => this.refreshSelectionToolbar();

  surface.addEventListener('qalma-selection-update', refresh);

  this.destroyRef.onDestroy(() => {
    surface.removeEventListener('qalma-selection-update', refresh);
  });
});
```

```typescript
refreshSelectionToolbar(): void {
  const selection = this.editor.query<SelectionState>('selection');

  if (!selection || selection.empty || selection.text.trim().length === 0) {
    this.toolbarPlacement.set(null);
    return;
  }

  const range = window.getSelection()?.getRangeAt(0);
  const rect = range?.getBoundingClientRect();

  this.toolbarPlacement.set(
    rect ? { left: rect.left + rect.width / 2, top: rect.top - 8 } : null,
  );
}
```

```html
@if (toolbarPlacement(); as placement) {
  <qalma-toolbar
    label="Selection formatting"
    class="contextual-toolbar"
    [style.left.px]="placement.left"
    [style.top.px]="placement.top"
  >
    <button type="button" qalmaCommand="toggleBold">Bold</button>
    <button type="button" qalmaCommand="toggleItalic">Italic</button>
    <button type="button" qalmaCommand="toggleInlineCode">Code</button>
  </qalma-toolbar>
}
```

The docs playground uses this pattern with a Spartan/helm-style toolbar layered
above selected text. The editor library still owns only the headless query and
event contract.
