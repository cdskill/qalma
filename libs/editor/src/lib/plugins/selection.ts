import { EditorState, Plugin as ProseMirrorPlugin } from 'prosemirror-state';

import { createQalmaPlugin, QalmaPlugin } from './qalma-plugin';

export interface SelectionState {
  empty: boolean;
  from: number;
  to: number;
  text: string;
}

export const SelectionPlugin = createQalmaPlugin({
  key: 'selection',
  queries: () => ({
    selection: (state) => createSelectionState(state),
  }),
  prosemirrorPlugins: () => [createSelectionUpdatePlugin()],
});

export const SelectionKit: readonly QalmaPlugin[] = [SelectionPlugin];

function createSelectionState(state: EditorState): SelectionState {
  const { empty, from, to } = state.selection;

  return {
    empty,
    from,
    to,
    text: empty ? '' : state.doc.textBetween(from, to, '\n', '\n'),
  };
}

function createSelectionUpdatePlugin(): ProseMirrorPlugin {
  return new ProseMirrorPlugin({
    props: {
      handleDOMEvents: {
        focus: (view) => {
          dispatchSelectionUpdate(view.dom, view.state);

          return false;
        },
        blur: (view) => {
          dispatchSelectionUpdate(view.dom, view.state);

          return false;
        },
      },
    },
    view: () => ({
      update: (nextView, previousState) => {
        if (
          previousState.selection.eq(nextView.state.selection) &&
          previousState.doc.eq(nextView.state.doc)
        ) {
          return;
        }

        dispatchSelectionUpdate(nextView.dom, nextView.state);
      },
      destroy: () => undefined,
    }),
  });
}

function dispatchSelectionUpdate(host: HTMLElement, state: EditorState): void {
  host.dispatchEvent(
    new CustomEvent<SelectionState>('qalma-selection-update', {
      bubbles: true,
      detail: createSelectionState(state),
    }),
  );
}
