#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: pnpm release <version>  (e.g. 0.0.1-alpha.1)" >&2
  exit 1
fi

VERSION="$1"
TAG="v$VERSION"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Working tree is not clean. Commit or stash your changes first." >&2
  exit 1
fi

if git rev-parse "$TAG" >/dev/null 2>&1; then
  echo "Tag $TAG already exists." >&2
  exit 1
fi

# Sync libs/editor/package.json (and build dist/libs/editor for sanity) to the
# target version. The release workflow re-derives the version from the git tag
# and runs this same command, so this just keeps the repo's manifest in sync.
pnpm nx release version "$VERSION" --git-commit=false --git-tag=false --stage-changes=false

git add libs/editor/package.json
git commit -m "chore(editor): release $VERSION"
git tag -a "$TAG" -m "$TAG"

echo
echo "Created commit and tag $TAG."
read -r -p "Push branch and tag to origin to trigger the release workflow? [y/N] " confirm

if [[ "$confirm" =~ ^[Yy]$ ]]; then
  git push origin HEAD
  git push origin "$TAG"
else
  echo "Skipped push. Run 'git push origin HEAD && git push origin $TAG' when ready."
fi
