import { toggleMark } from 'prosemirror-commands';
import { MarkSpec } from 'prosemirror-model';

import { createQalmaPlugin, QalmaPlugin } from './qalma-plugin';
import { isMarkActive } from '../prosemirror/queries';

const subscriptMark: MarkSpec = {
  excludes: 'superscript',
  parseDOM: [
    { tag: 'sub' },
    {
      style: 'vertical-align',
      getAttrs: (value) => (String(value) === 'sub' ? null : false),
    },
  ],
  toDOM: () => ['sub', 0],
};

const superscriptMark: MarkSpec = {
  excludes: 'subscript',
  parseDOM: [
    { tag: 'sup' },
    {
      style: 'vertical-align',
      getAttrs: (value) => (String(value) === 'super' ? null : false),
    },
  ],
  toDOM: () => ['sup', 0],
};

export const SubscriptSuperscriptPlugin = /* @__PURE__ */ createQalmaPlugin({
  key: 'subscriptSuperscript',
  marks: {
    subscript: subscriptMark,
    superscript: superscriptMark,
  },
  commands: (schema) => ({
    toggleSubscript: toggleMark(schema.marks['subscript']),
    toggleSuperscript: toggleMark(schema.marks['superscript']),
  }),
  commandStates: (schema) => ({
    toggleSubscript: (state) => isMarkActive(state, schema.marks['subscript']),
    toggleSuperscript: (state) =>
      isMarkActive(state, schema.marks['superscript']),
  }),
});

export const SubscriptSuperscriptKit: readonly QalmaPlugin[] = [
  SubscriptSuperscriptPlugin,
];
