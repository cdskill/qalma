---
title: Bundle Size
description: An honest, reproducible comparison of how much Qalma adds to your bundle versus other Angular rich-text editors.
---

# Bundle Size

How much does an editor actually cost your users? This page answers that with
**reproducible numbers**, not marketing. Every figure below comes from a script
you can run yourself — and if you do, you should get the same numbers.

> **TL;DR**
>
> - Among ProseMirror-based Angular editors, **Qalma is the lightest**.
> - A standard Qalma editor is **~77 KB gzip** — **38% lighter than Tiptap**
>   and **16% lighter than ngx-editor**.
> - Qalma adds just **~14 KB on top of the ProseMirror engine**; Tiptap's
>   abstraction layer adds **~61 KB** — about **4× more**.
> - **Quill is lighter** (~58 KB), but it's a different, monolithic engine.
>   We don't hide that — see [Caveats](#honest-caveats).

## What "a standard editor" means

Comparing editors only makes sense at an equivalent feature set. Each editor
below is built with:

> paragraph · bold · italic · underline · strike · headings · bullet &
> ordered lists · blockquote · code block · link · history (undo/redo) · hard
> break

The exact plugin/extension list for each library lives in the benchmark's
[`entries/`](https://github.com/cdskill/qalma/tree/main/bench/bundle-size/entries)
— that's the real contract, read it.

## Results — standard editor

Tree-shaken, minified, then compressed. **Angular, RxJS and zone.js are
excluded** because every Angular app already ships them — these numbers are the
code the editor itself adds to your bundle.

| Editor | Engine | Minified + gzip | Brotli | vs Qalma |
| ------ | ------ | --------------: | -----: | -------: |
| **Quill** <sub>(ngx-quill)</sub> | Quill | **58.0 KB** | 50.3 KB | −24% |
| **@qalma/editor** | ProseMirror | **76.8 KB** | 67.3 KB | — |
| **ngx-editor** | ProseMirror | **91.0 KB** | 78.6 KB | +18% |
| **Tiptap** <sub>(ngx-tiptap)</sub> | ProseMirror | **124.2 KB** | 98.1 KB | +62% |

<sub>Measured with esbuild + zlib. `@qalma/editor@0.1.0-beta.2`,
`ngx-editor@18.0.0`, `@tiptap/*@3.26.1`, `quill@2.0.3`, Node 24.</sub>

Among the three editors built on **the same engine (ProseMirror)**, Qalma is the
lightest — meaningfully lighter than both ngx-editor and Tiptap.

## The real story: engine floor vs toolkit overhead

Every ProseMirror editor must ship the ProseMirror engine — the document model,
state, view, base commands, keymap and history. That floor is identical for
Qalma, ngx-editor and Tiptap. What differs is how much each **toolkit adds on
top** of it:

| Layer | Minified + gzip |
| ----- | --------------: |
| ProseMirror engine (shared floor) | 62.7 KB |
| → Qalma adds | **+14.1 KB** |
| → ngx-editor adds | +28.2 KB |
| → Tiptap adds | **+61.4 KB** |

This is the number that matters when you compare ProseMirror editors: **Qalma's
overhead over the raw engine is roughly a quarter of Tiptap's.** Tiptap's
`@tiptap/core` abstraction layer is convenient, but you ship it.

## Tree-shaking: pay only for the plugins you import

Qalma is plugin-based and every plugin is side-effect-free, so a bundler drops
the ones you never import. The **ProseMirror engine is the floor** (~63 KB), so
the spread is bounded — but unused plugins genuinely fall away.

| Qalma editor | Minified + gzip |
| ------------ | --------------: |
| Minimal (bold/italic/underline/strike + history) | 70.6 KB |
| Standard (the full set above) | 76.8 KB |

You start just above the engine floor and add only what you use — the full
standard set is **~6 KB** over a minimal editor. Heavier optional plugins ship
from their own subpath (e.g. `@qalma/editor/table`, which pulls
`prosemirror-tables`) so they never weigh on editors that don't use them. (Quill
behaves differently: it's monolithic, so its ~58 KB is a fixed cost you pay even
for a minimal editor.)

## Honest caveats

We'd rather you trust the numbers than be impressed by them.

- **Quill is lighter on bytes.** At ~58 KB it beats Qalma's ~77 KB. Quill is a
  highly tuned monolith with a different architecture. Qalma's pitch isn't "the
  smallest possible editor" — it's the lightest **ProseMirror-based,
  Angular-native, headless** editor, with signals and a typed API instead of a
  wrapper around a black box.
- **Feature parity is approximate.** Tiptap's `StarterKit` bundles a few extras
  (horizontal rule, dropcursor, gapcursor) the Qalma set omits. The gap is small
  next to the 47 KB difference.
- **Angular binding overhead is excluded** and is small and similar across
  `ngx-*` wrappers; Qalma's primitives are measured as part of `@qalma/editor`.
- These are **transfer-size** numbers (gzip/brotli), not parse or runtime cost.

## Reproduce it

```sh
git clone https://github.com/cdskill/qalma
cd qalma/bench/bundle-size
npm install
npm run bench
```

The script bundles each editor with esbuild (`bundle`, `minify`, `treeShaking`),
compresses with `zlib`, and writes `results.json`. Methodology and the exact
entries are documented in the
[benchmark README](https://github.com/cdskill/qalma/tree/main/bench/bundle-size).

## Verify the inputs yourself

- [`@qalma/editor` on npm](https://www.npmjs.com/package/@qalma/editor) ·
  [bundlephobia](https://bundlephobia.com/package/@qalma/editor)
- [Tiptap](https://bundlephobia.com/package/@tiptap/starter-kit) ·
  [ngx-editor](https://bundlephobia.com/package/ngx-editor) ·
  [Quill](https://bundlephobia.com/package/quill)

> Note: bundlephobia reports packages in isolation and **excludes peer
> dependencies** — `@tiptap/core` shows ~29 KB there because `@tiptap/pm` and
> the extensions are peers, not because a real Tiptap editor is that small. It's
> also frequently rate-limited. That's exactly why this page ships a local,
> reproducible build instead.
