---
title: Link
description: Add validated links, link query state, selection helpers, and consumer-owned link popovers.
---

# Link

`LinkPlugin` adds a `link` mark with `href`, `target`, and `rel` attributes.
It does not render a link editor. Build URL inputs, previews, and popovers in
your app.

```typescript
import { LinkPlugin, TextFormattingKit, createQalmaEditor } from '@qalma/editor';

const editor = createQalmaEditor({
  plugins: [...TextFormattingKit, LinkPlugin],
});
```

## Commands and query

| Contract | Description |
| -------- | ----------- |
| `setLink` | Applies a link to the selection or stores it for future typed text. |
| `selectLink` | Selects an existing link by current state, document range, or anchor element. |
| `unsetLink` | Removes the active link mark. |
| `query&lt;LinkState&gt;('link')` | Returns link range, attributes, and text for the active or selected link. |

`setLink` accepts a string or an object.

```typescript
editor.execute('setLink', 'https://angular.dev');

editor.execute('setLink', {
  href: 'mailto:hello@example.com',
  target: null,
  rel: null,
});
```

## Link state

```typescript
import { LinkState } from '@qalma/editor';

const link = editor.query<LinkState>('link');

if (link) {
  console.log(link.href, link.text, link.from, link.to);
}
```

When the selection is collapsed, Qalma looks at the text before and after the
cursor to find the full link range. When a range is selected, it returns the
first link it finds in that selection.

## Options

```typescript
const editor = createQalmaEditor({
  plugins: [
    LinkPlugin.configure({
      allowedProtocols: ['http', 'https', 'mailto', 'tel'],
      allowRelativeLinks: true,
      defaultTarget: '_blank',
      defaultRel: 'noopener noreferrer',
    }),
  ],
});
```

| Option | Default | Description |
| ------ | ------- | ----------- |
| `allowedProtocols` | `['http', 'https', 'mailto', 'tel']` | Protocol allow-list. Entries are names without `:`. |
| `allowRelativeLinks` | `true` | Allows links without a protocol. |
| `defaultTarget` | `'_blank'` | Applied when command values or pasted DOM do not provide a target. Only `'_blank'` is preserved. |
| `defaultRel` | `'noopener noreferrer'` | Applied when command values or pasted DOM do not provide `rel`. Empty strings become `null`. |

Invalid or empty hrefs make `setLink` return `false`.

## Popover pattern

The docs playground uses `selectLink` before editing or removing a hovered link.

```typescript
import { LinkState } from '@qalma/editor';

showToolbarEditor(): void {
  const link = this.editor.query<LinkState>('link');
  this.href.set(link?.href ?? 'https://');
}

saveHref(href: string): void {
  this.editor.execute('setLink', href);
}

removeLink(): void {
  this.editor.execute('unsetLink');
}
```

If your popover starts from an anchor element, pass it to `selectLink` before
running the edit command.

```typescript
editAnchor(element: HTMLAnchorElement): void {
  if (this.editor.execute('selectLink', { element })) {
    this.editor.execute('setLink', this.href());
  }
}
```

You can also select by range:

```typescript
editor.execute('selectLink', { from: link.from, to: link.to });
```

## Click behavior

The plugin handles clicks on editor links. It prevents the editor click,
normalizes the href with the same options, and opens `_blank` links with
`window.open(href, '_blank', 'noopener,noreferrer')`. Other links assign
`window.location.href`.

If your product needs a different link-click policy, wrap the editor or build a
custom plugin that handles those DOM events first.
