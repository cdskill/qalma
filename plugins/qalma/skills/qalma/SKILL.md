---
name: qalma
description: Use when building with Qalma, the Angular-first headless rich text editor. Covers installing @qalma/editor, composing Angular UI around Qalma primitives (or adopting the optional @qalma/kit component layer for ready-made toolbar, menus, and popovers), selecting and configuring first-party plugins, authoring custom Qalma plugins, migrating from another editor, debugging editor behavior, or contributing to the Qalma repository.
---

# Qalma

Qalma is a headless, Angular-first rich text editor toolkit built on
ProseMirror. The public developer experience is the product: typed Angular
contracts, signal-based state, consumer-owned UI, accessible composition, and
plugins selected explicitly in TypeScript.

## Choose The Workflow

- **Use Qalma in an Angular app:** read
  [editor-integration.md](references/editor-integration.md).
- **Build accessible toolbar, menus, popovers, upload UI, or other editor
  chrome:** read [editor-integration.md](references/editor-integration.md).
  Presentation is consumer-owned by default; the optional first-party
  `@qalma/kit` package offers ready-made, restylable versions of that chrome
  when you would rather adopt than hand-roll it.
- **Author or change a Qalma plugin:** read
  [plugin-authoring.md](references/plugin-authoring.md).
- **Migrate from another editor or debug behavior:** read
  [troubleshooting.md](references/troubleshooting.md).
- **Work inside the Qalma source repo:** read
  [contributing.md](references/contributing.md) before editing.

## Core Rules

- Use public imports from `@qalma/editor` and optional public entrypoints such as
  `@qalma/editor/forms` or `@qalma/editor/table`.
- Do not import from `@qalma/editor/src`, `libs/editor/src/lib/prosemirror`, or
  other internal paths in consumer apps.
- Create editors with `createQalmaEditor({ content, plugins })`; plugin
  selection belongs in TypeScript.
- Compose UI explicitly in Angular templates with `<qalma-editor>`,
  `<qalma-toolbar>`, `<qalma-content>`, and `qalmaCommand`.
- Keep toolbar labels, icons, popovers, upload flows, menus, layout, and styling
  in the consuming application — or adopt the optional `@qalma/kit` package for
  ready-made versions you can still restyle, reconfigure, and replace per piece.
- Treat Qalma plugins as behavior providers: schema, commands, command state,
  queries, shortcuts, and ProseMirror plugins.
- Prefer Qalma-owned options and command names over leaking raw ProseMirror or
  third-party library details into app contracts.

## Before Changing Code

1. Inspect the app's Angular version, package manager, existing editor code,
   styling system, and tests.
2. Check the installed `@qalma/editor` version and public exports before writing
   examples.
3. If the task relies on a feature that may have changed, prefer current local
   package types or the docs at `https://qalma.dev/docs`.
4. Keep the implementation small: add only the plugins, UI controls, and tests
   needed for the user-visible behavior.

## Validation

Prefer the host repo's commands. For Angular apps, useful checks are:

```sh
npm test
npm run build
npx tsc --noEmit
```

Inside the Qalma repo, follow [contributing.md](references/contributing.md) for
the narrower Nx checks.
