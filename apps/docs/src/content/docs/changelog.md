---
title: Changelog
description: Release notes for the current alpha line, summarized from libs/editor/CHANGELOG.md.
---

# Changelog

The canonical package changelog lives in `libs/editor/CHANGELOG.md`. This page
summarizes the current alpha line for docs readers.

## 0.0.1-alpha.5 - 2026-06-14

Branding update for the docs site:

- Added the Qalma brand mark.

## 0.0.1-alpha.4 - 2026-06-14

Version bump only. No editor code changes.

## 0.0.1-alpha.3 - 2026-06-14

Feature and docs infrastructure updates:

- Added `SlashCommandPlugin`.
- Added cookieless PostHog analytics in the docs app.
- Added search/SEO deployment support for Google Search Console, robots.txt,
  and IndexNow.

## 0.0.1-alpha.2 - 2026-06-13

Docs and infrastructure setup:

- Added S3 and CloudFront infrastructure.
- Added the deploy workflow.
- Enabled zoneless change detection.
- Added the Analog docs app in SSG mode.

## 0.0.1-alpha.1 - 2026-06-12

Initial alpha editor surface:

- Added the headless ProseMirror foundation.
- Renamed public APIs, selectors, CSS hooks, mention attributes, and command
  directives to Qalma names.
- Added first-party plugins for links, headings, lists, blockquotes, code
  blocks, clear formatting, hard breaks, text alignment, color, highlight,
  placeholder, trailing paragraph, subscript/superscript, paste rules,
  mentions, images, and slash commands.
- Added the image node as an inline selectable node.
- Moved placeholder rendering into `PlaceholderPlugin`.
- Deferred content mounting until browser render.

## Current status

The package is still alpha (`0.0.x`). Public APIs may change between alpha
releases. Prefer reading the dedicated docs pages and the current TypeScript
exports from `@qalma/editor` when integrating a feature.
