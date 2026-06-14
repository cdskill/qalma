---
title: Installation
description: Add Qalma to an Angular project — package, change detection, and the base styles for the editing surface.
---

# Installation

Qalma is a single package, `@qalma/editor`. It bundles the ProseMirror
libraries it needs, so there is nothing else to add to your `package.json`.

## Requirements

Qalma has a single peer dependency — Angular itself.

| Package         | Required version   |
| --------------- | ------------------ |
| `@angular/core` | `>=21.0.0 <22.0.0` |

It relies on Angular's modern signal APIs, so 21 is the floor. There is nothing
else to install: TypeScript comes with your Angular toolchain, and the
ProseMirror packages ship inside `@qalma/editor`.

## Install the package

```bash
pnpm add @qalma/editor
```

```bash
npm install @qalma/editor
```

```bash
yarn add @qalma/editor
```

```bash
bun add @qalma/editor
```

That's it for dependencies — `prosemirror-state`, `prosemirror-view`,
`prosemirror-model` and friends come along with the package.

## Change detection

Qalma exposes editor state through Angular signals and never touches Zone.js,
so it runs cleanly in a **zoneless** app. Apps scaffolded with Angular 21 are
already zoneless. If yours isn't yet, add the provider to your application
config:

```typescript
import { ApplicationConfig, provideZonelessChangeDetection } from '@angular/core';

export const appConfig: ApplicationConfig = {
  providers: [provideZonelessChangeDetection()],
};
```

> Qalma also works in a Zone.js app — but zoneless is the recommended setup and
> the one the playground runs on.

## Base styles

Qalma is **headless**: it ships no CSS. The content surface renders a
ProseMirror document into an element with the `.ProseMirror` class, and you own
its appearance. At minimum, remove the default focus outline:

```css
.ProseMirror {
  outline: none;
  white-space: pre-wrap;
  word-break: break-word;
}
```

If you use the `PlaceholderPlugin`, add a rule so the placeholder text shows on
an empty document. The plugin tags the empty block with the
`.qalma-placeholder` class and a `data-placeholder` attribute:

```css
.qalma-placeholder::before {
  content: attr(data-placeholder);
  color: var(--qalma-placeholder-color, #9ca3af);
  pointer-events: none;
  height: 0;
  float: left;
}
```

Everything else — typography, lists, blockquotes, code blocks — is styled the
same way, by targeting elements inside `.ProseMirror`. With Tailwind you can do
this inline on `<qalma-content>`:

```html
<qalma-content
  class="block min-h-48 p-4
    [&_.ProseMirror]:outline-none
    [&_.ProseMirror_h2]:text-2xl [&_.ProseMirror_h2]:font-bold
    [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6
    [&_.ProseMirror_blockquote]:border-l-4 [&_.ProseMirror_blockquote]:pl-4"
/>
```

## Server-side rendering

Qalma is SSR-safe. The `<qalma-content>` component only mounts the ProseMirror
view in the browser (inside `afterNextRender`), so it won't run during
server rendering and won't break hydration. No extra configuration is needed.

## Verify the install

Drop this into any standalone component to confirm everything resolves. It
renders an editable surface with bold/italic and undo/redo:

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';
import {
  createQalmaEditor,
  HistoryPlugin,
  QalmaCommand,
  QalmaContent,
  QalmaEditor,
  QalmaToolbar,
  TextFormattingKit,
} from '@qalma/editor';

@Component({
  selector: 'app-editor-check',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QalmaEditor, QalmaContent, QalmaToolbar, QalmaCommand],
  template: `
    <qalma-editor [editor]="editor">
      <qalma-toolbar class="flex gap-2 border-b p-2">
        <button type="button" qalmaCommand="toggleBold">Bold</button>
        <button type="button" qalmaCommand="toggleItalic">Italic</button>
        <button type="button" qalmaCommand="undo">Undo</button>
        <button type="button" qalmaCommand="redo">Redo</button>
      </qalma-toolbar>

      <qalma-content class="block min-h-32 p-4 [&_.ProseMirror]:outline-none" />
    </qalma-editor>
  `,
})
export class EditorCheck {
  protected readonly editor = createQalmaEditor({
    content: '<p>If you can format this text, Qalma is installed. 🎉</p>',
    plugins: [...TextFormattingKit, HistoryPlugin],
  });
}
```

If the toolbar toggles formatting and `Ctrl/Cmd + Z` undoes it, you're ready.

## Next steps

- [Quick Start](/docs/quick-start) — build a real editor with headings, lists
  and a live HTML output.
- [Plugins](/docs/plugins) — the full catalogue of features you can opt into.
