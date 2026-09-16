# Security policy

## Reporting a vulnerability

Do not open a public issue for a suspected vulnerability. Use GitHub's private
**Report a vulnerability** flow for this repository and include:

- the affected package and version;
- a minimal reproduction or malicious document;
- the input path (`setHtml`, `setJSON`, `setMarkdown`, paste/drop, or a custom
  plugin);
- the expected impact and any known workaround.

Please avoid accessing data that is not yours and give the maintainers a
reasonable opportunity to investigate before public disclosure.

## Supported versions

Security fixes are delivered on the latest published minor line. Older minor
and prerelease versions may be asked to upgrade before a fix is backported.

## Security boundaries

Qalma's first-party plugins parse content into a fixed ProseMirror schema and
validate their persisted attributes. That is an important defense, but the
editor is not a general-purpose HTML sanitizer:

- custom `QalmaPlugin` schemas and DOM serializers are trusted application
  code;
- files received through `FileHandlerPlugin` remain untrusted and require
  server-side size, signature, MIME, and malware checks;
- remote image URLs trigger browser network requests and should be proxied or
  restricted by Content Security Policy when document authors are untrusted;
- HTML rendered outside `<qalma-content>` should remain behind the framework's
  normal sanitizer. Do not use `bypassSecurityTrustHtml` for user-authored
  content;
- authorization, tenant isolation, collaboration permissions, storage
  validation, CSP, and Trusted Types are responsibilities of the host
  application.

See `SECURITY_AUDIT_2026-09-16.md` for the latest repository audit and the
editor-CVE comparison that informed these boundaries.
