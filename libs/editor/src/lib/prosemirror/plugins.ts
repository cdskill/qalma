import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { undoInputRule } from 'prosemirror-inputrules';
import { Schema } from 'prosemirror-model';
import { Command, Plugin as ProseMirrorPlugin } from 'prosemirror-state';

import {
  QalmaCommandHandler,
  QalmaPlugin,
  QalmaQuery,
  QalmaStateQuery,
} from '../plugins/qalma-plugin';

export function createBasePlugins(
  schema: Schema,
  qalmaPlugins: readonly QalmaPlugin[],
): ProseMirrorPlugin[] {
  const shortcuts = createShortcutRegistry(schema, qalmaPlugins);

  return [
    ...qalmaPlugins.flatMap(
      (plugin) => plugin.prosemirrorPlugins?.(schema) ?? [],
    ),
    ...(Object.keys(shortcuts).length > 0 ? [keymap(shortcuts)] : []),
    keymap({ Backspace: undoInputRule }),
    keymap(baseKeymap),
  ];
}

export function createCommandRegistry(
  schema: Schema,
  qalmaPlugins: readonly QalmaPlugin[],
): Record<string, QalmaCommandHandler> {
  const commands: Record<string, QalmaCommandHandler> = {};

  for (const plugin of qalmaPlugins) {
    for (const [name, command] of Object.entries(
      plugin.commands?.(schema) ?? {},
    )) {
      if (commands[name]) {
        throw new Error(
          `QALMA plugin "${plugin.key}" defines duplicate command "${name}".`,
        );
      }

      commands[name] = command;
    }
  }

  return commands;
}

export function createCommandStateRegistry(
  schema: Schema,
  qalmaPlugins: readonly QalmaPlugin[],
): Record<string, QalmaStateQuery> {
  const states: Record<string, QalmaStateQuery> = {};

  for (const plugin of qalmaPlugins) {
    for (const [commandName, query] of Object.entries(
      plugin.commandStates?.(schema) ?? {},
    )) {
      if (states[commandName]) {
        throw new Error(
          `QALMA plugin "${plugin.key}" defines duplicate command state "${commandName}".`,
        );
      }

      states[commandName] = query;
    }
  }

  return states;
}

export function createQueryRegistry(
  schema: Schema,
  qalmaPlugins: readonly QalmaPlugin[],
): Partial<Record<string, QalmaQuery>> {
  const queries: Partial<Record<string, QalmaQuery>> = {};

  for (const plugin of qalmaPlugins) {
    for (const [name, query] of Object.entries(
      plugin.queries?.(schema) ?? {},
    )) {
      if (queries[name]) {
        throw new Error(
          `QALMA plugin "${plugin.key}" defines duplicate query "${name}".`,
        );
      }

      queries[name] = query;
    }
  }

  return queries;
}

function createShortcutRegistry(
  schema: Schema,
  qalmaPlugins: readonly QalmaPlugin[],
): Record<string, Command> {
  const shortcuts: Record<string, Command> = {};

  for (const plugin of qalmaPlugins) {
    for (const [shortcut, command] of Object.entries(
      plugin.shortcuts?.(schema) ?? {},
    )) {
      if (shortcuts[shortcut]) {
        throw new Error(
          `QALMA plugin "${plugin.key}" defines duplicate shortcut "${shortcut}".`,
        );
      }

      shortcuts[shortcut] = command;
    }
  }

  return shortcuts;
}
