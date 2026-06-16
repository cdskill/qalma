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

| Contract                         | Description                                                                   |
| -------------------------------- | ----------------------------------------------------------------------------- |
| `setLink`                        | Applies a link to the selection or stores it for future typed text.           |
| `selectLink`                     | Selects an existing link by current state, document range, or anchor element. |
| `unsetLink`                      | Removes the active link mark.                                                 |
| `query&lt;LinkState&gt;('link')` | Returns link range, attributes, and text for the active or selected link.     |

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
      onClick: null,
    }),
  ],
});
```

| Option               | Default                              | Description                                                                                                                           |
| -------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `allowedProtocols`   | `['http', 'https', 'mailto', 'tel']` | Protocol allow-list. Entries are names without `:`.                                                                                   |
| `allowRelativeLinks` | `true`                               | Allows links without a protocol.                                                                                                      |
| `defaultTarget`      | `'_blank'`                           | Applied when command values or pasted DOM do not provide a target. Only `'_blank'` is preserved.                                      |
| `defaultRel`         | `'noopener noreferrer'`              | Applied when command values or pasted DOM do not provide `rel`. Empty strings become `null`.                                          |
| `onClick`            | `null`                               | Optional callback for editor link clicks. When configured, Qalma prevents the native click and passes the link event to the host app. |

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

The plugin does not navigate on editor link clicks by default. Navigation,
routing, analytics, previews, and confirmation flows stay in your app.

Configure `onClick` when you want Qalma to turn editor link clicks into a
consumer-owned event. Qalma normalizes the href with the same options, prevents
the native click, and passes the DOM event, anchor element, href, target, rel,
and text to your callback.

```typescript
import { LinkClickHandler, LinkPlugin } from '@qalma/editor';

const handleLinkClick: LinkClickHandler = ({ href, target }) => {
  if (target === '_blank') {
    window.open(href, '_blank', 'noopener,noreferrer');

    return;
  }

  window.location.assign(href);
};

const editor = createQalmaEditor({
  plugins: [
    LinkPlugin.configure({
      onClick: handleLinkClick,
    }),
  ],
});
```

That example intentionally keeps navigation in application code. A routed
Angular app can call its router, open a product-specific preview, or ignore the
click entirely.
