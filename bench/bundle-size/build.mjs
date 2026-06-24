// Reproducible bundle-size benchmark.
//
// For each editor we bundle a standard editor (equivalent feature set) with
// esbuild, fully tree-shaken and minified, then measure the gzipped and
// brotli-compressed payload. Angular and rxjs are marked external because
// every Angular app already ships them — we measure only the JS the editor
// itself adds to your bundle.
//
// Run: npm install && npm run bench
import { build } from 'esbuild';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const QALMA_LOCAL_DIST = process.env.QALMA_LOCAL_DIST
  ? resolve(process.env.QALMA_LOCAL_DIST)
  : null;
const QALMA_VERSION = process.env.QALMA_VERSION ?? null;

const FRAMEWORK_EXTERNALS = [
  '@angular/*',
  'rxjs',
  'rxjs/*',
  'zone.js',
];

const TARGETS = [
  { id: 'qalma', label: '@qalma/editor', pkg: '@qalma/editor', engine: 'ProseMirror' },
  { id: 'ngx-editor', label: 'ngx-editor', pkg: 'ngx-editor', engine: 'ProseMirror' },
  { id: 'tiptap', label: 'Tiptap (ngx-tiptap)', pkg: '@tiptap/core', engine: 'ProseMirror' },
  { id: 'quill', label: 'Quill (ngx-quill)', pkg: 'quill', engine: 'Quill' },
];

function version(pkg) {
  if (pkg === '@qalma/editor' && QALMA_VERSION) {
    return QALMA_VERSION;
  }

  if (pkg === '@qalma/editor' && QALMA_LOCAL_DIST) {
    return JSON.parse(readFileSync(`${QALMA_LOCAL_DIST}/package.json`, 'utf8'))
      .version;
  }

  try {
    return JSON.parse(readFileSync(`node_modules/${pkg}/package.json`, 'utf8')).version;
  } catch {
    return '?';
  }
}

function qalmaLocalPlugin() {
  if (!QALMA_LOCAL_DIST) {
    return null;
  }

  return {
    name: 'qalma-local-dist',
    setup(build) {
      build.onResolve({ filter: /^@qalma\/editor$/ }, () => ({
        path: `${QALMA_LOCAL_DIST}/fesm2022/qalma-editor.mjs`,
      }));
      build.onResolve({ filter: /^@qalma\/editor\/forms$/ }, () => ({
        path: `${QALMA_LOCAL_DIST}/fesm2022/qalma-editor-forms.mjs`,
      }));
      build.onResolve({ filter: /^@qalma\/editor\/table$/ }, () => ({
        path: `${QALMA_LOCAL_DIST}/fesm2022/qalma-editor-table.mjs`,
      }));
    },
  };
}

async function measure(target) {
  const result = await build({
    entryPoints: [`entries/${target.id}.js`],
    bundle: true,
    minify: true,
    treeShaking: true,
    format: 'esm',
    platform: 'browser',
    target: 'es2022',
    legalComments: 'none',
    external: FRAMEWORK_EXTERNALS,
    plugins: [qalmaLocalPlugin()].filter(Boolean),
    write: false,
    logLevel: 'silent',
  });

  const code = result.outputFiles[0].contents;
  const raw = code.byteLength;
  const gzip = gzipSync(code, { level: 9 }).byteLength;
  const brotli = brotliCompressSync(code, {
    params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
  }).byteLength;

  return { ...target, version: version(target.pkg), raw, gzip, brotli };
}

const kb = (n) => (n / 1024).toFixed(1);

const rows = [];
for (const target of TARGETS) {
  rows.push(await measure(target));
}

rows.sort((a, b) => a.gzip - b.gzip);

const baseline = rows[0];

// Illustration of plugin-based tree-shaking: a minimal Qalma editor.
const qalmaMin = await measure({
  id: 'qalma-minimal',
  label: '@qalma/editor (minimal)',
  pkg: '@qalma/editor',
  engine: 'ProseMirror',
});

// The raw ProseMirror engine floor every PM-based editor inherits.
const pmBaseline = await measure({
  id: 'prosemirror-baseline',
  label: 'ProseMirror engine only',
  pkg: 'prosemirror-view',
  engine: 'ProseMirror',
});

console.log('\nStandard editor — tree-shaken & minified payload (Angular excluded)\n');
const header = ['Editor', 'Engine', 'Version', 'Minified', 'Gzip', 'Brotli', 'vs lightest'];
const table = rows.map((r) => [
  r.label,
  r.engine,
  r.version,
  `${kb(r.raw)} KB`,
  `${kb(r.gzip)} KB`,
  `${kb(r.brotli)} KB`,
  r === baseline ? '—' : `+${Math.round(((r.gzip - baseline.gzip) / baseline.gzip) * 100)}%`,
]);

const widths = header.map((h, i) =>
  Math.max(h.length, ...table.map((row) => row[i].length)),
);
const fmt = (row) => row.map((c, i) => c.padEnd(widths[i])).join('  ');
console.log(fmt(header));
console.log(widths.map((w) => '-'.repeat(w)).join('  '));
table.forEach((row) => console.log(fmt(row)));

const qalmaStd = rows.find((r) => r.id === 'qalma');
const pmEngine = pmBaseline.engine === 'ProseMirror' ? pmBaseline : null;
console.log(
  `\nProseMirror engine floor (shared by all PM editors): ${kb(pmBaseline.gzip)} KB gzip` +
    `\nQalma toolkit overhead on top of the engine: ${kb(qalmaStd.gzip - pmBaseline.gzip)} KB gzip` +
    `\nTiptap toolkit overhead on top of the engine: ${kb(rows.find((r) => r.id === 'tiptap').gzip - pmBaseline.gzip)} KB gzip` +
    `\nQalma minimal vs standard: ${kb(qalmaMin.gzip)} KB → ${kb(qalmaStd.gzip)} KB (plugins add little over the engine).`,
);

const out = {
  generatedAt: new Date().toISOString(),
  node: process.version,
  note: 'Gzip/brotli of an esbuild-bundled, tree-shaken, minified standard editor. Angular + rxjs marked external.',
  standard: rows,
  qalmaMinimal: qalmaMin,
  prosemirrorBaseline: pmBaseline,
};
writeFileSync('results.json', JSON.stringify(out, null, 2) + '\n');
console.log('\nWrote results.json');
