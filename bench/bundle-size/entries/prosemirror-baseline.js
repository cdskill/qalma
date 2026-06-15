// The raw ProseMirror engine floor that every ProseMirror-based editor
// (Qalma, ngx-editor, Tiptap) must ship before adding any features: the
// document model, editor state, view, base commands, keymap, history and
// list schema. This is the unavoidable baseline, not toolkit overhead.
import { EditorState } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { Schema } from 'prosemirror-model';
import { keymap } from 'prosemirror-keymap';
import { baseKeymap, toggleMark } from 'prosemirror-commands';
import { history, undo, redo } from 'prosemirror-history';
import { addListNodes } from 'prosemirror-schema-list';

const schema = new Schema({
  nodes: addListNodes(
    new Schema({
      nodes: {
        doc: { content: 'block+' },
        paragraph: { group: 'block', content: 'inline*' },
        text: { group: 'inline' },
      },
      marks: { strong: {}, em: {} },
    }).spec.nodes,
    'paragraph block*',
    'block',
  ),
  marks: { strong: {}, em: {} },
});

const state = EditorState.create({
  schema,
  plugins: [
    history(),
    keymap({ 'Mod-z': undo, 'Mod-y': redo, 'Mod-b': toggleMark(schema.marks.strong) }),
    keymap(baseKeymap),
  ],
});

globalThis.__sink = [EditorView, state, redo];
