import { Mark, MarkSpec, MarkType } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';

import {
  createConfigurableQalmaPlugin,
  createQalmaPlugin,
  QalmaCommandHandler,
  QalmaPlugin,
} from './qalma-plugin';

export type HighlightCommandValue = string;

export interface HighlightPluginOptions {
  defaultColor: string;
}

export const HIGHLIGHT_PLUGIN_DEFAULT_OPTIONS: Readonly<HighlightPluginOptions> =
  Object.freeze({
    defaultColor: 'rgb(254, 240, 138)',
  });

export const HighlightPlugin = /* @__PURE__ */ createConfigurableQalmaPlugin(
  HIGHLIGHT_PLUGIN_DEFAULT_OPTIONS,
  (options) => {
    const defaultColor = normalizeCssColor(
      options.defaultColor,
      'background-color',
    );

    assertDefaultHighlightColor(defaultColor);

    return createQalmaPlugin({
      key: 'highlight',
      marks: {
        highlight: createHighlightMark(defaultColor),
      },
      commands: (schema) => ({
        setHighlight: createSetHighlightCommand(
          schema.marks['highlight'],
          defaultColor,
        ),
        unsetHighlight: createUnsetHighlightCommand(schema.marks['highlight']),
      }),
      commandStates: (schema) => ({
        setHighlight: (state) =>
          isHighlightActive(state, schema.marks['highlight']),
      }),
      queries: (schema) => ({
        highlightColor: (state) =>
          getActiveHighlightColor(state, schema.marks['highlight']),
      }),
    });
  },
);

export const HighlightKit: readonly QalmaPlugin[] = [HighlightPlugin];

function createHighlightMark(defaultColor: string): MarkSpec {
  return {
    attrs: {
      color: { default: defaultColor },
    },
    parseDOM: [
      {
        tag: 'mark',
        getAttrs: (node) => {
          if (!(node instanceof HTMLElement)) {
            return false;
          }

          return {
            color:
              normalizeCssColor(
                node.style.backgroundColor,
                'background-color',
              ) ?? defaultColor,
          };
        },
      },
    ],
    toDOM: (mark) => {
      const color = getHighlightColor(mark, defaultColor);

      return color === defaultColor
        ? ['mark', 0]
        : ['mark', { style: `background-color: ${color};` }, 0];
    },
  };
}

function createSetHighlightCommand(
  mark: MarkType,
  defaultColor: string,
): QalmaCommandHandler {
  return (state, dispatch, _view, value) => {
    const color =
      value === undefined
        ? defaultColor
        : normalizeCommandColor(value, 'background-color');

    if (!color || !markApplies(state, mark)) {
      return false;
    }

    if (dispatch) {
      dispatch(
        updateHighlightMarks(state, mark, () => color).scrollIntoView(),
      );
    }

    return true;
  };
}

function createUnsetHighlightCommand(mark: MarkType): QalmaCommandHandler {
  return (state, dispatch) => {
    if (!isHighlightActive(state, mark)) {
      return false;
    }

    if (dispatch) {
      dispatch(updateHighlightMarks(state, mark, () => null).scrollIntoView());
    }

    return true;
  };
}

function updateHighlightMarks(
  state: EditorState,
  mark: MarkType,
  getNextColor: () => string | null,
): Transaction {
  if (state.selection.empty) {
    return updateStoredHighlightMark(state, mark, getNextColor);
  }

  const transaction = state.tr;

  for (const range of state.selection.ranges) {
    state.doc.nodesBetween(range.$from.pos, range.$to.pos, (node, position) => {
      if (!node.isText || position >= range.$to.pos) {
        return undefined;
      }

      const from = Math.max(position, range.$from.pos);
      const to = Math.min(position + node.nodeSize, range.$to.pos);
      const color = getNextColor();

      transaction.removeMark(from, to, mark);

      if (color) {
        transaction.addMark(from, to, mark.create({ color }));
      }

      return undefined;
    });
  }

  return transaction;
}

function updateStoredHighlightMark(
  state: EditorState,
  mark: MarkType,
  getNextColor: () => string | null,
): Transaction {
  const color = getNextColor();
  const transaction = state.tr.removeStoredMark(mark);

  if (color) {
    transaction.addStoredMark(mark.create({ color }));
  }

  return transaction;
}

function isHighlightActive(state: EditorState, mark: MarkType): boolean {
  return Boolean(getActiveHighlightMark(state, mark));
}

function getActiveHighlightColor(
  state: EditorState,
  mark: MarkType,
): string | null {
  return getActiveHighlightMark(state, mark)?.attrs['color'] ?? null;
}

function getActiveHighlightMark(
  state: EditorState,
  mark: MarkType,
): Mark | null {
  if (state.selection.empty) {
    return (
      mark.isInSet(state.storedMarks ?? state.selection.$from.marks()) ?? null
    );
  }

  let activeMark: Mark | null = null;

  state.doc.nodesBetween(state.selection.from, state.selection.to, (node) => {
    if (activeMark) {
      return false;
    }

    if (node.isText) {
      activeMark = mark.isInSet(node.marks) ?? null;
    }

    return undefined;
  });

  return activeMark;
}

function getHighlightColor(mark: Mark, defaultColor: string): string {
  return (
    normalizeCssColor(mark.attrs['color'], 'background-color') ?? defaultColor
  );
}

function normalizeCommandColor(
  value: unknown,
  cssPropertyName: 'background-color',
): string | null {
  return typeof value === 'string'
    ? normalizeCssColor(value, cssPropertyName)
    : null;
}

function normalizeCssColor(
  value: unknown,
  cssPropertyName: 'background-color',
): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const color = value.trim();

  if (!color || /[;{}<>]/.test(color)) {
    return null;
  }

  if (typeof document === 'undefined') {
    return color;
  }

  const element = document.createElement('span');

  element.style.setProperty(cssPropertyName, color);

  return element.style.getPropertyValue(cssPropertyName) || null;
}

function markApplies(state: EditorState, mark: MarkType): boolean {
  if (state.selection.empty) {
    const { $from } = state.selection;

    return $from.parent.inlineContent && $from.parent.type.allowsMarkType(mark);
  }

  for (const range of state.selection.ranges) {
    let applies = false;

    state.doc.nodesBetween(range.$from.pos, range.$to.pos, (node) => {
      if (applies) {
        return false;
      }

      applies = node.inlineContent && node.type.allowsMarkType(mark);

      return undefined;
    });

    if (applies) {
      return true;
    }
  }

  return false;
}

function assertDefaultHighlightColor(
  defaultColor: string | null,
): asserts defaultColor is string {
  if (!defaultColor) {
    throw new Error('HighlightPlugin defaultColor must be a valid CSS color.');
  }
}
