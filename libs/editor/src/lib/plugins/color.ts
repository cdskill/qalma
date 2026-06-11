import { Mark, MarkSpec, MarkType } from 'prosemirror-model';
import { EditorState, Transaction } from 'prosemirror-state';

import {
  createQalmaPlugin,
  QalmaCommandHandler,
  QalmaPlugin,
} from './qalma-plugin';

export type ColorCommandValue = string;

export const ColorPlugin = createQalmaPlugin({
  key: 'color',
  marks: {
    textStyle: createTextStyleMark(),
  },
  commands: (schema) => ({
    setTextColor: createSetTextStyleCommand(schema.marks['textStyle'], 'color'),
    unsetTextColor: createUnsetTextStyleCommand(
      schema.marks['textStyle'],
      'color',
    ),
    setBackgroundColor: createSetTextStyleCommand(
      schema.marks['textStyle'],
      'backgroundColor',
    ),
    unsetBackgroundColor: createUnsetTextStyleCommand(
      schema.marks['textStyle'],
      'backgroundColor',
    ),
  }),
  commandStates: (schema) => ({
    unsetTextColor: (state) =>
      isTextStyleAttributeActive(state, schema.marks['textStyle'], 'color'),
    unsetBackgroundColor: (state) =>
      isTextStyleAttributeActive(
        state,
        schema.marks['textStyle'],
        'backgroundColor',
      ),
  }),
  queries: (schema) => ({
    textColor: (state) =>
      getActiveTextStyleAttrs(state, schema.marks['textStyle'])?.color ?? null,
    backgroundColor: (state) =>
      getActiveTextStyleAttrs(state, schema.marks['textStyle'])
        ?.backgroundColor ?? null,
  }),
});

export const ColorKit: readonly QalmaPlugin[] = [ColorPlugin];

interface TextStyleAttrs {
  color: string | null;
  backgroundColor: string | null;
}

type TextStyleAttributeName = keyof TextStyleAttrs;

function createTextStyleMark(): MarkSpec {
  return {
    attrs: {
      color: { default: null },
      backgroundColor: { default: null },
    },
    parseDOM: [
      {
        tag: '[style]',
        getAttrs: (node) => {
          if (!(node instanceof HTMLElement)) {
            return false;
          }

          return getTextStyleAttrsFromElement(node) ?? false;
        },
      },
      {
        tag: 'font[color]',
        getAttrs: (node) => {
          if (!(node instanceof HTMLElement)) {
            return false;
          }

          const color = normalizeCssColor(
            node.getAttribute('color'),
            'color',
          );

          return color ? { color, backgroundColor: null } : false;
        },
      },
    ],
    toDOM: (mark) => [
      'span',
      {
        style: createTextStyleAttribute(getTextStyleAttrs(mark)),
      },
      0,
    ],
  };
}

function createSetTextStyleCommand(
  mark: MarkType,
  attribute: TextStyleAttributeName,
): QalmaCommandHandler {
  return (state, dispatch, _view, value) => {
    const color = normalizeCommandColor(value, getCssPropertyName(attribute));

    if (!color || !markApplies(state, mark)) {
      return false;
    }

    if (dispatch) {
      dispatch(
        updateTextStyleMarks(state, mark, (attrs) => ({
          ...attrs,
          [attribute]: color,
        })).scrollIntoView(),
      );
    }

    return true;
  };
}

function createUnsetTextStyleCommand(
  mark: MarkType,
  attribute: TextStyleAttributeName,
): QalmaCommandHandler {
  return (state, dispatch) => {
    if (!isTextStyleAttributeActive(state, mark, attribute)) {
      return false;
    }

    if (dispatch) {
      dispatch(
        updateTextStyleMarks(state, mark, (attrs) => ({
          ...attrs,
          [attribute]: null,
        })).scrollIntoView(),
      );
    }

    return true;
  };
}

function updateTextStyleMarks(
  state: EditorState,
  mark: MarkType,
  updateAttrs: (attrs: TextStyleAttrs) => TextStyleAttrs,
): Transaction {
  if (state.selection.empty) {
    return updateStoredTextStyleMark(state, mark, updateAttrs);
  }

  const transaction = state.tr;

  for (const range of state.selection.ranges) {
    state.doc.nodesBetween(range.$from.pos, range.$to.pos, (node, position) => {
      if (!node.isText || position >= range.$to.pos) {
        return undefined;
      }

      const from = Math.max(position, range.$from.pos);
      const to = Math.min(position + node.nodeSize, range.$to.pos);
      const currentMark = mark.isInSet(node.marks);
      const nextAttrs = updateAttrs(getTextStyleAttrs(currentMark));

      transaction.removeMark(from, to, mark);

      if (hasTextStyleAttrs(nextAttrs)) {
        transaction.addMark(from, to, mark.create(nextAttrs));
      }

      return undefined;
    });
  }

  return transaction;
}

function updateStoredTextStyleMark(
  state: EditorState,
  mark: MarkType,
  updateAttrs: (attrs: TextStyleAttrs) => TextStyleAttrs,
): Transaction {
  const marks = state.storedMarks ?? state.selection.$from.marks();
  const nextAttrs = updateAttrs(getTextStyleAttrs(mark.isInSet(marks)));
  const transaction = state.tr.removeStoredMark(mark);

  if (hasTextStyleAttrs(nextAttrs)) {
    transaction.addStoredMark(mark.create(nextAttrs));
  }

  return transaction;
}

function isTextStyleAttributeActive(
  state: EditorState,
  mark: MarkType,
  attribute: TextStyleAttributeName,
): boolean {
  const attrs = getActiveTextStyleAttrs(state, mark);

  return Boolean(attrs?.[attribute]);
}

function getActiveTextStyleAttrs(
  state: EditorState,
  mark: MarkType,
): TextStyleAttrs | null {
  if (state.selection.empty) {
    const activeMark = mark.isInSet(
      state.storedMarks ?? state.selection.$from.marks(),
    );

    return activeMark ? getTextStyleAttrs(activeMark) : null;
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

  return activeMark ? getTextStyleAttrs(activeMark) : null;
}

function getTextStyleAttrs(mark: Mark | null | undefined): TextStyleAttrs {
  return {
    color: normalizeCssColor(mark?.attrs['color'], 'color'),
    backgroundColor: normalizeCssColor(
      mark?.attrs['backgroundColor'],
      'background-color',
    ),
  };
}

function getTextStyleAttrsFromElement(
  element: HTMLElement,
): TextStyleAttrs | null {
  const attrs = {
    color: normalizeCssColor(element.style.color, 'color'),
    backgroundColor: normalizeCssColor(
      element.style.backgroundColor,
      'background-color',
    ),
  };

  return hasTextStyleAttrs(attrs) ? attrs : null;
}

function createTextStyleAttribute(attrs: TextStyleAttrs): string {
  return [
    attrs.color ? `color: ${attrs.color};` : '',
    attrs.backgroundColor ? `background-color: ${attrs.backgroundColor};` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

function hasTextStyleAttrs(attrs: TextStyleAttrs): boolean {
  return Boolean(attrs.color || attrs.backgroundColor);
}

function normalizeCommandColor(
  value: unknown,
  cssPropertyName: 'color' | 'background-color',
): string | null {
  return typeof value === 'string'
    ? normalizeCssColor(value, cssPropertyName)
    : null;
}

function normalizeCssColor(
  value: unknown,
  cssPropertyName: 'color' | 'background-color',
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

function getCssPropertyName(
  attribute: TextStyleAttributeName,
): 'color' | 'background-color' {
  return attribute === 'color' ? 'color' : 'background-color';
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
