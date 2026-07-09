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
  plugins: [...TextFormattingKit, HistoryPlugin.configure({ depth: 200, newGroupDelay: 750 })],
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

Do not ask the core `@qalma/editor` library to render a toolbar from a plugin
array. That is intentionally outside the core; the optional `@qalma/kit` package
below is the opt-in for data-driven chrome.

## Optional UI Kit (@qalma/kit)

`@qalma/editor` stays headless. `@qalma/kit` is a separate, optional package that
provides ready-made, Tailwind-first chrome for teams that would rather adopt than
hand-roll it. It never becomes required: install it only for the pieces you want,
restyle them through your token contract, and replace any piece with your own
component at any time. Default to consumer-owned UI; reach for the kit when its
defaults match the surface you are building.

Install it alongside the editor:

```sh
npm install @qalma/kit @ng-icons/core @ng-icons/lucide
```

What it offers:

- `QalmaButton` — a token-driven directive for native `<button>`/`<a>` hosts.
- `QalmaToolbarButton` and `QalmaToolbarRegistry` — icon command buttons and a
  data-driven toolbar composed from `QALMA_TOOLBAR_*` fragments. This is the
  opt-in that renders a toolbar from data.
- `QalmaMentionMenu`, `QalmaSlashCommandMenu` — presentational suggestion
  surfaces; your controller still owns filtering and insertion.
- `QalmaLinkPopover` (with `LinkPopoverController`), `QalmaContextualToolbar`
  (with `QalmaSelectionToolbarDirective`), and `QalmaDragHandle` (with
  `QalmaDragHandleDirective`) — editor overlays wired to the headless API.
- Behavior primitives — `anchorToRect`, `flipAbovePlacement`,
  `DismissibleOverlay`, `KeyboardNavigableList`, `cn` — for building your own
  chrome with the same placement, dismissal, and keyboard logic.

Theming: the kit does not ship a compiled stylesheet. With Tailwind v4, the
consumer must point Tailwind at the installed package, for example from a
standard `src/styles.css`:

```css
@import 'tailwindcss';
@source '../node_modules/@qalma/kit';
```

The kit reads shadcn-style Tailwind tokens (`bg-popover`,
`text-muted-foreground`, `border-border`, …). Provide that token contract once;
there is no `--qalma-*` prefix. Icons resolve by name through `@ng-icons`; use
`provideQalmaToolbarIcons()` for the defaults and your own `provideIcons()` to
override or extend them.

When the app already owns controls through PrimeNG, Material, Kendo, ng-zorro, or
a private design system, keep binding them to `editor.execute()` and skip the
kit, or use only the pieces that fit. See `https://qalma.dev/kit` for the full
component reference.

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
