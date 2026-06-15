---
title: Paste Rules
description: Normalize pasted HTML and plain-text URLs with PasteRulesPlugin.
---

# Paste Rules

`PasteRulesPlugin` installs paste handling for cleaned HTML, linked clipboard
text, and plain-text autolinks. It has no commands or queries.

```typescript
import {
  LinkPlugin,
  PasteRulesPlugin,
  TextFormattingKit,
  createQalmaEditor,
} from '@qalma/editor';

const editor = createQalmaEditor({
  plugins: [...TextFormattingKit, LinkPlugin, PasteRulesPlugin],
});
```

Add `LinkPlugin` when you want autolink behavior. `PasteRulesPlugin` checks the
schema for the `link` mark before it creates links.

## Options

```typescript
PasteRulesPlugin.configure({
  autolink: true,
  allowedProtocols: ['http', 'https', 'mailto', 'tel'],
  allowRelativeLinks: true,
  cleanHtml: true,
  defaultProtocol: 'https',
});
```

| Option | Default | Description |
| ------ | ------- | ----------- |
| `autolink` | `true` | Converts plain-text URL-like paste content into anchors when `LinkPlugin` is present. |
| `allowedProtocols` | `['http', 'https', 'mailto', 'tel']` | Protocol allow-list. Entries are protocol names without colons. |
| `allowRelativeLinks` | `true` | Allows relative links such as `/docs` and `#section`. |
| `cleanHtml` | `true` | Cleans HTML before ProseMirror parses it. |
| `defaultProtocol` | `'https'` | Prefix used for pasted `www.` links. Must be `http` or `https` and included in `allowedProtocols`. |

## HTML cleaning

When the clipboard contains `text/html` and `cleanHtml` is true, Qalma builds a
clean HTML fragment and lets the editor schema parse that fragment.

Allowed elements:

```text
blockquote, code, del, em, h1, h2, h3, h4, h5, h6, i, li, mark, ol, p, pre,
s, strike, strong, sub, sup, u, ul
```

`script` and `style` elements are dropped. `html`, `body`, `span`, and `font`
are unwrapped. Unsupported elements are also unwrapped. Links are kept only
when their normalized href passes the configured protocol rules.

If `cleanHtml` is false and the clipboard contains HTML, the plugin returns
`false` from its paste handler and lets the default ProseMirror paste flow run.

## Linked clipboard text

When the clipboard contains HTML whose visible text matches `text/plain`, and
the clipboard also exposes a usable URL through `text/uri-list` or plain text,
Qalma can wrap the pasted text in a link if the cleaned HTML has no anchor.

This supports browser copy flows where a URL and display text travel as
separate clipboard formats.

## Plain-text autolink

When there is no HTML, `autolink` is true, and `LinkPlugin` is present, Qalma
looks for these URL forms in text:

```text
https://example.com
http://example.com
mailto:hello@example.com
tel:+123456789
www.example.com
```

Trailing punctuation such as `.`, `,`, `!`, and unmatched closing brackets is
kept outside the link. `www.` links receive the configured `defaultProtocol`.

```typescript
const editor = createQalmaEditor({
  plugins: [
    LinkPlugin,
    PasteRulesPlugin.configure({
      defaultProtocol: 'https',
      allowedProtocols: ['https', 'mailto', 'tel'],
    }),
  ],
});
```

With that configuration, `www.qalma.dev` becomes
`https://www.qalma.dev`, while `http://qalma.dev` is rejected.
