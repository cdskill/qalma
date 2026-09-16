import { Signal, WritableSignal, signal } from '@angular/core';
import { Node as ProseMirrorNode, Schema } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import {
  QalmaCommandHandler,
  QalmaCommandValue,
  QalmaContentParser,
  QalmaPlugin,
  QalmaQuery,
  QalmaStateQuery,
} from '../plugins/qalma-plugin';
import { parseHtmlDocument, serializeHtmlDocument } from '../prosemirror/html';
import {
  QalmaDocument,
  parseJsonDocument,
  serializeJsonDocument,
} from '../prosemirror/json';
import { serializeMarkdownDocument } from '../prosemirror/markdown';
import {
  createCommandRegistry,
  createCommandStateRegistry,
  createContentParserRegistry,
  createQueryRegistry,
} from '../prosemirror/plugins';
import { createQalmaSchema } from '../prosemirror/schema';
import { createQalmaState } from '../prosemirror/state';
import {
  QALMA_STORED_DOCUMENT_FORMAT,
  QALMA_STORED_DOCUMENT_FORMAT_VERSION,
  QalmaDocumentMigration,
  QalmaStoredDocument,
  createMigrationRegistry,
  migrateStoredDocument,
} from './stored-document';

const EMPTY_DOCUMENT_HTML = '<p></p>';

export interface QalmaContentLimits {
  maxHtmlLength: number;
  maxMarkdownLength: number;
  maxJsonNodes: number;
  maxJsonDepth: number;
  maxJsonTextLength: number;
}

export const QALMA_DEFAULT_CONTENT_LIMITS: Readonly<QalmaContentLimits> =
  Object.freeze({
    maxHtmlLength: 1_000_000,
    maxMarkdownLength: 1_000_000,
    maxJsonNodes: 50_000,
    maxJsonDepth: 100,
    maxJsonTextLength: 1_000_000,
  });

export interface QalmaEditorOptions {
  content?: string;
  contentLimits?: Partial<QalmaContentLimits>;
  editable?: boolean;
  plugins?: readonly QalmaPlugin[];
  schemaVersion?: number;
  migrations?: readonly QalmaDocumentMigration[];
}

export interface QalmaEditorCoordinates {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export class QalmaEditorController {
  readonly html: Signal<string>;
  readonly editable: Signal<boolean>;

  private readonly plugins: readonly QalmaPlugin[];
  private readonly schema: Schema;
  private readonly htmlState: WritableSignal<string>;
  private readonly editableState: WritableSignal<boolean>;
  private readonly viewVersion = signal(0);
  private readonly commands: Record<string, QalmaCommandHandler>;
  private readonly commandStates: Record<string, QalmaStateQuery>;
  private readonly queries: Partial<Record<string, QalmaQuery>>;
  private readonly contentParsers: Partial<Record<string, QalmaContentParser>>;
  private readonly contentLimits: Readonly<QalmaContentLimits>;
  private readonly schemaVersion: number;
  private readonly migrations: ReadonlyMap<number, QalmaDocumentMigration>;
  private editorState?: EditorState;
  private editorView?: EditorView;
  private host?: HTMLElement;
  /** Faithful document set via `setJSON` before the view is mounted. */
  private pendingDoc?: ProseMirrorNode;

  constructor(options: QalmaEditorOptions = {}) {
    this.contentLimits = resolveContentLimits(options.contentLimits);
    assertStringWithinLimit(
      options.content ?? EMPTY_DOCUMENT_HTML,
      this.contentLimits.maxHtmlLength,
      'HTML content',
    );
    this.plugins = [...(options.plugins ?? [])];
    this.schema = createQalmaSchema(this.plugins);
    this.commands = createCommandRegistry(this.schema, this.plugins);
    this.commandStates = createCommandStateRegistry(this.schema, this.plugins);
    this.queries = createQueryRegistry(this.schema, this.plugins);
    this.contentParsers = createContentParserRegistry(this.plugins);
    this.schemaVersion = options.schemaVersion ?? 1;
    this.migrations = createMigrationRegistry(
      this.schemaVersion,
      options.migrations ?? [],
    );

    this.htmlState = signal(options.content ?? EMPTY_DOCUMENT_HTML);
    this.editableState = signal(options.editable ?? true);

    this.html = this.htmlState.asReadonly();
    this.editable = this.editableState.asReadonly();
  }

  mount(host: HTMLElement): void {
    if (this.host === host && this.editorView) {
      return;
    }

    this.unmount();
    host.replaceChildren();

    this.editorState = createQalmaState({
      doc: this.pendingDoc,
      html: this.html(),
      plugins: this.plugins,
      schema: this.schema,
    });
    assertProseMirrorDocumentWithinLimits(
      this.editorState.doc,
      this.contentLimits,
    );
    this.pendingDoc = undefined;
    this.host = host;
    this.editorView = new EditorView(host, {
      state: this.editorState,
      editable: () => this.editable(),
      attributes: this.createEditorAttributes(),
      dispatchTransaction: (transaction) =>
        this.dispatchTransaction(transaction),
    });
    this.syncHtmlFromEditorState();
    this.bumpViewVersion();
  }

  unmount(host?: HTMLElement): void {
    if (host && host !== this.host) {
      return;
    }

    this.editorView?.destroy();
    this.editorView = undefined;
    this.editorState = undefined;
    this.host = undefined;
    this.bumpViewVersion();
  }

  execute(commandName: string, value?: QalmaCommandValue): boolean {
    const command = this.commands[commandName];

    if (!this.editable() || !command || !this.editorState) {
      return false;
    }

    const executed = command(
      this.editorState,
      (transaction) => this.dispatchTransaction(transaction),
      this.editorView,
      value,
    );

    if (executed) {
      this.editorView?.focus();
    }

    return executed;
  }

  canExecute(commandName: string, value?: QalmaCommandValue): boolean {
    this.viewVersion();

    const command = this.commands[commandName];

    return Boolean(
      this.editable() &&
        command &&
        this.editorState &&
        command(this.editorState, undefined, this.editorView, value),
    );
  }

  hasCommandState(commandName: string): boolean {
    return Boolean(this.commandStates[commandName]);
  }

  isCommandActive(commandName: string): boolean {
    this.viewVersion();

    const query = this.commandStates[commandName];

    return Boolean(query && this.editorState && query(this.editorState));
  }

  hasQuery(queryName: string): boolean {
    return Boolean(this.queries[queryName]);
  }

  query<TValue = unknown>(queryName: string): TValue | null {
    this.viewVersion();

    const query = this.queries[queryName];

    return query && this.editorState
      ? (query(this.editorState) as TValue)
      : null;
  }

  setHtml(html: string): void {
    assertStringWithinLimit(
      html,
      this.contentLimits.maxHtmlLength,
      'HTML content',
    );

    if (html === this.html()) {
      return;
    }

    this.pendingDoc = undefined;

    if (!this.editorView) {
      this.htmlState.set(html);

      return;
    }

    const nextState = createQalmaState({
      html,
      plugins: this.plugins,
      schema: this.schema,
    });
    assertProseMirrorDocumentWithinLimits(nextState.doc, this.contentLimits);
    this.editorState = nextState;
    this.editorView.updateState(nextState);
    this.syncHtmlFromEditorState();
    this.bumpViewVersion();
  }

  /**
   * Serializes the current document to ProseMirror's native JSON — the
   * lossless format to persist and later restore with `setJSON`.
   */
  getJSON(): QalmaDocument {
    return serializeJsonDocument(this.currentDoc());
  }

  /** Replaces the document content from a JSON document produced by `getJSON`. */
  setJSON(json: QalmaDocument): void {
    assertDocumentWithinLimits(json, this.contentLimits);

    const doc = parseJsonDocument(json, this.schema);
    assertProseMirrorDocumentWithinLimits(doc, this.contentLimits);

    if (!this.editorView) {
      this.pendingDoc = doc;
      this.htmlState.set(serializeHtmlDocument(doc, this.schema));

      return;
    }

    this.editorState = createQalmaState({
      doc,
      plugins: this.plugins,
      schema: this.schema,
    });
    this.editorView.updateState(this.editorState);
    this.syncHtmlFromEditorState();
    this.bumpViewVersion();
  }

  /**
   * Returns a versioned persistence envelope around the lossless document JSON.
   * Schema plugins are recorded so missing node and mark definitions fail
   * clearly when the document is restored elsewhere.
   */
  getStoredDocument(): QalmaStoredDocument {
    return {
      format: QALMA_STORED_DOCUMENT_FORMAT,
      formatVersion: QALMA_STORED_DOCUMENT_FORMAT_VERSION,
      schemaVersion: this.schemaVersion,
      schemaPlugins: this.schemaPluginKeys(),
      document: this.getJSON(),
    };
  }

  /**
   * Restores a versioned document and applies each configured schema migration
   * before parsing it with the current editor schema.
   */
  setStoredDocument(storedDocument: QalmaStoredDocument): void {
    assertDocumentWithinLimits(storedDocument?.document, this.contentLimits);

    const document = migrateStoredDocument(
      storedDocument,
      this.schemaVersion,
      this.migrations,
    );
    const availableSchemaPlugins = new Set(this.schemaPluginKeys());
    const missingPlugins = storedDocument.schemaPlugins.filter(
      (plugin) => !availableSchemaPlugins.has(plugin),
    );

    if (missingPlugins.length > 0) {
      throw new Error(
        `Cannot load QALMA document because schema plugins are missing: ${missingPlugins.join(', ')}.`,
      );
    }

    this.setJSON(document);
  }

  hasContentParser(format: string): boolean {
    return Boolean(this.contentParsers[format]);
  }

  /**
   * Parses Markdown through the optional `@qalma/editor/markdown` entrypoint
   * and loads the resulting schema-normalized document.
   */
  setMarkdown(markdown: string): void {
    assertStringWithinLimit(
      markdown,
      this.contentLimits.maxMarkdownLength,
      'Markdown content',
    );

    const parser = this.contentParsers['markdown'];

    if (!parser) {
      throw new Error(
        'QALMA Markdown parsing is not configured. Add MarkdownPlugin from "@qalma/editor/markdown".',
      );
    }

    this.setHtml(parser(markdown).html);
  }

  /**
   * Serializes the current document to Markdown (CommonMark + GFM). Marks with
   * no Markdown equivalent (underline, color, highlight, sub/superscript,
   * mentions) fall back to inline HTML so no content is lost.
   */
  getMarkdown(): string {
    return serializeMarkdownDocument(this.currentDoc());
  }

  /**
   * Whether the document has no user-visible content: no text and no media
   * (images, mentions, tables, horizontal rules). Empty paragraphs, empty
   * structural containers (blockquotes, lists) and hard breaks all count as
   * empty. Computed from the document model when one exists; before mount,
   * serialized HTML is parsed through the editor schema when a DOM parser is
   * available, with a schema-aware string fallback for server-side rendering.
   * Tracks editor state like the other read models, so it stays live inside
   * `computed`/`effect`. Form adapters use it to normalize an empty editor to an
   * empty control value.
   */
  isEmpty(): boolean {
    this.viewVersion();

    const doc = this.editorState?.doc ?? this.pendingDoc;

    if (doc) {
      return isEmptyDocument(doc);
    }

    return isEmptyHtmlDocument(this.html(), this.schema);
  }

  setEditable(editable: boolean): void {
    this.editableState.set(editable);
    this.editorView?.setProps({
      editable: () => editable,
    });
  }

  focus(): void {
    this.editorView?.focus();
  }

  getCoordinatesAtPosition(position: number): QalmaEditorCoordinates | null {
    this.viewVersion();

    if (!this.editorView || !this.editorState) {
      return null;
    }

    if (position < 0 || position > this.editorState.doc.content.size) {
      return null;
    }

    try {
      return this.editorView.coordsAtPos(position);
    } catch {
      return null;
    }
  }

  private dispatchTransaction(transaction: Transaction): void {
    if (!this.editorState) {
      return;
    }

    const previousDoc = this.editorState.doc;
    const nextState = this.editorState.apply(transaction);

    assertProseMirrorDocumentWithinLimits(nextState.doc, this.contentLimits);
    this.editorState = nextState;
    this.editorView?.updateState(nextState);

    if (!previousDoc.eq(nextState.doc)) {
      this.syncHtmlFromEditorState();
    }

    this.bumpViewVersion();
  }

  private currentDoc(): ProseMirrorNode {
    const document =
      this.editorState?.doc ??
      this.pendingDoc ??
      parseHtmlDocument(this.html(), this.schema);

    assertProseMirrorDocumentWithinLimits(document, this.contentLimits);

    return document;
  }

  private syncHtmlFromEditorState(): void {
    if (!this.editorState) {
      return;
    }

    const html = serializeHtmlDocument(this.editorState.doc, this.schema);

    if (html !== this.html()) {
      this.htmlState.set(html);
    }
  }

  private bumpViewVersion(): void {
    this.viewVersion.update((value) => value + 1);
  }

  private createEditorAttributes(): Record<string, string> {
    return {
      'aria-label': 'Rich text editor',
    };
  }

  private schemaPluginKeys(): string[] {
    return this.plugins
      .filter(
        (plugin) =>
          Boolean(plugin.nodes) ||
          Boolean(plugin.marks) ||
          Boolean(plugin.extendNodes),
      )
      .map((plugin) => plugin.key);
  }
}

function isEmptyDocument(doc: ProseMirrorNode): boolean {
  if (doc.textContent.replace(/\u200b/g, '').trim().length > 0) {
    return false;
  }

  let hasContent = false;

  doc.descendants((node) => {
    if (hasContent) {
      return false;
    }

    if (isContentNode(node)) {
      hasContent = true;

      return false;
    }

    return true;
  });

  return !hasContent;
}

function isEmptyHtmlDocument(html: string, schema: Schema): boolean {
  if (canParseHtmlDocument()) {
    return isEmptyDocument(parseHtmlDocument(html, schema));
  }

  return isEmptySerializedHtml(html, schema);
}

function canParseHtmlDocument(): boolean {
  return (
    typeof document !== 'undefined' &&
    typeof document.createElement === 'function'
  );
}

function isEmptySerializedHtml(html: string, schema: Schema): boolean {
  const trimmedHtml = html.trim();

  if (trimmedHtml === '') {
    return true;
  }

  if (
    (schema.nodes['image'] && /<img\b/i.test(trimmedHtml)) ||
    (schema.nodes['horizontalRule'] && /<hr\b/i.test(trimmedHtml)) ||
    (schema.nodes['table'] && /<table\b/i.test(trimmedHtml)) ||
    (schema.nodes['mention'] &&
      /<span\b[^>]*\bdata-qalma-mention\b/i.test(trimmedHtml))
  ) {
    return false;
  }

  return (
    trimmedHtml
      .replace(/<br\b[^>]*>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;|&#160;|&#xa0;/gi, ' ')
      .replace(/&#8203;|&#x200b;|&ZeroWidthSpace;/gi, '')
      .replace(/\u00a0/g, ' ')
      .replace(/\u200b/g, '')
      .trim().length === 0
  );
}

/**
 * A node that counts as content even when the document carries no text: media
 * atoms (images, mentions), tables, and block-level leaves (horizontal rules,
 * and any future block embed). Hard breaks — inline, non-atom leaves — do not.
 */
function isContentNode(node: ProseMirrorNode): boolean {
  if (node.isText) {
    return false;
  }

  return (
    node.type.spec.atom === true ||
    node.type.name === 'table' ||
    (node.isLeaf && !node.type.isInline)
  );
}

export function createQalmaEditor(
  options: QalmaEditorOptions = {},
): QalmaEditorController {
  return new QalmaEditorController(options);
}

function resolveContentLimits(
  limits: Partial<QalmaContentLimits> | undefined,
): Readonly<QalmaContentLimits> {
  const resolved = Object.freeze({
    ...QALMA_DEFAULT_CONTENT_LIMITS,
    ...limits,
  });

  for (const [name, value] of Object.entries(resolved)) {
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new RangeError(
        `QALMA content limit ${name} must be a positive safe integer.`,
      );
    }
  }

  return resolved;
}

function assertStringWithinLimit(
  value: unknown,
  maxLength: number,
  label: string,
): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeError(`QALMA ${label} must be a string.`);
  }

  if (value.length > maxLength) {
    throw new RangeError(
      `QALMA ${label} exceeds the configured limit of ${maxLength} characters.`,
    );
  }
}

function assertDocumentWithinLimits(
  document: unknown,
  limits: Readonly<QalmaContentLimits>,
): void {
  const pending: Array<{ value: unknown; depth: number }> = [
    { value: document, depth: 1 },
  ];
  const visited = new WeakSet<object>();
  let nodeCount = 0;
  let textLength = 0;

  while (pending.length > 0) {
    const current = pending.pop();

    if (!current) {
      continue;
    }

    nodeCount += 1;

    if (nodeCount > limits.maxJsonNodes) {
      throw new RangeError(
        `QALMA JSON document exceeds the configured limit of ${limits.maxJsonNodes} values.`,
      );
    }

    if (typeof current.value === 'string') {
      textLength += current.value.length;

      if (textLength > limits.maxJsonTextLength) {
        throw new RangeError(
          `QALMA JSON document exceeds the configured text limit of ${limits.maxJsonTextLength} characters.`,
        );
      }

      continue;
    }

    if (typeof current.value !== 'object' || current.value === null) {
      continue;
    }

    if (visited.has(current.value)) {
      throw new RangeError('QALMA JSON document must not contain cycles.');
    }

    visited.add(current.value);

    if (current.depth > limits.maxJsonDepth) {
      throw new RangeError(
        `QALMA JSON document exceeds the configured depth limit of ${limits.maxJsonDepth}.`,
      );
    }

    for (const value of Object.values(current.value)) {
      pending.push({ value, depth: current.depth + 1 });
    }
  }
}

function assertProseMirrorDocumentWithinLimits(
  document: ProseMirrorNode,
  limits: Readonly<QalmaContentLimits>,
): void {
  const pending: Array<{ node: ProseMirrorNode; depth: number }> = [
    { node: document, depth: 1 },
  ];
  let nodeCount = 0;
  let textLength = 0;

  while (pending.length > 0) {
    const current = pending.pop();

    if (!current) {
      continue;
    }

    nodeCount += 1 + current.node.marks.length;
    textLength += current.node.isText ? (current.node.text?.length ?? 0) : 0;

    if (nodeCount > limits.maxJsonNodes) {
      throw new RangeError(
        `QALMA document exceeds the configured limit of ${limits.maxJsonNodes} nodes and marks.`,
      );
    }

    if (current.depth > limits.maxJsonDepth) {
      throw new RangeError(
        `QALMA document exceeds the configured depth limit of ${limits.maxJsonDepth}.`,
      );
    }

    if (textLength > limits.maxJsonTextLength) {
      throw new RangeError(
        `QALMA document exceeds the configured text limit of ${limits.maxJsonTextLength} characters.`,
      );
    }

    for (let index = 0; index < current.node.childCount; index += 1) {
      pending.push({
        node: current.node.child(index),
        depth: current.depth + 1,
      });
    }
  }
}
