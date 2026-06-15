---
title: Building a Custom Plugin
description: Create a QalmaPlugin with commands, queries, shortcuts, ProseMirror behavior, and validated options.
---

# Building a Custom Plugin

A `QalmaPlugin` is the extension unit Qalma composes into an editor. A plugin
can contribute schema nodes or marks, commands, command states, queries,
shortcuts, and ProseMirror plugins.

```typescript
import { createQalmaPlugin } from '@qalma/editor';

export const WordCountPlugin = createQalmaPlugin({
  key: 'wordCount',
  queries: () => ({
    wordCount: (state) =>
      state.doc.textContent.trim().split(/\s+/).filter(Boolean).length,
  }),
});
```

Use it like any first-party plugin:

```typescript
const editor = createQalmaEditor({
  plugins: [WordCountPlugin],
});

const words = editor.query<number>('wordCount');
```

## Plugin shape

```typescript
import { QalmaPlugin } from '@qalma/editor';

export const MyPlugin: QalmaPlugin = {
  key: 'myPlugin',
  nodes: {},
  marks: {},
  extendNodes: (nodes) => ({}),
  commands: (schema) => ({}),
  commandStates: (schema) => ({}),
  queries: (schema) => ({}),
  shortcuts: (schema) => ({}),
  prosemirrorPlugins: (schema) => [],
};
```

Only `key` is required. Add the sections your feature needs.

| Section | Use it for |
| ------- | ---------- |
| `nodes` | New document nodes such as images, mentions, or code blocks. |
| `marks` | Inline annotations such as bold, links, color, or highlight. |
| `extendNodes` | Add attributes or DOM serialization to nodes that already exist. |
| `commands` | Actions exposed through `editor.execute()` and `qalmaCommand`. |
| `commandStates` | Boolean active state for commands. |
| `queries` | Read models exposed through `editor.query&lt;T&gt;()`. |
| `shortcuts` | ProseMirror keymap entries. |
| `prosemirrorPlugins` | Decorations, event handlers, node views, append transactions, and other engine behavior. |

## Uniqueness rules

Qalma validates plugin composition while the controller is created.

| Must be unique | Why |
| -------------- | --- |
| Plugin `key` | Identifies the plugin in composition errors. |
| Node names | Schema nodes cannot collide. |
| Mark names | Schema marks cannot collide. |
| Command names | `editor.execute(name)` must be unambiguous. |
| Command-state names | `editor.isCommandActive(name)` must be unambiguous. |
| Query names | `editor.query(name)` must be unambiguous. |
| Shortcuts | Keymap entries must not silently override each other. |

Use names that are stable and product-specific, especially for custom plugins
inside an application.

## Command example

Commands receive the current state, an optional dispatch function, the editor
view, and an optional command value. Return `true` when the command can apply.
Only dispatch when `dispatch` is provided.

```typescript
import { createQalmaPlugin } from '@qalma/editor';

export const TimestampPlugin = createQalmaPlugin({
  key: 'timestamp',
  commands: () => ({
    insertTimestamp: (state, dispatch) => {
      const text = new Date().toISOString();

      if (dispatch) {
        dispatch(state.tr.insertText(text).scrollIntoView());
      }

      return true;
    },
  }),
});
```

```html
<button type="button" qalmaCommand="insertTimestamp">
  Insert timestamp
</button>
```

## Query and command-state example

Use queries when UI needs data, and command states when a command needs active
toggle state.

```typescript
export const SelectionPlugin = createQalmaPlugin({
  key: 'selectionInfo',
  queries: () => ({
    selectionSize: (state) => state.selection.to - state.selection.from,
  }),
  commandStates: () => ({
    clearSelection: (state) => !state.selection.empty,
  }),
  commands: () => ({
    clearSelection: (state, dispatch) => {
      if (state.selection.empty) {
        return false;
      }

      if (dispatch) {
        dispatch(state.tr.deleteSelection().scrollIntoView());
      }

      return true;
    },
  }),
});
```

## Configurable plugins

Use `createConfigurableQalmaPlugin()` for public options. Validate options in
the factory so invalid configuration fails at editor creation time.

```typescript
import {
  createConfigurableQalmaPlugin,
  createQalmaPlugin,
} from '@qalma/editor';

interface CharacterLimitOptions {
  limit: number;
}

export const CharacterLimitPlugin = createConfigurableQalmaPlugin(
  Object.freeze({ limit: 1000 } satisfies CharacterLimitOptions),
  (options) => {
    if (!Number.isInteger(options.limit) || options.limit < 1) {
      throw new RangeError('CharacterLimitPlugin limit must be positive.');
    }

    return createQalmaPlugin({
      key: 'characterLimit',
      queries: () => ({
        characterCount: (state) => state.doc.textContent.length,
        characterLimit: () => options.limit,
      }),
    });
  },
);
```

```typescript
const editor = createQalmaEditor({
  plugins: [CharacterLimitPlugin.configure({ limit: 280 })],
});
```

The base plugin is not mutated. `.configure()` returns a new plugin instance
with frozen merged options.

## Keep the boundary clean

Custom plugins may use ProseMirror concepts because plugins are the intentional
engine boundary. Application components should still talk to the editor through
Qalma commands, states, queries, and DOM events, rather than reaching into
internal helpers.
