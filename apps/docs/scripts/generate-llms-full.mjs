import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const DOCS_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const REPO_ROOT = dirname(dirname(DOCS_ROOT));
const CONTENT_ROOT = join(DOCS_ROOT, 'src/content');
const DOCS_NAV_FILE = join(DOCS_ROOT, 'src/app/docs/docs-nav.ts');
const OUTPUT_FILE = join(DOCS_ROOT, 'public/llms-full.txt');
const SITE = 'https://qalma.dev';

export function generateLlmsFull() {
  const markdownFiles = collectMarkdownFiles(CONTENT_ROOT);
  const orderedFiles = orderByDocsNav(markdownFiles);
  const sections = orderedFiles.map(renderMarkdownFile);
  const tableOfContents = sections
    .map((section) => `- [${section.title}](${section.url})`)
    .join('\n');

  const output = [
    '# Qalma Full Documentation',
    '',
    '> Single-file Markdown export of the Qalma documentation for LLMs.',
    '',
    'Qalma is an Angular-first, headless rich text editor toolkit built on ProseMirror.',
    'This file inlines the Markdown documentation from `apps/docs/src/content` so',
    'a model or crawler can retrieve the docs in one fetch.',
    '',
    'Short index: https://qalma.dev/llms.txt',
    'Documentation home: https://qalma.dev/',
    'Source repository: https://github.com/cdskill/qalma',
    'npm package: https://www.npmjs.com/package/@qalma/editor',
    '',
    'This file is generated. Edit the Markdown files under `apps/docs/src/content`',
    'and run `pnpm docs:llms-full`, or build the docs site, to refresh it.',
    '',
    '## Table of Contents',
    '',
    tableOfContents,
    '',
    ...sections.flatMap((section) => [
      '---',
      '',
      `Source: ${section.url}`,
      `File: ${section.sourcePath}`,
      ...(section.description ? [`Description: ${section.description}`] : []),
      '',
      section.body,
      '',
    ]),
  ].join('\n');

  mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
  writeFileSync(OUTPUT_FILE, `${output.trimEnd()}\n`);

  return { fileCount: orderedFiles.length, outputFile: OUTPUT_FILE };
}

function collectMarkdownFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  return readdirSync(directory)
    .flatMap((entry) => {
      const path = join(directory, entry);
      const stats = statSync(path);

      if (stats.isDirectory()) {
        return collectMarkdownFiles(path);
      }

      return path.endsWith('.md') ? [path] : [];
    })
    .sort((left, right) => left.localeCompare(right));
}

function orderByDocsNav(files) {
  const navOrder = readDocsNavOrder();
  const order = new Map(navOrder.map((path, index) => [path, index]));

  return [...files].sort((left, right) => {
    const leftPath = toContentPath(left);
    const rightPath = toContentPath(right);
    const leftIndex = order.get(leftPath) ?? Number.MAX_SAFE_INTEGER;
    const rightIndex = order.get(rightPath) ?? Number.MAX_SAFE_INTEGER;

    if (leftIndex !== rightIndex) {
      return leftIndex - rightIndex;
    }

    return leftPath.localeCompare(rightPath);
  });
}

function readDocsNavOrder() {
  if (!existsSync(DOCS_NAV_FILE)) {
    return [];
  }

  const source = readFileSync(DOCS_NAV_FILE, 'utf8');

  return [...source.matchAll(/href:\s*'\/docs\/([^']+)'/g)].map(
    ([, slug]) => `docs/${slug}.md`,
  );
}

function renderMarkdownFile(file) {
  const sourcePath = toContentPath(file);
  const routePath = sourcePath.replace(/\.md$/, '').replace(/\/index$/, '');
  const url = `${SITE}/${routePath}`;
  const parsed = parseFrontmatter(readFileSync(file, 'utf8'));
  const body = normalizeMarkdown(parsed.body, url);
  const title = parsed.attributes.title ?? findFirstHeading(body) ?? routePath;

  return {
    title,
    url,
    sourcePath: `apps/docs/src/content/${sourcePath}`,
    description: parsed.attributes.description,
    body,
  };
}

function toContentPath(file) {
  return relative(CONTENT_ROOT, file).split(sep).join('/');
}

function parseFrontmatter(source) {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);

  if (!match) {
    return { attributes: {}, body: source };
  }

  const attributes = Object.fromEntries(
    match[1]
      .split(/\r?\n/)
      .map((line) => line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/))
      .filter(Boolean)
      .map(([, key, value]) => [key, unquote(value.trim())]),
  );

  return { attributes, body: source.slice(match[0].length) };
}

function unquote(value) {
  const quoted = value.match(/^['"]([\s\S]*)['"]$/);
  return quoted ? quoted[1] : value;
}

function normalizeMarkdown(markdown, pageUrl) {
  return decodeCommonHtmlEntities(markdown)
    .replace(/\]\((\/[^)\s]*)\)/g, (_, path) => `](${SITE}${path})`)
    .replace(/\]\((#[^)\s]*)\)/g, (_, hash) => `](${pageUrl}${hash})`)
    .trim();
}

function decodeCommonHtmlEntities(value) {
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
}

function findFirstHeading(markdown) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1];
}

if (resolve(process.argv[1] ?? '') === fileURLToPath(import.meta.url)) {
  const result = generateLlmsFull();
  console.log(
    `Generated ${relative(REPO_ROOT, result.outputFile)} from ${result.fileCount} Markdown files.`,
  );
}
