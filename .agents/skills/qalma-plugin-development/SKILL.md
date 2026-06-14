---
name: qalma-plugin-development
description: Implement, change, review, or remove Qalma editor plugins end to end. Use for requests involving a new plugin or feature, ProseMirror marks or nodes, commands, command states, keyboard shortcuts, configurable plugin options, plugin kits, toolbar integration, sandbox examples, or plugin behavior tests.
---

# Qalma Plugin Development

Build each plugin as a complete consumer-visible vertical slice while preserving
the headless Qalma architecture.

## Prepare

1. Read [plugin-contract.md](references/plugin-contract.md).
2. Read [definition-of-done.md](references/definition-of-done.md).
3. Inspect `qalma-plugin.ts`, the closest existing plugin, the ProseMirror
   registries, the public barrel, sandbox composition, and relevant tests.
4. Use `qalma-architecture` first if the feature needs a new core
   extension point, public escape hatch, or library boundary.

## Implement A Plugin

1. Define the capability and separate engine behavior from consumer
   presentation.
2. Prefer a proven ProseMirror package or primitive for editing semantics.
3. Design Qalma-owned names and public options. Keep the raw engine
   contract private by default.
4. Add the plugin under `libs/editor/src/lib/plugins` unless architecture
   criteria justify another location.
5. Contribute only the contract fields the feature needs: schema, commands,
   command states, shortcuts, or ProseMirror plugins.
6. Export only consumer-facing symbols from `libs/editor/src/index.ts`.
7. Configure the plugin in the sandbox TypeScript and compose its controls
   explicitly in the sandbox template. Never make the core auto-render buttons.
8. Use `qalma-docs-sync` to update `apps/docs`, docs navigation, and
   `libs/editor/README.md` for the public plugin surface.
9. Add focused tests for public behavior, configuration, invalid options, state,
   and keyboard behavior as applicable.
10. Run the definition-of-done checks and stop every server started for testing.

## Configurable Plugin Rules

- Define a Qalma-owned `...PluginOptions` interface.
- Export immutable default options when consumers benefit from knowing them.
- Use `createConfigurableQalmaPlugin`.
- Merge partial options with defaults.
- Validate resolved options early with actionable errors.
- Do not mutate the base plugin or previously configured instances.
- Do not expose every upstream option automatically; expose options that form a
  useful and supportable public contract.

## Composition Rules

- Give plugin keys, schema names, command names, and shortcuts stable unique
  names.
- Add `commandStates` when UI needs meaningful active state.
- Rely on `qalmaCommand` for execution, disabled state, focus preservation, active
  class, and `aria-pressed`.
- Keep toolbar labels, icons, order, styling, and layout in the consumer.
- A kit is a readonly convenience collection of plugins, not a different plugin
  type.
- Do not create one library per plugin by default.
