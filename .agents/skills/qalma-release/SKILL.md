---
name: qalma-release
description: Guide npm releases and the publish pipeline for @qalma/editor and @qalma/skills. Use when discussing or changing versioning, the release scripts, the GitHub Actions release workflow, the Nx release configuration, npm publishConfig, or npm Trusted Publisher setup.
---

# Qalma Release

`@qalma/editor`, `@qalma/skills`, and `@qalma/kit` are published to npm under
the `latest` dist-tag while the public API stabilizes. The packages are
pre-1.0, but public releases use normal semver versions without prerelease
suffixes. The scripted release path bumps the minor version on every release
(`0.2.0`, `0.3.0`, and so on).

Releases are tag-driven: a `vX.Y.Z` git tag pushed to `main` triggers GitHub
Actions, which builds, re-derives the version from the tag, and publishes all
three packages via npm's OIDC Trusted Publisher (no npm token in CI).

For the full architecture, history, and troubleshooting, read
[release-pipeline.md](references/release-pipeline.md).

## Cut a Release

1. Make sure `main` is clean and up to date (`git status`, `git pull`).
2. If the current version is still on the historical beta line, bootstrap the
   first normal semver release explicitly:

   ```sh
   pnpm nx release 0.2.0 --skip-publish --dry-run
   pnpm nx release 0.2.0 --skip-publish
   node tools/sync-changelog-doc.mjs
   ```

   This one explicit version is needed because Nx's native `minor` bump from
   `0.1.0-beta.4` resolves to `0.1.0`, while Qalma's new policy is to move to
   the next minor without a suffix.

3. After `0.2.0`, preview the next minor bump with `pnpm release:dry-run`.
4. After `0.2.0`, run the normal release command with `pnpm release`.

   For an explicit one-off version, call Nx directly so the version argument is
   passed before the changelog-sync command:

   ```sh
   pnpm nx release <version> --skip-publish
   node tools/sync-changelog-doc.mjs
   ```

   These scripts or commands run `nx release ... --skip-publish`, then sync the
   generated editor changelog into the docs changelog. The release portion:
   - Runs the `preVersionCommand`
     (`./node_modules/.bin/nx run-many -t build -p editor skills ui-kit`).
   - Writes the new version into `libs/editor/package.json` and
     `dist/libs/editor/package.json`, `libs/skills/package.json` and
     `dist/libs/skills/package.json`, plus `libs/ui-kit/package.json` and
     `dist/libs/ui-kit/package.json`.
   - Generates project changelogs from conventional commits.
   - Commits the manifest and changelog change as
     `chore(release): publish <version>`.
   - Creates an annotated tag `v<version>` on that commit.
   - Skips publishing (CI does that).

   After the release commit and tag are created, `tools/sync-changelog-doc.mjs`
   syncs `apps/docs/src/content/docs/changelog.md` and creates a separate
   `docs(changelog): sync docs changelog from release` commit if the docs
   changelog changed. The release tag intentionally stays on the release commit.

5. `git push --follow-tags` to push the commit and the tag. Pushing the tag is
   the actual deploy trigger — `.github/workflows/release.yml` runs, publishes
   `@qalma/editor@<version>`, `@qalma/skills@<version>`, and
   `@qalma/kit@<version>` under the `latest` dist-tag, then creates a GitHub
   release whose notes are this version's section of `libs/editor/CHANGELOG.md`.
6. Watch the "Release" workflow run in GitHub Actions to confirm the publish
   and the GitHub release both succeeded.

Before the first coupled tag that includes all packages, ensure `@qalma/skills`
and `@qalma/kit` both exist on npm and have the same Trusted Publisher
configuration as `@qalma/editor`. If npm package settings are not available yet,
bootstrap the missing package once manually, configure the Trusted Publisher,
then let tags publish all packages going forward.

## Versioning Conventions

- Use normal semver releases before `1.0.0`; do not add a `-beta`, `-alpha`, or
  other prerelease suffix on the scripted release path.
- The default release script always bumps to the next minor. From the historical
  beta line, use one explicit `0.2.0` release first; after that the normal
  script moves `0.2.0` to `0.3.0`, then `0.3.0` to `0.4.0`, and so on.
- Keep the historical alpha and beta lines as history only. Do not cut new
  prereleases unless the project intentionally reopens a prerelease track and
  updates this skill plus the release scripts again.
- Never push a `v*` tag for a version already published to npm — the workflow
  checks all package versions before publishing, and re-publishing an existing
  version fails before any package is published.
- `BREAKING CHANGE:` commit footers still document API breaks for history, even
  though the package remains pre-1.0.

## Do Not

- Run plain `nx release` (without `--skip-publish`) locally — it will attempt
  `npm publish` from your machine and re-introduce the 2FA/token friction the
  Trusted Publisher setup removed.
- Hand-edit package `version` fields — use `pnpm release` or
  `pnpm nx release <version> --skip-publish` so the commit, tag, and `dist`
  manifests stay in sync.
