# Release Pipeline

## Package

- `@qalma/editor` — scoped, public npm package, built from `libs/editor` with
  `@nx/angular:package` (ng-packagr, partial Angular compilation).
- `libs/editor/package.json` carries `publishConfig: { access: "public", tag:
  "latest" }`, `repository`, `bugs`, `homepage`, `keywords`, and the
  `@angular/core` peer range. This file is the manifest that ships to npm.
- `libs/editor/ng-package.json` configures the ng-packagr build:
  `dest: "../../dist/libs/editor"`, `allowedNonPeerDependencies` for the
  `prosemirror-*` packages + `tslib`, entry `src/index.ts`.

## Nx Release Configuration (`nx.json`)

```jsonc
"release": {
  "projects": ["editor"],
  "version": {
    "preVersionCommand": "pnpm nx build editor",
    "manifestRootsToUpdate": ["{projectRoot}", "dist/libs/editor"]
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

- Single project ("editor") with no `projectsRelationship` → defaults to
  `fixed`, so the release tag pattern is `v{version}` (matches the
  `on: push: tags: 'v*'` trigger in the workflow).
- `preVersionCommand` rebuilds the lib so `dist/libs/editor/package.json`
  exists before its version is rewritten.
- `projectChangelogs` generates `libs/editor/CHANGELOG.md` from conventional
  commits and commits it alongside the version bump in the local
  `chore(release): publish {version}` commit. `workspaceChangelog` stays off
  (single-project repo, so a workspace-level changelog would be redundant).
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

`targetDefaults.nx-release-publish` (also in `nx.json`) configures the publish
target used by CI:

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

## Local Release Scripts (`package.json`)

```jsonc
"release": "nx release --skip-publish",
"release:dry-run": "nx release --skip-publish --dry-run"
```

`nx release <specifier> --skip-publish` defaults (confirmed via
`--printConfig` / dry-run on this workspace):

- `git.commit = true`, message `chore(release): publish {version}`.
- `git.tag = true`, pattern `v{version}`, `stageChanges = true`.
- Changelog step writes `libs/editor/CHANGELOG.md` and stages it into the same
  release commit (no GitHub release locally — `createRelease` is unset).
- Publish step is skipped (auto-answers "no" to the publish prompt).

This intentionally leaves the actual `npm publish` and the GitHub release to CI.

`prerelease` / `release:dry-run` use the `prerelease` specifier so repeated
alpha cuts bump `0.0.1-alpha.N` automatically.

## GitHub Actions Workflow (`.github/workflows/release.yml`)

- Trigger: `push: tags: 'v*'`.
- Permissions: `contents: write` (to create the GitHub release),
  `id-token: write` (required for npm OIDC Trusted Publishing).
- Steps:
  1. Checkout with full history (`fetch-depth: 0`).
  2. Setup pnpm 10.23.0, Node 24.x with `registry-url:
     https://registry.npmjs.org`.
  3. `npm install --global npm@latest` (Trusted Publishing needs a recent npm
     CLI).
  4. `pnpm install --frozen-lockfile`.
  5. Validate: `nx run-many -t lint`, `tsc --noEmit` for editor/sandbox/
     sandbox-e2e, `nx build sandbox`.
  6. Resolve version from `GITHUB_REF_NAME` (strip leading `v`); check
     `npm view @qalma/editor version` to set `first_release` for the very
     first publish.
  7. `pnpm nx release version <version> [--first-release] --git-commit=false
     --git-tag=false --stage-changes=false` — re-applies the version to
     `libs/editor/package.json` and `dist/libs/editor/package.json` inside the
     CI checkout (independent of whatever was committed locally).
  8. `npm publish dist/libs/editor --access public --tag latest --provenance`.
     The package is alpha-only, so `latest` tracks the newest alpha (it is what
     npmjs features and what a plain `npm install` resolves). Publishing under
     `latest` keeps this inside the single OIDC-authenticated publish call — a
     separate `npm dist-tag add` step would not be authenticated by the
     trusted-publishing token and would need a long-lived npm token secret.
  9. Create the GitHub release with the `gh` CLI (pre-installed on the runner,
     authenticated via `GITHUB_TOKEN`): an `awk` step extracts the current
     version's section from the committed `libs/editor/CHANGELOG.md` into
     `release-notes.md`, then `gh release create v<version> --title v<version>
     --notes-file release-notes.md` runs — adding `--prerelease` when the
     version contains a `-` (i.e. an `alpha`/`rc` preid). The committed
     changelog is the source of truth; nx's `createRelease` is not used (it has
     no CLI flag and would fire during the local release too).

## npm Trusted Publisher (OIDC)

Configured on the `@qalma/editor` npm package settings page:

- Publisher: GitHub Actions
- Organization or user / Repository: `cdskill` / `qalma`
- Workflow filename: `release.yml` (file lives at
  `.github/workflows/release.yml`)
- Environment name: empty (the `publish` job has no `environment:` key)
- Allowed actions: "Allow npm publish" only ("Allow npm stage publish" is
  unused by this workflow)

With Trusted Publishing configured, CI needs no npm token/secret — `npm
publish --provenance` authenticates via the GitHub Actions OIDC token.

"Publishing access" on the package can be set to "Require two-factor
authentication and disallow tokens (recommended)" — Trusted Publishers work
under either setting, so this is the stricter option for any remaining manual
publishes.

## Bootstrap History

`0.0.1-alpha.0` was published manually before Trusted Publishing existed, using
a granular access token scoped to `@qalma` plus `npm publish --otp=<code>`
(npm requires 2FA-or-token-with-2FA-bypass to publish; the account has 2FA
required for publishing, hence `--otp`). That bootstrap token should be revoked
once a CI-driven release via Trusted Publishing has succeeded.

## Troubleshooting

- `npm error 403 ... Two-factor authentication or granular access token with
  bypass 2fa enabled is required to publish packages.` — the npm account
  requires 2FA for publishing. For a manual publish, pass `--otp=<TOTP>`. CI
  publishes avoid this entirely via Trusted Publishing.
- If the workflow's "Resolve release version" step reports the tag version
  already exists on npm (and `first_release` is incorrectly `true`), the tag
  was likely pushed for a version already published — delete the tag and
  re-tag with the next version instead.
