// Minimal Qalma editor: bold, italic, underline, strike + history only.
// Illustrates the plugin-based floor — you ship only the plugins you import.
import {
  createQalmaEditor,
  TextFormattingKit,
  HistoryPlugin,
} from '@qalma/editor';

const editor = createQalmaEditor({
  content: '<p>hello</p>',
  plugins: [...TextFormattingKit, HistoryPlugin],
});

globalThis.__sink = editor;
