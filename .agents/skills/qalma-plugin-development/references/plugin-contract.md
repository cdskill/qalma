# Plugin Contract

## Source Of Truth

Inspect these files before implementing because the code may evolve:

- `libs/editor/src/lib/plugins/qalma-plugin.ts`
- `libs/editor/src/lib/prosemirror/schema.ts`
- `libs/editor/src/lib/prosemirror/plugins.ts`
- `libs/editor/src/lib/prosemirror/state.ts`
- `libs/editor/src/lib/editor/qalma-editor-controller.ts`
- `libs/editor/src/lib/editor/command.ts`
- `libs/editor/src/index.ts`

Use `text-formatting.ts` as the basic mark-and-command example and `history.ts`
as the configurable engine-plugin example.

## Contribution Fields

| Field                        | Use                                                       |
| ---------------------------- | --------------------------------------------------------- |
| `key`                        | Stable unique identity for the Qalma plugin.        |
| `nodes`                      | Add optional ProseMirror node specs to the editor schema. |
| `extendNodes(nodes)`         | Return amended specs for existing schema nodes.           |
| `marks`                      | Add optional ProseMirror mark specs to the editor schema. |
| `commands(schema)`           | Register consumer-executable named commands.              |
| `commandStates(schema)`      | Report meaningful active state for named commands.        |
| `queries(schema)`            | Expose read-only plugin state for consumer-composed UI.   |
| `contentParsers`             | Add an opt-in content format parser returning HTML.       |
| `shortcuts(schema)`          | Register keyboard shortcuts backed by commands.           |
| `prosemirrorPlugins(schema)` | Install engine behavior such as history.                  |

Only add a new contract field when a real plugin cannot be expressed cleanly
with the existing fields. That decision is an architecture change.

Content parsers expose Qalma-owned `{ html }` results rather than a
ProseMirror schema or parser object. The controller normalizes that HTML
through the selected editor schema. Keep heavy format dependencies in optional
secondary entrypoints, as `@qalma/editor/markdown` does.

## Naming

- Use short lowercase plugin keys such as `bold`, `history`, or `link`.
- Use semantic schema names such as `strong` or `link`.
- Use verb-led command names such as `toggleBold`, `setLink`, `unsetLink`,
  `undo`, or `redo`.
- Keep names stable once public.
- Check the entire selected plugin set for collisions; the core intentionally
  rejects duplicates.

## Mark Plugin Shape

A mark plugin normally needs:

1. A `MarkSpec` with parse and serialization rules.
2. A command built from a proven ProseMirror command or a focused custom
   command.
3. A command-state query when the feature can be active.
4. A read-only query when consumer UI needs attributes or ranges from the
   current document state.
5. Conventional shortcuts when they exist.
6. A consumer-composed sandbox button using `qalmaCommand`.

Account for both semantic HTML tags and relevant pasted inline styles when
defining `parseDOM`. Serialize to predictable semantic HTML.

Every persisted mark attribute must define `AttributeSpec.validate`. Normalize
at commands and `parseDOM`, but assume `setJSON()` bypasses both paths. Build a
fresh allowlisted attribute object in `toDOM()` and never merge an untrusted
attribute bag; generic merging must reject `__proto__`, `prototype`, and
`constructor`.

## Node Plugin Shape

A node plugin normally needs:

1. A `NodeSpec` with correct content expression, group, parse rules, and DOM
   serialization.
2. `extendNodes` when a feature needs to add attributes or serialization
   behavior to an existing schema node such as `paragraph`.
3. Commands for inserting, toggling, wrapping, lifting, or changing node type.
4. State queries only when they provide useful UI state.
5. Read-only queries only when consumer UI needs structured state.
6. Keyboard behavior that composes with the base keymap.
7. Tests for schema validity, parsing, serialization, and editing behavior.

Do not introduce an Angular node view until the feature needs Angular-specific
interactive rendering.

Every persisted node attribute must define `AttributeSpec.validate`, including
type-only attributes. URL and CSS values require centralized allowlists and
defence-in-depth checks at serialization. Add malicious JSON tests alongside
HTML and command tests.

## Stateful Engine Plugin Shape

Use `prosemirrorPlugins` for behavior that belongs in ProseMirror state rather
than the document schema. Expose commands or state queries only when consumers
need to interact with that behavior.

## Public API

Export the plugin and any intentional Qalma-owned option or default types.
Keep internal `MarkSpec`, `NodeSpec`, helper commands, assertions, queries, and
raw ProseMirror adapters private unless a consumer use case requires them.

## Sandbox Contract

The sandbox is a consumer, not privileged library code:

```ts
const editor = createQalmaEditor({
  plugins: [ExamplePlugin],
});
```

```html
<button type="button" qalmaCommand="exampleCommand">Example</button>
```

If a plugin works only through internal imports or library-rendered UI, its
public developer experience is incomplete.
