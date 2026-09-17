import {
  BlockquotePlugin,
  ClearFormattingPlugin,
  CodeBlockPlugin,
  HardBreakPlugin,
  HeadingsPlugin,
  HistoryPlugin,
  HorizontalRulePlugin,
  InlineCodePlugin,
  LinkPlugin,
  ListsPlugin,
  PasteRulesPlugin,
  QalmaPlugin,
  TextFormattingKit,
  TrailingParagraphPlugin,
} from '@qalma/editor';

/**
 * A practical, UI-agnostic baseline for article and note editors. This lives
 * in a secondary entrypoint so the composite imports never retain plugins in
 * consumers that do not opt into the kit.
 */
export const EssentialsKit: readonly QalmaPlugin[] = [
  HeadingsPlugin,
  ...TextFormattingKit,
  InlineCodePlugin,
  BlockquotePlugin,
  ListsPlugin,
  CodeBlockPlugin,
  HorizontalRulePlugin,
  HardBreakPlugin,
  LinkPlugin,
  HistoryPlugin,
  ClearFormattingPlugin,
  PasteRulesPlugin,
  TrailingParagraphPlugin,
];
