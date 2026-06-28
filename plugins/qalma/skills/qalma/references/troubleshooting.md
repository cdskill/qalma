# Troubleshooting And Migration

Use this reference when migrating to Qalma or debugging editor behavior in an
app that already uses Qalma.

## Migration Heuristics

- Map the old editor's extensions to explicit Qalma plugins.
- Move toolbar generation out of editor configuration and into Angular
  templates.
- Replace editor-specific UI state with `canExecute`, `isCommandActive`, and
  `query`.
- Persist JSON when lossless round trips matter. Use HTML for legacy content and
  rendering interop.
- Keep ProseMirror-specific logic behind app-local adapters unless the app is
  intentionally authoring Qalma plugins.

## Common Issues

**A command does nothing**

- Confirm the plugin that registers the command is present in `plugins`.
- Check the command name spelling and argument shape.
- Use `canExecute(command, value?)` to see whether the current selection permits
  the command.

**The toolbar state is wrong**

- Prefer `qalmaCommand` for buttons instead of manually wiring click handlers.
- Confirm the plugin contributes a command state for active state.
- Check whether the command is meaningful for the current selection.

**Content disappears after reload**

- Prefer `getJSON()` and `setJSON()` for lossless persistence.
- If using HTML, confirm the relevant plugins are selected before parsing saved
  content.
- Check custom schema parse rules and serialization rules.

**Styling does not apply**

- Style from the app, not the library.
- Target the mounted content area via `.qalma-content` and ProseMirror content
  classes from the consuming application's stylesheet.
- Avoid relying on library-provided product styling; Qalma is headless.

**The app breaks during SSR or tests**

- Keep browser-only code out of module evaluation.
- Create or mount the editor only where the host app expects DOM access.
- Mock or isolate upload, popover, and measurement behavior in unit tests.

## Debugging Steps

1. Inspect the selected plugin array.
2. Check public command names and public query names.
3. Reproduce with a minimal editor and the smallest plugin set.
4. Verify persistence format with a known simple document.
5. If a feature depends on current Qalma internals, inspect the installed package
   types or current source before changing code.
