#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const major = Number(process.argv[2]);

if (major !== 21 && major !== 22) {
  throw new Error('Usage: node tools/verify-angular-compatibility.mjs <21|22>');
}

const workspaceRoot = resolve(import.meta.dirname, '..');
const editorPackage = join(workspaceRoot, 'dist/libs/editor');
const kitPackage = join(workspaceRoot, 'dist/libs/ui-kit');

if (!existsSync(editorPackage) || !existsSync(kitPackage)) {
  throw new Error(
    'Build the editor and UI kit before running Angular compatibility verification.',
  );
}

const fixtureRoot = mkdtempSync(
  join(tmpdir(), `qalma-angular-${major}-compat-`),
);
const angularVersion = `^${major}.0.0`;
const typescriptVersion = major === 21 ? '~5.9.2' : '~6.0.0';

try {
  const editorTarball = pack(editorPackage);
  const kitTarball = pack(kitPackage);

  writeFileSync(
    join(fixtureRoot, 'package.json'),
    JSON.stringify(
      {
        name: `qalma-angular-${major}-compatibility`,
        private: true,
        type: 'module',
        dependencies: {
          '@angular/common': angularVersion,
          '@angular/compiler': angularVersion,
          '@angular/compiler-cli': angularVersion,
          '@angular/core': angularVersion,
          '@angular/forms': angularVersion,
          '@angular/platform-browser': angularVersion,
          '@ng-icons/core': '^33.2.3',
          '@ng-icons/lucide': '^33.2.3',
          '@qalma/editor': `file:${editorTarball}`,
          '@qalma/kit': `file:${kitTarball}`,
          rxjs: '^7.8.2',
          tslib: '^2.8.1',
          typescript: typescriptVersion,
        },
      },
      null,
      2,
    ),
  );
  writeFileSync(
    join(fixtureRoot, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          target: 'ES2022',
          module: 'ES2022',
          moduleResolution: 'bundler',
          experimentalDecorators: true,
          skipLibCheck: false,
          strict: true,
        },
        angularCompilerOptions: {
          strictTemplates: true,
        },
        files: ['fixture.ts'],
      },
      null,
      2,
    ),
  );
  writeFileSync(
    join(fixtureRoot, 'fixture.ts'),
    `import { Component } from '@angular/core';
import {
  QalmaContent,
  QalmaEditor,
  createQalmaEditor,
} from '@qalma/editor';
import { EssentialsKit } from '@qalma/editor/essentials';
import { QalmaToolbarButton } from '@qalma/kit';

@Component({
  standalone: true,
  imports: [QalmaEditor, QalmaContent, QalmaToolbarButton],
  template: \`
    <qalma-editor [editor]="editor">
      <qalma-toolbar-button
        command="toggleBold"
        icon="lucideBold"
        label="Bold"
      />
      <qalma-content />
    </qalma-editor>
  \`,
})
export class CompatibilityFixture {
  readonly editor = createQalmaEditor({ plugins: [...EssentialsKit] });
}
`,
  );

  run('npm', [
    'install',
    '--ignore-scripts',
    '--no-audit',
    '--no-fund',
    '--legacy-peer-deps',
  ]);
  run(join(fixtureRoot, 'node_modules/.bin/ngc'), [
    '-p',
    join(fixtureRoot, 'tsconfig.json'),
  ]);

  console.log(`Angular ${major} compatibility fixture compiled successfully.`);
} finally {
  rmSync(fixtureRoot, { recursive: true, force: true });
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: fixtureRoot,
    encoding: 'utf8',
    stdio: 'inherit',
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(
      `${command} ${args.join(' ')} exited with status ${String(result.status)}.`,
    );
  }
}

function pack(packageRoot) {
  const result = spawnSync(
    'npm',
    ['pack', packageRoot, '--pack-destination', fixtureRoot],
    {
      cwd: fixtureRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit'],
    },
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`npm pack ${packageRoot} failed.`);
  }

  const filename = result.stdout.trim().split('\n').at(-1);

  if (!filename) {
    throw new Error(`npm pack ${packageRoot} did not return a tarball name.`);
  }

  return join(fixtureRoot, filename);
}
