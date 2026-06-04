# @angular-rte/editor

Headless Angular components and plugin primitives for the Angular RTE editor.

```ts
const editor = createRteEditor({
  plugins: [
    ...TextFormattingKit,
    HistoryPlugin.configure({
      depth: 200,
      newGroupDelay: 750,
    }),
  ],
});
```

```html
<rte-editor [editor]="editor">
  <rte-toolbar>
    <button rteCommand="toggleBold">Bold</button>
    <button rteCommand="undo">Undo</button>
    <button rteCommand="redo">Redo</button>
  </rte-toolbar>

  <rte-content />
</rte-editor>
```
