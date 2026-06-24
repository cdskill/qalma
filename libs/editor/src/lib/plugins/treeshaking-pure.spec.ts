import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// The library ships as a single FESM, so a bundler can only drop an unused
// `export const XPlugin = createQalmaPlugin(...)` when the call is annotated
// side-effect-free. Without `/* @__PURE__ */`, the plugin's code leaks into
// every editor bundle (see qalma-plugin.ts). This guard fails if a new plugin
// or kit factory export forgets the annotation.
describe('plugin factory exports are tree-shakeable', () => {
  const pluginsDir = dirname(fileURLToPath(import.meta.url));
  const tableDir = join(pluginsDir, '../../../table/src');
  // Anchored to line start so commented examples (e.g. in qalma-plugin.ts) are
  // not scanned — only real top-level exports.
  const factoryExport =
    /^export const \w+(?:: [^=]+)? = (\/\* @__PURE__ \*\/ )?create(?:Configurable)?QalmaPlugin\(/gm;

  const files = [
    ...pluginSourceFiles(pluginsDir),
    ...pluginSourceFiles(tableDir),
  ];

  it.each(files)('%s annotates every plugin factory export with @__PURE__', (file) => {
    const source = readFileSync(file, 'utf8');

    for (const match of source.matchAll(factoryExport)) {
      expect(
        match[1],
        `${file}: "${match[0]}" must be prefixed with /* @__PURE__ */`,
      ).toBe('/* @__PURE__ */ ');
    }
  });

  function pluginSourceFiles(dir: string): string[] {
    return readdirSync(dir)
      .filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts'))
      .map((file) => join(dir, file));
  }
});
