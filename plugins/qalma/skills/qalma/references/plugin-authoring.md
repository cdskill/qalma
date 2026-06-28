# Plugin Authoring

Use this reference when creating a custom Qalma plugin in a consumer app or
contributing a first-party plugin to Qalma.

## Plugin Contract

A `QalmaPlugin` can contribute:

- `key`
- `nodes`
- `extendNodes(nodes)`
- `marks`
- `commands(schema)`
- `commandStates(schema)`
- `queries(schema)`
- `shortcuts(schema)`
- `prosemirrorPlugins(schema)`

Use only the fields the feature needs. A plugin should describe capability, not
presentation.

## Naming

- Plugin keys are stable and unique, such as `bold`, `history`, or `link`.
- Schema names are semantic, such as `strong` or `link`.
- Commands are verb-led, such as `toggleBold`, `setLink`, `unsetLink`,
  `insertImage`, `undo`, or `redo`.
- Shortcuts must not collide across the selected plugin set.

## Mark Plugin Shape

A mark plugin usually needs:

1. A `MarkSpec` with parse and serialization rules.
2. A command built from a proven ProseMirror command or a narrow custom command.
3. A command state when the toolbar needs active or disabled state.
4. A query only when consumer UI needs structured state.
5. Conventional shortcuts when they exist.

Parse both semantic HTML and realistic pasted markup when needed. Serialize to
predictable semantic HTML.

## Node Plugin Shape

A node plugin usually needs:

1. A `NodeSpec` with correct `content`, `group`, parse rules, and DOM output.
2. `extendNodes(nodes)` only when amending an existing node is the right model.
3. Commands for inserting, toggling, wrapping, lifting, or updating nodes.
4. Keyboard behavior that composes with the base editor behavior.
5. Tests for schema validity, parsing, serialization, and user-visible editing.

Avoid Angular node views until the feature genuinely needs Angular-specific
interactive rendering.

## Configurable Plugins

For first-party or reusable plugins:

- Define a Qalma-owned `...PluginOptions` interface.
- Export immutable defaults only when useful to consumers.
- Merge partial options with defaults.
- Validate resolved options early with actionable errors.
- Do not expose an upstream options object wholesale unless that is an explicit
  public API decision.
- Do not mutate a base plugin or previously configured plugin instance.

## Consumer UI Contract

After adding a command, show usage through consumer-owned markup:

```html
<button type="button" qalmaCommand="exampleCommand">Example</button>
```

The plugin is incomplete if it only works through internal imports, library
rendered UI, or a privileged sandbox path.

## Tests

Add the narrowest useful coverage:

- duplicate key, schema, command, query, or shortcut collisions;
- invalid options;
- command behavior and command state;
- parse and serialization behavior;
- keyboard behavior when shortcuts are part of the public contract.
