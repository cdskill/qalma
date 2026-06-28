import {
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { dirname, join } from 'node:path';

export interface AddSkillOptions {
  /** Absolute path to the skill source folder to copy. */
  source: string;
  /** Absolute path to the destination skill folder. */
  destination: string;
  /** Overwrite the destination when it already exists. Defaults to `false`. */
  force?: boolean;
}

export interface AddSkillResult {
  /** Absolute path the skill was written to. */
  destination: string;
  /** Absolute paths of the files written. */
  files: string[];
  /** Whether an existing destination was overwritten. */
  overwritten: boolean;
}

/**
 * Copy a skill folder into a destination, recursively. Refuses to clobber an
 * existing destination unless `force` is set, so a stray re-run never silently
 * discards local edits.
 */
export function addSkill(options: AddSkillOptions): AddSkillResult {
  const { source, destination, force = false } = options;

  if (!existsSync(source) || !statSync(source).isDirectory()) {
    throw new Error(`Skill source not found: ${source}`);
  }

  const overwritten = existsSync(destination);
  if (overwritten && !force) {
    throw new Error(
      `Destination already exists: ${destination}\n` +
        'Re-run with --force to overwrite it.',
    );
  }

  mkdirSync(dirname(destination), { recursive: true });
  cpSync(source, destination, { recursive: true, force: true });

  return { destination, files: listFiles(destination), overwritten };
}

function listFiles(root: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const full = join(root, entry.name);
    if (entry.isDirectory()) {
      files.push(...listFiles(full));
    } else {
      files.push(full);
    }
  }
  return files;
}
