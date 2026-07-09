## 0.5.0 (2026-07-09)

### 🩹 Fixes

- **kit:** restore toolbar button styles in consumers ([46bb026](https://github.com/cdskill/qalma/commit/46bb026))

## 0.4.0 (2026-07-08)

This was a version bump only for ui-kit to align it with other projects, there were no code changes.

## 0.3.0 (2026-07-07)

### 🚀 Features

- **kit:** publishing necessary stuff for kit ([ddc10f1](https://github.com/cdskill/qalma/commit/ddc10f1))

## 0.2.0 (2026-07-07)

### 🚀 Features

- add Qalma UI Kit documentation and release setup ([#24](https://github.com/cdskill/qalma/pull/24))
- **release:** publish qalma skills package ([#23](https://github.com/cdskill/qalma/pull/23))
- **editor:** add Angular forms adapter ([a1b498f](https://github.com/cdskill/qalma/commit/a1b498f))
- **repo:** ci templates, contributing how to, script for beta release ([47cb9d6](https://github.com/cdskill/qalma/commit/47cb9d6))
- **editor:** add table plugin ([f08ff42](https://github.com/cdskill/qalma/commit/f08ff42))
- **editor:** add markdown input rules to headings plugin ([f8d5b0e](https://github.com/cdskill/qalma/commit/f8d5b0e))
- **repo:** add task list plugin ([8361f4b](https://github.com/cdskill/qalma/commit/8361f4b))
- **editor:** add slash command plugin ([1bdbbac](https://github.com/cdskill/qalma/commit/1bdbbac))
- **docs:** cookieless PostHog analytics (SSR-safe) ([a028094](https://github.com/cdskill/qalma/commit/a028094))
- **seo:** GSC verification, robots.txt, IndexNow on deploy ([f0b2686](https://github.com/cdskill/qalma/commit/f0b2686))
- **docs:** add S3+CloudFront infra (Terraform) and CI deploy workflow ([6728e57](https://github.com/cdskill/qalma/commit/6728e57))
- **docs:** enable zoneless change detection + register Angular CLI MCP ([3290508](https://github.com/cdskill/qalma/commit/3290508))
- **docs:** add Analog docs app in SSG mode + sync-doc skill ([1a3e579](https://github.com/cdskill/qalma/commit/1a3e579))
- ⚠️  **editor:** rename public api to qalma ([17e7ff3](https://github.com/cdskill/qalma/commit/17e7ff3))
- **editor:** add code block plugin ([3c7efb4](https://github.com/cdskill/qalma/commit/3c7efb4))
- **editor:** add headings and lists plugins ([1e25877](https://github.com/cdskill/qalma/commit/1e25877))
- **editor:** add headless plugin-based ProseMirror foundation ([b4aa486](https://github.com/cdskill/qalma/commit/b4aa486))

### 🩹 Fixes

- **release:** align beta release guidance ([834a908](https://github.com/cdskill/qalma/commit/834a908))

### 🔥 Performance

- **repo:** reduce default editor bundle size ([#19](https://github.com/cdskill/qalma/pull/19))

### ⚠️  Breaking Changes

- **editor:** rename public api to qalma  ([17e7ff3](https://github.com/cdskill/qalma/commit/17e7ff3))
  public editor APIs, selectors, CSS hooks, mention attributes, and command directives now use Qalma names.