import { InputRule, inputRules } from 'prosemirror-inputrules';
import { NodeSpec, NodeType } from 'prosemirror-model';
import { EditorState, TextSelection, Transaction } from 'prosemirror-state';

import {
  createConfigurableQalmaPlugin,
  createQalmaPlugin,
  QalmaCommandHandler,
  QalmaPlugin,
} from './qalma-plugin';

export interface HorizontalRulePluginOptions {
  /**
   * Enable the markdown-style input rule: typing `---`, `___`, or `***` at the
   * start of an empty textblock inserts a horizontal rule. Backspace
   * immediately after reverts to the literal characters.
   */
  inputRules: boolean;
}

export const HORIZONTAL_RULE_PLUGIN_DEFAULT_OPTIONS: Readonly<HorizontalRulePluginOptions> =
  Object.freeze({
    inputRules: true,
  });

const horizontalRuleNode: NodeSpec = {
  group: 'block',
  parseDOM: [{ tag: 'hr' }],
  toDOM: () => ['hr'],
};

export const HorizontalRulePlugin = createConfigurableQalmaPlugin(
  HORIZONTAL_RULE_PLUGIN_DEFAULT_OPTIONS,
  (options) => {
    assertHorizontalRulePluginOptions(options);

    return createQalmaPlugin({
      key: 'horizontalRule',
      nodes: {
        horizontalRule: horizontalRuleNode,
      },
      commands: (schema) => ({
        insertHorizontalRule: createInsertHorizontalRuleCommand(
          schema.nodes['horizontalRule'],
          schema.nodes['paragraph'],
        ),
      }),
      prosemirrorPlugins: options.inputRules
        ? (schema) => [
            inputRules({
              rules: [
                createHorizontalRuleInputRule(
                  schema.nodes['horizontalRule'],
                  schema.nodes['paragraph'],
                ),
              ],
            }),
          ]
        : undefined,
    });
  },
);

export const HorizontalRuleKit: readonly QalmaPlugin[] = [HorizontalRulePlugin];

function createInsertHorizontalRuleCommand(
  horizontalRule: NodeType,
  paragraph: NodeType,
): QalmaCommandHandler {
  return (state, dispatch) => {
    if (!canInsert(state, horizontalRule)) {
      return false;
    }

    if (dispatch) {
      dispatch(insertHorizontalRule(state.tr, horizontalRule, paragraph));
    }

    return true;
  };
}

function createHorizontalRuleInputRule(
  horizontalRule: NodeType,
  paragraph: NodeType,
): InputRule {
  return new InputRule(/^(?:---|___|\*\*\*)$/, (state, _match, start, end) => {
    if (!canInsert(state, horizontalRule)) {
      return null;
    }

    return insertHorizontalRule(
      state.tr.delete(start, end),
      horizontalRule,
      paragraph,
    );
  });
}

// Insert the rule at the selection, then guarantee an editable textblock
// follows with the cursor in it so the leaf node never traps the caret.
function insertHorizontalRule(
  tr: Transaction,
  horizontalRule: NodeType,
  paragraph: NodeType,
): Transaction {
  tr.replaceSelectionWith(horizontalRule.create());

  const { $to } = tr.selection;

  if (!$to.nodeAfter || !$to.nodeAfter.isTextblock) {
    tr.insert($to.pos, paragraph.create());
  }

  return tr
    .setSelection(TextSelection.create(tr.doc, $to.pos + 1))
    .scrollIntoView();
}

function canInsert(state: EditorState, nodeType: NodeType): boolean {
  const { $from } = state.selection;

  for (let depth = $from.depth; depth >= 0; depth--) {
    const index = $from.index(depth);

    if ($from.node(depth).canReplaceWith(index, index, nodeType)) {
      return true;
    }
  }

  return false;
}

function assertHorizontalRulePluginOptions(
  options: Readonly<HorizontalRulePluginOptions>,
): void {
  if (typeof options.inputRules !== 'boolean') {
    throw new TypeError('HorizontalRulePlugin inputRules must be a boolean.');
  }
}
