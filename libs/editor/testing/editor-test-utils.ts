import { TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import {
  QalmaEditorController,
  QalmaEditorOptions,
  createQalmaEditor,
} from '../src/lib/editor/qalma-editor-controller';

installGeometryMocks();

export interface MountedEditor {
  editor: QalmaEditorController;
  host: HTMLElement;
  unmount(): void;
}

export function mountEditor(options: QalmaEditorOptions = {}): MountedEditor {
  const editor = createQalmaEditor(options);
  const host = document.createElement('div');

  document.body.appendChild(host);
  editor.mount(host);

  return {
    editor,
    host,
    unmount: () => {
      editor.unmount(host);
      host.remove();
    },
  };
}

export function getEditorView(editor: QalmaEditorController): EditorView {
  const view = (editor as unknown as { editorView: EditorView | undefined })
    .editorView;

  if (!view) {
    throw new Error('Editor view is not mounted.');
  }

  return view;
}

export function selectEditorRange(
  editor: QalmaEditorController,
  from: number,
  to: number,
): void {
  const view = getEditorView(editor);

  view.dispatch(
    view.state.tr.setSelection(TextSelection.create(view.state.doc, from, to)),
  );
}

export interface TextRange {
  from: number;
  to: number;
}

export function findTextRange(
  editor: QalmaEditorController,
  text: string,
): TextRange {
  const view = getEditorView(editor);
  let range: TextRange | null = null;

  view.state.doc.descendants((node, position) => {
    if (range) {
      return false;
    }

    if (!node.isText) {
      return undefined;
    }

    const textContent = node.text ?? '';
    const index = textContent.indexOf(text);

    if (index === -1) {
      return undefined;
    }

    range = {
      from: position + index,
      to: position + index + text.length,
    };

    return false;
  });

  if (!range) {
    throw new Error(`Could not find text "${text}" in the editor document.`);
  }

  return range;
}

export function selectText(editor: QalmaEditorController, text: string): void {
  const range = findTextRange(editor, text);

  selectEditorRange(editor, range.from, range.to);
}

export function placeCursorAfterText(
  editor: QalmaEditorController,
  text: string,
): void {
  const range = findTextRange(editor, text);

  selectEditorRange(editor, range.to, range.to);
}

export function getEditorSelectionFrom(editor: QalmaEditorController): number {
  return getEditorView(editor).state.selection.from;
}

export function typeText(editor: QalmaEditorController, text: string): boolean {
  const view = getEditorView(editor);
  const { from, to } = view.state.selection;
  let handled = false;

  view.someProp('handleTextInput', (handler) => {
    handled =
      handler(view, from, to, text, () =>
        view.state.tr.insertText(text, from, to),
      ) === true;

    return handled;
  });

  if (!handled) {
    view.dispatch(view.state.tr.insertText(text, from, to));
  }

  return handled;
}

export function insertText(editor: QalmaEditorController, text: string): void {
  const view = getEditorView(editor);

  view.dispatch(view.state.tr.insertText(text));
}

export interface TestClipboardData {
  html?: string;
  text: string;
  uriList?: string;
}

export function pasteClipboard(
  editor: QalmaEditorController,
  clipboardData: TestClipboardData,
): ClipboardEvent {
  const view = getEditorView(editor);
  const event = new Event('paste', {
    bubbles: true,
    cancelable: true,
  }) as ClipboardEvent;

  Object.defineProperty(event, 'clipboardData', {
    value: {
      getData: (type: string) => {
        if (type === 'text/html') {
          return clipboardData.html ?? '';
        }

        if (type === 'text/uri-list') {
          return clipboardData.uriList ?? '';
        }

        return type === 'text/plain' ? clipboardData.text : '';
      },
    },
  });

  view.dom.dispatchEvent(event);

  return event;
}

export async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
}

export interface TestKeyOptions {
  altKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
  shiftKey?: boolean;
}

export function dispatchKey(
  editor: QalmaEditorController,
  key: string,
  options: TestKeyOptions = {},
): KeyboardEvent {
  const view = getEditorView(editor);
  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key,
    ...options,
  });

  view.dom.dispatchEvent(event);

  return event;
}

export function dispatchModKey(
  editor: QalmaEditorController,
  key: string,
  options: Omit<TestKeyOptions, 'ctrlKey' | 'metaKey'> = {},
): KeyboardEvent {
  return dispatchKey(editor, key, {
    ...options,
    ctrlKey: !isMacPlatform(),
    metaKey: isMacPlatform(),
  });
}

function isMacPlatform(): boolean {
  return /Mac|iP(hone|[oa]d)/.test(navigator.platform);
}

function installGeometryMocks(): void {
  const getClientRects = () => createDOMRectList(createDOMRect());
  const getBoundingClientRect = () => createDOMRect();

  for (const prototype of [Element.prototype, Text.prototype]) {
    if (!('getClientRects' in prototype)) {
      Object.defineProperty(prototype, 'getClientRects', {
        configurable: true,
        value: getClientRects,
      });
    }

    if (!('getBoundingClientRect' in prototype)) {
      Object.defineProperty(prototype, 'getBoundingClientRect', {
        configurable: true,
        value: getBoundingClientRect,
      });
    }
  }

  if (typeof Range !== 'undefined') {
    if (!Range.prototype.getClientRects) {
      Object.defineProperty(Range.prototype, 'getClientRects', {
        configurable: true,
        value: getClientRects,
      });
    }

    if (!Range.prototype.getBoundingClientRect) {
      Object.defineProperty(Range.prototype, 'getBoundingClientRect', {
        configurable: true,
        value: getBoundingClientRect,
      });
    }
  }
}

function createDOMRect(): DOMRect {
  return {
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 0,
    x: 0,
    y: 0,
    toJSON: () => ({}),
  } as DOMRect;
}

function createDOMRectList(rect: DOMRect): DOMRectList {
  return {
    0: rect,
    length: 1,
    item: (index: number) => (index === 0 ? rect : null),
    [Symbol.iterator]: function* () {
      yield rect;
    },
  } as DOMRectList;
}
