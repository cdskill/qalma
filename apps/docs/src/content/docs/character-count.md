---
title: Character Count
description: Read character and word counts and optionally enforce a document limit.
---

# Character Count

`CharacterCountPlugin` exposes a reactive query and can reject edits that grow
the document beyond a configured limit.

```typescript
const editor = createQalmaEditor({
  plugins: [CharacterCountPlugin.configure({ limit: 2_000 })],
});

readonly count = computed(
  () => this.editor.query<CharacterCountState>('characterCount')!,
);
```

The state contains `characters`, `words`, `limit`, `remaining`, and
`isOverLimit`. The default `grapheme` mode counts a family emoji or combined
accent as one visible character; choose `mode: 'codePoint'` for code-point
counting.

A limited plugin blocks transactions that increase an over-limit document, but
still permits deletions. `setHtml()` and document restoration remain explicit
application operations and may load over-limit content; the query reports that
state so your UI can explain it.

```html
<p aria-live="polite">{{ count().characters }} / {{ count().limit }} characters</p>
```
