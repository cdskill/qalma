import { Node as ProseMirrorNode } from 'prosemirror-model';
import { Plugin as ProseMirrorPlugin } from 'prosemirror-state';

import {
  QalmaPlugin,
  createConfigurableQalmaPlugin,
  createQalmaPlugin,
} from './qalma-plugin';

export type CharacterCountMode = 'grapheme' | 'codePoint';

export interface CharacterCountPluginOptions {
  limit: number | null;
  mode: CharacterCountMode;
}

export interface CharacterCountState {
  characters: number;
  words: number;
  limit: number | null;
  remaining: number | null;
  isOverLimit: boolean;
}

export const CHARACTER_COUNT_PLUGIN_DEFAULT_OPTIONS: Readonly<CharacterCountPluginOptions> =
  /* @__PURE__ */ Object.freeze({
    limit: null,
    mode: 'grapheme',
  });

export const CharacterCountPlugin =
  /* @__PURE__ */ createConfigurableQalmaPlugin(
    CHARACTER_COUNT_PLUGIN_DEFAULT_OPTIONS,
    (options) => {
      assertCharacterCountPluginOptions(options);

      return createQalmaPlugin({
        key: 'characterCount',
        queries: () => ({
          characterCount: (state) =>
            createCharacterCountState(state.doc, options),
        }),
        prosemirrorPlugins: () =>
          options.limit === null
            ? []
            : [createLimitPlugin(options.limit, options.mode)],
      });
    },
  );

export const CharacterCountKit: readonly QalmaPlugin[] = [CharacterCountPlugin];

function createCharacterCountState(
  doc: ProseMirrorNode,
  options: Readonly<CharacterCountPluginOptions>,
): CharacterCountState {
  const text = documentText(doc);
  const characters = countCharacters(text, options.mode);

  return {
    characters,
    words: countWords(text),
    limit: options.limit,
    remaining:
      options.limit === null ? null : Math.max(options.limit - characters, 0),
    isOverLimit: options.limit !== null && characters > options.limit,
  };
}

function createLimitPlugin(
  limit: number,
  mode: CharacterCountMode,
): ProseMirrorPlugin {
  return new ProseMirrorPlugin({
    filterTransaction: (transaction, state) => {
      if (!transaction.docChanged) {
        return true;
      }

      const currentCount = countCharacters(documentText(state.doc), mode);
      const nextCount = countCharacters(documentText(transaction.doc), mode);

      return nextCount <= limit || nextCount <= currentCount;
    },
  });
}

function documentText(doc: ProseMirrorNode): string {
  return doc.textBetween(0, doc.content.size, '\n', '\n');
}

function countCharacters(text: string, mode: CharacterCountMode): number {
  if (mode === 'codePoint') {
    return Array.from(text).length;
  }

  const Segmenter = (
    Intl as typeof Intl & {
      Segmenter?: new (
        locale?: string,
        options?: { granularity: 'grapheme' },
      ) => {
        segment(input: string): Iterable<unknown>;
      };
    }
  ).Segmenter;

  return Segmenter
    ? Array.from(
        new Segmenter(undefined, { granularity: 'grapheme' }).segment(text),
      ).length
    : Array.from(text).length;
}

function countWords(text: string): number {
  const normalized = text.trim();

  return normalized === '' ? 0 : normalized.split(/\s+/u).length;
}

function assertCharacterCountPluginOptions(
  options: Readonly<CharacterCountPluginOptions>,
): void {
  if (
    options.limit !== null &&
    (!Number.isInteger(options.limit) || options.limit < 0)
  ) {
    throw new RangeError(
      'CharacterCountPlugin limit must be null or a non-negative integer.',
    );
  }

  if (options.mode !== 'grapheme' && options.mode !== 'codePoint') {
    throw new Error(
      'CharacterCountPlugin mode must be "grapheme" or "codePoint".',
    );
  }
}
