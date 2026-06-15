---
name: git-commit
description: Create well-formatted conventional commits from staged changes, with a MANDATORY scope. Use when the user invokes /git-commit, /commit, or asks to generate and create a commit for this repository.
---

# Git Commit

Create a focused conventional commit from the changes that are already staged.
Every commit in this repository MUST carry a `type(scope): description` header —
a commit without a scope is invalid here.

## Workflow

1. Run `git status --short` to understand staged, unstaged, and untracked files.
2. Run `git diff --staged` and analyze only staged changes.
3. If nothing is staged, stop and ask the user to stage changes first.
4. Pick the `type` and a **required** `scope` from the tables below, based on the
   staged paths. If the diff legitimately spans several scopes, either split it
   into separate commits or use the broadest accurate scope (e.g. `repo`).
5. Generate a conventional commit message that reflects the staged diff.
6. **Validate before committing**: the subject line MUST match
   `^(feat|fix|docs|style|refactor|perf|test|build|ci|chore)\([a-z0-9-]+\)!?: .+`.
   If it does not (e.g. the scope is missing), fix the message — never commit
   without a scope.
7. Create the commit with `git commit` using the validated multi-line message.
8. Report the commit hash and message summary.

## Commit Format

```text
<type>(<scope>): <description>

[optional body]

[optional footer]
```

The `(<scope>)` segment is **not optional** in this repository.

## Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style or formatting changes
- `refactor`: Code restructuring without behavior changes
- `perf`: Performance improvement
- `test`: Adding or modifying tests
- `build`: Build system, dependencies, or packaging
- `ci`: CI/CD pipeline changes
- `chore`: Maintenance tasks

## Scopes (required — pick the most specific match)

| Scope       | Use for changes under…                                  |
| ----------- | ------------------------------------------------------- |
| `editor`    | `libs/editor` — the `@qalma/editor` library             |
| `docs`      | `apps/docs` / `apps/docs-e2e` — the documentation site  |
| `sandbox`   | `apps/sandbox` / `apps/sandbox-e2e` — the demo app       |
| `bench`     | `bench/**` — benchmarks (e.g. bundle-size)               |
| `infra`     | `infra/**` — Terraform/OpenTofu, hosting, CDN            |
| `skills`    | `.agents/skills` / `.claude/skills`                      |
| `agents`    | `.agents` agent configuration (non-skill)                |
| `release`   | Version bumps and release publishing                     |
| `repo`      | Repo-wide tooling, root config, or genuinely cross-cutting changes |

If a needed scope is not listed, choose a short lower-case noun that names the
affected area (kebab-case allowed, e.g. `seo`) — but a scope is still required.
Merge commits created by `git merge`/PR merges are the only exception and are
left untouched.

## Message Guidelines

- Use an imperative, lower-case description without a trailing period.
- Always include a scope (see above). When in doubt between two scopes, prefer
  the more specific one; fall back to `repo` only for truly cross-cutting work.
- Prefer a single-line commit when the staged change is small and obvious.
- Add a short body when the diff includes multiple meaningful changes or when
  the reason for the change is not obvious from the subject.
- Mention breaking changes with a `!` after the scope and/or a
  `BREAKING CHANGE:` footer when applicable.
- Do not include unstaged or untracked changes in the commit message.

## Examples

```text
feat(editor): add inline code mark to the toolbar
```

```text
docs(repo): rewrite root README and add bundle-size comparison
```

```text
feat(editor)!: rename EditorConfig.plugins to extensions

BREAKING CHANGE: `plugins` is now `extensions` in the public config.
```
