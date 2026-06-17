---
title: Roadmap
description: Current product direction and known documentation-facing priorities for Qalma.
---

# Roadmap

Qalma is an alpha editor toolkit. The current direction is defined by the code,
the public exports, and the repository mission: an Angular-first, headless,
plugin-based editor on ProseMirror.

This roadmap is not a release promise. It is a map of the product shape the repo
is already moving toward.

## Current foundation

The current editor already includes:

| Area               | Shipped surface                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------- |
| Angular primitives | `QalmaEditor`, `QalmaContent`, `QalmaToolbar`, `QalmaCommand`                                       |
| Controller         | Signals for HTML/editability, command execution, command state, queries, content replacement, focus |
| Formatting         | Text formatting, inline code, color, highlight, subscript/superscript, clear formatting             |
| Structure          | Headings, lists, blockquotes, hard breaks, trailing paragraphs                                      |
| Media and links    | Links, inline images                                                                                |
| Productivity       | Selection state, mentions, slash commands, paste rules, code blocks, history                        |
| Layout             | Text alignment                                                                                      |
| Docs examples      | Live playground, consumer-owned toolbar, contextual toolbar, link popover, mention menu, slash menu |

## Near-term product priorities

These are the areas the existing code suggests are most important to harden:

| Priority                    | Why it matters                                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Public API clarity          | The developer experience is the product, so commands, queries, options, and UI responsibilities need stable docs and examples. |
| Plugin validation           | Configurable plugins should continue to expose Qalma-owned option interfaces with clear validation errors.                     |
| Consumer-owned UI recipes   | Menus, popovers, toolbars, uploads, and forms should remain app code, with copyable examples.                                  |
| Accessibility patterns      | Headless menus need strong keyboard and ARIA recipes because Qalma does not render fixed UI.                                   |
| SSR and zoneless confidence | Angular 21, signals, `afterNextRender`, and server-safe patterns are central to the library shape.                             |

## Open design areas

These areas should stay deliberate rather than accidental:

| Area                          | Current stance                                                                                                                                    |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Raw ProseMirror exports       | Keep ProseMirror as the internal engine unless a public API design decision makes a specific export necessary.                                    |
| First-party plugin boundaries | Keep first-party plugins in `libs/editor/src/lib/plugins` until dependency, release, ownership, or bundle boundaries justify a dedicated package. |
| Toolbar rendering             | Keep toolbar UI consumer-owned. Do not add configuration-driven toolbar rendering to the editor library.                                          |
| Design systems                | Keep Spartan/helm, Tailwind, icons, and product styling in apps, not in `@qalma/editor`.                                                          |
| Node views and overlays       | Prefer command/query/event contracts that let Angular apps render their own UI.                                                                   |

## How to contribute to the roadmap

When proposing a feature, document:

1. Which plugin or public primitive owns the behavior.
2. Which command names, query names, schema names, shortcuts, and events it
   introduces.
3. What UI remains consumer-owned.
4. What validation errors consumers should see.
5. Which docs page and playground example prove the integration.

That keeps new work aligned with Qalma's headless Angular contract.
