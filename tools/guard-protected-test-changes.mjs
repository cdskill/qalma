#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const APPROVAL_LABEL = 'approved-test-change';

const protectedChecks = [
  {
    reason: 'GitHub workflow',
    matches: (file) => file.startsWith('.github/workflows/'),
  },
  {
    reason: 'CODEOWNERS',
    matches: (file) => file === '.github/CODEOWNERS',
  },
  {
    reason: 'test-change guard',
    matches: (file) => file === 'tools/guard-protected-test-changes.mjs',
  },
  {
    reason: 'unit or integration test',
    matches: (file) => /\.(spec|test)\.[cm]?[jt]sx?$/.test(file),
  },
  {
    reason: 'test setup',
    matches: (file) => file.endsWith('/test-setup.ts'),
  },
  {
    reason: 'snapshot or golden output',
    matches: (file) =>
      file.includes('/__snapshots__/') ||
      file.endsWith('.snap') ||
      file.includes('/golden/'),
  },
  {
    reason: 'browser E2E project',
    matches: (file) => /^apps\/[^/]+-e2e\//.test(file),
  },
  {
    reason: 'Playwright config',
    matches: (file) => /(^|\/)playwright\.config\.[cm]?[jt]s$/.test(file),
  },
  {
    reason: 'Vitest or Vite test config',
    matches: (file) => /(^|\/)(vite|vitest)\.config\.[cm]?[jt]s$/.test(file),
  },
  {
    reason: 'test TypeScript config',
    matches: (file) => /(^|\/)tsconfig\.spec\.json$/.test(file),
  },
  {
    reason: 'public API snapshot',
    matches: (file) =>
      /(^|\/)(api-report|public-api|api-extractor)\./.test(file),
  },
];

const args = parseArgs(process.argv.slice(2));
const event = readGithubEvent();
const changedFiles = getChangedFiles(event, args);
const protectedFiles = changedFiles
  .map((file) => ({
    file,
    reason: protectedChecks.find((check) => check.matches(file))?.reason,
  }))
  .filter((entry) => entry.reason);

if (protectedFiles.length === 0) {
  console.log('No protected test, CI, or guard files changed.');
  process.exit(0);
}

if (hasApproval(event, args)) {
  console.log(
    `Protected test changes allowed by "${APPROVAL_LABEL}" approval.`,
  );
  logProtectedFiles(protectedFiles);
  process.exit(0);
}

if (!isPullRequestEvent()) {
  console.log(
    'Protected files changed outside a pull request; CODEOWNERS and branch protection must govern this path.',
  );
  logProtectedFiles(protectedFiles);
  process.exit(0);
}

console.error(
  `Protected test, CI, or guard files changed without the "${APPROVAL_LABEL}" label.`,
);
console.error(
  'A human reviewer should inspect the intent before this PR can update tests or their enforcement.',
);
logProtectedFiles(protectedFiles);
process.exit(1);

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--base') {
      parsed.base = argv[index + 1];
      index += 1;
    } else if (arg === '--head') {
      parsed.head = argv[index + 1];
      index += 1;
    } else if (arg === '--approval-label') {
      parsed.approvalLabel = argv[index + 1];
      index += 1;
    }
  }

  return parsed;
}

function readGithubEvent() {
  const eventPath = process.env.GITHUB_EVENT_PATH;

  if (!eventPath || !existsSync(eventPath)) {
    return null;
  }

  return JSON.parse(readFileSync(eventPath, 'utf8'));
}

function isPullRequestEvent() {
  return ['pull_request', 'pull_request_target'].includes(
    process.env.GITHUB_EVENT_NAME ?? '',
  );
}

function hasApproval(event, args) {
  const approvalLabel = args.approvalLabel ?? APPROVAL_LABEL;

  if (process.env.ALLOW_PROTECTED_TEST_CHANGES === 'true') {
    return true;
  }

  return Boolean(
    event?.pull_request?.labels?.some((label) => label.name === approvalLabel),
  );
}

function getChangedFiles(event, args) {
  const explicitBase = args.base;
  const explicitHead = args.head;
  const pullRequestBase = event?.pull_request?.base?.sha;
  const pullRequestHead = event?.pull_request?.head?.sha;
  const baseRef =
    process.env.GITHUB_BASE_REF || event?.pull_request?.base?.ref || 'main';
  const candidates = [];

  if (explicitBase && explicitHead) {
    candidates.push([`${explicitBase}...${explicitHead}`]);
  }

  if (explicitBase && !explicitHead) {
    candidates.push([`${explicitBase}...HEAD`]);
  }

  if (pullRequestBase && pullRequestHead) {
    candidates.push([`${pullRequestBase}...${pullRequestHead}`]);
  }

  candidates.push([`origin/${baseRef}...HEAD`], [`${baseRef}...HEAD`]);

  for (const candidate of candidates) {
    const files = tryGitDiff(candidate);

    if (files) {
      return Array.from(new Set([...files, ...getWorktreeChangedFiles()]));
    }
  }

  throw new Error(
    `Unable to resolve changed files. Tried ranges: ${candidates
      .map((candidate) => candidate.join(' '))
      .join(', ')}`,
  );
}

function tryGitDiff(rangeArgs) {
  try {
    const output = execFileSync(
      'git',
      ['diff', '--name-only', '--diff-filter=ACMRTUXB', ...rangeArgs],
      {
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'ignore'],
      },
    );

    return output
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return null;
  }
}

function getWorktreeChangedFiles() {
  const tracked = tryGitDiff(['HEAD']) ?? [];
  const untracked = execFileSync(
    'git',
    ['ls-files', '--others', '--exclude-standard'],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    },
  )
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return [...tracked, ...untracked];
}

function logProtectedFiles(files) {
  for (const entry of files) {
    console.error(`- ${entry.file} (${entry.reason})`);
  }
}
