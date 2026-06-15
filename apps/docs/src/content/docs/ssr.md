---
title: SSR & Zoneless
description: Use Qalma in Angular SSR and zoneless applications.
---

# SSR & Zoneless

Qalma is built for modern Angular apps that use signals and zoneless change
detection. It also stays safe during server rendering by mounting the editor
view only in the browser.

## Zoneless setup

Angular 21 apps can use `provideZonelessChangeDetection()`.

```typescript
import {
  ApplicationConfig,
  provideZonelessChangeDetection,
} from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection()],
};
```

Qalma state is exposed as signals, so templates can bind directly to
`editor.html()`, `editor.editable()`, computed command state, and queries.

## Server rendering

`&lt;qalma-content&gt;` calls `editor.mount(...)` inside `afterNextRender`. That means
the ProseMirror `EditorView` is not created during server rendering.

```html
<qalma-editor [editor]="editor">
  <qalma-content class="block min-h-48 p-4 [&_.ProseMirror]:outline-none" />
</qalma-editor>
```

You can create the controller as a component field:

```typescript
protected readonly editor = createQalmaEditor({
  content: '<p>SSR-safe setup.</p>',
  plugins: [...TextFormattingKit, HistoryPlugin],
});
```

## DOM work in app components

When your consumer UI needs `window`, `document`, selections, ranges, or DOM
event listeners, run that work after browser render and clean it up.

```typescript
afterNextRender(() => {
  const surface = this.surface().nativeElement;
  const refresh = () => this.refreshMenu();

  surface.addEventListener('qalma-slash-command-update', refresh);

  this.destroyRef.onDestroy(() => {
    surface.removeEventListener('qalma-slash-command-update', refresh);
  });
});
```

This is the pattern used by the docs playground for mention and slash command
menus.

## Plugin options and SSR

First-party configurable plugins validate options when the editor is created.
Browser-only behavior stays in mounted event handlers, node views, or guarded
normalization paths. If you write a custom plugin, keep the same rule: do not
read browser globals while defining static plugin options unless you guard them.

```typescript
const color =
  typeof document === 'undefined'
    ? fallbackColor
    : normalizeWithBrowserCss(value);
```

## Read-only rendering

Use `editable: false` for read-only editor surfaces that still need Qalma's
schema parsing and serialization.

```typescript
const editor = createQalmaEditor({
  content: '<p>Preview only</p>',
  editable: false,
  plugins: [...TextFormattingKit],
});
```

Commands do not execute while read-only, but the content surface can still mount
and render the document.
