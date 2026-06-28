import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { addSkill } from './add';

describe('addSkill', () => {
  let root: string;
  let source: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'qalma-skills-'));
    source = join(root, 'source', 'qalma');
    mkdirSync(join(source, 'references'), { recursive: true });
    writeFileSync(join(source, 'SKILL.md'), 'skill');
    writeFileSync(join(source, 'references', 'a.md'), 'a');
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('copies the skill tree into a fresh destination', () => {
    const destination = join(root, 'out', 'qalma');

    const result = addSkill({ source, destination });

    expect(result.overwritten).toBe(false);
    expect(result.files).toHaveLength(2);
    expect(existsSync(join(destination, 'SKILL.md'))).toBe(true);
    expect(existsSync(join(destination, 'references', 'a.md'))).toBe(true);
  });

  it('refuses to overwrite an existing destination without force', () => {
    const destination = join(root, 'out', 'qalma');
    addSkill({ source, destination });

    expect(() => addSkill({ source, destination })).toThrow(/--force/);
  });

  it('overwrites with force and reports it', () => {
    const destination = join(root, 'out', 'qalma');
    addSkill({ source, destination });
    writeFileSync(join(source, 'SKILL.md'), 'updated');

    const result = addSkill({ source, destination, force: true });

    expect(result.overwritten).toBe(true);
    expect(readFileSync(join(destination, 'SKILL.md'), 'utf8')).toBe('updated');
  });

  it('replaces an existing destination with force instead of merging stale files', () => {
    const destination = join(root, 'out', 'qalma');
    addSkill({ source, destination });
    writeFileSync(join(destination, 'stale.md'), 'stale');

    const result = addSkill({ source, destination, force: true });

    expect(result.overwritten).toBe(true);
    expect(result.files).toHaveLength(2);
    expect(existsSync(join(destination, 'stale.md'))).toBe(false);
  });

  it('throws when the source folder is missing', () => {
    expect(() =>
      addSkill({ source: join(root, 'nope'), destination: join(root, 'out') }),
    ).toThrow(/not found/);
  });
});
