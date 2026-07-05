import type { TemplateRef } from '@angular/core';

/**
 * A single command button in a toolbar registry: which editor command to run,
 * which icon to show, and its accessible label. `value` is forwarded to the
 * command as its payload when present.
 */
export interface ToolbarCommandItem {
  readonly command: string;
  readonly icon: string;
  readonly label: string;
  readonly value?: unknown;
}

/**
 * An escape hatch for controls that are not a plain command button (color
 * pickers, upload buttons, a language `<select>`…). The consumer supplies an
 * `<ng-template>` and the toolbar renders it inline at this position.
 */
export interface ToolbarTemplateItem {
  readonly template: TemplateRef<unknown>;
}

export type ToolbarItem = ToolbarCommandItem | ToolbarTemplateItem;

/** One separator-delimited run of items. Empty groups render nothing. */
export type ToolbarGroup = readonly ToolbarItem[];

export function isToolbarCommandItem(
  item: ToolbarItem,
): item is ToolbarCommandItem {
  return 'command' in item;
}

// ---------------------------------------------------------------------------
// Default command fragments — the declarative source of truth for the standard
// editor toolbar, reusable across consumers (playground, sandbox, downstream
// apps). Compose them into `ToolbarGroup[]` and hand them to
// `<qalma-toolbar-registry>`; interleave custom controls with `ToolbarTemplateItem`.
// ---------------------------------------------------------------------------

export const QALMA_TOOLBAR_HEADINGS: readonly ToolbarCommandItem[] = [
  { command: 'setParagraph', icon: 'lucidePilcrow', label: 'Paragraph' },
  { command: 'toggleHeading1', icon: 'lucideHeading1', label: 'Heading 1' },
  { command: 'toggleHeading2', icon: 'lucideHeading2', label: 'Heading 2' },
  { command: 'toggleHeading3', icon: 'lucideHeading3', label: 'Heading 3' },
];

export const QALMA_TOOLBAR_INLINE_MARKS: readonly ToolbarCommandItem[] = [
  { command: 'toggleBold', icon: 'lucideBold', label: 'Bold' },
  { command: 'toggleItalic', icon: 'lucideItalic', label: 'Italic' },
  { command: 'toggleUnderline', icon: 'lucideUnderline', label: 'Underline' },
  {
    command: 'toggleStrike',
    icon: 'lucideStrikethrough',
    label: 'Strikethrough',
  },
  { command: 'toggleInlineCode', icon: 'lucideCode', label: 'Inline code' },
  { command: 'toggleMonospace', icon: 'lucideLetterText', label: 'Monospace' },
  { command: 'toggleSubscript', icon: 'lucideSubscript', label: 'Subscript' },
  {
    command: 'toggleSuperscript',
    icon: 'lucideSuperscript',
    label: 'Superscript',
  },
];

export const QALMA_TOOLBAR_ALIGN: readonly ToolbarCommandItem[] = [
  { command: 'setTextAlignLeft', icon: 'lucideAlignLeft', label: 'Align left' },
  {
    command: 'setTextAlignCenter',
    icon: 'lucideAlignCenter',
    label: 'Align center',
  },
  {
    command: 'setTextAlignRight',
    icon: 'lucideAlignRight',
    label: 'Align right',
  },
  {
    command: 'setTextAlignJustify',
    icon: 'lucideAlignJustify',
    label: 'Justify',
  },
];

export const QALMA_TOOLBAR_LISTS: readonly ToolbarCommandItem[] = [
  { command: 'toggleBulletList', icon: 'lucideList', label: 'Bullet list' },
  {
    command: 'toggleOrderedList',
    icon: 'lucideListOrdered',
    label: 'Ordered list',
  },
  { command: 'toggleTaskList', icon: 'lucideListTodo', label: 'Task list' },
  { command: 'liftListItem', icon: 'lucideOutdent', label: 'Outdent' },
  { command: 'sinkListItem', icon: 'lucideIndent', label: 'Indent' },
  { command: 'toggleBlockquote', icon: 'lucideTextQuote', label: 'Blockquote' },
  { command: 'toggleCodeBlock', icon: 'lucideSquareCode', label: 'Code block' },
];

/** Always-available table entry point (inserting a new table). */
export const QALMA_TOOLBAR_TABLE_INSERT: ToolbarCommandItem = {
  command: 'insertTable',
  icon: 'lucideTable',
  label: 'Insert table',
};

/** Table editing commands — only meaningful while the selection is in a table. */
export const QALMA_TOOLBAR_TABLE_OPS: readonly ToolbarCommandItem[] = [
  {
    command: 'addRowAfter',
    icon: 'lucideBetweenHorizontalEnd',
    label: 'Add row',
  },
  {
    command: 'addColumnAfter',
    icon: 'lucideBetweenVerticalEnd',
    label: 'Add column',
  },
  { command: 'deleteRow', icon: 'lucideRows3', label: 'Delete row' },
  { command: 'deleteColumn', icon: 'lucideColumns3', label: 'Delete column' },
  {
    command: 'toggleHeaderRow',
    icon: 'lucideHeading',
    label: 'Toggle header row',
  },
  { command: 'deleteTable', icon: 'lucideTrash2', label: 'Delete table' },
];

export const QALMA_TOOLBAR_HISTORY: readonly ToolbarCommandItem[] = [
  { command: 'undo', icon: 'lucideUndo2', label: 'Undo' },
  { command: 'redo', icon: 'lucideRedo2', label: 'Redo' },
];

/** Standalone command that usually sits alongside the color controls. */
export const QALMA_TOOLBAR_CLEAR_FORMATTING: ToolbarCommandItem = {
  command: 'clearFormatting',
  icon: 'lucideEraser',
  label: 'Clear formatting',
};

/** Standalone command that usually sits alongside the link/insert controls. */
export const QALMA_TOOLBAR_UNSET_LINK: ToolbarCommandItem = {
  command: 'unsetLink',
  icon: 'lucideUnlink',
  label: 'Unlink',
};
