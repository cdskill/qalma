import { MarkSpec, NodeSpec, Schema } from 'prosemirror-model';

import { RtePlugin } from '../plugins/rte-plugin';

const baseNodes: Record<string, NodeSpec> = {
  doc: {
    content: 'block+',
  },
  paragraph: {
    content: 'inline*',
    group: 'block',
    parseDOM: [{ tag: 'p' }],
    toDOM: () => ['p', 0] as const,
  },
  text: {
    group: 'inline',
  },
};

export function createRteSchema(plugins: readonly RtePlugin[]): Schema {
  assertUniquePluginKeys(plugins);

  const nodes: Record<string, NodeSpec> = { ...baseNodes };
  const marks: Record<string, MarkSpec> = {};

  for (const plugin of plugins) {
    addUniqueEntries(nodes, plugin.nodes, plugin.key, 'node');
    addUniqueEntries(marks, plugin.marks, plugin.key, 'mark');
  }

  return new Schema({
    nodes,
    marks,
  });
}

function assertUniquePluginKeys(plugins: readonly RtePlugin[]): void {
  const keys = new Set<string>();

  for (const plugin of plugins) {
    if (keys.has(plugin.key)) {
      throw new Error(`Duplicate RTE plugin key "${plugin.key}".`);
    }

    keys.add(plugin.key);
  }
}

function addUniqueEntries<T>(
  target: Record<string, T>,
  entries: Record<string, T> | undefined,
  pluginKey: string,
  type: 'mark' | 'node',
): void {
  for (const [name, spec] of Object.entries(entries ?? {})) {
    if (target[name]) {
      throw new Error(
        `RTE plugin "${pluginKey}" defines duplicate ${type} "${name}".`,
      );
    }

    target[name] = spec;
  }
}
