# Current Architecture

## Repository Map

- `libs/editor`: the current headless editor library and intentional public API.
- `libs/editor/src/lib/editor`: Angular primitives and the editor controller.
- `libs/editor/src/lib/plugins`: first-party plugin contracts and plugins.
- `libs/editor/src/lib/prosemirror`: internal ProseMirror integration helpers.
- `libs/editor/src/index.ts`: public package barrel.
- `apps/sandbox`: real consumer, playground, and executable documentation.
- `apps/sandbox-e2e`: public-behavior browser coverage.

## Runtime Flow

1. A consumer calls `createRteEditor()` with content, editor options, and a
   plugin array.
2. `RteEditorController` combines plugin contributions into one schema, command
   registry, command-state registry, query registry, and ProseMirror editor
   state.
3. `<rte-editor [editor]="editor">` provides the controller to projected
   descendants.
4. `<rte-content />` mounts and destroys the ProseMirror `EditorView`.
5. Consumer-owned buttons use `rteCommand` to execute named commands and receive
   disabled, active-class, and `aria-pressed` state.
6. `<rte-toolbar>` is an accessible projection primitive; it does not choose or
   render commands.

## Current Public Surface

The public barrel intentionally exposes:

- Editor primitives and `createRteEditor`.
- The `RtePlugin` and configurable-plugin contracts.
- First-party text-formatting plugins and `TextFormattingKit`.
- The configurable `LinkPlugin` and its Angular RTE-owned state/options.
- The configurable `HistoryPlugin` and its Angular RTE-owned options/defaults.

Keep helpers under `lib/prosemirror` private unless a consumer use case requires
an explicit escape hatch.

## Plugin Contract

An `RtePlugin` has a unique `key` and can contribute:

- `nodes`
- `marks`
- `commands(schema)`
- `commandStates(schema)`
- `queries(schema)`
- `shortcuts(schema)`
- `prosemirrorPlugins(schema)`

The core validates duplicate plugin keys, schema names, commands, command
states, queries, and shortcuts. Preserve those checks as the extension surface
grows.

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

## Decision Test

Before adding an abstraction or public export, answer:

1. Which current consumer problem does it solve?
2. Does it preserve consumer-owned UI and plugin selection?
3. Is it an Angular RTE concept or an engine implementation detail?
4. Can it remain private until a second use case exists?
5. What concrete signal would justify extracting it later?
