---
title: Security
description: Trust boundaries, safe rendering, content limits, URLs, uploads, and custom-plugin rules for Qalma.
---

# Security

Qalma's first-party plugins parse content into a fixed ProseMirror schema and
validate persisted attributes. This blocks unsupported tags and attributes,
unsafe URL schemes, malformed CSS values, and JSON attempts to bypass the HTML
parser. The editor is still one layer in your application's security model; it
is not a general-purpose sanitizer for arbitrary custom schemas.

## Keep every input untrusted

Treat HTML, Markdown, raw JSON, stored documents, pasted content, upload
metadata, AI output, migrations, and future collaboration messages as
untrusted. Qalma applies default import limits:

```typescript
const editor = createQalmaEditor({
  contentLimits: {
    maxHtmlLength: 250_000,
    maxMarkdownLength: 250_000,
    maxJsonNodes: 20_000,
    maxJsonDepth: 50,
    maxJsonTextLength: 250_000,
  },
});
```

The same structural limits are checked against the live ProseMirror document,
so a paste or transaction cannot grow it beyond the configured ceiling. Tune
the values to the product instead of raising them globally when one workflow
needs larger documents.

## Render stored HTML safely

Keep Angular's sanitizer in the path when rendering HTML outside the editor:

```html
<article [innerHTML]="savedHtml"></article>
```

Do not call `bypassSecurityTrustHtml()` for user-authored editor output. A
custom plugin, older stored document, backend transformation, or future
configuration change can widen the schema's output. Use a restrictive Content
Security Policy and consider Trusted Types for an additional browser boundary.

## URLs and images

First-party links and images reject ASCII control characters, protocol-relative
URLs, and executable `javascript`, `vbscript`, `data`, and `blob` schemes. The
executable schemes stay forbidden even if they are added to a plugin's
`allowedProtocols` option.

Allowed `http` and `https` images still cause the reader's browser to contact a
remote host. For private documents, proxy uploaded media through your origin or
restrict `img-src` with CSP. If the product does not need external images,
configure a narrower image policy.

## Files are not validated by MIME filters

`FileHandlerPlugin.allowedMimeTypes` filters the browser-supplied `File.type`.
It is a UX filter, not a security verdict. Enforce file-size limits, inspect
magic bytes, decode images with resource limits, scan for malware, generate
safe filenames, and authorize storage on the server. Serve active formats such
as SVG or HTML from an isolated origin or reject them.

Clipboard `html` and `text` values delivered to callbacks are raw metadata. Do
not inject that HTML into the DOM.

## Custom plugin checklist

For every custom node or mark:

1. add `validate` to every persisted attribute;
2. normalize at commands and `parseDOM`, then validate again when loading JSON;
3. create a fresh allowlisted attribute object in `toDOM()`—never merge an
   untrusted object into it;
4. validate URL schemes and CSS values as single property values;
5. avoid raw HTML, SVG/MathML namespace preservation, event attributes, and
   hidden `data-*` values that are later restored;
6. fuzz HTML, JSON, Markdown, paste, serialization, and migration paths with the
   same payloads;
7. apply explicit input-size and nesting limits to any new parser.

See the repository [security policy](https://github.com/cdskill/qalma/blob/main/SECURITY.md)
and the dated [security audit](https://github.com/cdskill/qalma/blob/main/SECURITY_AUDIT_2026-09-16.md)
for reporting instructions, findings, and the external editor-CVE census.
