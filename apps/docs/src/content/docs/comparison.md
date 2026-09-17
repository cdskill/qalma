---
title: Comparison
description: Choose Qalma, Tiptap, ngx-editor, Quill, or raw ProseMirror based on product constraints rather than slogans.
---

# Editor Comparison

There is no universally best editor. Qalma is designed for teams that want an
Angular-native, headless API while retaining ProseMirror's document model.

| Option              | Strong fit                                                              | Main trade-off                                                         |
| ------------------- | ----------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Qalma**           | Angular 21/22, signals, consumer-owned UI, typed plugin contracts       | Pre-1.0 ecosystem and smaller community                                |
| **Raw ProseMirror** | Maximum engine control and custom document behavior                     | You design the Angular integration and public API yourself             |
| **Tiptap**          | Large extension ecosystem and cross-framework familiarity               | More abstraction and bundle overhead; Angular is not the core surface  |
| **ngx-editor**      | Established Angular editor with a conventional ready surface            | Less emphasis on headless composition and Qalma-style plugin contracts |
| **Quill**           | Straightforward conventional rich text with a lighter monolithic engine | A different document model with less ProseMirror-style schema control  |

Choose Qalma when the toolbar, menus, uploads, and design system must remain
application code, and when a typed Angular controller matters more than a
large ready-made extension marketplace. Do not choose it yet if you require a
mature third-party ecosystem, a guaranteed stable 1.0 API, or turnkey
collaboration.

For bytes, use the reproducible [Bundle Size](/docs/bundle-size) benchmark.
Feature parity is approximate and the page publishes caveats alongside the
numbers. The benchmark now measures the optional `@qalma/kit` separately so
the editor engine and UI layer are not conflated.
