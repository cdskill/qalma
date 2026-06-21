/**
 * Metadata for every example on the `/examples` page. The page renders the live
 * demo via `@switch` (one editor mounted at a time) and feeds `recipe` to the
 * code panel. Add an entry here + a `@case` in the page to grow the showcase.
 */
export type ExampleId =
  | 'comment-box'
  | 'mail-box'
  | 'notion-doc'
  | 'markdown-notes';

export interface ExampleMeta {
  readonly id: ExampleId;
  readonly title: string;
  readonly tagline: string;
  /** ng-icon (lucide) name, provided by the page. */
  readonly icon: string;
  readonly recipe: string;
}

const COMMENT_BOX_RECIPE = `import {
  createQalmaEditor,
  TextFormattingKit,
  InlineCodePlugin,
  LinkPlugin,
  ListsPlugin,
  MentionPlugin,
  PlaceholderPlugin,
  HardBreakPlugin,
  PasteRulesPlugin,
  HistoryPlugin,
} from '@qalma/editor';

// A comment box = the editor with a small, focused plugin subset.
const editor = createQalmaEditor({
  plugins: [
    ...TextFormattingKit,          // bold, italic, strike, underline
    InlineCodePlugin,
    LinkPlugin,
    ListsPlugin,
    MentionPlugin.configure({ trigger: '@' }),
    PlaceholderPlugin.configure({ placeholder: 'Write a comment…' }),
    HardBreakPlugin,
    PasteRulesPlugin,
    HistoryPlugin,
  ],
});

// A compact toolbar binds buttons to commands declaratively:
// <qalma-editor [editor]="editor">
//   <qalma-toolbar>
//     <button qalmaCommand="toggleBold">B</button>
//     <button qalmaCommand="toggleItalic">I</button>
//     <button qalmaCommand="toggleInlineCode">‹›</button>
//     <button qalmaCommand="toggleBulletList">•</button>
//   </qalma-toolbar>
//   <qalma-content />
// </qalma-editor>`;

const MAIL_BOX_RECIPE = `import {
  createQalmaEditor,
  TextFormattingKit,
  LinkPlugin,
  ListsPlugin,
  TextAlignPlugin,
  HorizontalRulePlugin,
  HardBreakPlugin,
  PasteRulesPlugin,
  PlaceholderPlugin,
  HistoryPlugin,
} from '@qalma/editor';

// An email composer: the formatting an email actually needs.
const editor = createQalmaEditor({
  plugins: [
    ...TextFormattingKit,          // bold, italic, underline, strike
    LinkPlugin,
    ListsPlugin,
    TextAlignPlugin,               // left / center / right
    HorizontalRulePlugin,          // signature divider
    HardBreakPlugin,
    PasteRulesPlugin,
    PlaceholderPlugin.configure({ placeholder: 'Write your message…' }),
    HistoryPlugin,
  ],
});

// On send, hand the HTML payload to your mail API:
const html = editor.html();`;

const NOTION_DOC_RECIPE = `import {
  createQalmaEditor,
  HeadingsPlugin,
  TextFormattingKit,
  InlineCodePlugin,
  LinkPlugin,
  ListsPlugin,
  TaskListPlugin,
  BlockquotePlugin,
  HorizontalRulePlugin,
  TablePlugin,
  CodeBlockPlugin,
  SlashCommandPlugin,
  DragHandlePlugin,
  SelectionPlugin,
  HardBreakPlugin,
  PasteRulesPlugin,
  PlaceholderPlugin,
  HistoryPlugin,
  TrailingParagraphPlugin,
} from '@qalma/editor';

// No toolbar — composition happens through a slash menu and a drag handle.
const editor = createQalmaEditor({
  plugins: [
    HeadingsPlugin,
    ...TextFormattingKit,
    InlineCodePlugin,
    LinkPlugin,
    ListsPlugin,
    TaskListPlugin,
    BlockquotePlugin,
    HorizontalRulePlugin,
    TablePlugin,
    CodeBlockPlugin,
    SlashCommandPlugin,   // type "/" to insert blocks
    DragHandlePlugin,     // drag blocks by the left handle
    SelectionPlugin,
    HardBreakPlugin,
    PasteRulesPlugin,
    PlaceholderPlugin.configure({ placeholder: "Type '/' for blocks…" }),
    HistoryPlugin,
    TrailingParagraphPlugin,
  ],
});`;

const MARKDOWN_NOTES_RECIPE = `import {
  createQalmaEditor,
  HeadingsPlugin,
  ListsPlugin,
  TaskListPlugin,
  BlockquotePlugin,
  CodeBlockPlugin,
  HorizontalRulePlugin,
  TextFormattingKit,
  InlineCodePlugin,
  LinkPlugin,
  HardBreakPlugin,
  PasteRulesPlugin,
  PlaceholderPlugin,
  HistoryPlugin,
  TrailingParagraphPlugin,
} from '@qalma/editor';

// Plugins ship Markdown input rules by default: typing '# ', '- ', '> '
// or **bold** transforms live as you type.
const editor = createQalmaEditor({
  plugins: [
    HeadingsPlugin,
    ListsPlugin,
    TaskListPlugin,
    BlockquotePlugin,
    CodeBlockPlugin,
    HorizontalRulePlugin,
    ...TextFormattingKit,
    InlineCodePlugin,
    LinkPlugin,
    HardBreakPlugin,
    PasteRulesPlugin,
    PlaceholderPlugin.configure({ placeholder: 'Start typing Markdown…' }),
    HistoryPlugin,
    TrailingParagraphPlugin,
  ],
});

// The vendored serializer round-trips straight back to Markdown:
const md = editor.getMarkdown();`;

export const EXAMPLES: readonly ExampleMeta[] = [
  {
    id: 'comment-box',
    title: 'Comment box',
    tagline: 'Compact toolbar, @mentions',
    icon: 'lucideMessageSquare',
    recipe: COMMENT_BOX_RECIPE,
  },
  {
    id: 'mail-box',
    title: 'Email composer',
    tagline: 'Formatting, alignment, links',
    icon: 'lucideMail',
    recipe: MAIL_BOX_RECIPE,
  },
  {
    id: 'notion-doc',
    title: 'Block document',
    tagline: 'Slash menu, drag handle',
    icon: 'lucideLayoutDashboard',
    recipe: NOTION_DOC_RECIPE,
  },
  {
    id: 'markdown-notes',
    title: 'Markdown notes',
    tagline: 'Input rules, live output',
    icon: 'lucideFileText',
    recipe: MARKDOWN_NOTES_RECIPE,
  },
];
