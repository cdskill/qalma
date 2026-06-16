---
name: qalma-docs-sync
description: Synchronize Qalma documentation surfaces after adding, changing, renaming, or removing an editor plugin, command, query, kit, public option, sandbox/playground behavior, or docs navigation entry. Use with Qalma plugin work to keep apps/docs, libs/editor/README.md, AGENTS.md, and repository skills accurate.
---

# Qalma Docs Sync

Keep public documentation in lockstep with Qalma's headless plugin surface.
Run this after any plugin or public editor capability changes.

## Sync Checklist

1. Inspect the changed plugin exports in `libs/editor/src/index.ts` and the
   implementation under `libs/editor/src/lib/plugins`.
2. Update `libs/editor/README.md`:
   - Add, rename, or remove the plugin in the **Available plugins** table.
   - Include consumer-facing command names.
   - Mention public queries, events, kits, or configuration where they affect
     consumer integration.
3. Update `apps/docs/src/app/docs/docs-nav.ts`:
   - Add a sidenav entry for new user-facing plugin documentation.
   - Place plugins by product area: formatting, document structure, media and
     links, productivity, layout, or guides.
4. Update or create markdown pages in `apps/docs/src/content/docs`:
   - Use frontmatter with `title` and `description`.
   - Explain selection in `plugins`, public commands, public queries, public
     options/defaults, shortcuts/events, and consumer-owned UI responsibilities.
   - Prefer small complete Angular examples over internal implementation notes.
5. If the live docs playground demonstrates the feature, update
   `apps/docs/src/app/playground` through the public `@qalma/editor` API only.
6. If the sandbox demonstrates the feature, keep `apps/sandbox` and docs
   playground behavior conceptually aligned unless the docs intentionally use a
   smaller example.
7. Update repository guidance when the workflow changes:
   - `AGENTS.md` for durable agent instructions.
   - `.agents/skills/qalma-plugin-development` if plugin definition-of-done or
     workflow expectations change.
8. Validate the changed surface with the narrowest useful checks:
   - `pnpm exec tsc -p libs/editor/tsconfig.lib.json --noEmit`
   - `pnpm exec tsc -p apps/docs/tsconfig.json --noEmit`
   - `pnpm nx build docs`
   - Relevant lint targets, noting unrelated existing failures separately.

## Documentation Rules

- Keep `libs/editor` docs headless: never imply Qalma renders toolbar buttons,
  menus, or styling.
- Treat `apps/docs` and `apps/sandbox` as consumers; examples must import from
  `@qalma/editor`, not internal paths.
- Document Qalma-owned contracts, not raw ProseMirror implementation details.
- Escape HTML-like snippets in inline markdown code with entities such as
  `&lt;` and `&gt;`; raw `<tag>` text inside inline code can be parsed as DOM and
  render as empty `<code></code>` nodes. Use fenced `html` blocks for raw HTML
  examples.
- If a plugin exposes events for consumer UI, show how a consumer can listen and
  decide what to render.
- If a page is intentionally left as a nav placeholder, state that in the final
  response; otherwise prefer creating the markdown page immediately.
