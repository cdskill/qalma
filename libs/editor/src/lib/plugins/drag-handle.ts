import { Fragment, Node as ProseMirrorNode } from 'prosemirror-model';
import {
  NodeSelection,
  Plugin as ProseMirrorPlugin,
  Selection,
  TextSelection,
} from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

import {
  createQalmaPlugin,
  QalmaCommandHandler,
  QalmaPlugin,
} from './qalma-plugin';

export interface DragHandleCommandValue {
  pos: number;
}

export interface DragHandleMoveCommandValue extends DragHandleCommandValue {
  targetPos: number;
}

export interface DragHandleState extends DragHandleCommandValue {
  from: number;
  to: number;
  type: string;
  text: string;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

interface DragHandleBlock {
  index: number;
  node: ProseMirrorNode;
  pos: number;
  to: number;
}

export const DragHandlePlugin = createQalmaPlugin({
  key: 'dragHandle',
  commands: () => ({
    selectBlock: createSelectBlockCommand(),
    deleteBlock: createDeleteBlockCommand(),
    duplicateBlock: createDuplicateBlockCommand(),
    moveBlockTo: createMoveBlockToCommand(),
    moveBlockUp: createMoveBlockCommand('up'),
    moveBlockDown: createMoveBlockCommand('down'),
  }),
  queries: () => ({
    dragHandle: (state) => {
      const target = findCurrentTopLevelBlock(state);

      return target ? createDragHandleState(state, target) : null;
    },
  }),
  prosemirrorPlugins: () => [createDragHandleDecorationPlugin()],
});

export const DragHandleKit: readonly QalmaPlugin[] = [DragHandlePlugin];

function createSelectBlockCommand(): QalmaCommandHandler {
  return (state, dispatch, _view, value) => {
    const target = findTargetBlock(state, value);

    if (!target) {
      return false;
    }

    if (dispatch) {
      dispatch(
        state.tr
          .setSelection(NodeSelection.create(state.doc, target.pos))
          .scrollIntoView(),
      );
    }

    return true;
  };
}

function createDeleteBlockCommand(): QalmaCommandHandler {
  return (state, dispatch, _view, value) => {
    const target = findTargetBlock(state, value);

    if (!target) {
      return false;
    }

    if (dispatch) {
      const replacement = state.schema.nodes['paragraph']?.createAndFill();
      let transaction =
        state.doc.childCount === 1 && replacement
          ? state.tr.replaceWith(target.pos, target.to, replacement)
          : state.tr.delete(target.pos, target.to);

      transaction = setSelectionNear(
        transaction,
        Math.min(target.pos + 1, transaction.doc.content.size),
      );
      dispatch(transaction.scrollIntoView());
    }

    return true;
  };
}

function createDuplicateBlockCommand(): QalmaCommandHandler {
  return (state, dispatch, _view, value) => {
    const target = findTargetBlock(state, value);

    if (!target) {
      return false;
    }

    if (dispatch) {
      const copy = target.node.copy(target.node.content);
      const transaction = state.tr.insert(target.to, copy);

      dispatch(setSelectionNear(transaction, target.to + 1).scrollIntoView());
    }

    return true;
  };
}

function createMoveBlockToCommand(): QalmaCommandHandler {
  return (state, dispatch, _view, value) => {
    const moveValue = parseDragHandleMoveCommandValue(value);
    const target = moveValue && getTopLevelBlockAtPos(state, moveValue.pos);

    if (
      !moveValue ||
      !target ||
      !isTopLevelBoundary(state.doc, moveValue.targetPos) ||
      moveValue.targetPos === target.pos ||
      moveValue.targetPos === target.to ||
      (moveValue.targetPos > target.pos && moveValue.targetPos < target.to)
    ) {
      return false;
    }

    if (dispatch) {
      const insertionPos =
        moveValue.targetPos > target.pos
          ? moveValue.targetPos - target.node.nodeSize
          : moveValue.targetPos;
      const transaction = state.tr
        .delete(target.pos, target.to)
        .insert(insertionPos, target.node);

      dispatch(
        setSelectionNear(transaction, insertionPos + 1).scrollIntoView(),
      );
    }

    return true;
  };
}

function createMoveBlockCommand(
  direction: 'up' | 'down',
): QalmaCommandHandler {
  return (state, dispatch, _view, value) => {
    const target = findTargetBlock(state, value);
    const sibling =
      target &&
      getTopLevelBlockByIndex(
        state,
        direction === 'up' ? target.index - 1 : target.index + 1,
      );

    if (!target || !sibling) {
      return false;
    }

    if (dispatch) {
      const from = direction === 'up' ? sibling.pos : target.pos;
      const to = direction === 'up' ? target.to : sibling.to;
      const movedTargetPos =
        direction === 'up' ? sibling.pos : target.pos + sibling.node.nodeSize;
      const content =
        direction === 'up'
          ? Fragment.fromArray([target.node, sibling.node])
          : Fragment.fromArray([sibling.node, target.node]);
      const transaction = state.tr.replaceWith(from, to, content);

      dispatch(
        setSelectionNear(transaction, movedTargetPos + 1).scrollIntoView(),
      );
    }

    return true;
  };
}

function createDragHandleDecorationPlugin(): ProseMirrorPlugin {
  return new ProseMirrorPlugin({
    props: {
      decorations: (state) =>
        DecorationSet.create(state.doc, createDragHandleDecorations(state.doc)),
    },
  });
}

function createDragHandleDecorations(
  doc: ProseMirrorNode,
): Decoration[] {
  const decorations: Decoration[] = [];

  doc.forEach((node, pos) => {
    if (!node.isBlock) {
      return;
    }

    decorations.push(
      Decoration.node(pos, pos + node.nodeSize, {
        'data-qalma-drag-handle-block': '',
        'data-qalma-drag-handle-pos': String(pos),
        'data-qalma-drag-handle-to': String(pos + node.nodeSize),
        'data-qalma-drag-handle-type': node.type.name,
      }),
    );
  });

  return decorations;
}

function createDragHandleState(
  state: Parameters<QalmaCommandHandler>[0],
  target: DragHandleBlock,
): DragHandleState {
  return {
    pos: target.pos,
    from: target.pos,
    to: target.to,
    type: target.node.type.name,
    text: target.node.textContent,
    canMoveUp: Boolean(getTopLevelBlockByIndex(state, target.index - 1)),
    canMoveDown: Boolean(getTopLevelBlockByIndex(state, target.index + 1)),
  };
}

function findTargetBlock(
  state: Parameters<QalmaCommandHandler>[0],
  value: unknown,
): DragHandleBlock | null {
  const commandValue = parseDragHandleCommandValue(value);

  return commandValue
    ? getTopLevelBlockAtPos(state, commandValue.pos)
    : findCurrentTopLevelBlock(state);
}

function parseDragHandleCommandValue(
  value: unknown,
): DragHandleCommandValue | null {
  if (
    typeof value !== 'object' ||
    value === null ||
    !('pos' in value) ||
    !Number.isInteger(value.pos)
  ) {
    return null;
  }

  const pos = value.pos;

  return typeof pos === 'number' ? { pos } : null;
}

function parseDragHandleMoveCommandValue(
  value: unknown,
): DragHandleMoveCommandValue | null {
  const commandValue = parseDragHandleCommandValue(value);

  if (
    !commandValue ||
    typeof value !== 'object' ||
    value === null ||
    !('targetPos' in value) ||
    !Number.isInteger(value.targetPos)
  ) {
    return null;
  }

  const targetPos = value.targetPos;

  return typeof targetPos === 'number'
    ? { ...commandValue, targetPos }
    : null;
}

function findCurrentTopLevelBlock(
  state: Parameters<QalmaCommandHandler>[0],
): DragHandleBlock | null {
  if (state.selection instanceof NodeSelection && state.selection.node.isBlock) {
    return getTopLevelBlockAtPos(state, state.selection.from);
  }

  return getTopLevelBlockContainingPos(state, state.selection.from);
}

function getTopLevelBlockAtPos(
  state: Parameters<QalmaCommandHandler>[0],
  pos: number,
): DragHandleBlock | null {
  let result: DragHandleBlock | null = null;

  state.doc.forEach((node, offset, index) => {
    if (offset === pos) {
      result = {
        index,
        node,
        pos: offset,
        to: offset + node.nodeSize,
      };
    }
  });

  return result;
}

function getTopLevelBlockContainingPos(
  state: Parameters<QalmaCommandHandler>[0],
  pos: number,
): DragHandleBlock | null {
  let result: DragHandleBlock | null = null;

  state.doc.forEach((node, offset, index) => {
    const to = offset + node.nodeSize;

    if (!result && pos >= offset && pos <= to) {
      result = {
        index,
        node,
        pos: offset,
        to,
      };
    }
  });

  return result;
}

function isTopLevelBoundary(doc: ProseMirrorNode, pos: number): boolean {
  if (pos === 0 || pos === doc.content.size) {
    return true;
  }

  let result = false;

  doc.forEach((node, offset) => {
    if (pos === offset || pos === offset + node.nodeSize) {
      result = true;
    }
  });

  return result;
}

function getTopLevelBlockByIndex(
  state: Parameters<QalmaCommandHandler>[0],
  index: number,
): DragHandleBlock | null {
  if (index < 0 || index >= state.doc.childCount) {
    return null;
  }

  let result: DragHandleBlock | null = null;

  state.doc.forEach((node, offset, currentIndex) => {
    if (currentIndex === index) {
      result = {
        index,
        node,
        pos: offset,
        to: offset + node.nodeSize,
      };
    }
  });

  return result;
}

function setSelectionNear(
  transaction: Parameters<NonNullable<QalmaCommandHandler>>[0]['tr'],
  pos: number,
): Parameters<NonNullable<QalmaCommandHandler>>[0]['tr'] {
  const boundedPos = Math.min(Math.max(0, pos), transaction.doc.content.size);
  const resolvedPos = transaction.doc.resolve(boundedPos);
  const selection =
    resolvedPos.parent.isTextblock && resolvedPos.parentOffset <= resolvedPos.parent.content.size
      ? TextSelection.create(transaction.doc, boundedPos)
      : Selection.near(resolvedPos);

  return transaction.setSelection(selection);
}
