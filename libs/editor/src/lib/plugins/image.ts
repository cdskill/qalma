import { Node as ProseMirrorNode, NodeSpec, NodeType } from 'prosemirror-model';
import {
  EditorState,
  NodeSelection,
  Plugin as ProseMirrorPlugin,
} from 'prosemirror-state';

import {
  createConfigurableQalmaPlugin,
  createQalmaPlugin,
  QalmaCommandHandler,
  QalmaPlugin,
} from './qalma-plugin';

export interface ImageCommandValue {
  src: string;
  alt?: string | null;
  title?: string | null;
  previewSrc?: string | null;
}

export type ImageUpdateCommandValue = Partial<ImageCommandValue>;

export interface ImageState {
  from: number;
  to: number;
  src: string;
  alt: string;
  title: string | null;
  previewSrc: string | null;
}

export interface ImagePluginOptions {
  allowedProtocols: readonly string[];
  allowRelativeImages: boolean;
  defaultAlt: string;
}

export const IMAGE_PLUGIN_DEFAULT_OPTIONS: Readonly<ImagePluginOptions> =
  Object.freeze({
    allowedProtocols: Object.freeze(['http', 'https']),
    allowRelativeImages: true,
    defaultAlt: '',
  });

export const ImagePlugin = /* @__PURE__ */ createConfigurableQalmaPlugin(
  IMAGE_PLUGIN_DEFAULT_OPTIONS,
  (options) => {
    assertImagePluginOptions(options);

    const imageNode: NodeSpec = {
      attrs: {
        src: {},
        alt: { default: options.defaultAlt },
        title: { default: null },
        previewSrc: { default: null },
      },
      atom: true,
      draggable: true,
      inline: true,
      group: 'inline',
      parseDOM: [
        {
          tag: 'img[src]',
          getAttrs: (node) => {
            if (!(node instanceof HTMLElement)) {
              return false;
            }

            const src = normalizeImageSrc(node.getAttribute('src'), options);

            if (!src) {
              return false;
            }

            return {
              src,
              alt: normalizeAlt(node.getAttribute('alt') ?? options.defaultAlt),
              title: normalizeTitle(node.getAttribute('title')),
              previewSrc: null,
            };
          },
        },
      ],
      selectable: true,
      toDOM: (node) => {
        const attrs: Record<string, string> = {
          src: node.attrs['src'],
          alt: normalizeAlt(node.attrs['alt']),
        };
        const title = normalizeTitle(node.attrs['title']);

        if (title) {
          attrs['title'] = title;
        }

        return ['img', attrs];
      },
    };

    return createQalmaPlugin({
      key: 'image',
      nodes: {
        image: imageNode,
      },
      commands: (schema) => ({
        insertImage: createInsertImageCommand(schema.nodes['image'], options),
        updateImage: createUpdateImageCommand(schema.nodes['image'], options),
        removeImage: createRemoveImageCommand(schema.nodes['image']),
      }),
      commandStates: (schema) => ({
        insertImage: (state) =>
          Boolean(getSelectedImage(state, schema.nodes['image'])),
      }),
      queries: (schema) => ({
        image: (state) => getImageState(state, schema.nodes['image']),
      }),
      prosemirrorPlugins: () => [createImagePreviewPlugin()],
    });
  },
);

export const ImageKit: readonly QalmaPlugin[] = [ImagePlugin];

function createInsertImageCommand(
  image: NodeType,
  options: Readonly<ImagePluginOptions>,
): QalmaCommandHandler {
  return (state, dispatch, _view, value) => {
    const attrs = resolveImageAttrs(value, options);

    if (!attrs || !canReplaceSelectionWithImage(state, image)) {
      return false;
    }

    if (dispatch) {
      const imageNode = image.create(attrs);
      const transaction = state.tr.replaceSelectionWith(imageNode, false);
      const insertedPosition = transaction.selection.from - imageNode.nodeSize;

      if (transaction.doc.nodeAt(insertedPosition)?.type === image) {
        transaction.setSelection(
          NodeSelection.create(transaction.doc, insertedPosition),
        );
      }

      dispatch(transaction.scrollIntoView());
    }

    return true;
  };
}

function createUpdateImageCommand(
  image: NodeType,
  options: Readonly<ImagePluginOptions>,
): QalmaCommandHandler {
  return (state, dispatch, _view, value) => {
    const selectedImage = getSelectedImage(state, image);
    const attrs = resolveImageAttrs(
      {
        ...selectedImage?.node.attrs,
        ...resolveImageUpdateValue(value),
      },
      options,
    );

    if (!selectedImage || !attrs) {
      return false;
    }

    if (dispatch) {
      const transaction = state.tr.setNodeMarkup(
        selectedImage.from,
        image,
        attrs,
      );

      dispatch(
        transaction
          .setSelection(NodeSelection.create(transaction.doc, selectedImage.from))
          .scrollIntoView(),
      );
    }

    return true;
  };
}

function createRemoveImageCommand(image: NodeType): QalmaCommandHandler {
  return (state, dispatch) => {
    const selectedImage = getSelectedImage(state, image);

    if (!selectedImage) {
      return false;
    }

    if (dispatch) {
      dispatch(
        state.tr.delete(selectedImage.from, selectedImage.to).scrollIntoView(),
      );
    }

    return true;
  };
}

interface SelectedImage {
  node: ProseMirrorNode;
  from: number;
  to: number;
}

function getSelectedImage(
  state: EditorState,
  image: NodeType,
): SelectedImage | null {
  const { selection } = state;

  if (!(selection instanceof NodeSelection) || selection.node.type !== image) {
    return null;
  }

  return {
    node: selection.node,
    from: selection.from,
    to: selection.to,
  };
}

function getImageState(state: EditorState, image: NodeType): ImageState | null {
  const selectedImage = getSelectedImage(state, image);

  return selectedImage
    ? {
        from: selectedImage.from,
        to: selectedImage.to,
        src: selectedImage.node.attrs['src'],
        alt: normalizeAlt(selectedImage.node.attrs['alt']),
        title: normalizeTitle(selectedImage.node.attrs['title']),
        previewSrc: normalizePreviewSrc(selectedImage.node.attrs['previewSrc']),
      }
    : null;
}

function canReplaceSelectionWithImage(
  state: EditorState,
  image: NodeType,
): boolean {
  const { $from } = state.selection;

  for (let depth = $from.depth; depth >= 0; depth--) {
    const index = $from.index(depth);

    if ($from.node(depth).canReplaceWith(index, index, image)) {
      return true;
    }
  }

  return false;
}

function resolveImageAttrs(
  value: unknown,
  options: Readonly<ImagePluginOptions>,
): ImageCommandValue | null {
  const rawValue =
    typeof value === 'string'
      ? { src: value }
      : isImageCommandValue(value)
        ? value
        : null;

  if (!rawValue) {
    return null;
  }

  const src = normalizeImageSrc(rawValue.src, options);

  if (!src) {
    return null;
  }

  return {
    src,
    alt: normalizeAlt(rawValue.alt ?? options.defaultAlt),
    title: normalizeTitle(rawValue.title),
    previewSrc: normalizePreviewSrc(rawValue.previewSrc),
  };
}

function normalizeImageSrc(
  value: string | null | undefined,
  options: Readonly<ImagePluginOptions>,
): string | null {
  const src = value?.trim();

  if (!src) {
    return null;
  }

  const protocol = src.match(/^([a-z][a-z0-9+.-]*):/i)?.[1].toLowerCase();

  if (!protocol) {
    return options.allowRelativeImages && !src.startsWith('//') ? src : null;
  }

  return options.allowedProtocols.includes(protocol) ? src : null;
}

function normalizeAlt(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeTitle(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  return value.trim() || null;
}

function normalizePreviewSrc(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const src = value.trim();

  if (!src) {
    return null;
  }

  return src.startsWith('blob:') || /^data:image\//i.test(src) ? src : null;
}

function isImageCommandValue(value: unknown): value is ImageCommandValue {
  return (
    typeof value === 'object' &&
    value !== null &&
    'src' in value &&
    typeof value.src === 'string'
  );
}

function createImagePreviewPlugin(): ProseMirrorPlugin {
  return new ProseMirrorPlugin({
    props: {
      nodeViews: {
        image: (node) => {
          return new ImageNodeView(node);
        },
      },
    },
  });
}

class ImageNodeView {
  readonly dom = document.createElement('img');

  constructor(private node: ProseMirrorNode) {
    this.render();
  }

  update(node: ProseMirrorNode): boolean {
    if (node.type !== this.node.type) {
      return false;
    }

    this.node = node;
    this.render();

    return true;
  }

  private render(): void {
    const src =
      normalizePreviewSrc(this.node.attrs['previewSrc']) ??
      this.node.attrs['src'];
    const title = normalizeTitle(this.node.attrs['title']);

    this.dom.src = src;
    this.dom.alt = normalizeAlt(this.node.attrs['alt']);

    if (title) {
      this.dom.title = title;
    } else {
      this.dom.removeAttribute('title');
    }
  }
}

function resolveImageUpdateValue(value: unknown): ImageUpdateCommandValue {
  if (typeof value === 'string') {
    return { src: value };
  }

  return typeof value === 'object' && value !== null ? value : {};
}

function assertImagePluginOptions(options: Readonly<ImagePluginOptions>): void {
  if (!Array.isArray(options.allowedProtocols)) {
    throw new TypeError('ImagePlugin allowedProtocols must be an array.');
  }

  if (options.allowedProtocols.length === 0) {
    throw new RangeError(
      'ImagePlugin allowedProtocols must include at least one protocol.',
    );
  }

  const seen = new Set<string>();

  for (const protocol of options.allowedProtocols) {
    if (typeof protocol !== 'string' || !/^[a-z][a-z0-9+.-]*$/.test(protocol)) {
      throw new TypeError(
        'ImagePlugin allowedProtocols entries must be protocol names without colons.',
      );
    }

    if (seen.has(protocol)) {
      throw new Error('ImagePlugin allowedProtocols entries must be unique.');
    }

    seen.add(protocol);
  }

  if (typeof options.allowRelativeImages !== 'boolean') {
    throw new TypeError('ImagePlugin allowRelativeImages must be a boolean.');
  }

  if (typeof options.defaultAlt !== 'string') {
    throw new TypeError('ImagePlugin defaultAlt must be a string.');
  }
}
