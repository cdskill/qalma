import { access, readdir, readFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const INDEX_ROOT = resolve('dist/apps/docs/analog/public/pagefind');
const ENTRY_FILE = join(INDEX_ROOT, 'pagefind-entry.json');
const FRAGMENTS_ROOT = join(INDEX_ROOT, 'fragment');

await access(ENTRY_FILE);

const entry = JSON.parse(await readFile(ENTRY_FILE, 'utf8'));
const fragments = (await readdir(FRAGMENTS_ROOT)).filter((file) =>
  file.endsWith('.pf_fragment'),
);

if (!entry.languages || Object.keys(entry.languages).length === 0) {
  throw new Error('Pagefind did not emit a language index.');
}

if (fragments.length < 50) {
  throw new Error(
    `Pagefind indexed only ${fragments.length} pages; expected at least 50 docs pages.`,
  );
}

console.log(`Verified Pagefind index with ${fragments.length} page fragments.`);
