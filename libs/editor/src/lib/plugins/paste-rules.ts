import {
  DOMParser as ProseMirrorDOMParser,
  Schema,
} from 'prosemirror-model';
import { Plugin as ProseMirrorPlugin } from 'prosemirror-state';

import { createConfigurableQalmaPlugin, createQalmaPlugin } from './qalma-plugin';

export interface PasteRulesPluginOptions {
  autolink: boolean;
  allowedProtocols: readonly string[];
  allowRelativeLinks: boolean;
  cleanHtml: boolean;
  defaultProtocol: 'http' | 'https';
}

export const PASTE_RULES_PLUGIN_DEFAULT_OPTIONS: Readonly<PasteRulesPluginOptions> =
  Object.freeze({
    autolink: true,
    allowedProtocols: Object.freeze(['http', 'https', 'mailto', 'tel']),
    allowRelativeLinks: true,
    cleanHtml: true,
    defaultProtocol: 'https',
  });

export const PasteRulesPlugin = /* @__PURE__ */ createConfigurableQalmaPlugin(
  PASTE_RULES_PLUGIN_DEFAULT_OPTIONS,
  (options) => {
    assertPasteRulesPluginOptions(options);

    return createQalmaPlugin({
      key: 'pasteRules',
      prosemirrorPlugins: (schema) => [
        createPasteRulesPlugin(schema, options),
      ],
    });
  },
);

function createPasteRulesPlugin(
  schema: Schema,
  options: Readonly<PasteRulesPluginOptions>,
): ProseMirrorPlugin {
  return new ProseMirrorPlugin({
    props: {
      handlePaste: (view, event) => {
        const clipboardData = event.clipboardData;

        if (!clipboardData) {
          return false;
        }

        const html = createPasteHtml(clipboardData, schema, options);

        if (!html) {
          return false;
        }

        const container = document.createElement('div');
        container.innerHTML = html;

        event.preventDefault();
        view.dispatch(
          view.state.tr
            .replaceSelection(
              ProseMirrorDOMParser.fromSchema(view.state.schema).parseSlice(
                container,
                { preserveWhitespace: true },
              ),
            )
            .scrollIntoView(),
        );

        return true;
      },
    },
  });
}

function createPasteHtml(
  clipboardData: DataTransfer,
  schema: Schema,
  options: Readonly<PasteRulesPluginOptions>,
): string | null {
  const html = clipboardData.getData('text/html');
  const text = clipboardData.getData('text/plain');

  if (html && !options.cleanHtml) {
    return null;
  }

  if (html) {
    const cleanedHtml = cleanPastedHtml(html, options);
    const clipboardHref = getClipboardHref(clipboardData, options);

    if (
      schema.marks['link'] &&
      clipboardHref &&
      !hasAnchor(cleanedHtml) &&
      hasEquivalentText(cleanedHtml, text)
    ) {
      return createLinkedTextHtml(text, clipboardHref);
    }

    return cleanedHtml;
  }

  if (!options.autolink || !schema.marks['link']) {
    return null;
  }

  return createAutolinkHtml(text, options);
}

function cleanPastedHtml(
  html: string,
  options: Readonly<PasteRulesPluginOptions>,
): string {
  const source = document.implementation.createHTMLDocument('');
  const target = document.createElement('div');

  source.body.innerHTML = html;

  for (const child of Array.from(source.body.childNodes)) {
    appendCleanNode(target, child, options);
  }

  return target.innerHTML;
}

function appendCleanNode(
  parent: Node,
  source: Node,
  options: Readonly<PasteRulesPluginOptions>,
): void {
  const cleanNode = createCleanNode(source, options);

  if (cleanNode) {
    parent.appendChild(cleanNode);
  }
}

function createCleanNode(
  source: Node,
  options: Readonly<PasteRulesPluginOptions>,
): Node | null {
  if (source.nodeType === Node.TEXT_NODE) {
    return document.createTextNode(source.textContent ?? '');
  }

  if (!(source instanceof HTMLElement)) {
    return null;
  }

  const tagName = source.tagName.toLowerCase();

  if (tagName === 'script' || tagName === 'style') {
    return null;
  }

  if (tagName === 'br') {
    return document.createElement('br');
  }

  if (tagName === 'a') {
    return createCleanLink(source, options);
  }

  if (shouldUnwrapElement(tagName)) {
    return createCleanFragment(source, options);
  }

  if (!isAllowedElement(tagName)) {
    return createCleanFragment(source, options);
  }

  const element = document.createElement(tagName);

  for (const child of Array.from(source.childNodes)) {
    appendCleanNode(element, child, options);
  }

  return element;
}

function createCleanLink(
  source: HTMLElement,
  options: Readonly<PasteRulesPluginOptions>,
): Node {
  const href = normalizeHref(source.getAttribute('href') ?? '', options);

  if (!href) {
    return createCleanFragment(source, options);
  }

  const link = document.createElement('a');
  link.setAttribute('href', href);

  for (const child of Array.from(source.childNodes)) {
    appendCleanNode(link, child, options);
  }

  if (!link.textContent) {
    link.textContent = href;
  }

  return link;
}

function createCleanFragment(
  source: HTMLElement,
  options: Readonly<PasteRulesPluginOptions>,
): DocumentFragment {
  const fragment = document.createDocumentFragment();

  for (const child of Array.from(source.childNodes)) {
    appendCleanNode(fragment, child, options);
  }

  return fragment;
}

function shouldUnwrapElement(tagName: string): boolean {
  return (
    tagName === 'html' ||
    tagName === 'body' ||
    tagName === 'span' ||
    tagName === 'font'
  );
}

function isAllowedElement(tagName: string): boolean {
  return [
    'blockquote',
    'code',
    'del',
    'em',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'i',
    'li',
    'mark',
    'ol',
    'p',
    'pre',
    's',
    'strike',
    'strong',
    'sub',
    'sup',
    'u',
    'ul',
  ].includes(tagName);
}

function hasAnchor(html: string): boolean {
  const container = document.createElement('div');
  container.innerHTML = html;

  return Boolean(container.querySelector('a[href]'));
}

function hasEquivalentText(html: string, text: string): boolean {
  const container = document.createElement('div');
  container.innerHTML = html;

  return normalizeText(container.textContent) === normalizeText(text);
}

function normalizeText(value: string | null): string {
  return (value ?? '').replace(/\s+/g, ' ').trim();
}

function getClipboardHref(
  clipboardData: DataTransfer,
  options: Readonly<PasteRulesPluginOptions>,
): string | null {
  const uriList = clipboardData
    .getData('text/uri-list')
    .split(/\r?\n/)
    .find((line) => line && !line.startsWith('#'));
  const normalizedUriList = normalizeHref(uriList ?? '', options);

  if (normalizedUriList) {
    return normalizedUriList;
  }

  const text = clipboardData.getData('text/plain').trim();

  if (!isHrefLikeText(text)) {
    return null;
  }

  return normalizeHref(text, options);
}

function isHrefLikeText(text: string): boolean {
  return (
    /^(?:[a-z][a-z0-9+.-]*:|www\.|\/|#)/i.test(text) && !/\s/.test(text)
  );
}

function createLinkedTextHtml(text: string, href: string): string | null {
  if (!text.trim()) {
    return null;
  }

  return text
    .replace(/\r\n?/g, '\n')
    .split('\n')
    .map(
      (line) =>
        `<p><a href="${escapeAttribute(href)}">${escapeHtml(
          line,
        )}</a></p>`,
    )
    .join('');
}

function createAutolinkHtml(
  text: string,
  options: Readonly<PasteRulesPluginOptions>,
): string | null {
  if (!text.trim()) {
    return null;
  }

  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const htmlLines = lines.map((line) => autolinkLine(line, options));

  if (!htmlLines.some((line) => line.changed)) {
    return null;
  }

  return htmlLines
    .map((line) => `<p>${line.html || '<br>'}</p>`)
    .join('');
}

interface AutolinkLine {
  changed: boolean;
  html: string;
}

function autolinkLine(
  line: string,
  options: Readonly<PasteRulesPluginOptions>,
): AutolinkLine {
  const pattern = /(?:https?:\/\/|mailto:|tel:|www\.)[^\s<>"']+/gi;
  let html = '';
  let changed = false;
  let position = 0;

  for (const match of line.matchAll(pattern)) {
    const rawMatch = match[0];
    const index = match.index ?? 0;
    const candidate = trimTrailingPunctuation(rawMatch);
    const href = normalizeHref(candidate.text, options);

    if (!href) {
      continue;
    }

    html += escapeHtml(line.slice(position, index));
    html += `<a href="${escapeAttribute(href)}">${escapeHtml(
      candidate.text,
    )}</a>`;
    html += escapeHtml(candidate.trailing);
    position = index + rawMatch.length;
    changed = true;
  }

  html += escapeHtml(line.slice(position));

  return {
    changed,
    html,
  };
}

interface TrimmedLinkCandidate {
  text: string;
  trailing: string;
}

function trimTrailingPunctuation(text: string): TrimmedLinkCandidate {
  let candidate = text;
  let trailing = '';

  while (/[.,;:!?]$/.test(candidate)) {
    trailing = `${candidate[candidate.length - 1] ?? ''}${trailing}`;
    candidate = candidate.slice(0, -1);
  }

  while (/[)\]}]$/.test(candidate) && hasUnmatchedClosingPunctuation(candidate)) {
    trailing = `${candidate[candidate.length - 1] ?? ''}${trailing}`;
    candidate = candidate.slice(0, -1);
  }

  return {
    text: candidate,
    trailing,
  };
}

function hasUnmatchedClosingPunctuation(value: string): boolean {
  const last = value[value.length - 1];

  if (last === ')') {
    return countCharacters(value, ')') > countCharacters(value, '(');
  }

  if (last === ']') {
    return countCharacters(value, ']') > countCharacters(value, '[');
  }

  if (last === '}') {
    return countCharacters(value, '}') > countCharacters(value, '{');
  }

  return false;
}

function countCharacters(value: string, character: string): number {
  return Array.from(value).filter((candidate) => candidate === character)
    .length;
}

function normalizeHref(
  text: string,
  options: Readonly<PasteRulesPluginOptions>,
): string | null {
  if (!text) {
    return null;
  }

  const href = text.toLowerCase().startsWith('www.')
    ? `${options.defaultProtocol}://${text}`
    : text;
  const protocol = href.match(/^([a-z][a-z0-9+.-]*):/i)?.[1].toLowerCase();

  if (!protocol) {
    return options.allowRelativeLinks ? href : null;
  }

  if (!options.allowedProtocols.includes(protocol)) {
    return null;
  }

  return href;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

function assertPasteRulesPluginOptions(
  options: Readonly<PasteRulesPluginOptions>,
): void {
  if (typeof options.autolink !== 'boolean') {
    throw new TypeError('PasteRulesPlugin autolink must be a boolean.');
  }

  if (!Array.isArray(options.allowedProtocols)) {
    throw new TypeError('PasteRulesPlugin allowedProtocols must be an array.');
  }

  if (options.allowedProtocols.length === 0) {
    throw new RangeError(
      'PasteRulesPlugin allowedProtocols must include at least one protocol.',
    );
  }

  for (const protocol of options.allowedProtocols) {
    if (
      typeof protocol !== 'string' ||
      !/^[a-z][a-z0-9+.-]*$/.test(protocol)
    ) {
      throw new TypeError(
        'PasteRulesPlugin allowedProtocols entries must be protocol names without colons.',
      );
    }
  }

  if (typeof options.allowRelativeLinks !== 'boolean') {
    throw new TypeError('PasteRulesPlugin allowRelativeLinks must be a boolean.');
  }

  if (typeof options.cleanHtml !== 'boolean') {
    throw new TypeError('PasteRulesPlugin cleanHtml must be a boolean.');
  }

  if (options.defaultProtocol !== 'http' && options.defaultProtocol !== 'https') {
    throw new TypeError(
      'PasteRulesPlugin defaultProtocol must be "http" or "https".',
    );
  }

  if (!options.allowedProtocols.includes(options.defaultProtocol)) {
    throw new Error(
      'PasteRulesPlugin defaultProtocol must be included in allowedProtocols.',
    );
  }
}
