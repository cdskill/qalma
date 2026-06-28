#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { addSkill } from './add';
import {
  SKILL_NAME,
  bundledSkillSource,
  isSkillTarget,
  skillTargets,
  targetDir,
} from './pack';

interface CliArgs {
  target: string;
  dir: string;
  cwd: string;
  force: boolean;
  help: boolean;
  version: boolean;
}

const HELP = `qalma-skills — install the Qalma agent skill pack

Usage:
  npx @qalma/skills add [options]

Options:
  --target <name>   destination tool: ${skillTargets().join(', ')} (default: agents)
  --dir <path>      explicit destination folder (overrides --target)
  --cwd <path>      base directory for --target (default: current directory)
  --force           overwrite an existing skill folder
  -h, --help        show this help
  -v, --version     print the package version

Examples:
  npx @qalma/skills add
  npx @qalma/skills add --target claude
  npx @qalma/skills add --dir ./tools/agents/qalma --force
`;

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = {
    target: 'agents',
    dir: '',
    cwd: process.cwd(),
    force: false,
    help: false,
    version: false,
  };

  const rest = [...argv];
  while (rest.length > 0) {
    const token = rest.shift() as string;
    switch (token) {
      case 'add':
        break;
      case '--target':
        args.target = expectValue(rest, '--target');
        break;
      case '--dir':
        args.dir = expectValue(rest, '--dir');
        break;
      case '--cwd':
        args.cwd = expectValue(rest, '--cwd');
        break;
      case '--force':
        args.force = true;
        break;
      case '-h':
      case '--help':
        args.help = true;
        break;
      case '-v':
      case '--version':
        args.version = true;
        break;
      default:
        if (token.startsWith('-')) {
          throw new Error(`Unknown option: ${token}`);
        }
        // Ignore unknown positionals so `add` stays the only command for now.
        break;
    }
  }

  return args;
}

function expectValue(rest: string[], flag: string): string {
  const value = rest.shift();
  if (value === undefined || value.startsWith('-')) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}

function packageVersion(packageDir: string): string {
  const manifest = JSON.parse(
    readFileSync(join(packageDir, 'package.json'), 'utf8'),
  ) as { version?: string };
  return manifest.version ?? '0.0.0';
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const packageDir = join(__dirname, '..');

  if (args.help) {
    process.stdout.write(HELP);
    return;
  }
  if (args.version) {
    process.stdout.write(`${packageVersion(packageDir)}\n`);
    return;
  }

  let destination: string;
  if (args.dir) {
    destination = resolve(args.cwd, args.dir);
  } else if (isSkillTarget(args.target)) {
    destination = targetDir(args.target, resolve(args.cwd));
  } else {
    throw new Error(
      `Unknown --target "${args.target}". ` +
        `Use one of: ${skillTargets().join(', ')} (or pass --dir).`,
    );
  }

  const source = bundledSkillSource(packageDir);
  const result = addSkill({ source, destination, force: args.force });

  process.stdout.write(
    `${result.overwritten ? 'Updated' : 'Installed'} the "${SKILL_NAME}" skill ` +
      `(${result.files.length} files)\n  -> ${result.destination}\n`,
  );
}

try {
  main();
} catch (error) {
  process.stderr.write(`qalma-skills: ${(error as Error).message}\n`);
  process.exitCode = 1;
}
