import { existsSync } from 'node:fs';
import { join } from 'node:path';

/** The skill folder name shipped by this package. */
export const SKILL_NAME = 'qalma';

/** Known agent tools with a conventional skills directory. */
export type SkillTarget = 'agents' | 'claude' | 'codex';

/**
 * Conventional project-local directory each tool reads `SKILL.md` folders from.
 * `agents` is the tool-agnostic default also used by this repository.
 */
const TARGET_ROOTS: Record<SkillTarget, string> = {
  agents: '.agents/skills',
  claude: '.claude/skills',
  codex: '.codex/skills',
};

export function isSkillTarget(value: string): value is SkillTarget {
  return Object.prototype.hasOwnProperty.call(TARGET_ROOTS, value);
}

/** The list of supported `--target` values, for help text and validation. */
export function skillTargets(): SkillTarget[] {
  return Object.keys(TARGET_ROOTS) as SkillTarget[];
}

/** Conventional destination skill folder for a known agent tool. */
export function targetDir(target: SkillTarget, cwd: string): string {
  return join(cwd, TARGET_ROOTS[target], SKILL_NAME);
}

/**
 * Absolute path to the skill source bundled inside this package.
 *
 * Published layout: `<packageDir>/pack/skills/qalma`, copied from
 * `plugins/qalma/skills` at build time (see `project.json` assets).
 */
export function bundledSkillSource(packageDir: string): string {
  const candidate = join(packageDir, 'pack', 'skills', SKILL_NAME);
  if (!existsSync(candidate)) {
    throw new Error(
      `Bundled skill pack missing at ${candidate}. This is a packaging error; ` +
        'please report it at https://github.com/cdskill/qalma/issues.',
    );
  }
  return candidate;
}
