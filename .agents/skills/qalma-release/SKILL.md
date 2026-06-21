---
name: qalma-release
description: Guide npm releases and the publish pipeline for @qalma/editor. Use when discussing or changing versioning, the release scripts, the GitHub Actions release workflow, the Nx release configuration, npm publishConfig, or npm Trusted Publisher setup.
---

# Qalma Release

`@qalma/editor` is published to npm under the `latest` dist-tag while the public
API stabilizes. The package is pre-1.0 and now uses beta prereleases for public
early-adopter cuts. There is no stable version to reserve `latest` for yet, so
`latest` tracks the newest beta and remains what npmjs features and what
`npm install @qalma/editor` resolves.

Releases are tag-driven: a `vX.Y.Z[-prerelease]` git tag pushed to `main`
triggers GitHub Actions, which builds, re-derives the version from the tag, and
publishes via npm's OIDC Trusted Publisher (no npm token in CI). When a stable
`1.0.0` is cut, publish it as `latest` and move later prereleases back to a
separate `next`/`beta` dist-tag.

For the full architecture, history, and troubleshooting, read
[release-pipeline.md](references/release-pipeline.md).

## Cut a Release

1. Make sure `main` is clean and up to date (`git status`, `git pull`).
2. Preview the beta bump:
   - First beta from the alpha line: `pnpm release:beta:init:dry-run`
     (uses `preminor --preid beta`, e.g. `0.1.0-beta.0`).
   - Subsequent betas: `pnpm release:beta:dry-run`
     (uses `prerelease --preid beta`, e.g. `0.1.0-beta.1`).
   - Explicit stable or one-off version:
     `pnpm nx release <version> --skip-publish --dry-run`.
3. Run the matching release command:
   - First beta: `pnpm release:beta:init`.
   - Subsequent beta: `pnpm release:beta`.
   - Explicit stable or one-off version:
     `pnpm nx release <version> --skip-publish`, then
     `node tools/sync-changelog-doc.mjs`.

   These scripts or commands run `nx release ... --skip-publish`, then sync the
   generated editor changelog into the docs changelog. The release portion:
   - Runs the `preVersionCommand` (`pnpm nx build editor`).
   - Writes the new version into `libs/editor/package.json` and
     `dist/libs/editor/package.json`.
   - Generates `libs/editor/CHANGELOG.md` from conventional commits.
   - Commits the manifest and changelog change as
     `chore(release): publish <version>`.
   - Creates an annotated tag `v<version>` on that commit.
   - Skips publishing (CI does that).

   After the release commit and tag are created, `tools/sync-changelog-doc.mjs`
   syncs `apps/docs/src/content/docs/changelog.md` and creates a separate
   `docs(changelog): sync docs changelog from release` commit if the docs
   changelog changed. The release tag intentionally stays on the release commit.

4. `git push --follow-tags` to push the commit and the tag. Pushing the tag is
   the actual deploy trigger — `.github/workflows/release.yml` runs, publishes
   `@qalma/editor@<version>` under the `latest` dist-tag, then creates a GitHub
   release whose notes are this version's section of `CHANGELOG.md`.
5. Watch the "Release" workflow run in GitHub Actions to confirm the publish
   and the GitHub release both succeeded.

## Versioning Conventions

- Use beta prereleases for public early-adopter releases before `1.0.0`
  (`0.1.0-beta.N` unless an explicit version is intentionally chosen). `latest`
  tracks the newest beta until a stable release exists, keeping npmjs and plain
  installs current. At `1.0.0`, stable remains on `latest` and later
  prereleases should move to a separate `next`/`beta` dist-tag.
- Keep the historical alpha line as history only. Do not cut new alpha releases
  unless the project intentionally reopens an alpha track and updates this skill
  plus the release scripts again.
- Never push a `v*` tag for a version already published to npm — the workflow's
  `first_release` check only guards the very first publish; re-publishing an
  existing version will fail.
- `BREAKING CHANGE:` commit footers still document API breaks for history, even
  though the package remains pre-1.0.

## Do Not

- Run plain `nx release` (without `--skip-publish`) locally — it will attempt
  `npm publish` from your machine and re-introduce the 2FA/token friction the
  Trusted Publisher setup removed.
- Hand-edit `libs/editor/package.json`'s `version` field — use the beta release
  scripts or `pnpm nx release <version> --skip-publish` so the commit, tag, and
  `dist` manifest stay in sync.
