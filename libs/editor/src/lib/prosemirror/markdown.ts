/**
 * Markdown serialization for the Qalma built-in schema.
 *
 * Node and mark serializers are keyed by Qalma's (camelCase) schema names.
 * Everything CommonMark/GFM can represent is emitted as Markdown; everything it
 * cannot (underline, monospace, text color, highlight, sub/superscript,
 * mentions) falls back to inline HTML, which CommonMark permits — so the
 * output stays complete and valid rather than silently dropping content.
 *
 * The serializer runs with `strict: false`, so third-party nodes/marks with no
 * serializer degrade to their text content instead of throwing.
 */
import { Mark, Node as ProseMirrorNode } from 'prosemirror-model';

import {
  MarkdownMarkSerializerMap,
  MarkdownNodeSerializerMap,
  MarkdownSerializer,
  MarkdownSerializerState,
  backticksFor,
} from './markdown-serializer';
import { normalizeQalmaUrl } from './url';

/** Code-block language sentinel meaning "no language" — never emitted. */
const PLAINTEXT_LANGUAGE = 'plaintext';
const MARKDOWN_LINK_PROTOCOLS = ['http', 'https', 'mailto', 'tel'] as const;
const MARKDOWN_IMAGE_PROTOCOLS = ['http', 'https'] as const;

const nodes: MarkdownNodeSerializerMap = {
  paragraph(state, node) {
    state.renderInline(node);
    state.closeBlock(node);
  },

  text(state, node) {
    state.text(node.text ?? '', !state.inAutolink);
  },

  heading(state, node) {
    state.write(state.repeat('#', Number(node.attrs['level'])) + ' ');
    state.renderInline(node, false);
    state.closeBlock(node);
  },

  blockquote(state, node) {
    state.wrapBlock('> ', null, node, () => state.renderContent(node));
  },

  codeBlock(state, node) {
    // Pick a fence longer than any backtick run inside the block.
    const backticks = node.textContent.match(/`{3,}/gm);
    const fence = backticks ? backticks.sort().slice(-1)[0] + '`' : '```';
    const language = safeMarkdownLanguage(node.attrs['language']);
    const info = language && language !== PLAINTEXT_LANGUAGE ? language : '';

    state.write(fence + info + '\n');
    state.text(node.textContent, false);
    state.write('\n');
    state.write(fence);
    state.closeBlock(node);
  },

  horizontalRule(state, node) {
    state.write('---');
    state.closeBlock(node);
  },

  bulletList(state, node) {
    state.renderList(node, '  ', () => '- ');
  },

  orderedList(state, node) {
    const start = Number(node.attrs['order'] ?? 1);
    const maxWidth = String(start + node.childCount - 1).length;
    const space = state.repeat(' ', maxWidth + 2);

    state.renderList(node, space, (index) => {
      const numeral = String(start + index);

      return state.repeat(' ', maxWidth - numeral.length) + numeral + '. ';
    });
  },

  listItem(state, node) {
    state.renderContent(node);
  },

  taskList(state, node) {
    state.renderList(node, '  ', () => '- ');
  },

  taskItem(state, node) {
    state.write(node.attrs['checked'] ? '[x] ' : '[ ] ');
    state.renderContent(node);
  },

  table(state, node) {
    renderTable(state, node);
  },

  image(state, node) {
    const src = safeMarkdownDestination(
      node.attrs['src'],
      MARKDOWN_IMAGE_PROTOCOLS,
    );
    const alt = state.esc(String(node.attrs['alt'] ?? ''));
    const title = escapeMarkdownTitle(node.attrs['title']);

    if (!src) {
      state.text(String(node.attrs['alt'] ?? ''));

      return;
    }

    state.write(
      `![${alt}](${escapeMarkdownDestination(src)}${title ? ` "${title}"` : ''})`,
    );
  },

  hardBreak(state, node, parent, index) {
    for (let i = index + 1; i < parent.childCount; i++) {
      if (parent.child(i).type !== node.type) {
        state.write('\\\n');

        return;
      }
    }
  },

  mention(state, node) {
    // Markdown has no mention concept; emit the visible label as plain text.
    state.text(`@${String(node.attrs['label'] ?? '')}`);
  },
};

const marks: MarkdownMarkSerializerMap = {
  strong: {
    open: '**',
    close: '**',
    mixable: true,
    expelEnclosingWhitespace: true,
  },
  em: { open: '*', close: '*', mixable: true, expelEnclosingWhitespace: true },
  strike: {
    open: '~~',
    close: '~~',
    mixable: true,
    expelEnclosingWhitespace: true,
  },
  code: {
    open: (_state, _mark, parent, index) =>
      backticksFor(parent.child(index), -1),
    close: (_state, _mark, parent, index) =>
      backticksFor(parent.child(index - 1), 1),
    escape: false,
  },
  link: {
    open: (_state, mark) =>
      safeMarkdownDestination(mark.attrs['href'], MARKDOWN_LINK_PROTOCOLS)
        ? '['
        : '',
    close: (_state, mark) => {
      const href = safeMarkdownDestination(
        mark.attrs['href'],
        MARKDOWN_LINK_PROTOCOLS,
      );

      return href ? `](${escapeMarkdownDestination(href)})` : '';
    },
  },
  // Marks below have no CommonMark/GFM syntax: fall back to inline HTML.
  underline: { open: '<u>', close: '</u>' },
  monospace: {
    open: '<span data-qalma-monospace="">',
    close: '</span>',
  },
  subscript: { open: '<sub>', close: '</sub>' },
  superscript: { open: '<sup>', close: '</sup>' },
  highlight: {
    open: (_state, mark) => {
      const color = safeCssColor(mark.attrs['color']);

      return color
        ? `<mark style="background-color: ${escapeHtmlAttribute(color)}">`
        : '<mark>';
    },
    close: '</mark>',
  },
  textStyle: {
    open: (_state, mark) => {
      const style = textStyleToCss(mark);

      return style ? `<span style="${style}">` : '';
    },
    close: (_state, mark) => (textStyleToCss(mark) ? '</span>' : ''),
  },
};

function textStyleToCss(mark: Mark): string {
  const declarations: string[] = [];
  const color = safeCssColor(mark.attrs['color']);
  const backgroundColor = safeCssColor(mark.attrs['backgroundColor']);

  if (color) {
    declarations.push(`color: ${escapeHtmlAttribute(color)}`);
  }

  if (backgroundColor) {
    declarations.push(
      `background-color: ${escapeHtmlAttribute(backgroundColor)}`,
    );
  }

  return declarations.join('; ');
}

function safeMarkdownLanguage(value: unknown): string {
  if (typeof value !== 'string') {
    return '';
  }

  return /^[a-z][a-z0-9-]*$/.test(value) ? value : '';
}

function safeMarkdownDestination(
  value: unknown,
  allowedProtocols: readonly string[],
): string | null {
  return normalizeQalmaUrl(value, {
    allowedProtocols,
    allowRelative: true,
  });
}

function escapeMarkdownDestination(value: string): string {
  return value.replace(/\\/g, '%5C').replace(/[()"]/g, '\\$&');
}

function escapeMarkdownTitle(value: unknown): string | null {
  if (typeof value !== 'string' || hasAsciiControlCharacters(value)) {
    return null;
  }

  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function hasAsciiControlCharacters(value: string): boolean {
  return Array.from(value).some((character) => {
    const code = character.charCodeAt(0);

    return code <= 0x1f || code === 0x7f;
  });
}

function safeCssColor(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const color = value.trim();

  return color && !/[;{}<>"']/.test(color) ? color : null;
}

function escapeHtmlAttribute(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Render a table as a GFM pipe table. The first row is treated as the header.
 * GFM cells are single-line, so each cell's content is flattened to inline
 * text (block breaks collapse to spaces, pipes are escaped).
 */
function renderTable(
  state: MarkdownSerializerState,
  node: ProseMirrorNode,
): void {
  const rows: ProseMirrorNode[] = [];

  node.forEach((row) => {
    if (row.type.name === 'table_row') {
      rows.push(row);
    }
  });

  if (rows.length === 0) {
    return;
  }

  const columnCount = rows.reduce(
    (max, row) => Math.max(max, row.childCount),
    1,
  );
  const renderRow = (row: ProseMirrorNode): string => {
    const cells: string[] = [];

    row.forEach((cell) => cells.push(serializeCell(state, cell)));

    while (cells.length < columnCount) {
      cells.push('');
    }

    return `| ${cells.join(' | ')} |`;
  };

  state.write(renderRow(rows[0]));
  state.ensureNewLine();
  state.write(`| ${Array(columnCount).fill('---').join(' | ')} |`);

  for (let i = 1; i < rows.length; i++) {
    state.ensureNewLine();
    state.write(renderRow(rows[i]));
  }

  state.closeBlock(node);
}

function serializeCell(
  state: MarkdownSerializerState,
  cell: ProseMirrorNode,
): string {
  const inner = new MarkdownSerializerState(state.nodes, state.marks, {
    ...state.options,
  });

  inner.renderContent(cell);

  return inner.out
    .trim()
    .replace(/\r?\n+/g, ' ')
    .replace(/\|/g, '\\|');
}

export function createQalmaMarkdownSerializer(): MarkdownSerializer {
  return new MarkdownSerializer(nodes, marks, {
    strict: false,
    tightLists: true,
    hardBreakNodeName: 'hardBreak',
  });
}

const qalmaMarkdownSerializer = createQalmaMarkdownSerializer();

export function serializeMarkdownDocument(doc: ProseMirrorNode): string {
  return qalmaMarkdownSerializer.serialize(doc);
}
