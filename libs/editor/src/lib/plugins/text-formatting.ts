import { toggleMark } from 'prosemirror-commands';
import { MarkSpec } from 'prosemirror-model';

import { createRtePlugin, RtePlugin } from './rte-plugin';
import { isMarkActive } from '../prosemirror/queries';

const strongMark: MarkSpec = {
  parseDOM: [
    { tag: 'strong' },
    { tag: 'b' },
    {
      style: 'font-weight',
      getAttrs: (value) => {
        const weight = String(value);

        return weight === 'bold' || weight === 'bolder' || Number(weight) >= 500
          ? null
          : false;
      },
    },
  ],
  toDOM: () => ['strong', 0],
};

const emMark: MarkSpec = {
  parseDOM: [{ tag: 'em' }, { tag: 'i' }, { style: 'font-style=italic' }],
  toDOM: () => ['em', 0],
};

const underlineMark: MarkSpec = {
  parseDOM: [
    { tag: 'u' },
    {
      style: 'text-decoration',
      getAttrs: (value) => (String(value).includes('underline') ? null : false),
    },
  ],
  toDOM: () => ['u', 0],
};

const strikeMark: MarkSpec = {
  parseDOM: [
    { tag: 's' },
    { tag: 'strike' },
    { tag: 'del' },
    {
      style: 'text-decoration',
      getAttrs: (value) =>
        String(value).includes('line-through') ? null : false,
    },
  ],
  toDOM: () => ['s', 0],
};

export const BoldPlugin = createRtePlugin({
  key: 'bold',
  marks: {
    strong: strongMark,
  },
  commands: (schema) => ({
    toggleBold: toggleMark(schema.marks['strong']),
  }),
  commandStates: (schema) => ({
    toggleBold: (state) => isMarkActive(state, schema.marks['strong']),
  }),
  shortcuts: (schema) => ({
    'Mod-b': toggleMark(schema.marks['strong']),
  }),
});

export const ItalicPlugin = createRtePlugin({
  key: 'italic',
  marks: {
    em: emMark,
  },
  commands: (schema) => ({
    toggleItalic: toggleMark(schema.marks['em']),
  }),
  commandStates: (schema) => ({
    toggleItalic: (state) => isMarkActive(state, schema.marks['em']),
  }),
  shortcuts: (schema) => ({
    'Mod-i': toggleMark(schema.marks['em']),
  }),
});

export const UnderlinePlugin = createRtePlugin({
  key: 'underline',
  marks: {
    underline: underlineMark,
  },
  commands: (schema) => ({
    toggleUnderline: toggleMark(schema.marks['underline']),
  }),
  commandStates: (schema) => ({
    toggleUnderline: (state) => isMarkActive(state, schema.marks['underline']),
  }),
  shortcuts: (schema) => ({
    'Mod-u': toggleMark(schema.marks['underline']),
  }),
});

export const StrikePlugin = createRtePlugin({
  key: 'strike',
  marks: {
    strike: strikeMark,
  },
  commands: (schema) => ({
    toggleStrike: toggleMark(schema.marks['strike']),
  }),
  commandStates: (schema) => ({
    toggleStrike: (state) => isMarkActive(state, schema.marks['strike']),
  }),
});

export const TextFormattingKit: readonly RtePlugin[] = [
  BoldPlugin,
  ItalicPlugin,
  UnderlinePlugin,
  StrikePlugin,
];
