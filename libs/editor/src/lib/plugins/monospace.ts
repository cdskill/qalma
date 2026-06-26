import { toggleMark } from 'prosemirror-commands';
import { MarkSpec } from 'prosemirror-model';

import { createQalmaPlugin, QalmaPlugin } from './qalma-plugin';
import { isMarkActive } from '../prosemirror/queries';

const monospaceMark: MarkSpec = {
  parseDOM: [{ tag: 'span[data-qalma-monospace]' }],
  toDOM: () => ['span', { 'data-qalma-monospace': '' }, 0],
};

export const MonospacePlugin = /* @__PURE__ */ createQalmaPlugin({
  key: 'monospace',
  marks: {
    monospace: monospaceMark,
  },
  commands: (schema) => ({
    toggleMonospace: toggleMark(schema.marks['monospace']),
  }),
  commandStates: (schema) => ({
    toggleMonospace: (state) => isMarkActive(state, schema.marks['monospace']),
  }),
});

export const MonospaceKit: readonly QalmaPlugin[] = [MonospacePlugin];
