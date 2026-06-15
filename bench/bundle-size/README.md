# Bundle-size benchmark

Reproducible measurement of how much JavaScript each Angular rich-text editor
adds to your application bundle — **tree-shaken, minified, and gzipped** — for a
standard editor with an equivalent feature set.

The numbers published on [qalma.dev/docs/bundle-size](https://qalma.dev/docs/bundle-size)
come from this folder.

## Reproduce

```sh
cd bench/bundle-size
npm install
npm run bench
```

You should get the same numbers (± a few bytes across esbuild patch versions).
Results are also written to `results.json`.

## What is measured

For each editor, [`entries/`](./entries) contains a tiny module that builds a
**standard editor** with the same feature set:

> paragraph · bold · italic · underline · strike · headings · bullet & ordered
> lists · blockquote · code block · link · history (undo/redo) · hard break

`build.mjs` bundles each entry with [esbuild](https://esbuild.github.io/)
(`bundle: true`, `minify: true`, `treeShaking: true`, `format: esm`), then
compresses the output with Node's `zlib` (`gzip` level 9, `brotli` quality 11).

### Why Angular is excluded

`@angular/*`, `rxjs` and `zone.js` are marked **external**. Every Angular app
already ships them, so counting them would tell you nothing about the editor.
We measure only the code the editor itself contributes.

This is also why the comparison is fair across libraries: `@qalma/editor` and
`ngx-editor` bundle ProseMirror as regular dependencies (counted here), while
the Angular bindings `ngx-tiptap` and `ngx-quill` push their engines
(`@tiptap/*`, `quill`) into peer dependencies. We measure the **engine + the
features**, i.e. what actually lands in your bundle, regardless of how each
project splits its `package.json`.

## Why not just read bundlephobia?

bundlephobia reports each package in isolation and **excludes peer
dependencies**. So `@tiptap/core` shows ~29 KB gzip with `dependencyCount: 0`,
hiding `@tiptap/pm` and every extension — a real Tiptap editor is ~124 KB.
bundlephobia is also frequently rate-limited (`429 Too Many Requests`). A local
build is reproducible and counts the whole picture.

As a sanity check, bundlephobia's `ngx-editor` figure (~89 KB gzip, deps
bundled) matches this benchmark's ~91 KB.

## Caveats

- Feature parity is approximate. The exact plugin/extension list per editor is
  in `entries/*.js` — read them; that is the contract.
- Tiptap's `StarterKit` bundles a few extras (e.g. horizontal rule, dropcursor,
  gapcursor) that the Qalma set omits. The gap is small relative to the
  difference measured.
- Quill is monolithic: the default `quill` entry ships its core, all formats
  and the snow theme's JS. It is not meaningfully tree-shakable, so its number
  is roughly a fixed floor regardless of which features you use.
- These are **payload** numbers (compressed transfer size), not parse/runtime
  cost.

## Pinned versions

See `package.json`. Current run: `@qalma/editor@0.0.1-alpha.5`,
`ngx-editor@18.0.0`, `@tiptap/*@3.26.1`, `quill@2.0.3`.
