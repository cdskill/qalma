---
title: File Handler
description: Receive validated pasted and dropped files without coupling the editor to an upload backend.
---

# File Handler

`FileHandlerPlugin` detects files in paste and drop events. It does not upload,
preview, or insert them: those are application decisions.

```typescript
const fileHandler = FileHandlerPlugin.configure({
  allowedMimeTypes: ['image/*', 'application/pdf'],
  onPaste: ({ files, position, html, text }) => this.uploadFiles(files, { position, html, text }),
  onDrop: ({ files, position }) => this.uploadFiles(files, { position }),
});
```

Return `true` when your callback consumes the event. Return `false`/`void` to
let other ProseMirror handlers continue. MIME filters accept exact values and
wildcards such as `image/*`. The callback receives Qalma-owned values only:
`files`, an optional document `position`, and clipboard HTML/plain text—no
`EditorView` leaks into your Angular layer.

`File.type` and filenames are supplied by the client. MIME filtering is a UX
filter, not security validation. Enforce file size, inspect magic bytes, decode
images with resource limits, scan content, authorize storage, and generate safe
filenames on the server. The callback's `html` value is raw clipboard metadata;
never inject it into the DOM.

For image uploads, create a local preview if needed, send the file to your own
backend, then call `editor.execute('insertImage', value)`.
