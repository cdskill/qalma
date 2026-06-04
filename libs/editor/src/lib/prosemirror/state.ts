import { Schema } from 'prosemirror-model';
import { EditorState } from 'prosemirror-state';

import { RtePlugin } from '../plugins/rte-plugin';
import { parseHtmlDocument } from './html';
import { createBasePlugins } from './plugins';

interface RteStateOptions {
  html: string;
  plugins: readonly RtePlugin[];
  schema: Schema;
}

export function createRteState(options: RteStateOptions): EditorState {
  return EditorState.create({
    doc: parseHtmlDocument(options.html, options.schema),
    schema: options.schema,
    plugins: createBasePlugins(options.schema, options.plugins),
  });
}
