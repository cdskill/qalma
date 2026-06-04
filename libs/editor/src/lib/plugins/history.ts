import { history, redo, undo } from 'prosemirror-history';

import { createConfigurableRtePlugin, createRtePlugin } from './rte-plugin';

export interface HistoryPluginOptions {
  depth: number;
  newGroupDelay: number;
}

export const HISTORY_PLUGIN_DEFAULT_OPTIONS: Readonly<HistoryPluginOptions> =
  Object.freeze({
    depth: 100,
    newGroupDelay: 500,
  });

export const HistoryPlugin = createConfigurableRtePlugin(
  HISTORY_PLUGIN_DEFAULT_OPTIONS,
  (options) => {
    assertHistoryPluginOptions(options);

    return createRtePlugin({
      key: 'history',
      prosemirrorPlugins: () => [history(options)],
      commands: () => ({
        undo,
        redo,
      }),
      shortcuts: () => ({
        'Mod-z': undo,
        'Shift-Mod-z': redo,
        'Mod-y': redo,
      }),
    });
  },
);

function assertHistoryPluginOptions(
  options: Readonly<HistoryPluginOptions>,
): void {
  if (!Number.isInteger(options.depth) || options.depth < 1) {
    throw new RangeError('HistoryPlugin depth must be a positive integer.');
  }

  if (!Number.isFinite(options.newGroupDelay) || options.newGroupDelay < 0) {
    throw new RangeError(
      'HistoryPlugin newGroupDelay must be a non-negative finite number.',
    );
  }
}
