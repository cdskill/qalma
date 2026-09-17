---
title: Unique IDs
description: Assign stable, serializable IDs to configured document nodes.
---

# Unique IDs

`UniqueIdPlugin` adds stable IDs to selected node types. Paragraphs are the
default:

```typescript
const editor = createQalmaEditor({
  plugins: [
    HeadingsPlugin,
    BlockquotePlugin,
    UniqueIdPlugin.configure({
      nodeTypes: ['paragraph', 'heading', 'blockquote'],
      attributeName: 'data-qalma-id',
    }),
  ],
});
```

IDs live in lossless JSON as `attrs.qalmaId` and round-trip through HTML via
the configured `data-*` attribute. Existing IDs are preserved; missing or
duplicate IDs receive fresh values after mounting or a document-changing
transaction.

The `uniqueId` query returns the nearest configured node at the selection:

```typescript
const block = editor.query<UniqueIdState>('uniqueId');
// { id, nodeType, position } | null
```

Pass `generateId` when your product has its own identifier policy. It must
return a non-empty unique string. Stable IDs are useful for comments,
annotations, server diffs, and future collaboration metadata; they do not
themselves implement collaboration.
