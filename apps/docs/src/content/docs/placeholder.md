---
title: Placeholder
description: Show placeholder text for an empty document with PlaceholderPlugin decorations.
---

# Placeholder

`PlaceholderPlugin` decorates the only empty textblock in an otherwise empty
document. It does not render visible placeholder text by itself; your CSS reads
the decoration attributes.

```typescript
import { PlaceholderPlugin, createQalmaEditor } from '@qalma/editor';

const editor = createQalmaEditor({
  plugins: [
    PlaceholderPlugin.configure({
      placeholder: 'Start writing...',
    }),
  ],
});
```

## Options

| Option | Default | Validation |
| ------ | ------- | ---------- |
| `placeholder` | `'Write something...'` | Non-empty string after trimming. |
| `className` | `'qalma-placeholder'` | Non-empty CSS class name without whitespace. |

## When it appears

The placeholder target exists only when:

1. The document has exactly one child.
2. That child is a textblock.
3. That textblock has no content.

When those conditions match, the plugin adds a node decoration with:

| Attribute | Value |
| --------- | ----- |
| `class` | Configured `className`. |
| `data-placeholder` | Configured `placeholder`. |

## CSS

Add CSS in your application. The editor library ships no placeholder styles.

```css
.qalma-placeholder::before {
  content: attr(data-placeholder);
  color: var(--muted-foreground);
  float: left;
  height: 0;
  pointer-events: none;
}
```

If you configure a custom class name, update the selector:

```typescript
PlaceholderPlugin.configure({
  placeholder: 'Write the first sentence...',
  className: 'editor-placeholder',
});
```

```css
.editor-placeholder::before {
  content: attr(data-placeholder);
  color: #9ca3af;
}
```

## Notes

The plugin has no commands, shortcuts, or queries. It is a ProseMirror
decoration plugin only, so it does not change serialized HTML.
