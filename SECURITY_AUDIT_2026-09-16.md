# Qalma security audit — 2026-09-16

## Executive summary

This review covered the Qalma editor's HTML, JSON, Markdown, paste/drop,
file-upload, DOM-serialization, plugin, and dependency boundaries. No known
advisory was found for the runtime dependency set published by
`@qalma/editor` (`marked`, `prosemirror-*`, and `tslib`) at the audit date.

The most important repository finding was architectural: first-party plugin
attributes were normalized when entering through HTML or commands, but raw
ProseMirror JSON could previously bypass those normalizers. This is the same
class of trust-boundary mistake behind several editor XSS advisories. The
review adds schema-level attribute validation, centralized URL policy,
defence-in-depth Markdown encoding, document complexity limits, safer examples,
and dependency upgrades.

This is a point-in-time source review, not a formal penetration test or a
guarantee that no vulnerability exists.

## Scope and method

- traced every public content input and output;
- reviewed all first-party node/mark attributes and DOM serializers;
- exercised malicious URL, JSON, CSS, and Markdown-export cases;
- reviewed paste cleaning, file callbacks, image previews, and remote images;
- ran `pnpm audit --json` against the pre-fix lockfile;
- compared Qalma's design with public advisories for Quill, Tiptap, CKEditor 5,
  TinyMCE, and ProseMirror-related serialization;
- searched the repository for common secret shapes and found no credential in
  tracked source (workflow references such as `${{ secrets.GITHUB_TOKEN }}` are
  expected).

## Findings and disposition

| ID       | Severity    | Finding                                                                                                                                    | Disposition                                                                                                                                                                                                             |
| -------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| QALMA-01 | High        | `setJSON()` and stored documents could bypass HTML/command normalization for URL and CSS-bearing attributes.                               | Fixed with ProseMirror `AttributeSpec.validate` on all security-relevant first-party attributes and tests for malicious JSON.                                                                                           |
| QALMA-02 | High        | URL checks treated `java\nscript:` as relative and allowed protocol-relative `//host` input.                                               | Fixed by one URL policy that rejects ASCII controls, network-path references, and executable `javascript`, `vbscript`, `data`, and `blob` protocols. Applied to links, images, paste autolinking, JSON, and DOM output. |
| QALMA-03 | Medium      | HTML, Markdown, JSON, and live transactions had no common complexity ceiling.                                                              | Fixed with configurable HTML/Markdown length, JSON value/depth/text, and live ProseMirror node/depth/text limits. Defaults are intentionally generous and can be lowered per product.                                   |
| QALMA-04 | Medium      | Markdown export trusted model URL, code-language, and CSS attributes. A malicious custom schema could produce active Markdown/inline HTML. | Fixed with destination allowlisting, title/language validation, CSS filtering, attribute encoding, and plain-text fallback for unsafe links/images.                                                                     |
| QALMA-05 | Medium      | Documentation examples called Angular `bypassSecurityTrustHtml()` on editor output, teaching an unsafe storage/rendering pattern.          | Fixed. Examples now use Angular's normal `[innerHTML]` sanitization.                                                                                                                                                    |
| QALMA-06 | Medium      | A custom plugin can define unsafe attributes or `toDOM()` output.                                                                          | Open by design: plugins are trusted code. Require `validate` on persisted attrs, construct fresh allowlisted DOM attrs, and sanitize again at an external rendering boundary.                                           |
| QALMA-07 | Medium      | `FileHandlerPlugin` MIME filters use browser-supplied `File.type`; this is not content validation.                                         | Documented boundary. Validate size, magic bytes, decoded dimensions, malware, filename, and storage permissions server-side.                                                                                            |
| QALMA-08 | Low         | Author-controlled `http`/`https` image sources can make reader browsers contact third parties.                                             | Open product policy. Proxy media or enforce restrictive `img-src`; disable relative/external images where appropriate.                                                                                                  |
| QALMA-09 | Medium–High | The monorepo lockfile contained patched-but-not-yet-adopted Angular, Vite, and Mermaid advisories.                                         | Fixed in the manifest/lockfile: Angular 21.2.22, Vite 7.3.5, Mermaid 10.9.8. Dependabot coverage was added.                                                                                                             |

## Editor vulnerability census

These projects are not Qalma dependencies. They are included because their
failures are useful regression targets.

| Project                            | Advisory                                                                                                                                                                                                                                                                                 | Status at 2026-09-16                                                                                                                                     | Lesson applied to Qalma                                                                                          |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Quill 2.0.3                        | [CVE-2025-15056 / GHSA-v3m3-f69x-jf25](https://github.com/advisories/GHSA-v3m3-f69x-jf25), XSS in HTML export                                                                                                                                                                            | **Open; no patched version listed.** The public [tracking issue #4783](https://github.com/slab/quill/issues/4783) is also open.                          | Validate at model load and encode/allowlist again at export.                                                     |
| Quill <=1.3.7                      | [CVE-2021-3163 / GHSA-4943-9vgg-gr5r](https://github.com/advisories/GHSA-4943-9vgg-gr5r), stored XSS through crafted image attributes                                                                                                                                                    | No patch; advisory is disputed.                                                                                                                          | Never preserve arbitrary element attributes; reconstruct allowed attrs.                                          |
| Tiptap link <2.10.4                | [CVE-2025-14284 / GHSA-vhrc-hgrq-x75r](https://github.com/advisories/GHSA-vhrc-hgrq-x75r), `javascript:` link XSS                                                                                                                                                                        | Fixed in 2.10.4.                                                                                                                                         | Central URL policy, including obfuscated schemes and JSON.                                                       |
| Tiptap core                        | [GHSA-cp6q-959q-f8rh](https://github.com/advisories/GHSA-cp6q-959q-f8rh), `__proto__` attributes become inherited executable DOM attrs                                                                                                                                                   | Fixed in 3.30.4. A v2 fix exists in 2.27.3, but the [advisory metadata correction #8339](https://github.com/ueberdosis/tiptap/issues/8339) remains open. | Do not merge untrusted attribute bags; Qalma first-party serializers build fresh allowlisted objects.            |
| Tiptap core 3.7.0–3.30.4           | [GHSA-j95f-988m-3j2f](https://github.com/advisories/GHSA-j95f-988m-3j2f), quadratic Markdown attribute ReDoS                                                                                                                                                                             | Fixed in 3.30.5.                                                                                                                                         | Bound Markdown size before parsing and avoid unanchored backtracking patterns.                                   |
| Tiptap CollaborationCaret <=3.31.2 | [GHSA-pmh9-4rj3-c67g](https://github.com/ueberdosis/tiptap/security/advisories/GHSA-pmh9-4rj3-c67g), collaborator-controlled CSS injection                                                                                                                                               | Fixed in 3.31.3; no CVE assigned.                                                                                                                        | Treat future collaboration awareness as hostile input; assign individual CSS properties after strict validation. |
| CKEditor 5 44.2.0–46.0.2           | [CVE-2025-58064 / GHSA-x9gp-vjh6-3wv6](https://github.com/ckeditor/ckeditor5/security/advisories/GHSA-x9gp-vjh6-3wv6), clipboard XSS with HTML Embed or custom `RawElement`                                                                                                              | Fixed in 46.0.3 and 45.2.2.                                                                                                                              | Clipboard cleaning must remain schema-bound; raw/custom DOM nodes expand the trusted computing base.             |
| TinyMCE 6.8.x–7.0.x                | [CVE-2026-47760 / GHSA-mh5m-5hw4-5c69](https://github.com/tinymce/tinymce/security/advisories/GHSA-mh5m-5hw4-5c69), nested-SVG sanitizer bypass                                                                                                                                          | Fixed in 7.1.0.                                                                                                                                          | Drop SVG and foreign namespaces rather than recursively preserving them.                                         |
| TinyMCE multiple lines             | [CVE-2026-47759](https://github.com/tinymce/tinymce/security/advisories/GHSA-q742-qvgc-gc2f), [CVE-2026-47761](https://github.com/tinymce/tinymce/security/advisories/GHSA-vg35-5wq7-3x7w), [CVE-2026-47762](https://github.com/tinymce/tinymce/security/advisories/GHSA-v98h-vmpc-fpqv) | Fixed in 8.5.1, 7.9.3, and 5.11.1 LTS; TinyMCE 6 has no listed fixed release.                                                                            | Never resurrect hidden `data-*` values, protected comments, or media placeholders after sanitization.            |

## Dependency findings in this repository

The pre-fix full workspace audit reported 150 advisories: 14 low, 70 moderate,
64 high, and 2 critical. Most were build/test/docs transitive packages rather
than dependencies shipped by `@qalma/editor`; severity alone does not imply
runtime exploitability in the library. The directly actionable locked versions
were:

- Angular 21.2.17: CVE-2026-68945, CVE-2026-69151, CVE-2026-69149,
  CVE-2026-88060, CVE-2026-88056, CVE-2026-88059, and CVE-2026-88057;
- Vite 7.3.2: CVE-2026-53632 and CVE-2026-53571;
- Mermaid 10.9.6: CVE-2026-71438, CVE-2026-50159, and CVE-2026-71436.

The manifest and lockfile now resolve the patched versions listed above. The
remaining transitive findings should be triaged continuously rather than
silenced wholesale; production reachability, CI exposure, and available
upgrades differ.

## Validation performed

- editor tests: 36 files and 200 tests passed;
- sandbox tests: 55 tests passed;
- lint: all eight Nx projects passed;
- TypeScript: editor library/spec, sandbox application/spec, and sandbox E2E
  configurations passed with `--noEmit`;
- package builds: `@qalma/editor` (including secondary entry points) and
  `@qalma/kit` passed;
- protected-test guard: passed locally and correctly listed the protected files
  that require the `approved-test-change` label during pull-request review.

The final sandbox application bundling could not be validated in this
environment: the esbuild 0.28.1 service used by `@angular/build` 21.2.22 exits
at `Building...` with `fatal error: all goroutines are asleep - deadlock!`.
This signature matches the public
[esbuild issue #4503](https://github.com/evanw/esbuild/issues/4503) and the
Angular one-shot build regressions tracked in
[#33497](https://github.com/angular/angular-cli/issues/33497). Limiting Angular
to one worker did not avoid it. Because the sandbox bundle did not complete, a
real-browser interaction pass was not possible during this audit.

## Required security invariants for future plugins

1. Every persisted `NodeSpec`/`MarkSpec` attribute has a type or function
   validator. HTML parsing alone is not a security boundary.
2. URL values pass the centralized policy at command, HTML, JSON, paste, and
   serialization boundaries. Executable schemes remain forbidden even if a
   consumer includes them in `allowedProtocols`.
3. `toDOM()` creates a new, allowlisted attribute object. Never forward or
   merge an untrusted object, and explicitly reject `__proto__`, `prototype`,
   and `constructor` in any generic merge utility.
4. Sanitizers reconstruct allowed nodes. They never restore hidden comments,
   `data-*` snapshots, foreign SVG/MathML namespaces, or raw elements later.
5. Parsers have byte/character and structural limits, and regexes are tested
   with adversarial near-matches.
6. Collaboration metadata, upload metadata, AI output, migration output, and
   backend JSON are all untrusted inputs.
7. Rendered stored HTML stays behind Angular sanitization and a restrictive
   CSP; bypass APIs require a separate security review.

## Recommended follow-up

- add browser fuzz/property tests for HTML → JSON → HTML and JSON → Markdown;
- add CodeQL and dependency-review workflows for pull requests;
- add a CSP/Trusted Types example for the docs application;
- define a collaboration threat model before adding Yjs/Hocuspocus;
- repeat this census before every minor release and after any serializer,
  parser, raw-node, media, or collaboration feature.
