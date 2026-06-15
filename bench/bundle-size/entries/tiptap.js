// Standard Tiptap editor (the engine behind ngx-tiptap).
// StarterKit covers paragraph/bold/italic/strike/headings/lists/blockquote/
// code/history/hard break; Link adds links — the equivalent feature set.
import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';

const editor = new Editor({
  content: '<p>hello</p>',
  extensions: [StarterKit, Link],
});

globalThis.__sink = editor;
