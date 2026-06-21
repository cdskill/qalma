# Contributing to Qalma

Thanks for taking the time to contribute! Qalma is an Angular-first, headless
rich text editor toolkit built on ProseMirror. Bug reports, feature ideas, docs
fixes, and pull requests are all welcome.

This project is in **beta** — the public API is stabilizing but may still change
before `1.0`. Feedback on the API surface and developer experience is especially
valuable right now.

## Prerequisites

- **Node.js** `>= 24`
- **pnpm** `10.23.0` (the repo pins it via `packageManager`)

```sh
pnpm install
```

## Project layout

| Path           | What it is                                              |
| -------------- | ------------------------------------------------------- |
| `libs/editor`  | The published package, `@qalma/editor`.                 |
| `apps/sandbox` | A full example app built on the public editor API.      |
| `apps/docs`    | The documentation site published to https://qalma.dev.  |
| `bench`        | Reproducible bundle-size benchmark.                     |

## Common commands

```sh
pnpm start           # run the sandbox example app
pnpm serve:docs      # run the documentation site locally

pnpm test            # run all unit tests
pnpm test:editor     # run the editor library tests only
pnpm lint            # lint everything

pnpm nx build editor # build the library
```

Always run `pnpm nx build editor` before opening a PR — a successful library
build is what catches issues `tsc` alone misses (for example, a new runtime
dependency that must be declared in `libs/editor/ng-package.json`'s
`allowedNonPeerDependencies`).

## Plugin conventions

A `QalmaPlugin` lives under `libs/editor/src/lib/plugins`, with its tests
co-located in a `*.spec.ts` next to it. Markdown input rules are co-located with
the plugin that owns them (via the `inputRules` option, default `true`) — there
is no monolithic markdown plugin. See `headings.ts` as the reference model.

## Commit messages

Commits **must** follow [Conventional Commits](https://www.conventionalcommits.org/)
**with a scope** — the scope is mandatory:

```
type(scope): summary
```

Examples:

```
feat(editor): add task list plugin
fix(editor): keep selection after toggling a heading
docs(docs): document the markdown serializer
```

Common types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`. The changelog
is generated from these messages, so write them for the reader.

## Pull requests

1. Fork the repo and create a branch from `main`.
2. Make your change, with tests where it makes sense.
3. Run `pnpm lint`, `pnpm test`, and `pnpm nx build editor` locally.
4. Open the PR with a clear description of the what and the why.

## License

By contributing, you agree that your contributions are licensed under the
[MIT License](./libs/editor/LICENSE).
