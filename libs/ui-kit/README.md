<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/cdskill/qalma/main/apps/docs/public/qalma-mark-dark.svg" />
    <img src="https://raw.githubusercontent.com/cdskill/qalma/main/apps/docs/public/qalma-mark-light.svg" alt="Qalma" width="56" height="56" />
  </picture>
</p>

# @qalma/kit

Optional UI components for [@qalma/editor](https://www.npmjs.com/package/@qalma/editor).

`@qalma/editor` stays headless. `@qalma/kit` is the Tailwind-first layer for
teams that want ready-made buttons, toolbar pieces, floating menus, link
popovers, drag handles, and behavior primitives while still owning their app's
visual identity.

**[Documentation and live examples](https://qalma.dev/kit)**

> **Status:** pre-1.0 (`0.x`). The public API is stabilizing but may still
> change before `1.0`.

## Installation

```sh
npm install @qalma/editor @qalma/kit @ng-icons/core @ng-icons/lucide
```

Peer dependencies:

- `@angular/core` `>=21 <22`
- `@angular/common` `>=21 <22`
- `@qalma/editor`
- `@ng-icons/core`
- `@ng-icons/lucide`

The kit does not ship a compiled stylesheet. It expects your app to provide
Tailwind utilities and the CSS token contract below. If you already use
shadcn-style tokens, the defaults should feel familiar.

With Tailwind v4, point Tailwind at the installed package so it generates the
utilities used inside kit components:

```css
@import 'tailwindcss';

/* Adjust the path if your global stylesheet is not src/styles.css. */
@source '../node_modules/@qalma/kit';
```

## Theming

The kit does not ship a fixed brand. Components read design tokens through
Tailwind utility names such as `bg-popover`, `text-muted-foreground`,
`border-border`, and `ring-ring`.

Then expose those tokens with `@theme`:

```css
@import 'tailwindcss';
@source '../node_modules/@qalma/kit';

@theme {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-popover: var(--popover);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-accent-subtle: var(--accent-subtle);
  --color-border: var(--border);
  --color-ring: var(--ring);
}

:root {
  --background: #ffffff;
  --foreground: #18181b;
  --card: #ffffff;
  --popover: #ffffff;
  --primary: #18181b;
  --primary-foreground: #fafafa;
  --secondary: #f4f4f5;
  --secondary-foreground: #18181b;
  --muted-foreground: #71717a;
  --accent: #2563eb;
  --accent-foreground: #ffffff;
  --accent-subtle: #dbeafe;
  --border: #e4e4e7;
  --ring: #93c5fd;
}
```

If those variable names conflict with your product tokens, scope them to the
editor surface instead of `:root`:

```css
.qalma-surface {
  --background: #ffffff;
  --foreground: #18181b;
  --accent: #2563eb;
  --border: #e4e4e7;
  --ring: #93c5fd;
}
```

## Quick Start

Create a Qalma editor as usual, then compose kit components inside the editor
context:

```ts
import { Component } from '@angular/core';
import { createQalmaEditor, HistoryPlugin, QalmaContent, QalmaEditor, QalmaToolbar, TextFormattingKit } from '@qalma/editor';
import { provideQalmaToolbarIcons, QALMA_TOOLBAR_HEADINGS, QALMA_TOOLBAR_HISTORY, QALMA_TOOLBAR_INLINE_MARKS, QalmaToolbarRegistry } from '@qalma/kit';

@Component({
  standalone: true,
  selector: 'app-editor',
  imports: [QalmaEditor, QalmaContent, QalmaToolbar, QalmaToolbarRegistry],
  providers: [provideQalmaToolbarIcons()],
  template: `
    <qalma-editor [editor]="editor" class="qalma-surface">
      <qalma-toolbar class="flex flex-wrap items-center gap-1 border-b border-border p-2">
        <qalma-toolbar-registry [groups]="toolbarGroups" />
      </qalma-toolbar>

      <qalma-content />
    </qalma-editor>
  `,
})
export class EditorComponent {
  protected readonly editor = createQalmaEditor({
    content: '<p>Hello Qalma</p>',
    plugins: [...TextFormattingKit, HistoryPlugin],
  });

  protected readonly toolbarGroups = [QALMA_TOOLBAR_HEADINGS, QALMA_TOOLBAR_INLINE_MARKS, QALMA_TOOLBAR_HISTORY];
}
```

## What Is Included

Visible components and directives:

- `QalmaButton`
- `QalmaToolbarButton`
- `QalmaToolbarRegistry`
- `QalmaMentionMenu`
- `QalmaSlashCommandMenu`
- `QalmaLinkPopover`
- `QalmaContextualToolbar`
- `QalmaSelectionToolbarDirective`
- `QalmaDragHandle`
- `QalmaDragHandleDirective`

Toolbar helpers:

- `provideQalmaToolbarIcons()`
- `QALMA_TOOLBAR_HEADINGS`
- `QALMA_TOOLBAR_INLINE_MARKS`
- `QALMA_TOOLBAR_ALIGN`
- `QALMA_TOOLBAR_LISTS`
- `QALMA_TOOLBAR_TABLE_INSERT`
- `QALMA_TOOLBAR_TABLE_OPS`
- `QALMA_TOOLBAR_CLEAR_FORMATTING`
- `QALMA_TOOLBAR_UNSET_LINK`
- `QALMA_TOOLBAR_HISTORY`

Behavior primitives for custom UI:

- `anchorToRect`
- `flipAbovePlacement`
- `DismissibleOverlay`
- `KeyboardNavigableList`
- `DragHandleController`
- `LinkPopoverController`
- selection toolbar and suggestion menu controller primitives

## Philosophy

Use the kit when its interaction pieces match your product. Skip it, or use only
the primitives, when your app already owns controls through PrimeNG, Material,
Kendo, ng-zorro, or a private design system.

The editor engine remains in `@qalma/editor`; this package is only the optional
UI layer.

## Learn More

- **UI Kit docs:** [qalma.dev/kit](https://qalma.dev/kit)
- **Editor docs:** [qalma.dev/docs](https://qalma.dev/docs)
- **Source and issues:** [github.com/cdskill/qalma](https://github.com/cdskill/qalma)
