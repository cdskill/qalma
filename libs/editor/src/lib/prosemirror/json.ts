import { Node as ProseMirrorNode, Schema } from 'prosemirror-model';

/**
 * The JSON representation of a Qalma document node, as produced by
 * ProseMirror's `Node.toJSON()`. This is the document engine's native,
 * lossless storage format — every node attribute and mark is preserved,
 * unlike HTML or Markdown serialization.
 */
export interface QalmaDocument {
  type: string;
  attrs?: Record<string, unknown>;
  content?: QalmaDocument[];
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
  text?: string;
  [key: string]: unknown;
}

export function serializeJsonDocument(doc: ProseMirrorNode): QalmaDocument {
  return doc.toJSON() as QalmaDocument;
}

export function parseJsonDocument(
  json: QalmaDocument,
  schema: Schema,
): ProseMirrorNode {
  return ProseMirrorNode.fromJSON(schema, json);
}
