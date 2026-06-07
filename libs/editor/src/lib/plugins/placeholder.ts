import { Node as ProseMirrorNode } from 'prosemirror-model';
import { Plugin as ProseMirrorPlugin } from 'prosemirror-state';
import { Decoration, DecorationSet } from 'prosemirror-view';

import {
  createConfigurableRtePlugin,
  createRtePlugin,
  RtePlugin,
} from './rte-plugin';

export interface PlaceholderPluginOptions {
  placeholder: string;
  className: string;
}

export const PLACEHOLDER_PLUGIN_DEFAULT_OPTIONS: Readonly<PlaceholderPluginOptions> =
  Object.freeze({
    placeholder: 'Write something...',
    className: 'rte-placeholder',
  });

export const PlaceholderPlugin = createConfigurableRtePlugin(
  PLACEHOLDER_PLUGIN_DEFAULT_OPTIONS,
  (options) => {
    assertPlaceholderPluginOptions(options);

    return createRtePlugin({
      key: 'placeholder',
      prosemirrorPlugins: () => [createPlaceholderProseMirrorPlugin(options)],
    });
  },
);

export const PlaceholderKit: readonly RtePlugin[] = [PlaceholderPlugin];

function createPlaceholderProseMirrorPlugin(
  options: Readonly<PlaceholderPluginOptions>,
): ProseMirrorPlugin {
  return new ProseMirrorPlugin({
    props: {
      decorations: (state) => {
        const target = getPlaceholderTarget(state.doc);

        if (!target) {
          return DecorationSet.empty;
        }

        return DecorationSet.create(state.doc, [
          Decoration.node(target.from, target.to, {
            class: options.className,
            'data-placeholder': options.placeholder,
          }),
        ]);
      },
    },
  });
}

interface PlaceholderTarget {
  from: number;
  to: number;
}

function getPlaceholderTarget(
  doc: ProseMirrorNode,
): PlaceholderTarget | null {
  if (doc.childCount !== 1) {
    return null;
  }

  const node = doc.child(0);

  if (!node.isTextblock || node.content.size > 0) {
    return null;
  }

  return {
    from: 0,
    to: node.nodeSize,
  };
}

function assertPlaceholderPluginOptions(
  options: Readonly<PlaceholderPluginOptions>,
): void {
  if (
    typeof options.placeholder !== 'string' ||
    options.placeholder.trim().length === 0
  ) {
    throw new Error(
      'PlaceholderPlugin placeholder must be a non-empty string.',
    );
  }

  if (
    typeof options.className !== 'string' ||
    options.className.trim().length === 0 ||
    /\s/.test(options.className)
  ) {
    throw new Error(
      'PlaceholderPlugin className must be a non-empty CSS class name.',
    );
  }
}
