import { MarkSpec, NodeSpec, Schema } from 'prosemirror-model';
import {
  Command,
  EditorState,
  Plugin as ProseMirrorPlugin,
} from 'prosemirror-state';

export type QalmaStateQuery = (state: EditorState) => boolean;
export type QalmaQuery<TValue = unknown> = (state: EditorState) => TValue;
export type QalmaCommandValue = unknown;
export type QalmaCommandHandler = (
  state: Parameters<Command>[0],
  dispatch?: Parameters<Command>[1],
  view?: Parameters<Command>[2],
  value?: QalmaCommandValue,
) => boolean;

export interface QalmaPlugin {
  key: string;
  nodes?: Record<string, NodeSpec>;
  extendNodes?: (
    nodes: Readonly<Record<string, NodeSpec>>,
  ) => Record<string, NodeSpec>;
  marks?: Record<string, MarkSpec>;
  commands?: (schema: Schema) => Record<string, QalmaCommandHandler>;
  commandStates?: (schema: Schema) => Record<string, QalmaStateQuery>;
  queries?: (schema: Schema) => Record<string, QalmaQuery>;
  shortcuts?: (schema: Schema) => Record<string, Command>;
  prosemirrorPlugins?: (schema: Schema) => ProseMirrorPlugin[];
}

export interface ConfigurableQalmaPlugin<TOptions extends object>
  extends QalmaPlugin {
  readonly options: Readonly<TOptions>;
  configure(options?: Partial<TOptions>): ConfigurableQalmaPlugin<TOptions>;
}

// Tree-shaking note: the library ships as a single FESM, so a bundler cannot
// drop an unused `export const XPlugin = createQalmaPlugin(...)` unless the call
// is marked side-effect-free. Always prefix plugin/kit factory exports with
// the Rollup/Terser pure-call annotation before `createQalmaPlugin(...)`
// so editors that don't import a plugin don't pay for its code.
export function createQalmaPlugin(plugin: QalmaPlugin): QalmaPlugin {
  return plugin;
}

export function createConfigurableQalmaPlugin<TOptions extends object>(
  defaultOptions: Readonly<TOptions>,
  createPlugin: (options: Readonly<TOptions>) => QalmaPlugin,
  options: Partial<TOptions> = {},
): ConfigurableQalmaPlugin<TOptions> {
  const resolvedOptions = Object.freeze({
    ...defaultOptions,
    ...options,
  }) as Readonly<TOptions>;
  const plugin = createPlugin(resolvedOptions);

  return Object.assign(plugin, {
    options: resolvedOptions,
    configure(nextOptions: Partial<TOptions> = {}) {
      return createConfigurableQalmaPlugin(defaultOptions, createPlugin, {
        ...resolvedOptions,
        ...nextOptions,
      });
    },
  });
}
