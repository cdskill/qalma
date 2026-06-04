import { keymap } from 'prosemirror-keymap';
import { baseKeymap } from 'prosemirror-commands';
import { Schema } from 'prosemirror-model';
import { Command, Plugin as ProseMirrorPlugin } from 'prosemirror-state';

import { RtePlugin, RteStateQuery } from '../plugins/rte-plugin';

export function createBasePlugins(
  schema: Schema,
  rtePlugins: readonly RtePlugin[],
): ProseMirrorPlugin[] {
  const shortcuts = createShortcutRegistry(schema, rtePlugins);

  return [
    ...rtePlugins.flatMap(
      (plugin) => plugin.prosemirrorPlugins?.(schema) ?? [],
    ),
    ...(Object.keys(shortcuts).length > 0 ? [keymap(shortcuts)] : []),
    keymap(baseKeymap),
  ];
}

export function createCommandRegistry(
  schema: Schema,
  rtePlugins: readonly RtePlugin[],
): Record<string, Command> {
  const commands: Record<string, Command> = {};

  for (const plugin of rtePlugins) {
    for (const [name, command] of Object.entries(
      plugin.commands?.(schema) ?? {},
    )) {
      if (commands[name]) {
        throw new Error(
          `RTE plugin "${plugin.key}" defines duplicate command "${name}".`,
        );
      }

      commands[name] = command;
    }
  }

  return commands;
}

export function createCommandStateRegistry(
  schema: Schema,
  rtePlugins: readonly RtePlugin[],
): Record<string, RteStateQuery> {
  const states: Record<string, RteStateQuery> = {};

  for (const plugin of rtePlugins) {
    for (const [commandName, query] of Object.entries(
      plugin.commandStates?.(schema) ?? {},
    )) {
      if (states[commandName]) {
        throw new Error(
          `RTE plugin "${plugin.key}" defines duplicate command state "${commandName}".`,
        );
      }

      states[commandName] = query;
    }
  }

  return states;
}

function createShortcutRegistry(
  schema: Schema,
  rtePlugins: readonly RtePlugin[],
): Record<string, Command> {
  const shortcuts: Record<string, Command> = {};

  for (const plugin of rtePlugins) {
    for (const [shortcut, command] of Object.entries(
      plugin.shortcuts?.(schema) ?? {},
    )) {
      if (shortcuts[shortcut]) {
        throw new Error(
          `RTE plugin "${plugin.key}" defines duplicate shortcut "${shortcut}".`,
        );
      }

      shortcuts[shortcut] = command;
    }
  }

  return shortcuts;
}
