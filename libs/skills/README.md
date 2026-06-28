# @qalma/skills

Installs the [Qalma](https://qalma.dev/) agent skill pack into any project so an
AI agent can build Angular rich text editors with `@qalma/editor`. The skill
teaches integration, headless UI composition, plugin authoring, and debugging.

It ships the same `SKILL.md` source as the in-repo pack at `plugins/qalma`, so
Claude Code, Codex, and other `SKILL.md`-aware agents all read identical
guidance.

## Usage

```sh
# Tool-agnostic default → ./.agents/skills/qalma
npx @qalma/skills add

# Claude Code → ./.claude/skills/qalma
npx @qalma/skills add --target claude

# Codex → ./.codex/skills/qalma
npx @qalma/skills add --target codex

# Explicit location
npx @qalma/skills add --dir ./tools/agents/qalma --force
```

| Option       | Description                                            |
| ------------ | ------------------------------------------------------ |
| `--target`   | `agents` (default), `claude`, or `codex`               |
| `--dir`      | Explicit destination folder, overrides `--target`      |
| `--cwd`      | Base directory for `--target` (default: current dir)   |
| `--force`    | Overwrite an existing skill folder                     |

The command refuses to overwrite an existing folder unless `--force` is passed,
so it never silently discards local edits.

## Programmatic API

```ts
import { addSkill, bundledSkillSource, targetDir } from '@qalma/skills';
```
