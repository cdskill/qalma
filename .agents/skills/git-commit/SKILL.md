---
name: git-commit
description: Create well-formatted git commits from staged changes. Use when the user invokes /commit or asks to generate and create a conventional commit for the current repository.
---

# Git Commit

Create a focused conventional commit from the changes that are already staged.

## Workflow

1. Run `git status --short` to understand staged, unstaged, and untracked files.
2. Run `git diff --staged` and analyze only staged changes.
3. If nothing is staged, stop and ask the user to stage changes first.
4. Generate a conventional commit message that reflects the staged diff.
5. Create the commit with `git commit` using a properly formatted multi-line
   message.
6. Report the commit hash and message summary.

## Commit Format

```text
<type>(<scope>): <description>

[optional body]

[optional footer]
```

## Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style or formatting changes
- `refactor`: Code restructuring without behavior changes
- `test`: Adding or modifying tests
- `chore`: Maintenance tasks

## Message Guidelines

- Use an imperative, lower-case description without a trailing period.
- Use a narrow scope when one is clear from the staged paths, such as `editor`,
  `sandbox`, `plugins`, `docs`, or `repo`.
- Prefer a single-line commit when the staged change is small and obvious.
- Add a short body when the diff includes multiple meaningful changes or when
  the reason for the change is not obvious from the subject.
- Mention breaking changes with a `BREAKING CHANGE:` footer when applicable.
- Do not include unstaged or untracked changes in the commit message.

## Example

```text
feat(auth): add password reset functionality

- Add forgot password form
- Implement email verification flow
- Add password reset endpoint
```
