<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/cdskill/qalma/main/apps/docs/public/qalma-mark-dark.svg" />
    <img src="https://raw.githubusercontent.com/cdskill/qalma/main/apps/docs/public/qalma-mark-light.svg" alt="Qalma" width="72" height="72" />
  </picture>
</p>

<h1 align="center">Qalma</h1>

<p align="center">
  Angular-first, headless rich text editor toolkit built on <a href="https://prosemirror.net/">ProseMirror</a>.
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@qalma/editor"><img alt="npm version" src="https://img.shields.io/npm/v/@qalma/editor?color=d9a45b&label=%40qalma%2Feditor&logo=npm" /></a>
  <a href="https://www.npmjs.com/package/@qalma/editor"><img alt="npm downloads" src="https://img.shields.io/npm/dm/@qalma/editor?color=d9a45b&logo=npm" /></a>
  <a href="https://packagephobia.com/result?p=@qalma/editor"><img alt="install size" src="https://packagephobia.com/badge?p=@qalma/editor" /></a>
  <a href="https://www.npmjs.com/package/@qalma/editor"><img alt="license" src="https://img.shields.io/npm/l/@qalma/editor?color=d9a45b" /></a>
  <br />
  <img alt="Angular" src="https://img.shields.io/badge/Angular-%E2%89%A521-dd0031?logo=angular&logoColor=white" />
  <img alt="Built on ProseMirror" src="https://img.shields.io/badge/built%20on-ProseMirror-6c5ce7" />
  <img alt="Types included" src="https://img.shields.io/badge/types-included-3178c6?logo=typescript&logoColor=white" />
  <a href="https://github.com/cdskill/qalma/actions/workflows/deploy.yml"><img alt="Deploy" src="https://img.shields.io/github/actions/workflow/status/cdskill/qalma/deploy.yml?branch=main&label=docs&logo=github" /></a>
</p>

<p align="center">
  <a href="https://qalma.dev/">Documentation</a>
  ·
  <a href="https://www.npmjs.com/package/@qalma/editor">npm</a>
  ·
  <a href="https://github.com/cdskill/qalma/issues">Issues</a>
</p>

---

> **Status:** alpha (`0.0.x`). The public API may still change between releases.

Qalma gives you a typed editor controller, signal-based state, and a small set
of unstyled Angular primitives (`<qalma-editor>`, `<qalma-content>`,
`<qalma-toolbar>`, `qalmaCommand`). Everything else — toolbar UI, styling,
menus, popovers — stays in your app. You choose the plugins, you own the markup.

## Why Qalma

- **Angular-native** — standalone components, signal-based state, `OnPush`, and
  typed contracts instead of leaked ProseMirror internals.
- **Headless** — no baked-in toolbar, theme, or feature set. The library ships
  behavior; your app owns every pixel.
- **Plugin-based** — compose schema nodes/marks, commands, shortcuts, and
  ProseMirror plugins through `QalmaPlugin`s and ready-made kits.
- **ProseMirror under the hood** — a battle-tested document engine, kept
  internal until an API is deliberately designed.

## Quick start

```sh
npm install @qalma/editor
```

`@angular/core` `>=21 <22` is a peer dependency.

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
    <button qalmaCommand="toggleBold">Bold</button>
    <button qalmaCommand="undo">Undo</button>
    <button qalmaCommand="redo">Redo</button>
  </qalma-toolbar>

  <qalma-content />
</qalma-editor>
```

See the [`@qalma/editor` README](libs/editor/README.md) for the full controller
API, components, and the list of available plugins.

## Repository layout

This is an [Nx](https://nx.dev) monorepo.

| Path           | Description                                                          |
| -------------- | ------------------------------------------------------------------- |
| `libs/editor`  | `@qalma/editor` — the published, headless editor toolkit.           |
| `apps/sandbox` | A real consumer app and executable documentation of the public API. |
| `apps/docs`    | The documentation site published to [qalma.dev](https://qalma.dev/). |
| `infra`        | Infrastructure (S3 + CloudFront) for the docs site.                 |

## Development

Requires [pnpm](https://pnpm.io/) (`pnpm@10`).

```sh
pnpm install

pnpm nx serve sandbox      # run the sandbox consumer app
pnpm nx serve docs         # run the documentation site
pnpm nx run-many -t lint   # lint everything
pnpm nx build sandbox      # production bundle
```

Run `pnpm nx graph` to explore the project graph.

## Contributing

Issues and pull requests are welcome. Please read [AGENTS.md](AGENTS.md) for the
architectural invariants and working agreement before opening a PR.

## License

MIT © Qalma
