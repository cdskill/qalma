import { MarkSpec, NodeSpec, Schema } from 'prosemirror-model';
import {
  Command,
  EditorState,
  Plugin as ProseMirrorPlugin,
} from 'prosemirror-state';

export type RteStateQuery = (state: EditorState) => boolean;
export type RteQuery<TValue = unknown> = (state: EditorState) => TValue;
export type RteCommandValue = unknown;
export type RteCommandHandler = (
  state: Parameters<Command>[0],
  dispatch?: Parameters<Command>[1],
  view?: Parameters<Command>[2],
  value?: RteCommandValue,
) => boolean;

export interface RtePlugin {
  key: string;
  nodes?: Record<string, NodeSpec>;
  marks?: Record<string, MarkSpec>;
  commands?: (schema: Schema) => Record<string, RteCommandHandler>;
  commandStates?: (schema: Schema) => Record<string, RteStateQuery>;
  queries?: (schema: Schema) => Record<string, RteQuery>;
  shortcuts?: (schema: Schema) => Record<string, Command>;
  prosemirrorPlugins?: (schema: Schema) => ProseMirrorPlugin[];
}

export interface ConfigurableRtePlugin<TOptions extends object>
  extends RtePlugin {
  readonly options: Readonly<TOptions>;
  configure(options?: Partial<TOptions>): ConfigurableRtePlugin<TOptions>;
}

export function createRtePlugin(plugin: RtePlugin): RtePlugin {
  return plugin;
}

export function createConfigurableRtePlugin<TOptions extends object>(
  defaultOptions: Readonly<TOptions>,
  createPlugin: (options: Readonly<TOptions>) => RtePlugin,
  options: Partial<TOptions> = {},
): ConfigurableRtePlugin<TOptions> {
  const resolvedOptions = Object.freeze({
    ...defaultOptions,
    ...options,
  }) as Readonly<TOptions>;
  const plugin = createPlugin(resolvedOptions);

  return Object.assign(plugin, {
    options: resolvedOptions,
    configure(nextOptions: Partial<TOptions> = {}) {
      return createConfigurableRtePlugin(defaultOptions, createPlugin, {
        ...resolvedOptions,
        ...nextOptions,
      });
    },
  });
}
