# Release Pipeline

## Package

- `@qalma/editor` — scoped, public npm package, built from `libs/editor` with
  `@nx/angular:package` (ng-packagr, partial Angular compilation).
- `@qalma/skills` — scoped, public npm package, built from `libs/skills` with
  `@nx/js:tsc`. It ships the `qalma-skills` CLI and bundles the public skill
  source from `plugins/qalma/skills` into `pack/skills/qalma`.
- `libs/editor/package.json` carries the package metadata: public npm access,
  the `latest` publish tag, `repository`, `bugs`, `homepage`, `keywords`, and
  the `@angular/core` peer range. This file is the manifest that ships to npm.
- `libs/editor/ng-package.json` configures the ng-packagr build:
  `dest: "../../dist/libs/editor"`, `allowedNonPeerDependencies` for the
  `prosemirror-*` packages + `tslib`, entry `src/index.ts`.
- `libs/skills/package.json` carries the package metadata, public npm access,
  the `latest` publish tag, `bin`, `main`, `types`, and `files` list for the
  skill installer package.

## Nx Release Configuration (`nx.json`)

```jsonc
"release": {
  "projects": ["editor", "skills"],
  "version": {
    "preVersionCommand": "pnpm nx run-many -t build -p editor skills",
    "manifestRootsToUpdate": ["{projectRoot}", "dist/libs/{projectName}"]
  },
  "changelog": {
    "automaticFromRef": true,
    "workspaceChangelog": false,
    "projectChangelogs": {
      "renderOptions": {
        "authors": false
      }
    }
  }
}
```

- `editor` and `skills` share Nx's default `fixed` release relationship, so
  both packages receive the same version and the release tag pattern remains
  `v{version}` (matches the `on: push: tags: 'v*'` trigger in the workflow).
- `preVersionCommand` rebuilds both packages so `dist/libs/editor/package.json`
  and `dist/libs/skills/package.json` exist before their versions are
  rewritten.
- `projectChangelogs` generates project changelogs from conventional commits
  and commits them alongside the version bump in the local
  `chore(release): publish {version}` commit. `workspaceChangelog` stays off
  because the GitHub release notes intentionally come from the editor changelog.
  When `skills` has no matching code changes, Nx creates a version-bump-only
  `libs/skills/CHANGELOG.md` entry to keep the fixed version aligned.
- `renderOptions.authors: false` drops the "❤️ Thank You" contributor section
  (the only built-in toggle for it — the heart emoji is hardcoded in nx's
  default renderer, so disabling the section is the way to remove it). The
  section heading emojis (🚀/🩹/⚠️) are nx defaults and remain.
- `automaticFromRef: true` lets changelog generation fall back to the first
  commit when no previous `v*` tag exists, so the first nx-managed changelog
  (and the CI release-notes extraction) don't hard-fail. Once a `v*` tag
  exists, nx diffs tag-to-tag as usual.
- `createRelease` is intentionally **not** set in `nx.json`: it is config-only
  (no CLI flag) and would fire during the local `nx release` too, where the tag
  isn't on the remote yet. The GitHub release is created in CI instead (see
  below).

`targetDefaults.nx-release-publish` (also in `nx.json`) configures the default
publish target options:

```jsonc
"nx-release-publish": {
  "dependsOn": ["build"],
  "options": {
    "packageRoot": "dist/libs/editor",
    "access": "public",
    "registry": "https://registry.npmjs.org/",
    "tag": "latest"
  }
}
```

`libs/skills/project.json` overrides `packageRoot` to `dist/libs/skills`. CI
publishes the explicit package roots directly with `npm publish`, but these Nx
publish targets stay aligned for local dry-runs or future Nx-driven publishing.

## Local Release Scripts (`package.json`)

```jsonc
"release": "nx release --skip-publish && node tools/sync-changelog-doc.mjs",
"prerelease": "nx release prerelease --skip-publish && node tools/sync-changelog-doc.mjs",
"prerelease:dry-run": "nx release prerelease --skip-publish --dry-run",
"release:beta:init": "nx release preminor --preid beta --skip-publish && node tools/sync-changelog-doc.mjs",
"release:beta:init:dry-run": "nx release preminor --preid beta --skip-publish --dry-run",
"release:beta": "nx release prerelease --preid beta --skip-publish && node tools/sync-changelog-doc.mjs",
"release:beta:dry-run": "nx release prerelease --preid beta --skip-publish --dry-run"
```

`nx release <specifier> --skip-publish` defaults (confirmed via
`--printConfig` / dry-run on this workspace):

- `git.commit = true`, message `chore(release): publish {version}`.
- `git.tag = true`, pattern `v{version}`, `stageChanges = true`.
- Changelog step writes project changelogs such as `libs/editor/CHANGELOG.md`
  and `libs/skills/CHANGELOG.md`, then stages them into the same release commit
  (no GitHub release locally — `createRelease` is unset).
- Publish step is skipped (auto-answers "no" to the publish prompt).

The beta scripts are the public prerelease path:

- `release:beta:init` starts the beta line with `preminor --preid beta`
  (for example, from the alpha line to `0.1.0-beta.0`).
- `release:beta` advances the beta line with `prerelease --preid beta`
  (for example, `0.1.0-beta.1`).
- The matching `*:dry-run` scripts preview those bumps without writing.

The generic `release` script remains available for the default Nx release flow,
but explicit stable or one-off versions should call Nx directly so the version
argument is passed before the changelog-sync command:

```sh
pnpm nx release <version> --skip-publish
node tools/sync-changelog-doc.mjs
```

Use `pnpm nx release <version> --skip-publish --dry-run` for an explicit dry
run.

After the Nx release command creates the release commit and tag,
`tools/sync-changelog-doc.mjs` regenerates
`apps/docs/src/content/docs/changelog.md` from `libs/editor/CHANGELOG.md` and
creates a follow-up `docs(changelog): sync docs changelog from release` commit
when the docs page changes. This intentionally keeps the release tag pointing at
the release commit while still pushing docs changelog drift in the same branch.

The actual `npm publish` calls for both packages and the GitHub release are
left to CI.

## GitHub Actions Workflow (`.github/workflows/release.yml`)

- Trigger: `push: tags: 'v*'`.
- Permissions: `contents: write` (to create the GitHub release),
  `id-token: write` (required for npm OIDC Trusted Publishing).
- Steps:
  1. Checkout with full history (`fetch-depth: 0`).
  2. Setup pnpm 10.23.0 and Node 24.x with the npm registry configured for
     publishing.
  3. `npm install --global npm@latest` (Trusted Publishing needs a recent npm
     CLI).
  4. `pnpm install --frozen-lockfile`.
  5. Validate: `nx run-many -t lint`, `tsc --noEmit` for editor, skills,
     sandbox, and sandbox-e2e configs, `nx test editor`, `nx test sandbox`,
     `nx test skills`, `nx build sandbox`, and the Chromium `sandbox-e2e`
     Playwright run.
  6. Resolve version from `GITHUB_REF_NAME` (strip leading `v`); check
     `npm view @qalma/editor version` to set `first_release` for the very
     first publish.
  7. Re-apply the tag version inside CI:

     ```sh
     pnpm nx release version <version> [--first-release] \
       --git-commit=false \
       --git-tag=false \
       --stage-changes=false
     ```

     This rewrites both package manifests under `libs/*/package.json` and
     `dist/libs/*/package.json` inside the CI checkout, independent of whatever
     was committed locally.

  8. Check that `@qalma/editor@<version>` and `@qalma/skills@<version>` are not
     already published. This happens before any publish command so the workflow
     does not partially publish one package when the other version already
     exists.
  9. Publish both package roots sequentially, with `skills` first because it is
     the newer package and therefore the more likely place for a Trusted
     Publisher setup issue:

     ```sh
     npm publish dist/libs/skills --access public --tag latest --provenance
     npm publish dist/libs/editor --access public --tag latest --provenance
     ```

     The packages are pre-1.0 with no stable release yet, so `latest` tracks the
     newest beta (it is what npmjs features and what plain installs resolve).
     Publishing under `latest` keeps this inside the OIDC-authenticated publish
     calls — separate `npm dist-tag add` steps would not be authenticated by the
     trusted-publishing token and would need a long-lived npm token secret.
     Once `1.0.0` is published, keep stable on `latest` and move later
     prereleases to a separate `next`/`beta` dist-tag.
  10. Create the GitHub release with the `gh` CLI (pre-installed on the runner,
     authenticated via `GITHUB_TOKEN`): an `awk` step extracts the current
     version's section from the committed `libs/editor/CHANGELOG.md` into
     `release-notes.md`, then `gh release create` creates `v<version>` from
     those notes, adding `--prerelease` when the version contains a `-` (i.e. a
     `beta`/`rc` preid). The committed changelog is the source of truth; nx's
     `createRelease` is not used (it has no CLI flag and would fire during the
     local release too).

## npm Trusted Publisher (OIDC)

Configured on the npm package settings pages for both `@qalma/editor` and
`@qalma/skills`:

- Publisher: GitHub Actions
- Organization or user / Repository: `cdskill` / `qalma`
- Workflow filename: `release.yml` (file lives at
  `.github/workflows/release.yml`)
- Environment name: empty (the `publish` job has no `environment:` key)
- Allowed actions: "Allow npm publish" only ("Allow npm stage publish" is
  unused by this workflow)

With Trusted Publishing configured for both packages, CI needs no npm
token/secret — each `npm publish --provenance` authenticates via the GitHub
Actions OIDC token.

"Publishing access" on the package can be set to "Require two-factor
authentication and disallow tokens (recommended)" — Trusted Publishers work
under either setting, so this is the stricter option for any remaining manual
publishes.

## Bootstrap History

`@qalma/editor@0.0.1-alpha.0` was published manually before Trusted Publishing
existed, using a granular access token scoped to `@qalma` plus
`npm publish --otp=<code>` (npm requires 2FA-or-token-with-2FA-bypass to
publish; the account has 2FA required for publishing, hence `--otp`). That
bootstrap token should be revoked once a CI-driven release via Trusted
Publishing has succeeded.

Before the first coupled tag publish, make sure `@qalma/skills` exists on npm
and has the same Trusted Publisher configuration as `@qalma/editor`; otherwise
the second publish will fail even though the workflow code is correct. If npm
package settings are not available yet for `@qalma/skills`, bootstrap the
package once manually from `dist/libs/skills` with
`npm publish dist/libs/skills --access public --otp=<TOTP>`, configure the
Trusted Publisher, then let tag-driven CI publish both packages going forward.

## Troubleshooting

- `npm error 403` about two-factor authentication or a granular access token
  with 2FA bypass — the npm account requires 2FA for publishing. For a manual
  publish, pass `--otp=<TOTP>`. CI publishes avoid this entirely via Trusted
  Publishing.
- If the workflow's "Verify package versions are unpublished" step reports that
  either package version already exists on npm, delete the tag and re-tag with
  the next version instead.
- If `npm publish dist/libs/skills` fails with Trusted Publishing/OIDC errors,
  check the `@qalma/skills` npm package settings and mirror the
  `@qalma/editor` Trusted Publisher configuration.
