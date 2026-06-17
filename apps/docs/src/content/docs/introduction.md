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

## Why not just use ProseMirror directly?

You can — ProseMirror _is_ the engine Qalma runs on. But ProseMirror is a
low-level toolkit, not a ready-made editor. Drop it into an Angular app and you
end up rebuilding the same integration layer that Qalma already gives you:

- **Angular lifecycle and rendering.** ProseMirror's `EditorView` is imperative
  and mounts straight to the DOM. You have to create it after render, keep it
  out of server-side rendering, tear it down on destroy, and make it cooperate
  with zoneless change detection. Qalma's controller does all of this and is
  SSR- and zoneless-safe out of the box.
- **State as signals.** ProseMirror hands you an `EditorState` and a `dispatch`
  function. Answering "is bold active?", "what's the current HTML?" or "what
  link is under the cursor?" means listening to every transaction and
  re-deriving state yourself. Qalma exposes all of it as signals — `html`,
  `isCommandActive`, `query` — that your components bind to directly.
- **Schema and plugin wiring.** A working editor needs a schema assembled from
  node and mark specs, plus keymaps, input rules, history, and a dozen plugins
  ordered correctly. Qalma plugins each own their schema, commands, shortcuts,
  and input rules, and are composed for you with duplicate detection.
- **A command contract.** `execute`, `canExecute`, `isCommandActive`, and the
  `qalmaCommand` directive give you one consistent way to drive the editor from
  buttons and menus, instead of hand-rolling a command registry in every app.
- **Common features, already built.** Links with click handling, mentions,
  slash commands, tables, code blocks with indentation, markdown shortcuts, and
  paste cleanup are each real work to build well on raw ProseMirror. In Qalma
  they are opt-in plugins.

In short: with raw ProseMirror you write the editor _and_ the Angular plumbing
every time. With Qalma you write only your UI. And because ProseMirror stays the
engine underneath, you keep its document model, schema validation, and
correctness — you just don't assemble them by hand.

## How the pieces fit together

A Qalma editor is composed from three layers:

1. **`QalmaEditorController`** — creates and owns the ProseMirror
   `EditorView`, exposes the document as signals, and runs the plugins you
   register.
2. **Plugins** (`QalmaPlugin`) — each plugin contributes schema nodes/marks,
   keymaps, input rules and commands. The
   [Core Concepts](/docs/architecture) section covers how they're composed.
3. **Your UI** — a toolbar, the content surface (`&lt;qalma-content&gt;`), and any
   popovers or menus (link editor, mention list, slash menu...) are regular
   Angular components that read from the controller and call its commands.

## Where to go next

- [Installation](/docs/installation) — add `@qalma/editor` to your project.
- [Quick Start](/docs/quick-start) — wire up a minimal editor in a few lines.
- [Plugins](/docs/plugins) — browse the full plugin reference.
- [Live Playground](/#playground) — try the editor right now, in your
  browser.
