---
name: qalma-release
description: Guide npm releases and the publish pipeline for @qalma/editor. Use when discussing or changing versioning, the release scripts, the GitHub Actions release workflow, the Nx release configuration, npm publishConfig, or npm Trusted Publisher setup.
---

# Qalma Release

`@qalma/editor` is published to npm under the `alpha` dist-tag while the public
API stabilizes. Releases are tag-driven: a `vX.Y.Z[-prerelease]` git tag pushed
to `main` triggers GitHub Actions, which builds, re-derives the version from the
tag, and publishes via npm's OIDC Trusted Publisher (no npm token in CI).

For the full architecture, history, and troubleshooting, read
[release-pipeline.md](references/release-pipeline.md).

## Cut a Release

1. Make sure `main` is clean and up to date (`git status`, `git pull`).
2. Preview the bump: `pnpm release:dry-run <version>` (e.g.
   `0.0.1-alpha.2`). This shows the manifest diff without writing anything.
3. Run `pnpm release <version>`. This is `nx release <version> --skip-publish`,
   which:
   - Runs the `preVersionCommand` (`pnpm nx build editor`).
   - Writes the new version into `libs/editor/package.json` and
     `dist/libs/editor/package.json`.
   - Generates `libs/editor/CHANGELOG.md` from conventional commits.
   - Commits the manifest and changelog change as
     `chore(release): publish <version>`.
   - Creates an annotated tag `v<version>` on that commit.
   - Skips publishing (CI does that).
4. `git push --follow-tags` to push the commit and the tag. Pushing the tag is
   the actual deploy trigger — `.github/workflows/release.yml` runs, publishes
   `@qalma/editor@<version>` with the `alpha` dist-tag, then creates a GitHub
   release whose notes are this version's section of `CHANGELOG.md`.
5. Watch the "Release" workflow run in GitHub Actions to confirm the publish
   and the GitHub release both succeeded.

## Versioning Conventions

- Stay on `0.0.x-alpha.N` prereleases and the `alpha` dist-tag until the public
  API is stable enough for `latest`.
- Never push a `v*` tag for a version already published to npm — the workflow's
  `first_release` check only guards the very first publish; re-publishing an
  existing version will fail.
- `BREAKING CHANGE:` commit footers still document API breaks for history, even
  though changelog generation is disabled in `nx.json`.

## Do Not

- Run plain `nx release` (without `--skip-publish`) locally — it will attempt
  `npm publish` from your machine and re-introduce the 2FA/token friction the
  Trusted Publisher setup removed.
- Hand-edit `libs/editor/package.json`'s `version` field — always go through
  `pnpm release <version>` so the commit, tag, and `dist` manifest stay in sync.
