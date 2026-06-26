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

/** Code-block language sentinel meaning "no language" — never emitted. */
const PLAINTEXT_LANGUAGE = 'plaintext';

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
    const language = String(node.attrs['language'] ?? '');
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
    const src = String(node.attrs['src'] ?? '').replace(/[()]/g, '\\$&');
    const alt = state.esc(String(node.attrs['alt'] ?? ''));
    const title = node.attrs['title']
      ? ` "${String(node.attrs['title']).replace(/"/g, '\\"')}"`
      : '';

    state.write(`![${alt}](${src}${title})`);
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
  strong: { open: '**', close: '**', mixable: true, expelEnclosingWhitespace: true },
  em: { open: '*', close: '*', mixable: true, expelEnclosingWhitespace: true },
  strike: { open: '~~', close: '~~', mixable: true, expelEnclosingWhitespace: true },
  code: {
    open: (_state, _mark, parent, index) => backticksFor(parent.child(index), -1),
    close: (_state, _mark, parent, index) =>
      backticksFor(parent.child(index - 1), 1),
    escape: false,
  },
  link: {
    open: '[',
    close: (_state, mark) =>
      '](' + String(mark.attrs['href']).replace(/[()"]/g, '\\$&') + ')',
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
    open: (_state, mark) =>
      mark.attrs['color']
        ? `<mark style="background-color: ${String(mark.attrs['color'])}">`
        : '<mark>',
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

  if (mark.attrs['color']) {
    declarations.push(`color: ${String(mark.attrs['color'])}`);
  }

  if (mark.attrs['backgroundColor']) {
    declarations.push(`background-color: ${String(mark.attrs['backgroundColor'])}`);
  }

  return declarations.join('; ');
}

/**
 * Render a table as a GFM pipe table. The first row is treated as the header.
 * GFM cells are single-line, so each cell's content is flattened to inline
 * text (block breaks collapse to spaces, pipes are escaped).
 */
function renderTable(state: MarkdownSerializerState, node: ProseMirrorNode): void {
  const rows: ProseMirrorNode[] = [];

  node.forEach((row) => {
    if (row.type.name === 'table_row') {
      rows.push(row);
    }
  });

  if (rows.length === 0) {
    return;
  }

  const columnCount = rows.reduce((max, row) => Math.max(max, row.childCount), 1);
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

  return inner.out.trim().replace(/\r?\n+/g, ' ').replace(/\|/g, '\\|');
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
