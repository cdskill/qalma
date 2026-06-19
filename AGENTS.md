# Qalma Repository Guidance

## Mission

Build an Angular-first, headless, plugin-based rich text editor on ProseMirror.
The product should offer the composability expected from modern editors such as
Plate or Tiptap while feeling native to Angular.

The public developer experience is the product. Prefer typed Angular-facing
contracts, signal-based state, consumer-owned UI, accessibility, and deliberate
extension points over exposing raw ProseMirror details.

## Repository Skills

- Use `qalma-architecture` for product vision, repository structure,
  public API design, new library boundaries, and architectural refactors.
- Use `qalma-plugin-development` whenever adding, changing, reviewing, or
  removing an editor plugin, command, mark, node, shortcut, or ProseMirror
  behavior.
- Use `qalma-docs-sync` after adding, changing, reviewing, or removing a public
  plugin capability that affects `apps/docs`, docs navigation, playground
  behavior, `libs/editor/README.md`, or durable workflow guidance.
- Use `git-commit` when the user invokes `/commit` or asks to generate and
  create a conventional commit from staged changes.
- Use `qalma-release` when discussing or changing versioning, the release
  scripts, the GitHub Actions release workflow, Nx release configuration, or
  npm publishing for `@qalma/editor`.

## Architectural Invariants

- Keep `libs/editor` headless. Do not bake toolbar buttons, product styling, or
  a fixed feature set into editor primitives.
- Let consumers select plugins in TypeScript and compose their UI explicitly
  through Angular templates and content projection.
- Treat `apps/sandbox` as a real consumer and executable documentation. It must
  use only the intentional public API from `@qalma/editor`.
- Keep ProseMirror as the internal engine. Expose it publicly only after an
  explicit API design decision.
- Let a `QalmaPlugin` contribute schema nodes or marks, commands, command states,
  shortcuts, and ProseMirror plugins.
- Expose configurable features through Qalma-owned option interfaces,
  immutable defaults, and validation. Do not leak a third-party options object
  as the public contract by default.
- Keep first-party plugins in `libs/editor/src/lib/plugins` until a real
  dependency, release, ownership, or bundle boundary justifies a dedicated lib.
- Preserve unique plugin keys, schema names, command names, and shortcuts.
- Keep the public barrel intentional and small. Do not export internal
  ProseMirror helpers or compatibility aliases without a concrete need.

## Angular Conventions

- Use standalone Angular APIs, signal-based inputs and state, `OnPush`, inline
  templates, and no component styles for headless library primitives.
- Keep application styling in the consumer. The editor library must not depend
  on Tailwind.
- Prefer focused primitives and directives over configuration-driven toolbar
  rendering inside the library.
- Remove dead code and stale exports while touching an area.

## Working Agreement

- Use `pnpm` and Nx project tasks.
- Read the current implementation before proposing or applying architecture.
- Keep changes scoped and avoid speculative abstractions.
- Add behavior to the sandbox only through the same public API a consumer uses.
- Update `AGENTS.md` or the relevant repository skill when a change makes its
  architecture, workflow, public API, or validation guidance inaccurate.
- Cover public behavior and important failure modes with the narrowest useful
  tests.
- Do not commit unless the user explicitly asks.
- If any local server is started for testing, stop it before the final response
  and verify that its port is free.

## Validation

Run the checks relevant to the change, expanding coverage when contracts or
shared behavior change:

```bash
pnpm nx run-many -t lint
pnpm nx test editor
pnpm nx test sandbox
pnpm nx build sandbox
pnpm exec tsc -p libs/editor/tsconfig.lib.json --noEmit
pnpm exec tsc -p libs/editor/tsconfig.spec.json --noEmit
pnpm exec tsc -p apps/sandbox/tsconfig.json --noEmit
pnpm exec tsc -p apps/sandbox/tsconfig.spec.json --noEmit
pnpm exec tsc -p apps/sandbox-e2e/tsconfig.json --noEmit
```

For user-visible editor behavior, also verify the sandbox interaction in a real
browser. If Playwright browsers are unavailable, report that limitation and use
the available browser tooling.

Test, E2E, snapshot, test config, workflow, CODEOWNERS, and guard-script changes
must pass `pnpm guard:protected-test-changes` in CI. Pull requests that touch
those protected files require the `approved-test-change` label after human
review.
