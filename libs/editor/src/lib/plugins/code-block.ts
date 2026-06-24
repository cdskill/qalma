import { setBlockType } from 'prosemirror-commands';
import {
  InputRule,
  inputRules,
  textblockTypeInputRule,
} from 'prosemirror-inputrules';
import { Node as ProseMirrorNode, NodeSpec, NodeType } from 'prosemirror-model';
import {
  EditorState,
  Plugin as ProseMirrorPlugin,
} from 'prosemirror-state';

import {
  createConfigurableQalmaPlugin,
  createQalmaPlugin,
  QalmaCommandHandler,
  QalmaPlugin,
} from './qalma-plugin';

export interface CodeBlockPluginOptions {
  languages: readonly string[];
  defaultLanguage: string;
  languageClassPrefix: string;
  indentText: string;
  /**
   * Enable the markdown-style input rule: ```` ``` ```` followed by a space
   * (optionally with a language, e.g. ```` ```ts ````) converts the textblock
   * to a code block. Backspace immediately after reverts to the literal
   * characters.
   */
  inputRules: boolean;
}

export const CODE_BLOCK_PLUGIN_DEFAULT_OPTIONS: Readonly<CodeBlockPluginOptions> =
  Object.freeze({
    languages: Object.freeze(['plaintext']),
    defaultLanguage: 'plaintext',
    languageClassPrefix: 'language-',
    indentText: '  ',
    inputRules: true,
  });

export const CodeBlockPlugin = /* @__PURE__ */ createConfigurableQalmaPlugin(
  CODE_BLOCK_PLUGIN_DEFAULT_OPTIONS,
  (options) => {
    assertCodeBlockPluginOptions(options);

    const codeBlockNode: NodeSpec = {
      attrs: {
        language: { default: options.defaultLanguage },
      },
      content: 'text*',
      marks: '',
      group: 'block',
      code: true,
      defining: true,
      parseDOM: [
        {
          tag: 'pre',
          preserveWhitespace: 'full',
          getAttrs: (node) => ({
            language: resolveParsedLanguage(node, options),
          }),
        },
      ],
      toDOM: (node) => [
        'pre',
        [
          'code',
          {
            class: `${options.languageClassPrefix}${resolveNodeLanguage(
              node.attrs['language'],
              options,
            )}`,
          },
          0,
        ],
      ],
    };

    return createQalmaPlugin({
      key: 'codeBlock',
      nodes: {
        codeBlock: codeBlockNode,
      },
      commands: (schema) => ({
        toggleCodeBlock: createToggleCodeBlockCommand(
          schema.nodes['codeBlock'],
          schema.nodes['paragraph'],
          options,
        ),
        setCodeBlockLanguage: createSetCodeBlockLanguageCommand(
          schema.nodes['codeBlock'],
          options,
        ),
      }),
      commandStates: (schema) => ({
        toggleCodeBlock: (state) =>
          isCodeBlockActive(state, schema.nodes['codeBlock']),
      }),
      queries: (schema) => ({
        codeBlockLanguage: (state) =>
          getActiveCodeBlock(state, schema.nodes['codeBlock'])?.node.attrs[
            'language'
          ] ?? null,
      }),
      shortcuts: (schema) => ({
        'Mod-Alt-c': createToggleCodeBlockCommand(
          schema.nodes['codeBlock'],
          schema.nodes['paragraph'],
          options,
        ),
      }),
      prosemirrorPlugins: (schema) => [
        createCodeBlockKeyboardPlugin(schema.nodes['codeBlock'], options),
        ...(options.inputRules
          ? [
              inputRules({
                rules: [
                  createCodeBlockInputRule(schema.nodes['codeBlock'], options),
                ],
              }),
            ]
          : []),
      ],
    });
  },
);

export const CodeBlockKit: readonly QalmaPlugin[] = [CodeBlockPlugin];

function createToggleCodeBlockCommand(
  codeBlock: NodeType,
  paragraph: NodeType,
  options: Readonly<CodeBlockPluginOptions>,
): QalmaCommandHandler {
  return (state, dispatch, _view, value) => {
    if (isCodeBlockActive(state, codeBlock)) {
      return setBlockType(paragraph)(state, dispatch);
    }

    const language =
      value === undefined
        ? options.defaultLanguage
        : resolveCommandLanguage(value, options);

    if (!language) {
      return false;
    }

    return setBlockType(codeBlock, { language })(state, dispatch);
  };
}

function createSetCodeBlockLanguageCommand(
  codeBlock: NodeType,
  options: Readonly<CodeBlockPluginOptions>,
): QalmaCommandHandler {
  return (state, dispatch, _view, value) => {
    const language = resolveCommandLanguage(value, options);
    const activeCodeBlock = getActiveCodeBlock(state, codeBlock);

    if (!language || !activeCodeBlock) {
      return false;
    }

    if (activeCodeBlock.node.attrs['language'] === language) {
      return true;
    }

    if (dispatch) {
      dispatch(
        state.tr
          .setNodeMarkup(activeCodeBlock.position, codeBlock, {
            ...activeCodeBlock.node.attrs,
            language,
          })
          .scrollIntoView(),
      );
    }

    return true;
  };
}

function isCodeBlockActive(state: EditorState, codeBlock: NodeType): boolean {
  return Boolean(getActiveCodeBlock(state, codeBlock));
}

// ```` ``` ```` plus a space converts the block to a code block; an optional
// language (```` ```ts ````) is honored when it is in the configured list,
// otherwise it falls back to the default language.
function createCodeBlockInputRule(
  codeBlock: NodeType,
  options: Readonly<CodeBlockPluginOptions>,
): InputRule {
  return textblockTypeInputRule(/^```([a-zA-Z0-9-]*)\s$/, codeBlock, (match) => ({
    language: resolveLanguageId(match[1], options) ?? options.defaultLanguage,
  }));
}

function createCodeBlockKeyboardPlugin(
  codeBlock: NodeType,
  options: Readonly<CodeBlockPluginOptions>,
): ProseMirrorPlugin {
  return new ProseMirrorPlugin({
    props: {
      handleKeyDown: (view, event) => {
        if (event.key !== 'Tab') {
          return false;
        }

        const activeCodeBlock = getActiveCodeBlock(view.state, codeBlock);

        if (!activeCodeBlock) {
          return false;
        }

        event.preventDefault();

        const transaction = event.shiftKey
          ? outdentCodeBlockSelection(view.state, activeCodeBlock, options)
          : indentCodeBlockSelection(view.state, activeCodeBlock, options);

        if (transaction) {
          view.dispatch(transaction.scrollIntoView());
        }

        return true;
      },
    },
  });
}

function indentCodeBlockSelection(
  state: EditorState,
  activeCodeBlock: ActiveCodeBlock,
  options: Readonly<CodeBlockPluginOptions>,
) {
  const contentStart = activeCodeBlock.position + 1;
  const lineStarts = getSelectedLineStarts(state, activeCodeBlock);
  const transaction = state.tr;

  for (const lineStart of [...lineStarts].reverse()) {
    transaction.insertText(options.indentText, contentStart + lineStart);
  }

  return transaction;
}

function outdentCodeBlockSelection(
  state: EditorState,
  activeCodeBlock: ActiveCodeBlock,
  options: Readonly<CodeBlockPluginOptions>,
) {
  const contentStart = activeCodeBlock.position + 1;
  const lineStarts = getSelectedLineStarts(state, activeCodeBlock);
  const text = activeCodeBlock.node.textContent;
  const transaction = state.tr;
  let changed = false;

  for (const lineStart of [...lineStarts].reverse()) {
    const deleteLength = getOutdentLength(text.slice(lineStart), options);

    if (deleteLength === 0) {
      continue;
    }

    transaction.delete(
      contentStart + lineStart,
      contentStart + lineStart + deleteLength,
    );
    changed = true;
  }

  return changed ? transaction : null;
}

function getSelectedLineStarts(
  state: EditorState,
  activeCodeBlock: ActiveCodeBlock,
): readonly number[] {
  const contentStart = activeCodeBlock.position + 1;
  const text = activeCodeBlock.node.textContent;
  const selectionFrom = Math.max(0, state.selection.from - contentStart);
  const selectionTo = Math.max(0, state.selection.to - contentStart);
  const firstLineStart = getLineStart(text, selectionFrom);
  const lastSelectedOffset =
    state.selection.empty || selectionTo === 0
      ? selectionFrom
      : selectionTo - 1;
  const lastLineStart = getLineStart(text, lastSelectedOffset);
  const lineStarts = [firstLineStart];
  let nextLineBreak = text.indexOf('\n', firstLineStart);

  while (nextLineBreak !== -1 && nextLineBreak + 1 <= lastLineStart) {
    lineStarts.push(nextLineBreak + 1);
    nextLineBreak = text.indexOf('\n', nextLineBreak + 1);
  }

  return lineStarts;
}

function getLineStart(text: string, offset: number): number {
  return text.lastIndexOf('\n', offset - 1) + 1;
}

function getOutdentLength(
  line: string,
  options: Readonly<CodeBlockPluginOptions>,
): number {
  if (line.startsWith(options.indentText)) {
    return options.indentText.length;
  }

  if (line.startsWith('\t')) {
    return 1;
  }

  const leadingSpaces = line.match(/^ +/)?.[0].length ?? 0;

  return Math.min(leadingSpaces, options.indentText.length);
}

interface ActiveCodeBlock {
  node: ProseMirrorNode;
  position: number;
}

function getActiveCodeBlock(
  state: EditorState,
  codeBlock: NodeType,
): ActiveCodeBlock | null {
  const { $from, $to } = state.selection;

  if (
    $from.parent.type !== codeBlock ||
    $to.parent.type !== codeBlock ||
    $from.depth === 0
  ) {
    return null;
  }

  return {
    node: $from.parent,
    position: $from.before($from.depth),
  };
}

function resolveParsedLanguage(
  node: Node | string,
  options: Readonly<CodeBlockPluginOptions>,
): string {
  if (!(node instanceof HTMLElement)) {
    return options.defaultLanguage;
  }

  const code = node.matches('code') ? node : node.querySelector('code');
  const language =
    resolveLanguageFromElement(code, options) ??
    resolveLanguageFromElement(node, options);

  return language ?? options.defaultLanguage;
}

function resolveLanguageFromElement(
  element: Element | null,
  options: Readonly<CodeBlockPluginOptions>,
): string | null {
  if (!element) {
    return null;
  }

  const classNames = Array.from(element.classList);
  const prefixes = Array.from(
    new Set([options.languageClassPrefix, 'language-', 'lang-']),
  );

  for (const className of classNames) {
    for (const prefix of prefixes) {
      if (className.startsWith(prefix)) {
        return resolveLanguageId(className.slice(prefix.length), options);
      }
    }
  }

  return null;
}

function resolveNodeLanguage(
  language: unknown,
  options: Readonly<CodeBlockPluginOptions>,
): string {
  return resolveLanguageId(language, options) ?? options.defaultLanguage;
}

function resolveCommandLanguage(
  value: unknown,
  options: Readonly<CodeBlockPluginOptions>,
): string | null {
  return resolveLanguageId(value, options);
}

function resolveLanguageId(
  value: unknown,
  options: Readonly<CodeBlockPluginOptions>,
): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const language = value.trim().toLowerCase();

  return options.languages.includes(language) ? language : null;
}

function assertCodeBlockPluginOptions(
  options: Readonly<CodeBlockPluginOptions>,
): void {
  if (!Array.isArray(options.languages)) {
    throw new TypeError('CodeBlockPlugin languages must be an array.');
  }

  if (options.languages.length === 0) {
    throw new RangeError(
      'CodeBlockPlugin languages must include at least one language.',
    );
  }

  const seen = new Set<string>();

  for (const language of options.languages) {
    assertLanguageId(language, 'CodeBlockPlugin languages entries');

    if (seen.has(language)) {
      throw new Error('CodeBlockPlugin languages entries must be unique.');
    }

    seen.add(language);
  }

  assertLanguageId(
    options.defaultLanguage,
    'CodeBlockPlugin defaultLanguage',
  );

  if (!seen.has(options.defaultLanguage)) {
    throw new Error(
      'CodeBlockPlugin defaultLanguage must be included in languages.',
    );
  }

  if (
    typeof options.languageClassPrefix !== 'string' ||
    options.languageClassPrefix.trim() !== options.languageClassPrefix ||
    options.languageClassPrefix.length === 0 ||
    /\s/.test(options.languageClassPrefix)
  ) {
    throw new Error(
      'CodeBlockPlugin languageClassPrefix must be a non-empty string without whitespace.',
    );
  }

  if (
    typeof options.indentText !== 'string' ||
    options.indentText.length === 0 ||
    !/^[\t ]+$/.test(options.indentText)
  ) {
    throw new Error(
      'CodeBlockPlugin indentText must be a non-empty string containing only spaces or tabs.',
    );
  }

  if (typeof options.inputRules !== 'boolean') {
    throw new TypeError('CodeBlockPlugin inputRules must be a boolean.');
  }
}

function assertLanguageId(value: unknown, label: string): asserts value is string {
  if (
    typeof value !== 'string' ||
    value.trim() !== value ||
    value.toLowerCase() !== value ||
    !/^[a-z][a-z0-9-]*$/.test(value)
  ) {
    throw new Error(
      `${label} must be lowercase language identifiers without whitespace.`,
    );
  }
}
