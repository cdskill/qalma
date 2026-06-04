import {
  DOMParser,
  DOMSerializer,
  Node as ProseMirrorNode,
  Schema,
} from 'prosemirror-model';

export function parseHtmlDocument(
  html: string,
  schema: Schema,
): ProseMirrorNode {
  const container = document.createElement('div');
  container.innerHTML = html.trim() || '<p></p>';

  return DOMParser.fromSchema(schema).parse(container);
}

export function serializeHtmlDocument(
  doc: ProseMirrorNode,
  schema: Schema,
): string {
  const fragment = DOMSerializer.fromSchema(schema).serializeFragment(
    doc.content,
  );
  const container = document.createElement('div');

  container.appendChild(fragment);

  return container.innerHTML;
}
