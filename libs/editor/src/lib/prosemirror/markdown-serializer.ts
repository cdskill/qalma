/**
 * Markdown serializer engine.
 *
 * Vendored from `prosemirror-markdown` (`src/to_markdown.ts`, MIT licensed,
 * © The ProseMirror authors) and ported to TypeScript. Only the *serializer*
 * half of that package is reproduced here: the `MarkdownSerializer` and
 * `MarkdownSerializerState` classes plus their two helpers.
 *
 * Why vendor instead of depend: `prosemirror-markdown`'s entry point also pulls
 * in its CommonMark *parser*, which bundles `markdown-it` (~56 KB gzip). That
 * import is not tree-shakeable through the package barrel, and Qalma never
 * parses Markdown — its input rules already cover typing Markdown syntax. So we
 * keep the proven serializer state machine (escaping, mark ordering, list
 * indentation) and drop the parser entirely. This module depends only on
 * `prosemirror-model`, which is already a runtime dependency.
 *
 * The Qalma-specific node/mark serializer specs live in `./markdown.ts`.
 */
import { Mark, Node as ProseMirrorNode } from 'prosemirror-model';

export interface MarkdownSerializerOptions {
  /**
   * Render lists in a tight style. Overridable per node via a `tight`
   * attribute. Defaults to `false`.
   */
  tightLists?: boolean;
  /**
   * Extra characters to escape, passed straight to `String.replace`. Matching
   * characters are prefixed with a backslash.
   */
  escapeExtraCharacters?: RegExp;
  /** The node name used for hard breaks. Defaults to `"hard_break"`. */
  hardBreakNodeName?: string;
  /**
   * When `false`, unknown node/mark types are rendered as their content
   * instead of throwing. Defaults to `true`.
   */
  strict?: boolean;
}

export type MarkdownNodeSerializer = (
  state: MarkdownSerializerState,
  node: ProseMirrorNode,
  parent: ProseMirrorNode,
  index: number,
) => void;

export interface MarkSerializerSpec {
  /** Text emitted before content carrying this mark. */
  open:
    | string
    | ((
        state: MarkdownSerializerState,
        mark: Mark,
        parent: ProseMirrorNode,
        index: number,
      ) => string);
  /** Text emitted after content carrying this mark. */
  close:
    | string
    | ((
        state: MarkdownSerializerState,
        mark: Mark,
        parent: ProseMirrorNode,
        index: number,
      ) => string);
  /**
   * Whether this mark's open/close order can be varied relative to other
   * mixable marks (e.g. `**a *b***` vs `*a **b***`).
   */
  mixable?: boolean;
  /**
   * Move enclosing whitespace out of the marks. Required for emphasis marks,
   * since CommonMark forbids whitespace directly inside them.
   */
  expelEnclosingWhitespace?: boolean;
  /**
   * Set to `false` to disable escaping inside the mark. A non-escaping mark
   * must be the innermost mark.
   */
  escape?: boolean;
}

export type MarkdownNodeSerializerMap = Record<string, MarkdownNodeSerializer>;
export type MarkdownMarkSerializerMap = Record<string, MarkSerializerSpec>;

const blankMark: MarkSerializerSpec = { open: '', close: '', mixable: true };

/** Text nodes expose `withText` at runtime, but it is not in the public type. */
function withText(node: ProseMirrorNode, text: string): ProseMirrorNode {
  return (
    node as unknown as { withText(text: string): ProseMirrorNode }
  ).withText(text);
}

/**
 * A specification for serializing a ProseMirror document as Markdown/CommonMark.
 */
export class MarkdownSerializer {
  constructor(
    readonly nodes: MarkdownNodeSerializerMap,
    readonly marks: MarkdownMarkSerializerMap,
    readonly options: MarkdownSerializerOptions = {},
  ) {}

  serialize(
    content: ProseMirrorNode,
    options: MarkdownSerializerOptions = {},
  ): string {
    const merged = { ...this.options, ...options };
    const state = new MarkdownSerializerState(this.nodes, this.marks, merged);

    state.renderContent(content);

    return state.out;
  }
}

function backticksFor(node: ProseMirrorNode, side: number): string {
  const ticks = /`+/g;
  let match: RegExpExecArray | null;
  let len = 0;

  if (node.isText) {
    while ((match = ticks.exec(node.text ?? ''))) {
      len = Math.max(len, match[0].length);
    }
  }

  let result = len > 0 && side > 0 ? ' `' : '`';

  for (let i = 0; i < len; i++) {
    result += '`';
  }

  if (len > 0 && side < 0) {
    result += ' ';
  }

  return result;
}

function isPlainURL(
  link: Mark,
  parent: ProseMirrorNode,
  index: number,
): boolean {
  if (link.attrs['title'] || !/^\w+:/.test(link.attrs['href'])) {
    return false;
  }

  const content = parent.child(index);

  if (
    !content.isText ||
    content.text !== link.attrs['href'] ||
    content.marks[content.marks.length - 1] !== link
  ) {
    return false;
  }

  return (
    index === parent.childCount - 1 ||
    !link.isInSet(parent.child(index + 1).marks)
  );
}

/**
 * Tracks state during Markdown serialization. An instance is passed to every
 * node and mark serializer function.
 */
export class MarkdownSerializerState {
  delim = '';
  out = '';
  closed: ProseMirrorNode | null = null;
  inAutolink: boolean | undefined = undefined;
  atBlockStart = false;
  inTightList = false;

  constructor(
    readonly nodes: MarkdownNodeSerializerMap,
    readonly marks: MarkdownMarkSerializerMap,
    readonly options: MarkdownSerializerOptions,
  ) {
    if (typeof this.options.tightLists === 'undefined') {
      this.options.tightLists = false;
    }

    if (typeof this.options.hardBreakNodeName === 'undefined') {
      this.options.hardBreakNodeName = 'hard_break';
    }
  }

  flushClose(size = 2): void {
    if (this.closed) {
      if (!this.atBlank()) {
        this.out += '\n';
      }

      if (size > 1) {
        let delimMin = this.delim;
        const trim = /\s+$/.exec(delimMin);

        if (trim) {
          delimMin = delimMin.slice(0, delimMin.length - trim[0].length);
        }

        for (let i = 1; i < size; i++) {
          this.out += delimMin + '\n';
        }
      }

      this.closed = null;
    }
  }

  getMark(name: string): MarkSerializerSpec {
    let info = this.marks[name];

    if (!info) {
      if (this.options.strict !== false) {
        throw new Error(`Mark type \`${name}\` not supported by Markdown renderer`);
      }

      info = blankMark;
    }

    return info;
  }

  wrapBlock(
    delim: string,
    firstDelim: string | null,
    node: ProseMirrorNode,
    f: () => void,
  ): void {
    const old = this.delim;

    this.write(firstDelim != null ? firstDelim : delim);
    this.delim += delim;
    f();
    this.delim = old;
    this.closeBlock(node);
  }

  atBlank(): boolean {
    return /(^|\n)$/.test(this.out);
  }

  ensureNewLine(): void {
    if (!this.atBlank()) {
      this.out += '\n';
    }
  }

  write(content?: string): void {
    this.flushClose();

    if (this.delim && this.atBlank()) {
      this.out += this.delim;
    }

    if (content) {
      this.out += content;
    }
  }

  closeBlock(node: ProseMirrorNode): void {
    this.closed = node;
  }

  text(text: string, escape = true): void {
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      this.write();

      // Escape exclamation marks in front of links.
      if (!escape && lines[i][0] === '[' && /(^|[^\\])!$/.test(this.out)) {
        this.out = this.out.slice(0, this.out.length - 1) + '\\!';
      }

      this.out += escape ? this.esc(lines[i], this.atBlockStart) : lines[i];

      if (i !== lines.length - 1) {
        this.out += '\n';
      }
    }
  }

  render(node: ProseMirrorNode, parent: ProseMirrorNode, index: number): void {
    if (this.nodes[node.type.name]) {
      this.nodes[node.type.name](this, node, parent, index);

      return;
    }

    if (this.options.strict !== false) {
      throw new Error(
        `Token type \`${node.type.name}\` not supported by Markdown renderer`,
      );
    }

    if (!node.type.isLeaf) {
      if (node.type.inlineContent) {
        this.renderInline(node);
      } else {
        this.renderContent(node);
      }

      if (node.isBlock) {
        this.closeBlock(node);
      }
    }
  }

  renderContent(parent: ProseMirrorNode): void {
    parent.forEach((node, _, i) => this.render(node, parent, i));
  }

  renderInline(parent: ProseMirrorNode, fromBlockStart = true): void {
    this.atBlockStart = fromBlockStart;

    const active: Mark[] = [];
    let trailing = '';
    const progress = (
      node: ProseMirrorNode | null,
      _offset: number,
      index: number,
    ): void => {
      let marks = node ? node.marks : [];

      // Remove marks from hard breaks that are the last node inside that mark
      // to avoid parser edge cases with newlines just before closing marks.
      if (node && node.type.name === this.options.hardBreakNodeName) {
        marks = marks.filter((m) => {
          if (index + 1 === parent.childCount) {
            return false;
          }

          const next = parent.child(index + 1);

          return m.isInSet(next.marks) && (!next.isText || /\S/.test(next.text ?? ''));
        });
      }

      let leading = trailing;
      trailing = '';

      // Expel leading whitespace from marks that require it.
      if (
        node &&
        node.isText &&
        marks.some((mark) => {
          const info = this.getMark(mark.type.name);

          return info && info.expelEnclosingWhitespace && !mark.isInSet(active);
        })
      ) {
        const match = /^(\s*)(.*)$/m.exec(node.text ?? '');
        const lead = match?.[1] ?? '';
        const rest = match?.[2] ?? '';

        if (lead) {
          leading += lead;
          node = rest ? withText(node, rest) : null;

          if (!node) {
            marks = active;
          }
        }
      }

      // Expel trailing whitespace from marks that require it.
      if (
        node &&
        node.isText &&
        marks.some((mark) => {
          const info = this.getMark(mark.type.name);

          return (
            info &&
            info.expelEnclosingWhitespace &&
            !this.isMarkAhead(parent, index + 1, mark)
          );
        })
      ) {
        const match = /^(.*?)(\s*)$/m.exec(node.text ?? '');
        const rest = match?.[1] ?? '';
        const trail = match?.[2] ?? '';

        if (trail) {
          trailing = trail;
          node = rest ? withText(node, rest) : null;

          if (!node) {
            marks = active;
          }
        }
      }

      const inner = marks.length ? marks[marks.length - 1] : null;
      const noEsc = inner ? this.getMark(inner.type.name).escape === false : false;
      const len = marks.length - (noEsc ? 1 : 0);

      // Reorder mixable marks (e.g. em/strong) so their order matches `active`.
      outer: for (let i = 0; i < len; i++) {
        const mark = marks[i];

        if (!this.getMark(mark.type.name).mixable) {
          break;
        }

        for (let j = 0; j < active.length; j++) {
          const other = active[j];

          if (!this.getMark(other.type.name).mixable) {
            break;
          }

          if (mark.eq(other)) {
            if (i > j) {
              marks = marks
                .slice(0, j)
                .concat(mark)
                .concat(marks.slice(j, i))
                .concat(marks.slice(i + 1, len));
            } else if (j > i) {
              marks = marks
                .slice(0, i)
                .concat(marks.slice(i + 1, j))
                .concat(mark)
                .concat(marks.slice(j, len));
            }

            continue outer;
          }
        }
      }

      // Find the prefix of the mark set that did not change.
      let keep = 0;

      while (keep < Math.min(active.length, len) && marks[keep].eq(active[keep])) {
        ++keep;
      }

      // Close the marks that need closing.
      while (keep < active.length) {
        const mark = active.pop();

        if (mark) {
          this.text(this.markString(mark, false, parent, index), false);
        }
      }

      // Emit any expelled leading whitespace outside the marks.
      if (leading) {
        this.text(leading);
      }

      // Open the marks that need opening.
      if (node) {
        while (active.length < len) {
          const add = marks[active.length];

          active.push(add);
          this.text(this.markString(add, true, parent, index), false);
          this.atBlockStart = false;
        }

        // Render the node. Special-case code marks whose content is unescaped.
        if (noEsc && inner && node.isText) {
          this.text(
            this.markString(inner, true, parent, index) +
              node.text +
              this.markString(inner, false, parent, index + 1),
            false,
          );
        } else {
          this.render(node, parent, index);
        }

        this.atBlockStart = false;
      }

      if (node?.isText && node.nodeSize > 0) {
        this.atBlockStart = false;
      }
    };

    parent.forEach(progress);
    progress(null, 0, parent.childCount);
    this.atBlockStart = false;
  }

  renderList(
    node: ProseMirrorNode,
    delim: string,
    firstDelim: (index: number) => string,
  ): void {
    if (this.closed && this.closed.type === node.type) {
      this.flushClose(3);
    } else if (this.inTightList) {
      this.flushClose(1);
    }

    const isTight =
      typeof node.attrs['tight'] !== 'undefined'
        ? node.attrs['tight']
        : this.options.tightLists;
    const prevTight = this.inTightList;

    this.inTightList = isTight;
    node.forEach((child, _, i) => {
      if (i && isTight) {
        this.flushClose(1);
      }

      this.wrapBlock(delim, firstDelim(i), node, () => this.render(child, node, i));
    });
    this.inTightList = prevTight;
  }

  esc(str: string, startOfLine = false): string {
    str = str.replace(/[`*\\~[\]_]/g, (m, i: number) =>
      m === '_' &&
      i > 0 &&
      i + 1 < str.length &&
      str[i - 1].match(/\w/) &&
      str[i + 1].match(/\w/)
        ? m
        : '\\' + m,
    );

    if (startOfLine) {
      str = str
        .replace(/^(\+[ ]|[-*>])/, '\\$&')
        .replace(/^(\s*)(#{1,6})(\s|$)/, '$1\\$2$3')
        .replace(/^(\s*\d+)\.\s/, '$1\\. ');
    }

    if (this.options.escapeExtraCharacters) {
      str = str.replace(this.options.escapeExtraCharacters, '\\$&');
    }

    return str;
  }

  quote(str: string): string {
    const wrap =
      str.indexOf('"') === -1 ? '""' : str.indexOf("'") === -1 ? "''" : '()';

    return wrap[0] + str + wrap[1];
  }

  repeat(str: string, n: number): string {
    let out = '';

    for (let i = 0; i < n; i++) {
      out += str;
    }

    return out;
  }

  markString(
    mark: Mark,
    open: boolean,
    parent: ProseMirrorNode,
    index: number,
  ): string {
    const info = this.getMark(mark.type.name);
    const value = open ? info.open : info.close;

    return typeof value === 'string' ? value : value(this, mark, parent, index);
  }

  getEnclosingWhitespace(text: string): {
    leading?: string;
    trailing?: string;
  } {
    return {
      leading: (text.match(/^(\s+)/) || [undefined])[0],
      trailing: (text.match(/(\s+)$/) || [undefined])[0],
    };
  }

  isMarkAhead(parent: ProseMirrorNode, index: number, mark: Mark): boolean {
    for (;; index++) {
      if (index >= parent.childCount) {
        return false;
      }

      const next = parent.child(index);

      if (next.type.name !== this.options.hardBreakNodeName) {
        return mark.isInSet(next.marks);
      }

      index++;
    }
  }
}

export { backticksFor, isPlainURL };
