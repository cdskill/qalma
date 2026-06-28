# Editor Integration

Use this reference when adding Qalma to an Angular app or changing consumer UI
around an existing Qalma editor.

## Install

Install the editor package and make sure Angular satisfies the peer range shown
by the installed package:

```sh
npm install @qalma/editor
```

Use the project's package manager (`pnpm`, `npm`, `yarn`, or `bun`) rather than
introducing a new one.

## Minimal Editor

```ts
import { createQalmaEditor, HistoryPlugin, TextFormattingKit } from '@qalma/editor';

const editor = createQalmaEditor({
  content: '<p>Hello world</p>',
  plugins: [
    ...TextFormattingKit,
    HistoryPlugin.configure({ depth: 200, newGroupDelay: 750 }),
  ],
});
```

```html
<qalma-editor [editor]="editor">
  <qalma-toolbar>
    <button type="button" qalmaCommand="toggleBold">Bold</button>
    <button type="button" qalmaCommand="undo">Undo</button>
    <button type="button" qalmaCommand="redo">Redo</button>
  </qalma-toolbar>

  <qalma-content />
</qalma-editor>
```

`<qalma-editor>` shares the controller with projected descendants.
`<qalma-content />` mounts the ProseMirror view. `<qalma-toolbar>` is only an
accessible structural wrapper; it does not decide which controls exist.

## Public Controller Shape

Common controller members:

- `html()` is a signal with the serialized HTML.
- `editable()` reports whether editing is enabled.
- `execute(command, value?)` runs a command.
- `canExecute(command, value?)` checks whether a command can currently run.
- `isCommandActive(command)` reports toggle state for UI.
- `query<T>(name)` reads plugin-provided state.
- `setHtml(html)`, `getJSON()`, `setJSON(doc)`, `getMarkdown()`,
  `setEditable(editable)`, and `focus()` cover common app integration needs.

Prefer JSON for lossless persistence when the app controls storage. Use HTML for
rendering and interop with existing HTML content. Markdown is an export format.

## UI Composition

Build the product UI in the app:

- Import only Qalma's public Angular primitives.
- Use `qalmaCommand` on buttons to preserve focus, disabled state, active state,
  and `aria-pressed`.
- Pass command arguments with `[qalmaCommandValue]`.
- Style `.qalma-content` and `.ProseMirror` from the app's stylesheet.
- Keep menus, popovers, upload flows, icon choices, and toolbar grouping in app
  code.
- Make controls keyboard reachable and use native buttons unless a custom
  component provides equivalent semantics.

Do not ask Qalma to render a toolbar from a plugin array. That is intentionally
outside the core library.

## Kits And Plugins

Most capabilities ship in two public shapes:

- A `...Plugin` is a single plugin. Configure it with `.configure(options)` when
  it accepts options, for example `HistoryPlugin.configure({ depth: 200 })`.
- A `...Kit` is a `readonly` array that bundles a plugin with its companion
  plugins. Spread it into `plugins`, for example `...TextFormattingKit`. Some
  kits wrap a single plugin for naming consistency.

Prefer the kit for a feature's default experience; reach for the individual
plugin when you need fine-grained selection or custom configuration.

## First-Party Plugin Selection

Select only the capabilities the user needs. Common public plugins include:

- Formatting: `TextFormattingKit`, `InlineCodePlugin`, `MonospacePlugin`,
  `SubscriptSuperscriptPlugin`, `ColorPlugin`, `HighlightPlugin`,
  `ClearFormattingPlugin`.
- Document structure: `HeadingsPlugin`, `BlockquotePlugin`, `ListsPlugin`,
  `TaskListPlugin`, `HorizontalRulePlugin`, `HardBreakPlugin`,
  `TrailingParagraphPlugin`.
- Rich content: `LinkPlugin`, `ImagePlugin`, `MentionPlugin`,
  `CodeBlockPlugin`, `TablePlugin` from `@qalma/editor/table`.
- Productivity and interaction: `HistoryPlugin`, `PasteRulesPlugin`,
  `PlaceholderPlugin`, `SelectionPlugin`, `SlashCommandPlugin`,
  `DragHandlePlugin`, `TextAlignPlugin`.

If the exact options or commands matter, inspect the installed package types or
the current docs before coding.

## Forms

Use `QalmaControlValueAccessor` from `@qalma/editor/forms` only when the app
needs Angular forms integration. Keep `@angular/forms` optional for apps that do
not use forms.
