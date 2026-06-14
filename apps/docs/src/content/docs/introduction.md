---
title: Introduction
description: What Qalma is, why it exists, and how it's built.
---

# Introduction

Qalma is a headless, plugin-based rich text editor for Angular, built on
[ProseMirror](https://prosemirror.net/). It ships no styling and no opinions
about your UI — you bring the components, Qalma brings the editing engine.

## Why Qalma

Most rich text editors for Angular are either thin wrappers around a
JavaScript library with an awkward API surface, or full UI kits you can't
easily restyle. Qalma takes a different approach:

- **Headless by default.** The editor exposes content, commands and state.
  Toolbars, menus and node views are plain Angular components you write (or
  copy from the playground) and style with Tailwind.
- **Plugin-based.** Every feature — headings, lists, links, mentions, code
  blocks, history — is a separate plugin you opt into. Nothing you don't use
  ships in your bundle.
- **Angular-native.** Built with standalone components, signals and
  `provideZonelessChangeDetection()`. The editor state is exposed as
  signals, not `EventEmitter` soup.
- **ProseMirror underneath.** You get a battle-tested document model,
  schema-driven validation, and an ecosystem of ideas to draw from — without
  having to write ProseMirror plugins by hand for common needs.

## How the pieces fit together

A Qalma editor is composed from three layers:

1. **`QalmaEditorController`** — creates and owns the ProseMirror
   `EditorView`, exposes the document as signals, and runs the plugins you
   register.
2. **Plugins** (`QalmaPlugin`) — each plugin contributes schema nodes/marks,
   keymaps, input rules and commands. The
   [Core Concepts](/docs/architecture) section covers how they're composed.
3. **Your UI** — a toolbar, the content surface (`<qalma-content>`), and any
   popovers or menus (link editor, mention list, slash menu...) are regular
   Angular components that read from the controller and call its commands.

## Where to go next

- [Installation](/docs/installation) — add `@qalma/editor` to your project.
- [Quick Start](/docs/quick-start) — wire up a minimal editor in a few lines.
- [Plugins](/docs/plugins) — browse the full plugin reference.
- [Live Playground](/#playground) — try the editor right now, in your
  browser.
