import { Plugin as ProseMirrorPlugin } from 'prosemirror-state';

import {
  QalmaPlugin,
  createConfigurableQalmaPlugin,
  createQalmaPlugin,
} from './qalma-plugin';

export interface QalmaFileHandlerEvent {
  files: readonly File[];
  position: number | null;
  html: string;
  text: string;
}

export type QalmaFileHandler = (event: QalmaFileHandlerEvent) => boolean | void;

export interface FileHandlerPluginOptions {
  allowedMimeTypes: readonly string[] | null;
  onPaste: QalmaFileHandler | null;
  onDrop: QalmaFileHandler | null;
}

export const FILE_HANDLER_PLUGIN_DEFAULT_OPTIONS: Readonly<FileHandlerPluginOptions> =
  /* @__PURE__ */ Object.freeze({
    allowedMimeTypes: null,
    onPaste: null,
    onDrop: null,
  });

export const FileHandlerPlugin = /* @__PURE__ */ createConfigurableQalmaPlugin(
  FILE_HANDLER_PLUGIN_DEFAULT_OPTIONS,
  (options) => {
    assertFileHandlerPluginOptions(options);

    return createQalmaPlugin({
      key: 'fileHandler',
      prosemirrorPlugins: () => [createFileHandlerProseMirrorPlugin(options)],
    });
  },
);

export const FileHandlerKit: readonly QalmaPlugin[] = [FileHandlerPlugin];

function createFileHandlerProseMirrorPlugin(
  options: Readonly<FileHandlerPluginOptions>,
): ProseMirrorPlugin {
  return new ProseMirrorPlugin({
    props: {
      handlePaste: (view, event) => {
        const files = acceptedFiles(
          Array.from(event.clipboardData?.files ?? []),
          options.allowedMimeTypes,
        );

        if (files.length === 0 || !options.onPaste) {
          return false;
        }

        return (
          options.onPaste({
            files,
            position: view.state.selection.from,
            html: event.clipboardData?.getData('text/html') ?? '',
            text: event.clipboardData?.getData('text/plain') ?? '',
          }) === true
        );
      },
      handleDrop: (view, event) => {
        const files = acceptedFiles(
          Array.from(event.dataTransfer?.files ?? []),
          options.allowedMimeTypes,
        );

        if (files.length === 0 || !options.onDrop) {
          return false;
        }

        const coordinates = view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        });

        return (
          options.onDrop({
            files,
            position: coordinates?.pos ?? null,
            html: event.dataTransfer?.getData('text/html') ?? '',
            text: event.dataTransfer?.getData('text/plain') ?? '',
          }) === true
        );
      },
    },
  });
}

function acceptedFiles(
  files: readonly File[],
  allowedMimeTypes: readonly string[] | null,
): File[] {
  if (allowedMimeTypes === null) {
    return [...files];
  }

  return files.filter((file) =>
    allowedMimeTypes.some((allowedType) =>
      mimeTypeMatches(file.type, allowedType),
    ),
  );
}

function mimeTypeMatches(mimeType: string, allowedType: string): boolean {
  if (allowedType.endsWith('/*')) {
    return mimeType.startsWith(allowedType.slice(0, -1));
  }

  return mimeType === allowedType;
}

function assertFileHandlerPluginOptions(
  options: Readonly<FileHandlerPluginOptions>,
): void {
  if (
    options.allowedMimeTypes !== null &&
    (!Array.isArray(options.allowedMimeTypes) ||
      options.allowedMimeTypes.some(
        (type) =>
          typeof type !== 'string' ||
          !/^[a-z0-9.+-]+\/(?:[a-z0-9.+-]+|\*)$/i.test(type),
      ))
  ) {
    throw new Error(
      'FileHandlerPlugin allowedMimeTypes must be null or valid MIME types such as "image/*".',
    );
  }

  if (options.onPaste !== null && typeof options.onPaste !== 'function') {
    throw new Error('FileHandlerPlugin onPaste must be null or a function.');
  }

  if (options.onDrop !== null && typeof options.onDrop !== 'function') {
    throw new Error('FileHandlerPlugin onDrop must be null or a function.');
  }
}
