import { MarkSpec, NodeSpec, Schema } from 'prosemirror-model';
import {
  Command,
  EditorState,
  Plugin as ProseMirrorPlugin,
} from 'prosemirror-state';

export type RteStateQuery = (state: EditorState) => boolean;

export interface RtePlugin {
  key: string;
  nodes?: Record<string, NodeSpec>;
  marks?: Record<string, MarkSpec>;
  commands?: (schema: Schema) => Record<string, Command>;
  commandStates?: (schema: Schema) => Record<string, RteStateQuery>;
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
