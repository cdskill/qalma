import { Node as ProseMirrorNode, Schema } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

import { QalmaPlugin } from '../plugins/qalma-plugin';
import { parseHtmlDocument } from './html';
import { createBasePlugins } from './plugins';

interface QalmaStateOptions {
  /** Seed the state from an already-parsed document. Takes precedence. */
  doc?: ProseMirrorNode;
  /** Seed the state by parsing an HTML string. Used when `doc` is absent. */
  html?: string;
  plugins: readonly QalmaPlugin[];
  schema: Schema;
}

export function createQalmaState(options: QalmaStateOptions): EditorState {
  const doc =
    options.doc ?? parseHtmlDocument(options.html ?? '<p></p>', options.schema);

  return EditorState.create({
    doc,
    schema: options.schema,
    plugins: createBasePlugins(options.schema, options.plugins),
  });
}
