import { Signal, WritableSignal, signal } from '@angular/core';
import { Schema } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import {
  RteCommandHandler,
  RteCommandValue,
  RtePlugin,
  RteQuery,
  RteStateQuery,
} from '../plugins/rte-plugin';
import { serializeHtmlDocument } from '../prosemirror/html';
import {
  createCommandRegistry,
  createCommandStateRegistry,
  createQueryRegistry,
} from '../prosemirror/plugins';
import { createRteSchema } from '../prosemirror/schema';
import { createRteState } from '../prosemirror/state';

export interface RteEditorOptions {
  content?: string;
  editable?: boolean;
  placeholder?: string;
  plugins?: readonly RtePlugin[];
}

export class RteEditorController {
  readonly html: Signal<string>;
  readonly editable: Signal<boolean>;
  readonly placeholder: Signal<string>;

  private readonly plugins: readonly RtePlugin[];
  private readonly schema: Schema;
  private readonly htmlState: WritableSignal<string>;
  private readonly editableState: WritableSignal<boolean>;
  private readonly placeholderState: WritableSignal<string>;
  private readonly viewVersion = signal(0);
  private readonly commands: Record<string, RteCommandHandler>;
  private readonly commandStates: Record<string, RteStateQuery>;
  private readonly queries: Partial<Record<string, RteQuery>>;
  private editorState?: EditorState;
  private editorView?: EditorView;
  private host?: HTMLElement;

  constructor(options: RteEditorOptions = {}) {
    this.plugins = [...(options.plugins ?? [])];
    this.schema = createRteSchema(this.plugins);
    this.commands = createCommandRegistry(this.schema, this.plugins);
    this.commandStates = createCommandStateRegistry(this.schema, this.plugins);
    this.queries = createQueryRegistry(this.schema, this.plugins);

    this.htmlState = signal(options.content ?? '<p></p>');
    this.editableState = signal(options.editable ?? true);
    this.placeholderState = signal(options.placeholder ?? 'Write something...');

    this.html = this.htmlState.asReadonly();
    this.editable = this.editableState.asReadonly();
    this.placeholder = this.placeholderState.asReadonly();
  }

  mount(host: HTMLElement): void {
    if (this.host === host && this.editorView) {
      return;
    }

    this.unmount();
    host.replaceChildren();

    this.editorState = createRteState({
      html: this.html(),
      plugins: this.plugins,
      schema: this.schema,
    });
    this.host = host;
    this.editorView = new EditorView(host, {
      state: this.editorState,
      editable: () => this.editable(),
      attributes: this.createEditorAttributes(),
      dispatchTransaction: (transaction) =>
        this.dispatchTransaction(transaction),
    });
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

  execute(commandName: string, value?: RteCommandValue): boolean {
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

  canExecute(commandName: string, value?: RteCommandValue): boolean {
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

    this.htmlState.set(html);

    if (!this.editorView) {
      return;
    }

    this.editorState = createRteState({
      html,
      plugins: this.plugins,
      schema: this.schema,
    });
    this.editorView.updateState(this.editorState);
    this.bumpViewVersion();
  }

  setEditable(editable: boolean): void {
    this.editableState.set(editable);
    this.editorView?.setProps({
      editable: () => editable,
    });
  }

  setPlaceholder(placeholder: string): void {
    this.placeholderState.set(placeholder);
    this.editorView?.setProps({
      attributes: this.createEditorAttributes(),
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
      this.htmlState.set(
        serializeHtmlDocument(this.editorState.doc, this.schema),
      );
    }

    this.bumpViewVersion();
  }

  private bumpViewVersion(): void {
    this.viewVersion.update((value) => value + 1);
  }

  private createEditorAttributes(): Record<string, string> {
    return {
      'aria-label': 'Rich text editor',
      'aria-placeholder': this.placeholder(),
      'data-placeholder': this.placeholder(),
    };
  }
}

export function createRteEditor(
  options: RteEditorOptions = {},
): RteEditorController {
  return new RteEditorController(options);
}
