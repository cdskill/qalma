import { NodeSpec, NodeType } from 'prosemirror-model';
import { Plugin as ProseMirrorPlugin, TextSelection } from 'prosemirror-state';

import {
  createConfigurableQalmaPlugin,
  createQalmaPlugin,
  QalmaCommandHandler,
  QalmaPlugin,
} from './qalma-plugin';
import { isInCodeContext } from '../prosemirror/code';

export interface MentionCommandValue {
  id: string;
  label: string;
  trigger?: string;
}

export interface MentionState {
  from: number;
  to: number;
  query: string;
  trigger: string;
}

export interface MentionPluginOptions {
  trigger: string;
  minQueryLength: number;
  maxQueryLength: number;
  appendSpaceOnInsert: boolean;
}

export const MENTION_PLUGIN_DEFAULT_OPTIONS: Readonly<MentionPluginOptions> =
  Object.freeze({
    trigger: '@',
    minQueryLength: 0,
    maxQueryLength: 64,
    appendSpaceOnInsert: true,
  });

export const MentionPlugin = createConfigurableQalmaPlugin(
  MENTION_PLUGIN_DEFAULT_OPTIONS,
  (options) => {
    assertMentionPluginOptions(options);

    const mentionNode: NodeSpec = {
      attrs: {
        id: {},
        label: {},
        trigger: { default: options.trigger },
      },
      group: 'inline',
      inline: true,
      atom: true,
      selectable: false,
      parseDOM: [
        {
          tag: 'span[data-qalma-mention]',
          getAttrs: (node) => {
            if (!(node instanceof HTMLElement)) {
              return false;
            }

            const id = normalizeMentionText(node.dataset['mentionId']);
            const trigger = normalizeTrigger(
              node.dataset['mentionTrigger'] ?? options.trigger,
            );
            const label = normalizeMentionText(
              node.dataset['mentionLabel'] ??
                stripMentionTrigger(node.textContent ?? '', trigger),
            );

            return id && label
              ? {
                  id,
                  label,
                  trigger,
                }
              : false;
          },
        },
      ],
      toDOM: (node) => {
        const trigger = normalizeTrigger(node.attrs['trigger']);
        const label = normalizeMentionText(node.attrs['label']) ?? '';
        const attrs: Record<string, string> = {
          'data-qalma-mention': '',
          'data-mention-id': String(node.attrs['id']),
          'data-mention-label': label,
          'data-mention-trigger': trigger,
          contenteditable: 'false',
        };

        return ['span', attrs, `${trigger}${label}`];
      },
    };

    return createQalmaPlugin({
      key: 'mention',
      nodes: {
        mention: mentionNode,
      },
      commands: (schema) => ({
        insertMention: createInsertMentionCommand(
          schema.nodes['mention'],
          options,
        ),
      }),
      queries: () => ({
        mention: (state) => getMentionState(state, options),
      }),
      prosemirrorPlugins: () => [createMentionInteractionPlugin(options)],
    });
  },
);

export const MentionKit: readonly QalmaPlugin[] = [MentionPlugin];

function createInsertMentionCommand(
  mention: NodeType,
  options: Readonly<MentionPluginOptions>,
): QalmaCommandHandler {
  return (state, dispatch, _view, value) => {
    const attrs = resolveMentionAttrs(value, options);
    const range = getMentionState(state, options) ?? {
      from: state.selection.from,
      to: state.selection.to,
      query: '',
      trigger: attrs?.trigger ?? options.trigger,
    };

    if (
      !attrs ||
      !selectionAllowsMention(state, mention, range.from, range.to)
    ) {
      return false;
    }

    if (dispatch) {
      const mentionNode = mention.create(attrs);
      const nextCharacter = state.doc.textBetween(
        range.to,
        Math.min(range.to + 1, state.doc.content.size),
        '',
        '',
      );
      const shouldAppendSpace =
        options.appendSpaceOnInsert && !/^\s$/.test(nextCharacter);
      let transaction = state.tr.replaceWith(range.from, range.to, mentionNode);
      const selectionPosition = range.from + mentionNode.nodeSize;

      if (shouldAppendSpace) {
        transaction = transaction.insertText(' ', selectionPosition);
      }

      dispatch(
        transaction
          .setSelection(
            TextSelection.create(transaction.doc, selectionPosition),
          )
          .scrollIntoView(),
      );
    }

    return true;
  };
}

function createMentionInteractionPlugin(
  options: Readonly<MentionPluginOptions>,
): ProseMirrorPlugin {
  return new ProseMirrorPlugin({
    props: {
      handleKeyDown: (view, event) => {
        if (
          !getMentionState(view.state, options) ||
          !isMentionNavigationKey(event.key)
        ) {
          return false;
        }

        const mentionEvent = new CustomEvent('qalma-mention-keydown', {
          bubbles: true,
          cancelable: true,
          detail: {
            key: event.key,
          },
        });

        view.dom.dispatchEvent(mentionEvent);

        if (!mentionEvent.defaultPrevented) {
          return false;
        }

        event.preventDefault();

        return true;
      },
    },
    view: (view) => ({
      update: () => {
        view.dom.dispatchEvent(
          new CustomEvent('qalma-mention-update', {
            bubbles: true,
          }),
        );
      },
    }),
  });
}

function isMentionNavigationKey(key: string): boolean {
  return (
    key === 'ArrowDown' ||
    key === 'ArrowUp' ||
    key === 'Escape' ||
    key === 'Enter' ||
    key === 'Tab' ||
    key === ' ' ||
    key === 'Spacebar'
  );
}

function getMentionState(
  state: Parameters<QalmaCommandHandler>[0],
  options: Readonly<MentionPluginOptions>,
): MentionState | null {
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

  if (triggerIndex < 0 || !hasMentionBoundary(textBeforeCursor, triggerIndex)) {
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

function hasMentionBoundary(text: string, triggerIndex: number): boolean {
  return triggerIndex === 0 || /\s/.test(text.charAt(triggerIndex - 1));
}

function resolveMentionAttrs(
  value: unknown,
  options: Readonly<MentionPluginOptions>,
): MentionCommandValue | null {
  if (!isMentionCommandValue(value)) {
    return null;
  }

  const id = normalizeMentionText(value.id);
  const label = normalizeMentionText(value.label);
  const trigger = normalizeTrigger(value.trigger ?? options.trigger);

  return id && label
    ? {
        id,
        label,
        trigger,
      }
    : null;
}

function isMentionCommandValue(value: unknown): value is MentionCommandValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'label' in value &&
    typeof value.id === 'string' &&
    typeof value.label === 'string' &&
    (!('trigger' in value) ||
      value.trigger === undefined ||
      typeof value.trigger === 'string')
  );
}

function selectionAllowsMention(
  state: Parameters<QalmaCommandHandler>[0],
  mention: NodeType,
  from: number,
  to: number,
): boolean {
  if (from < 0 || to > state.doc.content.size || from > to) {
    return false;
  }

  const $from = state.doc.resolve(from);
  const $to = state.doc.resolve(to);

  return (
    !isInCodeContext(state) &&
    $from.sameParent($to) &&
    $from.parent.canReplaceWith($from.index(), $to.index(), mention)
  );
}

function normalizeMentionText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  return value.trim() || null;
}

function normalizeTrigger(value: unknown): string {
  return typeof value === 'string' && value.length > 0 ? value : '@';
}

function stripMentionTrigger(text: string, trigger: string): string {
  return text.startsWith(trigger) ? text.slice(trigger.length) : text;
}

function assertMentionPluginOptions(
  options: Readonly<MentionPluginOptions>,
): void {
  if (
    typeof options.trigger !== 'string' ||
    Array.from(options.trigger).length !== 1 ||
    /\s/.test(options.trigger)
  ) {
    throw new TypeError(
      'MentionPlugin trigger must be a single non-whitespace character.',
    );
  }

  if (!Number.isInteger(options.minQueryLength) || options.minQueryLength < 0) {
    throw new RangeError(
      'MentionPlugin minQueryLength must be a non-negative integer.',
    );
  }

  if (
    !Number.isInteger(options.maxQueryLength) ||
    options.maxQueryLength < options.minQueryLength
  ) {
    throw new RangeError(
      'MentionPlugin maxQueryLength must be greater than or equal to minQueryLength.',
    );
  }

  if (typeof options.appendSpaceOnInsert !== 'boolean') {
    throw new TypeError('MentionPlugin appendSpaceOnInsert must be a boolean.');
  }
}
