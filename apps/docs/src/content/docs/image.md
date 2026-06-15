---
title: Image
description: Insert, update, query, and render inline images with ImagePlugin.
---

# Image

`ImagePlugin` adds an inline, selectable, draggable `image` node. It does not
render an upload UI. Your Angular app owns URL inputs, file pickers, image
validation copy, and previews.

```typescript
import { ImagePlugin, createQalmaEditor } from '@qalma/editor';

const editor = createQalmaEditor({
  plugins: [ImagePlugin],
});
```

## Commands and query

| Contract | Description |
| -------- | ----------- |
| `insertImage` | Inserts an inline image at the current selection and selects it. |
| `updateImage` | Updates the selected image node. |
| `removeImage` | Deletes the selected image node. |
| `query&lt;ImageState&gt;('image')` | Returns the selected image state, or `null` when an image node is not selected. |

`insertImage` accepts either a string URL or an object.

```typescript
editor.execute('insertImage', {
  src: 'https://picsum.photos/seed/qalma-ink/720/360',
  alt: 'A calm, textured backdrop',
  title: 'Example image',
});
```

`updateImage` accepts a partial image value and merges it with the currently
selected image before validating the result.

```typescript
editor.execute('updateImage', {
  alt: 'Updated alt text',
  title: null,
});
```

## Image state

```typescript
import { ImageState } from '@qalma/editor';

const image = editor.query<ImageState>('image');

if (image) {
  console.log(image.src, image.alt, image.title, image.from, image.to);
}
```

| Field | Description |
| ----- | ----------- |
| `from` / `to` | Document positions for the selected image. |
| `src` | Serialized image source. |
| `alt` | Normalized alt text. Empty string when absent. |
| `title` | Normalized title or `null`. |
| `previewSrc` | Browser-only preview URL or data image URL, or `null`. |

## Options

```typescript
const editor = createQalmaEditor({
  plugins: [
    ImagePlugin.configure({
      allowedProtocols: ['http', 'https'],
      allowRelativeImages: true,
      defaultAlt: '',
    }),
  ],
});
```

| Option | Default | Validation |
| ------ | ------- | ---------- |
| `allowedProtocols` | `['http', 'https']` | Non-empty array of protocol names without colons, all unique. |
| `allowRelativeImages` | `true` | Boolean. Relative sources are allowed unless they start with `//`. |
| `defaultAlt` | `''` | String. |

`src` values are trimmed. Empty values are rejected. Protocol-relative URLs such
as `//cdn.example.com/image.png` are rejected when no explicit protocol is
present.

## Upload pattern

The docs playground keeps upload handling in the app. It creates a temporary
object URL for immediate preview, while storing a stable application URL in
`src`.

```typescript
insertUploadedImage(file: File): void {
  const previewSrc = URL.createObjectURL(file);

  this.editor.execute('insertImage', {
    src: `/uploads/${encodeURIComponent(file.name)}`,
    alt: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
    title: file.name,
    previewSrc,
  });
}
```

`previewSrc` is accepted only when it starts with `blob:` or `data:image/`.
Serialization writes the real `src`, `alt`, and optional `title`; it does not
write `previewSrc`.

## Styling

The node serializes as inline `&lt;img&gt;`. Style it from your app.

```css
qalma-content .ProseMirror img {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
}

qalma-content .ProseMirror .ProseMirror-selectednode {
  outline: 2px solid var(--accent);
}
```
