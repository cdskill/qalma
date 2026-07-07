#!/usr/bin/env node
// Regenerates the docs changelog page from the canonical package changelog so
// the docs site never drifts from libs/editor/CHANGELOG.md. Wired into the
// `release` npm script; nx release generates the canonical changelog first,
// then this runs as a follow-up commit (never an amend, so the release tag
// keeps pointing at the release commit).
//
// Usage:
//   node tools/sync-changelog-doc.mjs            regenerate + commit if changed
//   node tools/sync-changelog-doc.mjs --no-commit  regenerate only

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const CANONICAL = join(repoRoot, 'libs/editor/CHANGELOG.md');
const DOCS = join(repoRoot, 'apps/docs/src/content/docs/changelog.md');
const DOCS_REL = 'apps/docs/src/content/docs/changelog.md';

const canonical = readFileSync(CANONICAL, 'utf8').trim();

const frontmatter = [
  '---',
  'title: Changelog',
  'description: Release notes for @qalma/editor, generated from libs/editor/CHANGELOG.md.',
  '---',
].join('\n');

const intro = [
  '# Changelog',
  '',
  'This page mirrors the canonical package changelog at',
  '`libs/editor/CHANGELOG.md`. It is regenerated from that file on every release —',
  'do not edit it by hand.',
].join('\n');

const next = `${frontmatter}\n\n${intro}\n\n${canonical}\n`;

let current = '';
try {
  current = readFileSync(DOCS, 'utf8');
} catch {
  // first run: file may not exist yet
}

if (current === next) {
  console.log('[sync-changelog-doc] docs changelog already in sync.');
  process.exit(0);
}

writeFileSync(DOCS, next);
console.log('[sync-changelog-doc] regenerated', DOCS_REL);

if (process.argv.includes('--no-commit')) {
  process.exit(0);
}

execFileSync('git', ['add', DOCS_REL], { cwd: repoRoot, stdio: 'inherit' });
execFileSync(
  'git',
  [
    'commit',
    '-m',
    'docs(changelog): sync docs changelog from release',
    '--',
    DOCS_REL,
  ],
  { cwd: repoRoot, stdio: 'inherit' },
);
console.log('[sync-changelog-doc] committed docs changelog.');
