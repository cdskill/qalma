import { computed, signal } from '@angular/core';
import {
  QalmaCommandValue,
  QalmaEditorController,
  SlashCommandState,
} from '@qalma/editor';

export interface SandboxSlashCommandOption {
  id: string;
  label: string;
  description: string;
  command: string;
  value?: QalmaCommandValue;
  shortcut: string;
  icon: string;
  keywords: readonly string[];
}

export interface SandboxSlashCommandPlacement {
  left: number;
  top: number | null;
  bottom: number | null;
  maxHeight: number;
}

const SLASH_COMMAND_MENU_WIDTH = 376;
const SLASH_COMMAND_MENU_MAX_HEIGHT = 372;
const SLASH_COMMAND_MENU_MARGIN = 12;
const SLASH_COMMAND_MENU_GAP = 8;
const SLASH_COMMAND_MENU_OPTION_HEIGHT = 40;
const SLASH_COMMAND_MENU_VERTICAL_PADDING = 88;

export const SANDBOX_SLASH_COMMAND_OPTIONS: readonly SandboxSlashCommandOption[] =
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
      id: 'blockquote',
      label: 'Quote',
      description: 'Capture a quoted passage',
      command: 'toggleBlockquote',
      shortcut: '>',
      icon: 'lucideTextQuote',
      keywords: ['blockquote', 'quote'],
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
  ];

export class SandboxSlashCommandController {
  readonly slashCommand = signal<SlashCommandState | null>(null);
  readonly placement = signal<SandboxSlashCommandPlacement | null>(null);
  readonly options = signal<readonly SandboxSlashCommandOption[]>([]);
  readonly activeIndex = signal(0);
  readonly open = computed(
    () =>
      Boolean(this.slashCommand() && this.placement()) &&
      this.options().length > 0,
  );

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
    this.placement.set(createSlashCommandPlacement(options.length));
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

  handleEditorKeydown(event: KeyboardEvent): void {
    if (this.handleNavigationKey(event.key)) {
      event.preventDefault();
    }
  }

  setActiveIndex(index: number): void {
    if (index >= 0 && index < this.options().length) {
      this.activeIndex.set(index);
    }
  }

  insert(option: SandboxSlashCommandOption): void {
    if (!this.editor.execute('deleteSlashCommand')) {
      return;
    }

    // Notion/Plate-style: the block renders on its own new line instead of
    // transforming the line the trigger was typed on. Empty blocks transform in
    // place (no split) to avoid leaving a stray blank line.
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

    this.editor.execute(option.command, option.value);
    this.hide();
  }

  private isInList(): boolean {
    return (
      this.editor.isCommandActive('toggleBulletList') ||
      this.editor.isCommandActive('toggleOrderedList')
    );
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

  private handleNavigationKey(key: string): boolean {
    if (!this.open()) {
      return false;
    }

    if (key === 'Escape') {
      this.dismiss();

      return true;
    }

    if (key === 'ArrowDown') {
      this.moveActiveOption(1);

      return true;
    }

    if (key === 'ArrowUp') {
      this.moveActiveOption(-1);

      return true;
    }

    if (key === 'Enter' || key === 'Tab') {
      const option = this.options()[this.activeIndex()];

      if (option) {
        this.insert(option);

        return true;
      }
    }

    return false;
  }

  private moveActiveOption(delta: number): void {
    const length = this.options().length;

    if (length === 0) {
      return;
    }

    this.activeIndex.update((index) => (index + delta + length) % length);
  }
}

function filterSlashCommandOptions(
  query: string,
): readonly SandboxSlashCommandOption[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return SANDBOX_SLASH_COMMAND_OPTIONS;
  }

  return SANDBOX_SLASH_COMMAND_OPTIONS.filter((option) =>
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
  optionCount: number,
): SandboxSlashCommandPlacement | null {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0).cloneRange();
  const rect = getRangeRect(range);

  if (!rect) {
    return null;
  }

  const desiredHeight = getSlashCommandMenuHeight(optionCount);
  const availableBelow =
    window.innerHeight - rect.bottom - SLASH_COMMAND_MENU_MARGIN;
  const availableAbove = rect.top - SLASH_COMMAND_MENU_MARGIN;
  const openAbove =
    availableBelow < desiredHeight && availableAbove > availableBelow;
  const availableHeight = Math.max(
    SLASH_COMMAND_MENU_OPTION_HEIGHT,
    openAbove
      ? availableAbove - SLASH_COMMAND_MENU_GAP
      : availableBelow - SLASH_COMMAND_MENU_GAP,
  );
  const maxHeight = Math.min(desiredHeight, availableHeight);
  const leftBoundary = Math.max(
    SLASH_COMMAND_MENU_MARGIN,
    window.innerWidth - SLASH_COMMAND_MENU_WIDTH - SLASH_COMMAND_MENU_MARGIN,
  );

  return {
    left: Math.min(
      Math.max(rect.left, SLASH_COMMAND_MENU_MARGIN),
      leftBoundary,
    ),
    top: openAbove ? null : rect.bottom + SLASH_COMMAND_MENU_GAP,
    bottom: openAbove
      ? window.innerHeight - rect.top + SLASH_COMMAND_MENU_GAP
      : null,
    maxHeight,
  };
}

function getSlashCommandMenuHeight(optionCount: number): number {
  return Math.min(
    SLASH_COMMAND_MENU_MAX_HEIGHT,
    SLASH_COMMAND_MENU_VERTICAL_PADDING +
      Math.max(1, optionCount) * SLASH_COMMAND_MENU_OPTION_HEIGHT,
  );
}

function getRangeRect(range: Range): DOMRect | null {
  const rect = range.getBoundingClientRect();

  if (rect.width > 0 || rect.height > 0) {
    return rect;
  }

  const clientRect = range.getClientRects()[0];

  if (clientRect) {
    return clientRect;
  }

  if (!range.collapsed) {
    return null;
  }

  const marker = document.createElement('span');

  marker.textContent = '\u200b';
  marker.style.cssText =
    'display:inline-block;width:0;height:1em;overflow:hidden;';
  range.insertNode(marker);

  const markerRect = marker.getBoundingClientRect();

  marker.remove();

  return markerRect.width > 0 || markerRect.height > 0 ? markerRect : null;
}
