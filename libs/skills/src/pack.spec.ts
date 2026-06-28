import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { targetDir } from './pack';

describe('targetDir', () => {
  it('uses the shared .agents skills directory for Codex installs', () => {
    expect(targetDir('codex', '/project')).toBe(
      join('/project', '.agents/skills', 'qalma'),
    );
  });

  it('keeps Claude installs in the Claude skills directory', () => {
    expect(targetDir('claude', '/project')).toBe(
      join('/project', '.claude/skills', 'qalma'),
    );
  });
});
