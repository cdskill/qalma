# Current Architecture

## Repository Map

- `libs/editor`: the current headless editor library and intentional public API.
- `libs/editor/src/lib/editor`: Angular primitives and the editor controller.
- `libs/editor/src/lib/plugins`: first-party plugin contracts and plugins.
- `libs/editor/markdown`: optional Markdown parser secondary entrypoint.
- `libs/editor/essentials`: broad kit secondary entrypoint, isolated so its
  composite imports do not defeat main-entrypoint tree-shaking.
- `libs/editor/src/lib/prosemirror`: internal ProseMirror integration helpers.
- `libs/editor/src/index.ts`: public package barrel.
- `apps/sandbox`: real consumer, playground, and executable documentation.
- `apps/sandbox-e2e`: public-behavior browser coverage.

## Runtime Flow

1. A consumer calls `createQalmaEditor()` with content, editor options, and a
   plugin array.
2. `QalmaEditorController` combines plugin contributions into one schema, command
   registry, command-state registry, query registry, content-parser registry,
   and ProseMirror editor state.
3. `<qalma-editor [editor]="editor">` provides the controller to projected
   descendants.
4. `<qalma-content />` mounts and destroys the ProseMirror `EditorView`.
5. Consumer-owned buttons use `qalmaCommand` to execute named commands and receive
   disabled, active-class, and `aria-pressed` state.
6. `<qalma-toolbar>` is an accessible projection primitive; it does not choose or
   render commands.

## Current Public Surface

The public barrel intentionally exposes:

- Editor primitives and `createQalmaEditor`.
- The `QalmaPlugin` and configurable-plugin contracts.
- First-party plugins and focused kits, plus `EssentialsKit` from the optional
  `@qalma/editor/essentials` entrypoint.
- The configurable `LinkPlugin` and its Qalma-owned state/options.
- The configurable `HistoryPlugin` and its Qalma-owned options/defaults.
- Lossless raw JSON plus the versioned `QalmaStoredDocument` persistence
  envelope and schema migrations.
- Configurable `QalmaContentLimits` enforced on imports and live document
  transactions.
- Markdown export in the main entrypoint and opt-in Markdown import from
  `@qalma/editor/markdown`.

Keep helpers under `lib/prosemirror` private unless a consumer use case requires
an explicit escape hatch.

## Plugin Contract

A `QalmaPlugin` has a unique `key` and can contribute:

- `nodes`
- `extendNodes(nodes)`
- `marks`
- `commands(schema)`
- `commandStates(schema)`
- `queries(schema)`
- `contentParsers`
- `shortcuts(schema)`
- `prosemirrorPlugins(schema)`

The core validates duplicate plugin keys, schema names, commands, command
states, queries, content parser formats, and shortcuts. Preserve those checks
as the extension surface grows.

First-party persisted node and mark attributes validate at the schema boundary
so raw JSON cannot bypass command or HTML normalization. Custom plugins are
trusted code: they must validate attributes and construct fresh allowlisted DOM
attribute objects rather than merging untrusted bags.

## Placement Rules

Put code in:

- `editor/` when it coordinates the editor lifecycle or provides a generic
  Angular primitive.
- `plugins/` when it contributes an optional editing capability.
- `prosemirror/` when it adapts engine behavior and is not public API.
- `apps/sandbox` when it is consumer composition, styling, or demonstration.

Keep a first-party plugin inside `libs/editor` by default. Consider a dedicated
library only when at least one of these is real:

- It adds a large optional dependency or material bundle weight.
- It has an independent release cadence or ownership boundary.
- It is independently consumed without the default plugin set.
- It needs its own substantial tests, assets, adapters, or integration surface.
- Keeping it in `editor` creates an actual dependency cycle or architectural
  coupling problem.

Do not split merely because the capability has a name.

## Likely Future Boundaries

These are possible destinations, not current scaffolding requirements:

- A framework-agnostic or engine-facing core if Angular coupling blocks reuse.
- Optional first-party plugin packages for heavy features such as tables,
  collaboration, media, or code highlighting.
- Optional UI packages for polished Angular components built on the headless
  primitives.
- Testing utilities once consumers need stable helpers for plugin and editor
  integration tests.

Create these only when the current implementation demonstrates the boundary.

## Performance Direction

- Keep one ProseMirror view and avoid recreating schema or registries during
  normal editing.
- Use signals to expose Angular-observable state without broad change-detection
  churn.
- Avoid an Angular component per document node unless a custom node view truly
  needs Angular behavior.
- Keep optional features and heavy dependencies out of the mandatory path.
- Keep `libs/editor` side-effect free so host bundlers can tree-shake unused
  first-party plugins from `@qalma/editor` barrel imports. Plugin modules
  must not register global behavior, patch prototypes, mutate shared runtime
  state, import global CSS, or perform browser work at module evaluation time.

## Decision Test

Before adding an abstraction or public export, answer:

1. Which current consumer problem does it solve?
2. Does it preserve consumer-owned UI and plugin selection?
3. Is it a Qalma concept or an engine implementation detail?
4. Can it remain private until a second use case exists?
5. What concrete signal would justify extracting it later?
