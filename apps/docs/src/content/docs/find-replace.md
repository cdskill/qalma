---
title: Find & Replace
description: Build consumer-owned search UI over Qalma's headless find and replace state.
---

# Find & Replace

`FindReplacePlugin` owns search state, match decorations, navigation, and
replacement. Your Angular template owns the search bar.

```typescript
const editor = createQalmaEditor({
  plugins: [
    FindReplacePlugin.configure({
      caseSensitive: false,
      wholeWord: false,
      className: 'my-find-match',
      activeClassName: 'my-find-active',
    }),
  ],
});

editor.execute('setFindQuery', {
  query: 'Angular',
  wholeWord: true,
});
editor.execute('findNext');
editor.execute('replaceCurrent', 'Qalma');
editor.execute('replaceAll', { replacement: 'editor' });
editor.execute('clearFind');
```

Read `query&lt;FindReplaceState&gt;('findReplace')` for `total`,
`activeMatch` (one-based), and the current `{ from, to }` range. Search works
across adjacent text nodes split by marks. Navigation wraps at the first and
last result.

Style `.qalma-find-match` and `.qalma-find-match-active`, or configure your own
single class names. Add an `aria-live` result count and keep inputs/buttons in
your component so focus policy remains yours.
