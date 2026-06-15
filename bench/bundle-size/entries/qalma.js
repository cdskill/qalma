// Standard editor built from @qalma/editor's public API.
// Features: bold, italic, underline, strike, headings, bullet/ordered lists,
// blockquote, link, history (undo/redo), hard break.
import {
  createQalmaEditor,
  TextFormattingKit,
  HeadingsPlugin,
  ListsPlugin,
  BlockquotePlugin,
  CodeBlockPlugin,
  LinkPlugin,
  HistoryPlugin,
  HardBreakPlugin,
} from '@qalma/editor';

const editor = createQalmaEditor({
  content: '<p>hello</p>',
  plugins: [
    ...TextFormattingKit,
    HeadingsPlugin,
    ListsPlugin,
    BlockquotePlugin,
    CodeBlockPlugin,
    LinkPlugin,
    HistoryPlugin,
    HardBreakPlugin,
  ],
});

// Keep every import reachable so nothing is tree-shaken as dead code.
globalThis.__sink = editor;
