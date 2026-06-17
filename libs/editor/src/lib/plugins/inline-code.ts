import { toggleMark } from 'prosemirror-commands';
import { InputRule, inputRules } from 'prosemirror-inputrules';
import { MarkSpec, MarkType } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

import {
  createConfigurableQalmaPlugin,
  createQalmaPlugin,
  QalmaPlugin,
} from './qalma-plugin';
import { isMarkActive } from '../prosemirror/queries';

export interface InlineCodePluginOptions {
  /**
   * Enable the markdown-style input rule: typing text between single backticks
   * converts it to inline code, e.g. `code`.
   */
  inputRules: boolean;
}

export const INLINE_CODE_PLUGIN_DEFAULT_OPTIONS: Readonly<InlineCodePluginOptions> =
  Object.freeze({
    inputRules: true,
  });

const inlineCodeMark: MarkSpec = {
  code: true,
  excludes: '_',
  parseDOM: [{ tag: 'code' }],
  toDOM: () => ['code', 0],
};

export const InlineCodePlugin = createConfigurableQalmaPlugin(
  INLINE_CODE_PLUGIN_DEFAULT_OPTIONS,
  (options) => {
    assertInlineCodePluginOptions(options);

    return createQalmaPlugin({
      key: 'inlineCode',
      marks: {
        code: inlineCodeMark,
      },
      commands: (schema) => ({
        toggleInlineCode: toggleMark(schema.marks['code']),
      }),
      commandStates: (schema) => ({
        toggleInlineCode: (state) => isMarkActive(state, schema.marks['code']),
      }),
      shortcuts: (schema) => ({
        'Mod-e': toggleMark(schema.marks['code']),
      }),
      prosemirrorPlugins: (schema) =>
        options.inputRules
          ? [
              inputRules({
                rules: [createInlineCodeInputRule(schema.marks['code'])],
              }),
            ]
          : [],
    });
  },
);

export const InlineCodeKit: readonly QalmaPlugin[] = [InlineCodePlugin];

function createInlineCodeInputRule(code: MarkType): InputRule {
  return new InputRule(
    /`([^`\n]+)`$/,
    (state, match, start, end) => {
      const text = match[1];

      if (
        !text ||
        text.trim().length === 0 ||
        !rangeAllowsMark(state, start, code)
      ) {
        return null;
      }

      return state.tr
        .delete(start, end)
        .insertText(text, start)
        .addMark(start, start + text.length, code.create())
        .removeStoredMark(code);
    },
    {
      inCodeMark: false,
    },
  );
}

function rangeAllowsMark(
  state: EditorState,
  start: number,
  mark: MarkType,
): boolean {
  return state.doc.resolve(start).parent.type.allowsMarkType(mark);
}

function assertInlineCodePluginOptions(
  options: Readonly<InlineCodePluginOptions>,
): void {
  if (typeof options.inputRules !== 'boolean') {
    throw new TypeError('InlineCodePlugin inputRules must be a boolean.');
  }
}
