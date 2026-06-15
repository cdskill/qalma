---
title: Contributing
description: Work on Qalma docs and editor code with the repository's pnpm, Nx, Angular, and validation workflow.
---

# Contributing

Qalma uses `pnpm`, Nx, Angular 21, Analog for the docs app, and a headless
editor library in `libs/editor`.

## Repository layout

| Path | Purpose |
| ---- | ------- |
| `libs/editor` | Public `@qalma/editor` package and first-party plugins. |
| `apps/docs` | Documentation site and live playground. |
| `apps/sandbox` | Consumer-style demo app for editor behavior. |
| `apps/docs/src/content/docs` | Markdown docs pages. |
| `apps/docs/src/app/docs/docs-nav.ts` | Docs sidenav entries. |

## Local commands

```bash
pnpm install
```

```bash
pnpm nx serve docs
```

```bash
pnpm nx serve sandbox
```

```bash
pnpm nx build docs
```

```bash
pnpm nx build sandbox
```

## Documentation workflow

When documenting a plugin or public capability:

1. Read the implementation in `libs/editor/src/lib/plugins` or
   `libs/editor/src/lib/editor`.
2. Check the public exports in `libs/editor/src/index.ts`.
3. Update or create the markdown page in `apps/docs/src/content/docs`.
4. Keep snippets importing from `@qalma/editor`, not internal paths.
5. Keep UI examples consumer-owned. Toolbar buttons, popovers, menus, uploads,
   and design-system components belong in the app.
6. If the sidenav changes, update `apps/docs/src/app/docs/docs-nav.ts`.

## Editor contribution rules

First-party plugins should expose Qalma-owned options, immutable defaults, and
validation. Preserve unique plugin keys, schema names, command names, query
names, and shortcuts.

Do not bake product styling or fixed toolbar UI into `libs/editor`. The library
should stay headless.

## Validation

Run the checks that match your change. For docs-only changes, start with:

```bash
pnpm exec tsc -p apps/docs/tsconfig.json --noEmit
```

```bash
pnpm nx build docs
```

For editor or sandbox behavior changes, expand to:

```bash
pnpm exec tsc -p libs/editor/tsconfig.lib.json --noEmit
```

```bash
pnpm exec tsc -p apps/sandbox/tsconfig.json --noEmit
```

```bash
pnpm nx build sandbox
```

For user-visible editor behavior, verify the sandbox or docs playground in a
real browser.
