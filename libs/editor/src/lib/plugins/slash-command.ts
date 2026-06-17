import { splitBlock } from 'prosemirror-commands';
import {
  EditorState,
  Plugin as ProseMirrorPlugin,
  PluginKey,
} from 'prosemirror-state';

import {
  createConfigurableQalmaPlugin,
  createQalmaPlugin,
  QalmaCommandHandler,
  QalmaPlugin,
} from './qalma-plugin';
import { isInCodeContext } from '../prosemirror/code';

export interface SlashCommandState {
  from: number;
  to: number;
  query: string;
  trigger: string;
}

export interface SlashCommandPluginOptions {
  trigger: string;
  minQueryLength: number;
  maxQueryLength: number;
}

interface SlashCommandPluginStorage {
  dismissedId: string | null;
}

interface SlashCommandPluginMeta {
  dismissedId?: string | null;
}

export const SLASH_COMMAND_PLUGIN_DEFAULT_OPTIONS: Readonly<SlashCommandPluginOptions> =
  Object.freeze({
    trigger: '/',
    minQueryLength: 0,
    maxQueryLength: 64,
  });

const slashCommandPluginKey = new PluginKey<SlashCommandPluginStorage>(
  'qalmaSlashCommand',
);

export const SlashCommandPlugin = createConfigurableQalmaPlugin(
  SLASH_COMMAND_PLUGIN_DEFAULT_OPTIONS,
  (options) => {
    assertSlashCommandPluginOptions(options);

    return createQalmaPlugin({
      key: 'slashCommand',
      commands: () => ({
        deleteSlashCommand: createDeleteSlashCommand(options),
        dismissSlashCommand: createDismissSlashCommand(options),
        splitSlashCommandBlock: createSplitSlashCommandBlock(),
      }),
      queries: () => ({
        slashCommand: (state) => getSlashCommandState(state, options),
      }),
      prosemirrorPlugins: () => [createSlashCommandInteractionPlugin(options)],
    });
  },
);

export const SlashCommandKit: readonly QalmaPlugin[] = [SlashCommandPlugin];

function createDeleteSlashCommand(
  options: Readonly<SlashCommandPluginOptions>,
): QalmaCommandHandler {
  return (state, dispatch) => {
    const slashCommand = getSlashCommandState(state, options);

    if (!slashCommand) {
      return false;
    }

    if (dispatch) {
      // Note: we intentionally do NOT mark this slash as dismissed here. The
      // text is removed, so the menu closes naturally. Marking it would also
      // suppress the menu after an undo restores the same `/query`.
      dispatch(
        state.tr.delete(slashCommand.from, slashCommand.to).scrollIntoView(),
      );
    }

    return true;
  };
}

function createDismissSlashCommand(
  options: Readonly<SlashCommandPluginOptions>,
): QalmaCommandHandler {
  return (state, dispatch) => {
    const slashCommand = getSlashCommandState(state, options);

    if (!slashCommand) {
      return false;
    }

    if (dispatch) {
      dispatch(
        state.tr.setMeta(slashCommandPluginKey, {
          dismissedId: getSlashCommandId(slashCommand),
        } satisfies SlashCommandPluginMeta),
      );
    }

    return true;
  };
}

// Splits the current block so a slash-command result lands on its own new line
// instead of transforming the line the trigger was typed on. Empty blocks are
// left untouched (returns false) so they can be transformed in place — avoiding
// a stray blank line above the new block.
function createSplitSlashCommandBlock(): QalmaCommandHandler {
  return (state, dispatch, view) => {
    if (
      !state.selection.empty ||
      state.selection.$from.parent.content.size === 0
    ) {
      return false;
    }

    return splitBlock(state, dispatch, view);
  };
}

function createSlashCommandInteractionPlugin(
  options: Readonly<SlashCommandPluginOptions>,
): ProseMirrorPlugin<SlashCommandPluginStorage> {
  return new ProseMirrorPlugin<SlashCommandPluginStorage>({
    key: slashCommandPluginKey,
    state: {
      init: () => ({ dismissedId: null }),
      apply: (transaction, previous) => {
        const meta = transaction.getMeta(slashCommandPluginKey) as
          | SlashCommandPluginMeta
          | undefined;

        if (meta && Object.prototype.hasOwnProperty.call(meta, 'dismissedId')) {
          return { dismissedId: meta.dismissedId ?? null };
        }

        if (transaction.docChanged) {
          return { dismissedId: null };
        }

        return previous;
      },
    },
    props: {
      handleKeyDown: (view, event) => {
        if (
          !getSlashCommandState(view.state, options) ||
          !isSlashCommandNavigationKey(event.key)
        ) {
          return false;
        }

        const slashCommandEvent = new CustomEvent(
          'qalma-slash-command-keydown',
          {
            bubbles: true,
            cancelable: true,
            detail: {
              key: event.key,
            },
          },
        );

        view.dom.dispatchEvent(slashCommandEvent);

        if (!slashCommandEvent.defaultPrevented) {
          return false;
        }

        event.preventDefault();

        return true;
      },
    },
    view: (view) => ({
      update: () => {
        view.dom.dispatchEvent(
          new CustomEvent('qalma-slash-command-update', {
            bubbles: true,
          }),
        );
      },
    }),
  });
}

function getSlashCommandState(
  state: EditorState,
  options: Readonly<SlashCommandPluginOptions>,
): SlashCommandState | null {
  const slashCommand = findSlashCommandState(state, options);
  const dismissedId = slashCommandPluginKey.getState(state)?.dismissedId;

  if (!slashCommand || dismissedId === getSlashCommandId(slashCommand)) {
    return null;
  }

  return slashCommand;
}

function findSlashCommandState(
  state: EditorState,
  options: Readonly<SlashCommandPluginOptions>,
): SlashCommandState | null {
  if (!state.selection.empty) {
    return null;
  }

  const $cursor = state.selection.$from;

  if (isInCodeContext(state)) {
    return null;
  }

  const textBeforeCursor = $cursor.parent.textBetween(
    0,
    $cursor.parentOffset,
    '',
    '',
  );
  const triggerIndex = textBeforeCursor.lastIndexOf(options.trigger);

  if (
    triggerIndex < 0 ||
    !hasSlashCommandBoundary(textBeforeCursor, triggerIndex)
  ) {
    return null;
  }

  const query = textBeforeCursor.slice(triggerIndex + options.trigger.length);

  if (
    /\s/.test(query) ||
    query.length < options.minQueryLength ||
    query.length > options.maxQueryLength
  ) {
    return null;
  }

  return {
    from: $cursor.start() + triggerIndex,
    to: state.selection.from,
    query,
    trigger: options.trigger,
  };
}

function getSlashCommandId(slashCommand: SlashCommandState): string {
  return [
    slashCommand.from,
    slashCommand.to,
    slashCommand.query,
    slashCommand.trigger,
  ].join(':');
}

function isSlashCommandNavigationKey(key: string): boolean {
  return (
    key === 'ArrowDown' ||
    key === 'ArrowUp' ||
    key === 'Escape' ||
    key === 'Enter' ||
    key === 'Tab'
  );
}

function hasSlashCommandBoundary(text: string, triggerIndex: number): boolean {
  return triggerIndex === 0 || /\s/.test(text.charAt(triggerIndex - 1));
}

function assertSlashCommandPluginOptions(
  options: Readonly<SlashCommandPluginOptions>,
): void {
  if (!isSingleNonWhitespaceCharacter(options.trigger)) {
    throw new TypeError(
      'SlashCommandPlugin trigger must be a single non-whitespace character.',
    );
  }

  if (!Number.isInteger(options.minQueryLength) || options.minQueryLength < 0) {
    throw new RangeError(
      'SlashCommandPlugin minQueryLength must be a non-negative integer.',
    );
  }

  if (!Number.isInteger(options.maxQueryLength) || options.maxQueryLength < 0) {
    throw new RangeError(
      'SlashCommandPlugin maxQueryLength must be a non-negative integer.',
    );
  }

  if (options.maxQueryLength < options.minQueryLength) {
    throw new RangeError(
      'SlashCommandPlugin maxQueryLength must be greater than or equal to minQueryLength.',
    );
  }
}

function isSingleNonWhitespaceCharacter(value: string): boolean {
  return typeof value === 'string' && value.length === 1 && !/\s/.test(value);
}
