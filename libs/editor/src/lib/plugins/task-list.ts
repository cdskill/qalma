import { Node as ProseMirrorNode, NodeSpec, NodeType } from 'prosemirror-model';
import { EditorState, Plugin as ProseMirrorPlugin } from 'prosemirror-state';
import {
  liftListItem as liftProsemirrorListItem,
  sinkListItem as sinkProsemirrorListItem,
  splitListItemKeepMarks,
  wrapInList,
} from 'prosemirror-schema-list';
import { EditorView } from 'prosemirror-view';

import {
  createQalmaPlugin,
  QalmaCommandHandler,
  QalmaPlugin,
} from './qalma-plugin';

export interface TaskItemState {
  checked: boolean;
}

const taskListNode: NodeSpec = {
  content: 'taskItem+',
  group: 'block',
  parseDOM: [{ tag: 'ul[data-type="task-list"]' }],
  toDOM: () => ['ul', { 'data-type': 'task-list' }, 0],
};

const taskItemNode: NodeSpec = {
  attrs: {
    checked: { default: false },
  },
  content: 'paragraph block*',
  defining: true,
  parseDOM: [
    {
      tag: 'li[data-type="task-item"]',
      getAttrs: (node) =>
        node instanceof HTMLElement
          ? { checked: getCheckedAttribute(node) }
          : { checked: false },
      contentElement: (node) =>
        node.querySelector<HTMLElement>('[data-task-item-content]') ?? node,
    },
  ],
  toDOM: (node) => {
    const checked = Boolean(node.attrs['checked']);

    return [
      'li',
      {
        'data-type': 'task-item',
        'data-checked': String(checked),
      },
      [
        'label',
        {
          'data-task-item-control': '',
          contenteditable: 'false',
        },
        [
          'input',
          {
            type: 'checkbox',
            'data-task-item-checkbox': '',
            'aria-label': 'Toggle task',
            checked: checked ? '' : null,
          },
        ],
        ['span', { 'data-task-item-check-label': '' }],
      ],
      ['div', { 'data-task-item-content': '' }, 0],
    ];
  },
};

export const TaskListPlugin = createQalmaPlugin({
  key: 'taskList',
  nodes: {
    taskList: taskListNode,
    taskItem: taskItemNode,
  },
  commands: (schema) => ({
    toggleTaskList: createToggleTaskListCommand(
      schema.nodes['taskList'],
      schema.nodes['taskItem'],
    ),
    splitTaskItem: splitListItemKeepMarks(schema.nodes['taskItem'], {
      checked: false,
    }),
    liftTaskItem: liftProsemirrorListItem(schema.nodes['taskItem']),
    sinkTaskItem: sinkProsemirrorListItem(schema.nodes['taskItem']),
    toggleTaskItemChecked: createToggleTaskItemCheckedCommand(
      schema.nodes['taskItem'],
    ),
    setTaskItemChecked: createSetTaskItemCheckedCommand(
      schema.nodes['taskItem'],
    ),
  }),
  commandStates: (schema) => ({
    toggleTaskList: (state) =>
      Boolean(findClosestNode(state, [schema.nodes['taskList']])),
    toggleTaskItemChecked: (state) =>
      Boolean(
        findClosestNode(state, [schema.nodes['taskItem']])?.node.attrs[
          'checked'
        ],
      ),
  }),
  queries: (schema) => ({
    taskItem: (state): TaskItemState | null => {
      const item = findClosestNode(state, [schema.nodes['taskItem']]);

      return item ? { checked: Boolean(item.node.attrs['checked']) } : null;
    },
  }),
  prosemirrorPlugins: (schema) => [
    createTaskListBehaviorPlugin(
      schema.nodes['taskItem'],
      splitListItemKeepMarks(schema.nodes['taskItem'], { checked: false }),
      liftProsemirrorListItem(schema.nodes['taskItem']),
      sinkProsemirrorListItem(schema.nodes['taskItem']),
    ),
  ],
});

export const TaskListKit: readonly QalmaPlugin[] = [TaskListPlugin];

function getCheckedAttribute(node: HTMLElement): boolean {
  const checked = node.getAttribute('data-checked');

  if (checked !== null) {
    return checked === 'true';
  }

  const checkbox = node.querySelector<HTMLInputElement>(
    'input[type="checkbox"]',
  );

  return Boolean(checkbox?.checked || checkbox?.hasAttribute('checked'));
}

function createToggleTaskListCommand(
  taskList: NodeType,
  taskItem: NodeType,
): QalmaCommandHandler {
  return (state, dispatch) => {
    if (findClosestNode(state, [taskList])) {
      return liftProsemirrorListItem(taskItem)(state, dispatch);
    }

    return wrapInList(taskList)(state, dispatch);
  };
}

function createToggleTaskItemCheckedCommand(
  taskItem: NodeType,
): QalmaCommandHandler {
  return (state, dispatch) => {
    const item = findClosestNode(state, [taskItem]);

    if (!item) {
      return false;
    }

    if (dispatch) {
      dispatch(
        state.tr
          .setNodeMarkup(item.position, taskItem, {
            ...item.node.attrs,
            checked: !item.node.attrs['checked'],
          })
          .scrollIntoView(),
      );
    }

    return true;
  };
}

function createSetTaskItemCheckedCommand(
  taskItem: NodeType,
): QalmaCommandHandler {
  return (state, dispatch, _view, value) => {
    if (typeof value !== 'boolean') {
      return false;
    }

    const item = findClosestNode(state, [taskItem]);

    if (!item) {
      return false;
    }

    if (dispatch) {
      dispatch(
        state.tr
          .setNodeMarkup(item.position, taskItem, {
            ...item.node.attrs,
            checked: value,
          })
          .scrollIntoView(),
      );
    }

    return true;
  };
}

interface ActiveNode {
  node: ProseMirrorNode;
  position: number;
}

function findClosestNode(
  state: EditorState,
  nodeTypes: readonly NodeType[],
): ActiveNode | null {
  const { $from } = state.selection;

  for (let depth = $from.depth; depth > 0; depth -= 1) {
    const node = $from.node(depth);

    if (nodeTypes.includes(node.type)) {
      return {
        node,
        position: $from.before(depth),
      };
    }
  }

  return null;
}

function createTaskListBehaviorPlugin(
  taskItem: NodeType,
  splitTaskItem: QalmaCommandHandler,
  liftTaskItem: QalmaCommandHandler,
  sinkTaskItem: QalmaCommandHandler,
): ProseMirrorPlugin {
  return new ProseMirrorPlugin({
    props: {
      handleDOMEvents: {
        change: (view, event) =>
          handleTaskItemCheckboxChange(view, event, taskItem),
      },
      handleKeyDown: (view, event) => {
        if (!findClosestNode(view.state, [taskItem])) {
          return false;
        }

        if (
          event.key === 'Enter' &&
          splitTaskItem(view.state, view.dispatch, view)
        ) {
          return true;
        }

        if (event.key !== 'Tab') {
          return false;
        }

        event.preventDefault();

        const command = event.shiftKey ? liftTaskItem : sinkTaskItem;

        return command(view.state, view.dispatch, view) || true;
      },
    },
  });
}

function handleTaskItemCheckboxChange(
  view: EditorView,
  event: Event,
  taskItem: NodeType,
): boolean {
  const target = event.target;

  if (
    !(target instanceof HTMLInputElement) ||
    target.type !== 'checkbox' ||
    !target.hasAttribute('data-task-item-checkbox')
  ) {
    return false;
  }

  const taskItemElement = target.closest<HTMLElement>(
    'li[data-type="task-item"]',
  );
  const position = taskItemElement
    ? findTaskItemPosition(view, taskItemElement, taskItem)
    : null;
  const node = position === null ? null : view.state.doc.nodeAt(position);

  if (position === null || !node) {
    return false;
  }

  view.dispatch(
    view.state.tr
      .setNodeMarkup(position, taskItem, {
        ...node.attrs,
        checked: target.checked,
      })
      .scrollIntoView(),
  );
  view.focus();

  return true;
}

function findTaskItemPosition(
  view: EditorView,
  taskItemElement: HTMLElement,
  taskItem: NodeType,
): number | null {
  let position: number | null = null;

  view.state.doc.descendants((node, pos) => {
    if (node.type === taskItem && view.nodeDOM(pos) === taskItemElement) {
      position = pos;

      return false;
    }

    return position === null;
  });

  return position;
}
