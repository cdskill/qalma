---
title: Architecture
description: How Qalma composes Angular primitives, an editor controller, first-party plugins, and ProseMirror.
---

# Architecture

Qalma is split into a small Angular-facing surface and an internal ProseMirror
engine. The public API is the Angular layer: `createQalmaEditor()`, the
`QalmaEditorController`, the headless components, and the first-party plugins
exported from `@qalma/editor`.

The editor library does not render toolbars, menus, popovers, or product
styling. Those pieces live in the consuming app. `apps/docs` and
`apps/sandbox` are examples of that pattern: their toolbar, link popover,
mention menu, slash command menu, and image upload controls are ordinary Angular
components built on top of the public controller API.

## Layers

| Layer | Public surface | Responsibility |
| ----- | -------------- | -------------- |
| Controller | `createQalmaEditor(options)` and `QalmaEditorController` | Owns content, editability, commands, command state, queries, mounting, and focus. |
| Angular primitives | `QalmaEditor`, `QalmaContent`, `QalmaToolbar`, `QalmaCommand` | Provide context, mount the editable surface, and wire native buttons to commands. |
| Plugins | `QalmaPlugin` objects and kits such as `TextFormattingKit` | Add schema nodes or marks, commands, command states, queries, shortcuts, and ProseMirror plugins. |
| Consumer UI | Your Angular components | Render buttons, selects, popovers, menus, uploads, validation, and app-specific styles. |
| ProseMirror | Internal engine | Parses, validates, edits, and serializes the document model. |

## Editor creation

`createQalmaEditor()` builds a controller from initial HTML, an optional
editable flag, and an ordered plugin list.

```typescript
import {
  BlockquotePlugin,
  HeadingsPlugin,
  HistoryPlugin,
  ListsPlugin,
  TextFormattingKit,
  createQalmaEditor,
} from '@qalma/editor';

export const editor = createQalmaEditor({
  content: '<h2>Release notes</h2><p>Start writing.</p>',
  editable: true,
  plugins: [
    HeadingsPlugin,
    ...TextFormattingKit,
    ListsPlugin,
    BlockquotePlugin,
    HistoryPlugin,
  ],
});
```

Only the plugins you include exist in that editor. If `LinkPlugin` is not in the
list, the schema has no `link` mark, `setLink` is not registered, and pasted
links are parsed as normal text unless another plugin handles them.

## Schema composition

Qalma starts from three base nodes:

| Node | Purpose |
| ---- | ------- |
| `doc` | Top-level document containing one or more block nodes. |
| `paragraph` | Default text block with inline content. |
| `text` | Inline text node. |

Plugins can add nodes, add marks, or extend existing nodes. For example,
`HeadingsPlugin` adds the `heading` node, `TextFormattingKit` adds marks such as
`strong` and `em`, and `TextAlignPlugin` extends configured nodes with a
`textAlign` attribute.

Qalma validates collisions while building the schema:

| Collision | Result |
| --------- | ------ |
| Duplicate plugin key | Throws `Duplicate QALMA plugin key "...".` |
| Duplicate node name | Throws with the plugin key and duplicate node name. |
| Duplicate mark name | Throws with the plugin key and duplicate mark name. |
| Extending an unknown node | Throws with the plugin key and unknown node name. |

That means custom plugins should use stable, unique names and should only
extend nodes that are guaranteed to exist in the same editor.

## Runtime registries

After the schema exists, Qalma asks each plugin for runtime capabilities:

| Capability | Public use |
| ---------- | ---------- |
| `commands(schema)` | Available through `editor.execute(name, value)` and `qalmaCommand`. |
| `commandStates(schema)` | Available through `editor.isCommandActive(name)` and button state. |
| `queries(schema)` | Available through `editor.query&lt;T&gt;(name)`. |
| `shortcuts(schema)` | Registered in a ProseMirror keymap before the base keymap. |
| `prosemirrorPlugins(schema)` | Internal behavior such as history, paste handling, decorations, events, and node views. |

Command names, command-state names, query names, and shortcut keys must also be
unique across the editor. If two plugins register the same name, editor
creation throws instead of silently picking one.

## Mounting

The controller is plain TypeScript. The actual ProseMirror view is mounted by
`&lt;qalma-content&gt;` after the browser render pass. This keeps server rendering
safe and lets the controller exist before the DOM is ready.

```html
<qalma-editor [editor]="editor">
  <qalma-content class="block min-h-48 p-4 [&_.ProseMirror]:outline-none" />
</qalma-editor>
```

When `qalma-content` is destroyed, it unmounts the view from the same host.
Calling `editor.setHtml()` before mount updates the controller's HTML signal;
calling it after mount rebuilds the ProseMirror state with the same schema and
plugins.

## Consumer-owned UI

Qalma intentionally stops at headless behavior. A link feature exposes commands
and query state; it does not render an input. A mention feature emits DOM events
and query state; it does not fetch users. The consumer chooses the Angular
component, positioning strategy, design system, validation copy, and data
source.

The library components have no component styles. Style the root
`.qalma-editor`, `.qalma-content`, `.qalma-toolbar`, `.qalma-command-active`,
and `.ProseMirror` descendants from your application.
