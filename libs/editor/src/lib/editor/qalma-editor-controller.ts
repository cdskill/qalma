import { Signal, WritableSignal, signal } from '@angular/core';
import { Node as ProseMirrorNode, Schema } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import {
  QalmaCommandHandler,
  QalmaCommandValue,
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
  createQueryRegistry,
} from '../prosemirror/plugins';
import { createQalmaSchema } from '../prosemirror/schema';
import { createQalmaState } from '../prosemirror/state';

export interface QalmaEditorOptions {
  content?: string;
  editable?: boolean;
  plugins?: readonly QalmaPlugin[];
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
  private editorState?: EditorState;
  private editorView?: EditorView;
  private host?: HTMLElement;
  /** Faithful document set via `setJSON` before the view is mounted. */
  private pendingDoc?: ProseMirrorNode;

  constructor(options: QalmaEditorOptions = {}) {
    this.plugins = [...(options.plugins ?? [])];
    this.schema = createQalmaSchema(this.plugins);
    this.commands = createCommandRegistry(this.schema, this.plugins);
    this.commandStates = createCommandStateRegistry(this.schema, this.plugins);
    this.queries = createQueryRegistry(this.schema, this.plugins);

    this.htmlState = signal(options.content ?? '<p></p>');
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
    if (html === this.html()) {
      return;
    }

    this.pendingDoc = undefined;

    if (!this.editorView) {
      this.htmlState.set(html);

      return;
    }

    this.editorState = createQalmaState({
      html,
      plugins: this.plugins,
      schema: this.schema,
    });
    this.editorView.updateState(this.editorState);
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
    const doc = parseJsonDocument(json, this.schema);

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
   * Serializes the current document to Markdown (CommonMark + GFM). Marks with
   * no Markdown equivalent (underline, color, highlight, sub/superscript,
   * mentions) fall back to inline HTML so no content is lost.
   */
  getMarkdown(): string {
    return serializeMarkdownDocument(this.currentDoc());
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

  private dispatchTransaction(transaction: Transaction): void {
    if (!this.editorState) {
      return;
    }

    this.editorState = this.editorState.apply(transaction);
    this.editorView?.updateState(this.editorState);

    if (transaction.docChanged) {
      this.syncHtmlFromEditorState();
    }

    this.bumpViewVersion();
  }

  private currentDoc(): ProseMirrorNode {
    return (
      this.editorState?.doc ??
      this.pendingDoc ??
      parseHtmlDocument(this.html(), this.schema)
    );
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
}

export function createQalmaEditor(
  options: QalmaEditorOptions = {},
): QalmaEditorController {
  return new QalmaEditorController(options);
}
