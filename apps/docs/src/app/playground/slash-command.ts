import { computed, signal } from '@angular/core';
import { QalmaEditorController, SlashCommandState } from '@qalma/editor';
import {
  KeyboardNavigableList,
  QalmaSlashCommandOption,
  SuggestionMenuPlacement,
  flipAbovePlacement,
} from '@qalma/kit';

const SLASH_COMMAND_MENU_WIDTH = 320;
const SLASH_COMMAND_MENU_MAX_HEIGHT = 360;
const SLASH_COMMAND_MENU_MARGIN = 12;
const SLASH_COMMAND_MENU_GAP = 8;
const SLASH_COMMAND_MENU_OPTION_HEIGHT = 44;
const SLASH_COMMAND_MENU_VERTICAL_PADDING = 76;

export const PLAYGROUND_SLASH_COMMAND_OPTIONS: readonly QalmaSlashCommandOption[] =
  [
    {
      id: 'paragraph',
      label: 'Text',
      description: 'Plain paragraph block',
      command: 'setParagraph',
      shortcut: 'T',
      icon: 'lucidePilcrow',
      keywords: ['paragraph', 'plain', 'text'],
    },
    {
      id: 'heading-1',
      label: 'Heading 1',
      description: 'Large section heading',
      command: 'toggleHeading1',
      shortcut: '#',
      icon: 'lucideHeading1',
      keywords: ['h1', 'title', 'heading'],
    },
    {
      id: 'heading-2',
      label: 'Heading 2',
      description: 'Medium section heading',
      command: 'toggleHeading2',
      shortcut: '##',
      icon: 'lucideHeading2',
      keywords: ['h2', 'subtitle', 'heading'],
    },
    {
      id: 'heading-3',
      label: 'Heading 3',
      description: 'Small section heading',
      command: 'toggleHeading3',
      shortcut: '###',
      icon: 'lucideHeading3',
      keywords: ['h3', 'heading'],
    },
    {
      id: 'bullet-list',
      label: 'Bullet list',
      description: 'Create a simple unordered list',
      command: 'toggleBulletList',
      shortcut: '-',
      icon: 'lucideList',
      keywords: ['ul', 'unordered', 'list'],
    },
    {
      id: 'ordered-list',
      label: 'Numbered list',
      description: 'Create a list with numbers',
      command: 'toggleOrderedList',
      shortcut: '1.',
      icon: 'lucideListOrdered',
      keywords: ['ol', 'ordered', 'number', 'list'],
    },
    {
      id: 'task-list',
      label: 'Task list',
      description: 'Track checked and unchecked items',
      command: 'toggleTaskList',
      shortcut: '[]',
      icon: 'lucideListTodo',
      keywords: ['task', 'todo', 'checklist', 'list'],
    },
    {
      id: 'blockquote',
      label: 'Quote',
      description: 'Capture a quoted passage',
      command: 'toggleBlockquote',
      shortcut: '>',
      icon: 'lucideTextQuote',
      keywords: ['blockquote', 'quote'],
    },
    {
      id: 'inline-code',
      label: 'Inline code',
      description: 'Format typed text as code',
      command: 'toggleInlineCode',
      placement: 'inline',
      shortcut: '`code`',
      icon: 'lucideCode',
      keywords: ['inline', 'code', 'mark'],
    },
    {
      id: 'code-block',
      label: 'Code block',
      description: 'Insert a syntax-highlighted block',
      command: 'toggleCodeBlock',
      shortcut: '```',
      icon: 'lucideSquareCode',
      keywords: ['pre', 'code', 'snippet'],
    },
    {
      id: 'horizontal-rule',
      label: 'Divider',
      description: 'Insert a horizontal rule',
      command: 'insertHorizontalRule',
      shortcut: '---',
      icon: 'lucideMinus',
      keywords: ['hr', 'divider', 'rule', 'separator'],
    },
    {
      id: 'table',
      label: 'Table',
      description: 'Insert a 3×3 table with a header row',
      command: 'insertTable',
      shortcut: '▦',
      icon: 'lucideTable',
      keywords: ['table', 'grid', 'rows', 'columns'],
    },
  ];

export class PlaygroundSlashCommandController {
  readonly slashCommand = signal<SlashCommandState | null>(null);
  readonly placement = signal<SuggestionMenuPlacement | null>(null);
  readonly options = signal<readonly QalmaSlashCommandOption[]>([]);
  readonly activeIndex = signal(0);
  readonly open = computed(
    () =>
      Boolean(this.slashCommand() && this.placement()) &&
      this.options().length > 0,
  );

  private readonly keyboardNav =
    new KeyboardNavigableList<QalmaSlashCommandOption>({
      items: () => this.options(),
      activeIndex: () => this.activeIndex(),
      setActiveIndex: (index) => this.activeIndex.set(index),
      onSelect: (option) => this.insert(option),
    });

  constructor(private readonly editor: QalmaEditorController) {}

  refresh(): void {
    const slashCommand = this.editor.query<SlashCommandState>('slashCommand');

    if (!slashCommand) {
      this.hide();

      return;
    }

    const options = filterSlashCommandOptions(slashCommand.query);
    const activeIndex = getNextActiveIndex(
      this.slashCommand(),
      slashCommand,
      this.activeIndex(),
    );

    this.slashCommand.set(slashCommand);
    this.options.set(options);
    this.activeIndex.set(
      Math.min(activeIndex, Math.max(0, options.length - 1)),
    );

    if (options.length === 0) {
      this.placement.set(null);

      return;
    }

    this.placement.set(
      createSlashCommandPlacement(this.editor, slashCommand.to, options.length),
    );
  }

  handleSlashCommandKeydown(event: Event): void {
    if (
      !(event instanceof CustomEvent) ||
      typeof event.detail?.key !== 'string'
    ) {
      return;
    }

    if (this.handleNavigationKey(event.detail.key)) {
      event.preventDefault();
    }
  }

  setActiveIndex(index: number): void {
    if (index >= 0 && index < this.options().length) {
      this.activeIndex.set(index);
    }
  }

  insert(option: QalmaSlashCommandOption): void {
    if (!this.editor.execute('deleteSlashCommand')) {
      return;
    }

    if (option.placement !== 'inline') {
      // Notion/Plate-style: the block renders on its own new line instead of
      // transforming the line the trigger was typed on. Empty blocks transform
      // in place (no split) to avoid leaving a stray blank line.
      if (this.isInList()) {
        // Keep the current item; split off a fresh one and lift it out of the list.
        this.editor.execute('splitListItem');

        for (let guard = 0; guard < 20 && this.isInList(); guard += 1) {
          if (!this.editor.execute('liftListItem')) {
            break;
          }
        }
      } else {
        this.editor.execute('splitSlashCommandBlock');
      }
    }

    this.editor.execute(option.command, option.value);
    this.hide();
  }

  dismiss(): void {
    this.editor.execute('dismissSlashCommand');
    this.hide();
  }

  hide(): void {
    this.slashCommand.set(null);
    this.placement.set(null);
    this.options.set([]);
    this.activeIndex.set(0);
  }

  private isInList(): boolean {
    return (
      this.editor.isCommandActive('toggleBulletList') ||
      this.editor.isCommandActive('toggleOrderedList') ||
      this.editor.isCommandActive('toggleTaskList')
    );
  }

  private handleNavigationKey(key: string): boolean {
    if (!this.open()) {
      return false;
    }

    if (key === 'Escape') {
      this.dismiss();

      return true;
    }

    if (key === 'Tab') {
      const option = this.options()[this.activeIndex()];

      if (option) {
        this.insert(option);

        return true;
      }

      return false;
    }

    return this.keyboardNav.handleKey(key);
  }
}

function filterSlashCommandOptions(
  query: string,
): readonly QalmaSlashCommandOption[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return PLAYGROUND_SLASH_COMMAND_OPTIONS;
  }

  return PLAYGROUND_SLASH_COMMAND_OPTIONS.filter((option) =>
    [option.label, option.description, ...option.keywords]
      .join(' ')
      .toLowerCase()
      .includes(normalizedQuery),
  );
}

function getNextActiveIndex(
  previous: SlashCommandState | null,
  next: SlashCommandState,
  currentIndex: number,
): number {
  return previous &&
    previous.from === next.from &&
    previous.to === next.to &&
    previous.query === next.query &&
    previous.trigger === next.trigger
    ? currentIndex
    : 0;
}

function createSlashCommandPlacement(
  editor: QalmaEditorController,
  position: number,
  optionCount: number,
): SuggestionMenuPlacement | null {
  const rect = editor.getCoordinatesAtPosition(position);

  if (!rect) {
    return null;
  }

  return flipAbovePlacement(rect, {
    width: SLASH_COMMAND_MENU_WIDTH,
    desiredHeight: getSlashCommandMenuHeight(optionCount),
    minHeight: SLASH_COMMAND_MENU_OPTION_HEIGHT,
    margin: SLASH_COMMAND_MENU_MARGIN,
    gap: SLASH_COMMAND_MENU_GAP,
  });
}

function getSlashCommandMenuHeight(optionCount: number): number {
  return Math.min(
    SLASH_COMMAND_MENU_MAX_HEIGHT,
    SLASH_COMMAND_MENU_VERTICAL_PADDING +
      Math.max(1, optionCount) * SLASH_COMMAND_MENU_OPTION_HEIGHT,
  );
}
