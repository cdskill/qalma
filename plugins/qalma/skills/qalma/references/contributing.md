# Contributing To Qalma

Use this reference only when working inside the Qalma source repository.

## Repository Rules

- Keep `libs/editor` headless.
- Let consumers select plugins in TypeScript and compose their UI explicitly.
- Treat `apps/sandbox` as a real consumer of the public API.
- Keep ProseMirror as the internal engine unless an explicit API decision says
  otherwise.
- Keep first-party plugins in `libs/editor/src/lib/plugins` until a real
  dependency, release, ownership, or bundle boundary justifies extraction.
- Preserve unique plugin keys, schema names, command names, query names,
  command names, and shortcuts.
- Keep the public barrel small and intentional.

## Where Code Belongs

- `libs/editor/src/lib/editor`: Angular primitives and controller lifecycle.
- `libs/editor/src/lib/plugins`: optional editor capabilities.
- `libs/editor/src/lib/prosemirror`: private engine integration.
- `apps/sandbox`: executable consumer documentation.
- `apps/docs`: public documentation.
- `plugins/qalma`: public agent skills for external users and contributors.

## Public Capability Changes

When changing a plugin, command, query, kit, option, docs example, or workflow:

1. Update `libs/editor/README.md` when the package surface changes.
2. Update docs pages and navigation in `apps/docs` when user-facing behavior
   changes.
3. Update `apps/sandbox` only through public `@qalma/editor` APIs.
4. Update `plugins/qalma/skills/qalma` when public agent guidance becomes stale.
5. Update `AGENTS.md` or repository skills when durable workflow guidance
   changes.

## Validation

Run the narrowest checks that cover the change. Important Qalma checks include:

```sh
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

If user-visible editor behavior changes, verify it in a real browser when
browser tooling is available.
