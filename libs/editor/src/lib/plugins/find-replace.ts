import { Node as ProseMirrorNode } from 'prosemirror-model';
import {
  EditorState,
  Plugin as ProseMirrorPlugin,
  PluginKey,
  TextSelection,
} from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

import {
  QalmaCommandHandler,
  QalmaPlugin,
  createConfigurableQalmaPlugin,
  createQalmaPlugin,
} from './qalma-plugin';

export interface FindReplacePluginOptions {
  caseSensitive: boolean;
  wholeWord: boolean;
  className: string;
  activeClassName: string;
}

export interface FindQueryCommandValue {
  query: string;
  caseSensitive?: boolean;
  wholeWord?: boolean;
}

export interface ReplaceCommandValue {
  replacement: string;
}

export interface FindReplaceState {
  query: string;
  caseSensitive: boolean;
  wholeWord: boolean;
  total: number;
  activeMatch: number | null;
  current: FindReplaceRange | null;
}

export interface FindReplaceRange {
  from: number;
  to: number;
}

interface InternalFindReplaceState extends FindReplaceState {
  matches: readonly FindReplaceRange[];
  activeIndex: number;
}

type FindReplaceMeta =
  | {
      type: 'setQuery';
      value: Required<FindQueryCommandValue>;
    }
  | { type: 'activate'; index: number }
  | { type: 'refresh'; preferredIndex: number }
  | { type: 'clear' };

export const FIND_REPLACE_PLUGIN_DEFAULT_OPTIONS: Readonly<FindReplacePluginOptions> =
  /* @__PURE__ */ Object.freeze({
    caseSensitive: false,
    wholeWord: false,
    className: 'qalma-find-match',
    activeClassName: 'qalma-find-match-active',
  });

export const FindReplacePlugin = /* @__PURE__ */ createConfigurableQalmaPlugin(
  FIND_REPLACE_PLUGIN_DEFAULT_OPTIONS,
  (options) => {
    assertFindReplacePluginOptions(options);

    const pluginKey = new PluginKey<InternalFindReplaceState>(
      'qalmaFindReplace',
    );

    return createQalmaPlugin({
      key: 'findReplace',
      commands: () => createFindReplaceCommands(pluginKey, options),
      queries: () => ({
        findReplace: (state) => publicState(pluginKey.getState(state)),
      }),
      prosemirrorPlugins: () => [
        createFindReplaceProseMirrorPlugin(pluginKey, options),
      ],
    });
  },
);

export const FindReplaceKit: readonly QalmaPlugin[] = [FindReplacePlugin];

function createFindReplaceCommands(
  pluginKey: PluginKey<InternalFindReplaceState>,
  options: Readonly<FindReplacePluginOptions>,
): Record<string, QalmaCommandHandler> {
  return {
    setFindQuery: (state, dispatch, _view, value) => {
      const query = resolveFindQuery(value, options);

      if (!query) {
        return false;
      }

      dispatch?.(
        state.tr.setMeta(pluginKey, {
          type: 'setQuery',
          value: query,
        } satisfies FindReplaceMeta),
      );

      return true;
    },
    findNext: (state, dispatch) => activateMatch(state, dispatch, pluginKey, 1),
    findPrevious: (state, dispatch) =>
      activateMatch(state, dispatch, pluginKey, -1),
    replaceCurrent: (state, dispatch, _view, value) => {
      const replacement = resolveReplacement(value);
      const pluginState = pluginKey.getState(state);

      if (replacement === null || !pluginState || pluginState.activeIndex < 0) {
        return false;
      }

      if (dispatch) {
        const match = pluginState.matches[pluginState.activeIndex];

        if (!match) {
          return false;
        }

        dispatch(
          state.tr
            .insertText(replacement, match.from, match.to)
            .setMeta(pluginKey, {
              type: 'refresh',
              preferredIndex: pluginState.activeIndex,
            } satisfies FindReplaceMeta),
        );
      }

      return true;
    },
    replaceAll: (state, dispatch, _view, value) => {
      const replacement = resolveReplacement(value);
      const pluginState = pluginKey.getState(state);

      if (
        replacement === null ||
        !pluginState ||
        pluginState.matches.length === 0
      ) {
        return false;
      }

      if (dispatch) {
        let transaction = state.tr;

        for (const match of [...pluginState.matches].reverse()) {
          transaction = transaction.insertText(
            replacement,
            match.from,
            match.to,
          );
        }

        dispatch(
          transaction.setMeta(pluginKey, {
            type: 'refresh',
            preferredIndex: 0,
          } satisfies FindReplaceMeta),
        );
      }

      return true;
    },
    clearFind: (state, dispatch) => {
      const pluginState = pluginKey.getState(state);

      if (!pluginState || pluginState.query === '') {
        return false;
      }

      dispatch?.(
        state.tr.setMeta(pluginKey, {
          type: 'clear',
        } satisfies FindReplaceMeta),
      );

      return true;
    },
  };
}

function activateMatch(
  state: EditorState,
  dispatch: Parameters<QalmaCommandHandler>[1],
  pluginKey: PluginKey<InternalFindReplaceState>,
  direction: 1 | -1,
): boolean {
  const pluginState = pluginKey.getState(state);

  if (!pluginState || pluginState.matches.length === 0) {
    return false;
  }

  const index =
    pluginState.activeIndex < 0
      ? direction === 1
        ? 0
        : pluginState.matches.length - 1
      : (pluginState.activeIndex + direction + pluginState.matches.length) %
        pluginState.matches.length;
  const match = pluginState.matches[index];

  if (!match) {
    return false;
  }

  dispatch?.(
    state.tr
      .setSelection(TextSelection.create(state.doc, match.from, match.to))
      .setMeta(pluginKey, {
        type: 'activate',
        index,
      } satisfies FindReplaceMeta)
      .scrollIntoView(),
  );

  return true;
}

function createFindReplaceProseMirrorPlugin(
  pluginKey: PluginKey<InternalFindReplaceState>,
  options: Readonly<FindReplacePluginOptions>,
): ProseMirrorPlugin<InternalFindReplaceState> {
  return new ProseMirrorPlugin({
    key: pluginKey,
    state: {
      init: () => emptyState(options),
      apply: (transaction, pluginState) => {
        const meta = transaction.getMeta(pluginKey) as
          | FindReplaceMeta
          | undefined;

        if (meta?.type === 'clear') {
          return emptyState(options);
        }

        if (meta?.type === 'setQuery') {
          return stateForQuery(transaction.doc, meta.value, -1);
        }

        let nextState = transaction.docChanged
          ? stateForQuery(transaction.doc, pluginState, pluginState.activeIndex)
          : pluginState;

        if (meta?.type === 'activate') {
          nextState = withActiveIndex(nextState, meta.index);
        } else if (meta?.type === 'refresh') {
          nextState = stateForQuery(
            transaction.doc,
            nextState,
            meta.preferredIndex,
          );
        }

        return nextState;
      },
    },
    props: {
      decorations: (state) => {
        const pluginState = pluginKey.getState(state);

        if (!pluginState || pluginState.matches.length === 0) {
          return DecorationSet.empty;
        }

        return DecorationSet.create(
          state.doc,
          pluginState.matches.map((match, index) =>
            Decoration.inline(match.from, match.to, {
              class:
                index === pluginState.activeIndex
                  ? `${options.className} ${options.activeClassName}`
                  : options.className,
              'data-qalma-find-match': String(index + 1),
            }),
          ),
        );
      },
    },
  });
}

function emptyState(
  options: Readonly<FindReplacePluginOptions>,
): InternalFindReplaceState {
  return {
    query: '',
    caseSensitive: options.caseSensitive,
    wholeWord: options.wholeWord,
    total: 0,
    activeMatch: null,
    current: null,
    matches: [],
    activeIndex: -1,
  };
}

function stateForQuery(
  doc: ProseMirrorNode,
  query: Pick<FindReplaceState, 'query' | 'caseSensitive' | 'wholeWord'>,
  preferredIndex: number,
): InternalFindReplaceState {
  const matches =
    query.query === '' ? [] : findMatches(doc, query.query, query);
  const activeIndex =
    matches.length === 0 || preferredIndex < 0
      ? -1
      : Math.min(preferredIndex, matches.length - 1);

  return {
    query: query.query,
    caseSensitive: query.caseSensitive,
    wholeWord: query.wholeWord,
    total: matches.length,
    activeMatch: activeIndex < 0 ? null : activeIndex + 1,
    current: activeIndex < 0 ? null : (matches[activeIndex] ?? null),
    matches,
    activeIndex,
  };
}

function withActiveIndex(
  state: InternalFindReplaceState,
  activeIndex: number,
): InternalFindReplaceState {
  const current = state.matches[activeIndex] ?? null;

  return {
    ...state,
    activeIndex: current ? activeIndex : -1,
    activeMatch: current ? activeIndex + 1 : null,
    current,
  };
}

function findMatches(
  doc: ProseMirrorNode,
  query: string,
  options: Pick<FindReplaceState, 'caseSensitive' | 'wholeWord'>,
): FindReplaceRange[] {
  const flattened = flattenDocument(doc);
  const expression = new RegExp(
    escapeRegExp(query),
    options.caseSensitive ? 'gu' : 'giu',
  );
  const matches: FindReplaceRange[] = [];

  for (const match of flattened.text.matchAll(expression)) {
    const index = match.index;
    const value = match[0];

    if (
      index === undefined ||
      (options.wholeWord &&
        (!isWordBoundary(flattened.text, index - 1) ||
          !isWordBoundary(flattened.text, index + value.length)))
    ) {
      continue;
    }

    const from = flattened.positions[index];
    const lastPosition = flattened.positions[index + value.length - 1];

    if (from === undefined || lastPosition === undefined) {
      continue;
    }

    matches.push({
      from,
      to: lastPosition + 1,
    });
  }

  return matches;
}

function flattenDocument(doc: ProseMirrorNode): {
  text: string;
  positions: number[];
} {
  let text = '';
  const positions: number[] = [];
  let previousEnd: number | null = null;

  doc.descendants((node, position) => {
    if (!node.isText || !node.text) {
      return;
    }

    if (previousEnd !== null && position !== previousEnd) {
      text += '\n';
      positions.push(-1);
    }

    for (let index = 0; index < node.text.length; index += 1) {
      text += node.text[index];
      positions.push(position + index);
    }

    previousEnd = position + node.nodeSize;
  });

  return { text, positions };
}

function isWordBoundary(text: string, index: number): boolean {
  if (index < 0 || index >= text.length) {
    return true;
  }

  return !/[\p{L}\p{N}_]/u.test(text[index] ?? '');
}

function resolveFindQuery(
  value: unknown,
  options: Readonly<FindReplacePluginOptions>,
): Required<FindQueryCommandValue> | null {
  if (typeof value === 'string') {
    return {
      query: value,
      caseSensitive: options.caseSensitive,
      wholeWord: options.wholeWord,
    };
  }

  if (!value || typeof value !== 'object' || !('query' in value)) {
    return null;
  }

  const candidate = value as FindQueryCommandValue;

  if (
    typeof candidate.query !== 'string' ||
    (candidate.caseSensitive !== undefined &&
      typeof candidate.caseSensitive !== 'boolean') ||
    (candidate.wholeWord !== undefined &&
      typeof candidate.wholeWord !== 'boolean')
  ) {
    return null;
  }

  return {
    query: candidate.query,
    caseSensitive: candidate.caseSensitive ?? options.caseSensitive,
    wholeWord: candidate.wholeWord ?? options.wholeWord,
  };
}

function resolveReplacement(value: unknown): string | null {
  if (typeof value === 'string') {
    return value;
  }

  if (
    value &&
    typeof value === 'object' &&
    'replacement' in value &&
    typeof (value as ReplaceCommandValue).replacement === 'string'
  ) {
    return (value as ReplaceCommandValue).replacement;
  }

  return null;
}

function publicState(
  state: InternalFindReplaceState | undefined,
): FindReplaceState | null {
  if (!state) {
    return null;
  }

  return {
    query: state.query,
    caseSensitive: state.caseSensitive,
    wholeWord: state.wholeWord,
    total: state.total,
    activeMatch: state.activeMatch,
    current: state.current,
  };
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function assertFindReplacePluginOptions(
  options: Readonly<FindReplacePluginOptions>,
): void {
  if (
    typeof options.caseSensitive !== 'boolean' ||
    typeof options.wholeWord !== 'boolean'
  ) {
    throw new Error(
      'FindReplacePlugin caseSensitive and wholeWord options must be booleans.',
    );
  }

  for (const [name, value] of [
    ['className', options.className],
    ['activeClassName', options.activeClassName],
  ]) {
    if (typeof value !== 'string' || value.trim() === '' || /\s/.test(value)) {
      throw new Error(
        `FindReplacePlugin ${name} must be one non-empty CSS class name.`,
      );
    }
  }
}
