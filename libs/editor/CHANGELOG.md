## 0.0.1-alpha.7 (2026-06-16)

### 🚀 Features

- **editor:** link plugin no longer invoke window but instead expose onClick handler ([a55bef9](https://github.com/cdskill/qalma/commit/a55bef9))

## 0.0.1-alpha.6 (2026-06-16)

### 🚀 Features

- **repo:** add task list plugin ([8361f4b](https://github.com/cdskill/qalma/commit/8361f4b))

## 0.0.1-alpha.5 (2026-06-14)

### 🚀 Features

- **docs:** add qalma brand mark ([dcba972](https://github.com/cdskill/qalma/commit/dcba972))

## 0.0.1-alpha.4 (2026-06-14)

This was a version bump only for editor to align it with other projects, there were no code changes.

## 0.0.1-alpha.3 (2026-06-14)

### 🚀 Features

- **editor:** add slash command plugin ([1bdbbac](https://github.com/cdskill/qalma/commit/1bdbbac))
- **docs:** cookieless PostHog analytics (SSR-safe) ([a028094](https://github.com/cdskill/qalma/commit/a028094))
- **seo:** GSC verification, robots.txt, IndexNow on deploy ([f0b2686](https://github.com/cdskill/qalma/commit/f0b2686))

## 0.0.1-alpha.2 (2026-06-13)

### 🚀 Features

- **docs:** add S3+CloudFront infra (Terraform) and CI deploy workflow ([6728e57](https://github.com/cdskill/qalma/commit/6728e57))
- **docs:** enable zoneless change detection + register Angular CLI MCP ([3290508](https://github.com/cdskill/qalma/commit/3290508))
- **docs:** add Analog docs app in SSG mode + sync-doc skill ([1a3e579](https://github.com/cdskill/qalma/commit/1a3e579))

## 0.0.1-alpha.1 (2026-06-12)

### 🚀 Features

- ⚠️  **editor:** rename public api to qalma ([17e7ff3](https://github.com/cdskill/qalma/commit/17e7ff3))
- **editor:** add image plugin ([2963fa3](https://github.com/cdskill/qalma/commit/2963fa3))
- **editor:** add headless mention plugin ([7ab9ea2](https://github.com/cdskill/qalma/commit/7ab9ea2))
- **plugins:** add paste rules plugin ([71a0c51](https://github.com/cdskill/qalma/commit/71a0c51))
- **editor:** add subscript superscript plugin ([23316d4](https://github.com/cdskill/qalma/commit/23316d4))
- **editor:** add trailing paragraph plugin ([0fb7a66](https://github.com/cdskill/qalma/commit/0fb7a66))
- **editor:** add placeholder plugin ([71897d7](https://github.com/cdskill/qalma/commit/71897d7))
- **editor:** add highlight plugin ([27f6720](https://github.com/cdskill/qalma/commit/27f6720))
- **editor:** add color plugin ([ba5e568](https://github.com/cdskill/qalma/commit/ba5e568))
- **editor:** add text alignment plugin ([d2ad48b](https://github.com/cdskill/qalma/commit/d2ad48b))
- **editor:** add hard break plugin ([d18edbe](https://github.com/cdskill/qalma/commit/d18edbe))
- **editor:** add clear formatting plugin ([fa6cf1a](https://github.com/cdskill/qalma/commit/fa6cf1a))
- **editor:** add code block plugin ([3c7efb4](https://github.com/cdskill/qalma/commit/3c7efb4))
- **editor:** add blockquote plugin ([32d1d9e](https://github.com/cdskill/qalma/commit/32d1d9e))
- **editor:** add headings and lists plugins ([1e25877](https://github.com/cdskill/qalma/commit/1e25877))
- **editor:** add headless link plugin ([7cad9b3](https://github.com/cdskill/qalma/commit/7cad9b3))
- **editor:** add headless plugin-based ProseMirror foundation ([b4aa486](https://github.com/cdskill/qalma/commit/b4aa486))

### 🩹 Fixes

- **editor:** expose commandStates for unset color commands ([4a3225b](https://github.com/cdskill/qalma/commit/4a3225b))
- ⚠️  **editor:** move placeholder rendering into PlaceholderPlugin ([dbf254b](https://github.com/cdskill/qalma/commit/dbf254b))
- ⚠️  **editor:** make image node inline and validate insertion via schema ([767dd90](https://github.com/cdskill/qalma/commit/767dd90))
- **editor:** defer content mount until browser render ([f168213](https://github.com/cdskill/qalma/commit/f168213))

### ⚠️  Breaking Changes

- **editor:** move placeholder rendering into PlaceholderPlugin  ([dbf254b](https://github.com/cdskill/qalma/commit/dbf254b))
  remove QalmaEditorOptions.placeholder,
  QalmaEditorController.placeholder, and setPlaceholder().
- **editor:** make image node inline and validate insertion via schema  ([767dd90](https://github.com/cdskill/qalma/commit/767dd90))
  the image node is now inline; documents serialized
  with a top-level <img> will be re-wrapped in a paragraph on parse.
- **editor:** rename public api to qalma  ([17e7ff3](https://github.com/cdskill/qalma/commit/17e7ff3))
  public editor APIs, selectors, CSS hooks, mention attributes, and command directives now use Qalma names.