---
title: Agent Skills
description: Install the Qalma agent skill pack with @qalma/skills for Codex, Claude Code, and other SKILL.md-aware coding agents.
---

# Agent Skills

Qalma ships an optional agent skill pack for coding agents that understand
`SKILL.md` folders. The skill teaches an agent how to integrate `@qalma/editor`,
compose Angular-owned editor UI, choose first-party plugins, author custom Qalma
plugins, and debug common editor behavior.

The npm package is `@qalma/skills`. The main install command is:

```bash
npx @qalma/skills add
```

That command installs the Qalma skill into:

```text
./.agents/skills/qalma
```

Use it when you want an AI coding agent to have Qalma-specific project guidance
inside your Angular repository.

## Requirements

You need Node.js and a package runner such as `npx`. The skill pack is separate
from the editor runtime: installing it does not add `@qalma/editor` to your app
and does not change your Angular code.

Install the editor itself with:

```bash
npm install @qalma/editor
```

Install the agent guidance with:

```bash
npx @qalma/skills add
```

## Install For Your Agent

The default target is tool-agnostic and works for agents that read
`./.agents/skills`:

```bash
npx @qalma/skills add
```

For Claude Code, install to `./.claude/skills/qalma`:

```bash
npx @qalma/skills add --target claude
```

For Codex, install to `./.codex/skills/qalma`:

```bash
npx @qalma/skills add --target codex
```

For a custom location, pass `--dir`:

```bash
npx @qalma/skills add --dir ./tools/agent-skills/qalma
```

## Options

| Option | Description |
| ------ | ----------- |
| `--target agents` | Install to `./.agents/skills/qalma`. This is the default. |
| `--target claude` | Install to `./.claude/skills/qalma`. |
| `--target codex` | Install to `./.codex/skills/qalma`. |
| `--dir &lt;path&gt;` | Install to an explicit folder instead of a known target. |
| `--cwd &lt;path&gt;` | Resolve the target directory from another working directory. |
| `--force` | Replace an existing Qalma skill folder. |

The installer refuses to overwrite an existing folder unless `--force` is
passed. This protects local edits to the installed skill.

## Update The Skill

Run the same command with `--force` to refresh an existing install:

```bash
npx @qalma/skills add --force
```

Use the same target you originally installed with:

```bash
npx @qalma/skills add --target claude --force
```

## What Gets Installed

The installed folder is named `qalma` and contains:

- `SKILL.md` — the entry point your agent reads.
- `references/` — focused guidance for editor integration, plugin authoring,
  troubleshooting, and contributing to Qalma.
- `agents/openai.yaml` — metadata for agents that read OpenAI-style skill UI
  hints.

The skill is documentation and workflow guidance for agents. It does not run in
your application bundle.

## Next Steps

- [Installation](/docs/installation) — install `@qalma/editor` in Angular.
- [Quick Start](/docs/quick-start) — build a working editor.
- [Building a Custom Plugin](/docs/custom-plugin) — extend Qalma with your own
  editor behavior.
