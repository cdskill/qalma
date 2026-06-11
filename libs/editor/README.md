# @qalma/editor

Headless Angular components and plugin primitives for the Qalma editor.

```ts
const editor = createQalmaEditor({
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
<qalma-editor [editor]="editor">
  <qalma-toolbar>
    <button qalmaCommand="toggleBold">Bold</button>
    <button qalmaCommand="undo">Undo</button>
    <button qalmaCommand="redo">Redo</button>
  </qalma-toolbar>

  <qalma-content />
</qalma-editor>
```

## Styling images

`ImagePlugin` renders the `image` node as a plain `<img>` with no inline
styles or classes — the library stays headless. The node is part of a
paragraph's inline content, so if your global CSS resets images to
`display: block` (the default in Tailwind's preflight, normalize.css, etc.),
inline images will behave like standalone blocks: the cursor can't be placed
next to them and `text-align` won't affect their position.

Scope an override to the editor content, for example:

```css
qalma-content .ProseMirror img {
  display: inline-block;
  vertical-align: bottom;
}
```
