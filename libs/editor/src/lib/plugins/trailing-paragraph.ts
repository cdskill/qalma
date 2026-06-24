import { NodeType } from 'prosemirror-model';
import {
  EditorState,
  Plugin as ProseMirrorPlugin,
  Transaction,
} from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { createQalmaPlugin, QalmaPlugin } from './qalma-plugin';

export const TrailingParagraphPlugin = /* @__PURE__ */ createQalmaPlugin({
  key: 'trailingParagraph',
  prosemirrorPlugins: (schema) => [
    createTrailingParagraphProseMirrorPlugin(schema.nodes['paragraph']),
  ],
});

export const TrailingParagraphKit: readonly QalmaPlugin[] = [
  TrailingParagraphPlugin,
];

function createTrailingParagraphProseMirrorPlugin(
  paragraph: NodeType,
): ProseMirrorPlugin {
  return new ProseMirrorPlugin({
    appendTransaction: (_transactions, _oldState, newState) =>
      createTrailingParagraphTransaction(newState, paragraph),
    view: (view) => {
      queueTrailingParagraphUpdate(view, paragraph);

      return {
        update: (updatedView) =>
          queueTrailingParagraphUpdate(updatedView, paragraph),
      };
    },
  });
}

function queueTrailingParagraphUpdate(
  view: EditorView,
  paragraph: NodeType,
): void {
  queueMicrotask(() => {
    if (view.isDestroyed) {
      return;
    }

    const transaction = createTrailingParagraphTransaction(
      view.state,
      paragraph,
    );

    if (transaction) {
      view.dispatch(transaction);
    }
  });
}

function createTrailingParagraphTransaction(
  state: EditorState,
  paragraph: NodeType,
): Transaction | null {
  const lastChild = state.doc.lastChild;

  if (
    lastChild?.type === paragraph &&
    lastChild.isTextblock &&
    lastChild.content.size === 0
  ) {
    return null;
  }

  const paragraphNode = paragraph.createAndFill();

  if (
    !paragraphNode ||
    !state.doc.canReplaceWith(
      state.doc.childCount,
      state.doc.childCount,
      paragraph,
    )
  ) {
    return null;
  }

  return state.tr
    .insert(state.doc.content.size, paragraphNode)
    .setMeta('addToHistory', false);
}
