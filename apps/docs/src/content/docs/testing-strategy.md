---
title: Testing Strategy
description: How Qalma protects plugin behavior, sandbox integration, browser workflows, and test-change review.
---

# Testing Strategy

Qalma's tests are layered around the same boundary as the product: a headless
editor library, first-party plugins, consumer-owned Angular UI, and a real
browser sandbox.

The goal is not only to catch regressions. The tests document how a plugin is
allowed to contribute schema, commands, command state, shortcuts, queries, and
runtime ProseMirror behavior without turning `apps/sandbox` into the only proof
that the editor works.

## Test layers

| Layer | Location | Purpose |
| ----- | -------- | ------- |
| Editor unit tests | `libs/editor/src/lib` | Protect controller behavior, Angular primitives, schema composition, and shared editor contracts. |
| Plugin unit tests | `libs/editor/src/lib/plugins/*.spec.ts` | Prove each first-party plugin in isolation: public names, schema, commands, command state, shortcuts, options, and important ProseMirror edges. |
| Sandbox unit tests | `apps/sandbox/src/app/app.spec.ts` | Verify the sandbox as a consumer of the public `@qalma/editor` API, including toolbar wiring and application-owned UI behavior. |
| Sandbox E2E tests | `apps/sandbox-e2e` | Exercise editing flows in Chromium with Playwright so browser-only selection, focus, clipboard, and keyboard behavior are covered. |
| Protected-change guard | `tools/guard-protected-test-changes.mjs` | Requires human review before a PR changes tests, CI, E2E setup, snapshots, or the guard itself. |

## Plugin contract vs plugin specs

`plugin-contract.spec.ts` stays focused on global invariants that apply to every
editor composition:

- plugin keys must be unique;
- schema node and mark names must be unique;
- commands, command states, queries, and shortcuts must be unique;
- configurable plugins should keep immutable defaults and validate options.

Dedicated plugin specs cover behavior that belongs to one plugin. A first-party
plugin should have targeted tests for the pieces it exposes:

- stable public plugin key and schema name;
- schema node or mark parsing and serialization;
- command success, command failure, and command state;
- keyboard shortcut mapping;
- option defaults, `.configure()` immutability, and validation errors;
- ProseMirror edge cases such as empty selections, nested blocks, list items,
  atom nodes, stored marks, non-editable transactions, and undo boundaries.

Keep these tests inside `libs/editor` and avoid importing from `apps/sandbox`.
The sandbox is a consumer, not the plugin test harness.

## First-party plugin checklist

When adding or changing a plugin in `libs/editor/src/lib/plugins`:

1. Add or update a dedicated `*.spec.ts` beside the plugin.
2. Use `plugin-contract.spec.ts` only for repo-wide invariants.
3. Test the public command names and query names that consumers call through
   `editor.execute()`, `editor.isCommandActive()`, and `editor.query()`.
4. Test configured and default behavior when the plugin exposes `.configure()`.
5. Add sandbox or docs playground coverage only when the change affects
   consumer-owned UI or browser interaction.
6. Update the plugin docs page and navigation when public behavior changes.

Shared test helpers can live outside the public library build, for example in
`libs/editor/testing`, when they reduce repeated ProseMirror setup. Do not
export those helpers from `@qalma/editor`.

## Local validation

For editor plugin changes, start with:

```bash
pnpm nx test editor -- --run
pnpm exec tsc -p libs/editor/tsconfig.spec.json --noEmit
pnpm exec tsc -p libs/editor/tsconfig.lib.json --noEmit
```

For sandbox behavior, add:

```bash
pnpm nx test sandbox -- --run
pnpm exec tsc -p apps/sandbox/tsconfig.spec.json --noEmit
pnpm exec tsc -p apps/sandbox/tsconfig.json --noEmit
pnpm nx build sandbox
```

For browser behavior, add:

```bash
pnpm exec playwright install --with-deps chromium
pnpm nx e2e sandbox-e2e -- --project=chromium
```

For docs-only changes, use:

```bash
pnpm exec tsc -p apps/docs/tsconfig.json --noEmit
pnpm nx build docs
```

If a change touches tests, E2E files, snapshots, test setup, test TypeScript
configs, GitHub workflows, CODEOWNERS, or the guard script, run:

```bash
pnpm guard:protected-test-changes
```

Outside a pull request this command reports protected files and exits
successfully. In CI on a pull request, protected changes fail until a reviewer
adds the `approved-test-change` label. The pull request workflow also runs when
labels are added or removed, so applying the approval label starts a fresh guard
run and removing it makes the required check reflect the revoked approval.

## CI and release gates

The CI workflow validates lint, typecheck, Vitest, sandbox build, and Playwright
sandbox E2E. Release tags run the same safety net before publishing
`@qalma/editor`.

Playwright browsers are installed in CI and release because Vitest with jsdom is
not a substitute for a real browser. Plugin unit tests are fast and precise, but
selection, focus, clipboard, pointer, and keyboard behavior can still differ in
Chromium. The release workflow treats the sandbox E2E suite as a publish gate so
Qalma does not ship a package that passes jsdom while failing in an actual
consumer surface.

## What remains fragile

Unit tests can prove plugin contracts and many ProseMirror transformations, but
they do not replace browser coverage for interactive editing. Add or extend
Playwright tests when a change depends on DOM selection, focus movement,
clipboard data, drag interactions, or event ordering.

Plugin specs should also grow with bugs. If a regression escapes through a
sandbox test, add the narrow plugin-level case first, then keep the sandbox or
E2E assertion only when it proves real consumer integration.
