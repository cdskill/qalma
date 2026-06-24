import { InputRule, inputRules, wrappingInputRule } from 'prosemirror-inputrules';
import {
  Node as ProseMirrorNode,
  NodeSpec,
  NodeType,
  Schema,
} from 'prosemirror-model';
import { EditorState, Plugin as ProseMirrorPlugin } from 'prosemirror-state';
import {
  bulletList as prosemirrorBulletList,
  liftListItem as liftProsemirrorListItem,
  listItem as prosemirrorListItem,
  orderedList as prosemirrorOrderedList,
  sinkListItem as sinkProsemirrorListItem,
  splitListItemKeepMarks,
  wrapInList,
} from 'prosemirror-schema-list';

import {
  createConfigurableQalmaPlugin,
  createQalmaPlugin,
  QalmaCommandHandler,
  QalmaPlugin,
} from './qalma-plugin';

export interface ListsPluginOptions {
  /**
   * Enable markdown-style input rules: `-`, `+`, or `*` followed by a space
   * starts a bullet list, and `1.` followed by a space starts an ordered
   * list. Backspace immediately after reverts to the literal characters.
   */
  inputRules: boolean;
}

export const LISTS_PLUGIN_DEFAULT_OPTIONS: Readonly<ListsPluginOptions> =
  Object.freeze({
    inputRules: true,
  });

const bulletListNode: NodeSpec = {
  ...prosemirrorBulletList,
  content: 'listItem+',
  group: 'block',
  parseDOM: [
    {
      tag: 'ul',
      getAttrs: (node) =>
        node instanceof HTMLElement &&
        node.getAttribute('data-type') === 'task-list'
          ? false
          : null,
    },
  ],
};

const orderedListNode: NodeSpec = {
  ...prosemirrorOrderedList,
  content: 'listItem+',
  group: 'block',
};

const listItemNode: NodeSpec = {
  ...prosemirrorListItem,
  content: 'paragraph block*',
  parseDOM: [
    {
      tag: 'li',
      getAttrs: (node) =>
        node instanceof HTMLElement &&
        node.getAttribute('data-type') === 'task-item'
          ? false
          : null,
    },
  ],
};

export const ListsPlugin = /* @__PURE__ */ createConfigurableQalmaPlugin(
  LISTS_PLUGIN_DEFAULT_OPTIONS,
  (options) => {
    assertListsPluginOptions(options);

    return createQalmaPlugin({
      key: 'lists',
      nodes: {
        bulletList: bulletListNode,
        orderedList: orderedListNode,
        listItem: listItemNode,
      },
      commands: (schema) => ({
        toggleBulletList: createToggleListCommand(
          schema.nodes['bulletList'],
          schema.nodes['orderedList'],
          schema.nodes['listItem'],
        ),
        toggleOrderedList: createToggleListCommand(
          schema.nodes['orderedList'],
          schema.nodes['bulletList'],
          schema.nodes['listItem'],
        ),
        splitListItem: splitListItemKeepMarks(schema.nodes['listItem']),
        liftListItem: liftProsemirrorListItem(schema.nodes['listItem']),
        sinkListItem: sinkProsemirrorListItem(schema.nodes['listItem']),
      }),
      commandStates: (schema) => ({
        toggleBulletList: (state) =>
          isClosestListActive(state, [
            schema.nodes['bulletList'],
            schema.nodes['orderedList'],
          ]),
        toggleOrderedList: (state) =>
          isClosestListActive(state, [
            schema.nodes['orderedList'],
            schema.nodes['bulletList'],
          ]),
      }),
      shortcuts: (schema) => ({
        'Mod-Shift-8': createToggleListCommand(
          schema.nodes['bulletList'],
          schema.nodes['orderedList'],
          schema.nodes['listItem'],
        ),
        'Mod-Shift-7': createToggleListCommand(
          schema.nodes['orderedList'],
          schema.nodes['bulletList'],
          schema.nodes['listItem'],
        ),
        Enter: splitListItemKeepMarks(schema.nodes['listItem']),
        Tab: createListTabCommand(
          [schema.nodes['bulletList'], schema.nodes['orderedList']],
          sinkProsemirrorListItem(schema.nodes['listItem']),
        ),
        'Shift-Tab': createListTabCommand(
          [schema.nodes['bulletList'], schema.nodes['orderedList']],
          liftProsemirrorListItem(schema.nodes['listItem']),
        ),
      }),
      prosemirrorPlugins: (schema) => [
        createLeaveEditorPlugin(),
        ...(options.inputRules
          ? [inputRules({ rules: createListInputRules(schema) })]
          : []),
      ],
    });
  },
);

export const ListsKit: readonly QalmaPlugin[] = [ListsPlugin];

// `-`, `+`, `*` start a bullet list; `1.` starts an ordered list and joins a
// preceding list only when the typed number continues its sequence.
function createListInputRules(schema: Schema): InputRule[] {
  return [
    wrappingInputRule(/^\s*([-+*])\s$/, schema.nodes['bulletList']),
    wrappingInputRule(
      /^(\d+)\.\s$/,
      schema.nodes['orderedList'],
      (match) => ({ order: Number(match[1]) }),
      (match, node) =>
        node.childCount + (node.attrs['order'] as number) === Number(match[1]),
    ),
  ];
}

function assertListsPluginOptions(
  options: Readonly<ListsPluginOptions>,
): void {
  if (typeof options.inputRules !== 'boolean') {
    throw new TypeError('ListsPlugin inputRules must be a boolean.');
  }
}

function createToggleListCommand(
  list: NodeType,
  alternateList: NodeType,
  listItem: NodeType,
): QalmaCommandHandler {
  return (state, dispatch) => {
    if (isListActive(state, list)) {
      return liftProsemirrorListItem(listItem)(state, dispatch);
    }

    const activeList = findClosestList(state, [list, alternateList]);

    if (activeList) {
      if (!list.validContent(activeList.node.content)) {
        return false;
      }

      if (dispatch) {
        dispatch(
          state.tr
            .setNodeMarkup(activeList.position, list, getListAttrs(list))
            .scrollIntoView(),
        );
      }

      return true;
    }

    return wrapInList(list, getListAttrs(list))(state, dispatch);
  };
}

function createListTabCommand(
  lists: readonly NodeType[],
  command: QalmaCommandHandler,
): QalmaCommandHandler {
  return (state, dispatch, view) => {
    if (command(state, dispatch, view)) {
      return true;
    }

    return Boolean(findClosestList(state, lists));
  };
}

function createLeaveEditorPlugin(): ProseMirrorPlugin {
  return new ProseMirrorPlugin({
    props: {
      handleKeyDown: (view, event) => {
        if (event.key !== 'Escape') {
          return false;
        }

        const target = findAdjacentFocusable(
          view.dom,
          event.shiftKey ? 'previous' : 'next',
        );

        event.preventDefault();

        if (target) {
          target.focus();
        } else {
          view.dom.blur();
        }

        return true;
      },
    },
  });
}

interface ActiveList {
  node: ProseMirrorNode;
  position: number;
}

function findClosestList(
  state: EditorState,
  listTypes: readonly NodeType[],
): ActiveList | null {
  const { $from } = state.selection;

  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth);

    if (listTypes.includes(node.type)) {
      return {
        node,
        position: $from.before(depth),
      };
    }
  }

  return null;
}

function isListActive(state: EditorState, list: NodeType): boolean {
  return Boolean(findClosestList(state, [list]));
}

function isClosestListActive(
  state: EditorState,
  [list, alternateList]: readonly [NodeType, NodeType],
): boolean {
  return findClosestList(state, [list, alternateList])?.node.type === list;
}

function getListAttrs(list: NodeType): Record<string, number> | null {
  return list.name === 'orderedList' ? { order: 1 } : null;
}

type FocusDirection = 'next' | 'previous';

const focusableSelector = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[contenteditable="true"]',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function findAdjacentFocusable(
  editor: HTMLElement,
  direction: FocusDirection,
): HTMLElement | null {
  const root = editor.getRootNode();

  if (!(root instanceof Document || root instanceof ShadowRoot)) {
    return null;
  }

  const focusableElements = Array.from(
    root.querySelectorAll<HTMLElement>(focusableSelector),
  ).filter((element) => isFocusable(element) && !editor.contains(element));
  const orderedElements =
    direction === 'next' ? focusableElements : focusableElements.reverse();

  return (
    orderedElements.find((element) =>
      direction === 'next'
        ? isAfterEditor(editor, element)
        : isBeforeEditor(editor, element),
    ) ?? null
  );
}

function isFocusable(element: HTMLElement): boolean {
  if (element.hidden || element.closest('[inert]')) {
    return false;
  }

  const style = getComputedStyle(element);

  return style.display !== 'none' && style.visibility !== 'hidden';
}

function isAfterEditor(editor: HTMLElement, element: HTMLElement): boolean {
  return Boolean(
    editor.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_FOLLOWING,
  );
}

function isBeforeEditor(editor: HTMLElement, element: HTMLElement): boolean {
  return Boolean(
    editor.compareDocumentPosition(element) & Node.DOCUMENT_POSITION_PRECEDING,
  );
}
