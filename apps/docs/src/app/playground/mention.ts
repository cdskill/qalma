import { computed, signal } from '@angular/core';
import {
  MentionCommandValue,
  MentionState,
  QalmaEditorController,
} from '@qalma/editor';
import {
  KeyboardNavigableList,
  QalmaMentionOption,
  SuggestionMenuPlacement,
  flipAbovePlacement,
} from '@qalma/kit';

export type PlaygroundMentionSource =
  | {
      kind: 'eager';
      items: readonly QalmaMentionOption[];
    }
  | {
      kind: 'lazy';
      load: (
        mention: MentionState,
      ) =>
        | readonly QalmaMentionOption[]
        | Promise<readonly QalmaMentionOption[]>;
    };

const MENTION_MENU_WIDTH = 280;
const MENTION_MENU_MAX_HEIGHT = 320;
const MENTION_MENU_MARGIN = 12;
const MENTION_MENU_GAP = 8;
const MENTION_MENU_OPTION_HEIGHT = 56;
const MENTION_MENU_VERTICAL_PADDING = 12;
const MENTION_MENU_LOADING_HEIGHT = 44;

const PLAYGROUND_MENTION_OPTIONS: readonly QalmaMentionOption[] = [
  {
    id: 'ada-lovelace',
    label: 'Ada Lovelace',
    description: 'Mathematical collaborator',
  },
  {
    id: 'grace-hopper',
    label: 'Grace Hopper',
    description: 'Compiler pioneer',
  },
  {
    id: 'katherine-johnson',
    label: 'Katherine Johnson',
    description: 'Orbital mechanics expert',
  },
  {
    id: 'margaret-hamilton',
    label: 'Margaret Hamilton',
    description: 'Apollo software lead',
  },
  {
    id: 'radia-perlman',
    label: 'Radia Perlman',
    description: 'Network protocol designer',
  },
];

export function createPlaygroundMentionSource(
  mode: 'eager' | 'lazy',
): PlaygroundMentionSource {
  return mode === 'eager'
    ? {
        kind: 'eager',
        items: PLAYGROUND_MENTION_OPTIONS,
      }
    : {
        kind: 'lazy',
        load: async (mention) =>
          filterMentionOptions(PLAYGROUND_MENTION_OPTIONS, mention.query),
      };
}

export class PlaygroundMentionController {
  readonly mention = signal<MentionState | null>(null);
  readonly placement = signal<SuggestionMenuPlacement | null>(null);
  readonly suggestions = signal<readonly QalmaMentionOption[]>([]);
  readonly loading = signal(false);
  readonly activeIndex = signal(0);
  readonly open = computed(
    () =>
      Boolean(this.mention() && this.placement()) &&
      (this.loading() || this.suggestions().length > 0),
  );

  private requestId = 0;
  private readonly keyboardNav = new KeyboardNavigableList<QalmaMentionOption>(
    {
      items: () => this.suggestions(),
      activeIndex: () => this.activeIndex(),
      setActiveIndex: (index) => this.activeIndex.set(index),
      onSelect: (option) => this.insert(option),
    },
  );

  constructor(
    private readonly editor: QalmaEditorController,
    private readonly source: PlaygroundMentionSource,
  ) {}

  refresh(): void {
    const mention = this.editor.query<MentionState>('mention');

    if (!mention) {
      this.hide();

      return;
    }

    const requestId = ++this.requestId;
    const result = resolveMentionSource(this.source, mention);
    const activeIndex = getNextActiveIndex(
      this.mention(),
      mention,
      this.activeIndex(),
    );

    this.mention.set(mention);
    this.activeIndex.set(activeIndex);

    if (isPromiseLike(result)) {
      this.placement.set(createMentionPlacement(1, true));
      this.loading.set(true);
      result.then((suggestions) => {
        if (requestId !== this.requestId) {
          return;
        }

        this.suggestions.set(suggestions);
        this.activeIndex.set(
          Math.min(this.activeIndex(), Math.max(0, suggestions.length - 1)),
        );
        this.placement.set(createMentionPlacement(suggestions.length));
        this.loading.set(false);
      });

      return;
    }

    this.suggestions.set(result);
    this.activeIndex.set(
      Math.min(this.activeIndex(), Math.max(0, result.length - 1)),
    );
    this.placement.set(createMentionPlacement(result.length));
    this.loading.set(false);
  }

  handleMentionKeydown(event: Event): void {
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

  private handleNavigationKey(key: string): boolean {
    if (!this.open()) {
      return false;
    }

    if (key === 'Escape') {
      this.hide();

      return true;
    }

    if (key === 'Tab' || key === ' ' || key === 'Spacebar') {
      const option = this.suggestions()[this.activeIndex()];

      if (option) {
        this.insert(option);

        return true;
      }

      return false;
    }

    return this.keyboardNav.handleKey(key);
  }

  setActiveIndex(index: number): void {
    if (index >= 0 && index < this.suggestions().length) {
      this.activeIndex.set(index);
    }
  }

  insert(option: QalmaMentionOption): void {
    const mention = this.mention();
    const value: MentionCommandValue = {
      id: option.id,
      label: option.label,
      trigger: mention?.trigger,
    };

    if (this.editor.execute('insertMention', value)) {
      this.hide();
    }
  }

  hide(): void {
    this.requestId += 1;
    this.mention.set(null);
    this.placement.set(null);
    this.suggestions.set([]);
    this.loading.set(false);
    this.activeIndex.set(0);
  }
}

function resolveMentionSource(
  source: PlaygroundMentionSource,
  mention: MentionState,
): readonly QalmaMentionOption[] | Promise<readonly QalmaMentionOption[]> {
  if (source.kind === 'lazy') {
    const result = source.load(mention);

    return isPromiseLike(result)
      ? result.then((options) => filterMentionOptions(options, mention.query))
      : filterMentionOptions(result, mention.query);
  }

  return filterMentionOptions(source.items, mention.query);
}

function filterMentionOptions(
  options: readonly QalmaMentionOption[],
  query: string,
): readonly QalmaMentionOption[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return options.slice(0, 5);
  }

  return options
    .filter((option) =>
      `${option.label} ${option.id}`.toLowerCase().includes(normalizedQuery),
    )
    .slice(0, 5);
}

function getNextActiveIndex(
  previous: MentionState | null,
  next: MentionState,
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

function createMentionPlacement(
  optionCount: number,
  loading = false,
): SuggestionMenuPlacement | null {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0).cloneRange();
  const rect = getRangeRect(range);

  if (!rect) {
    return null;
  }

  return flipAbovePlacement(rect, {
    width: MENTION_MENU_WIDTH,
    desiredHeight: getMentionMenuHeight(optionCount, loading),
    minHeight: MENTION_MENU_LOADING_HEIGHT,
    margin: MENTION_MENU_MARGIN,
    gap: MENTION_MENU_GAP,
  });
}

function getMentionMenuHeight(optionCount: number, loading: boolean): number {
  if (loading) {
    return MENTION_MENU_LOADING_HEIGHT;
  }

  return Math.min(
    MENTION_MENU_MAX_HEIGHT,
    MENTION_MENU_VERTICAL_PADDING +
      Math.max(1, optionCount) * MENTION_MENU_OPTION_HEIGHT,
  );
}

function getRangeRect(range: Range): DOMRect | null {
  const rect = range.getBoundingClientRect();

  if (rect.width > 0 || rect.height > 0) {
    return rect;
  }

  const clientRect = range.getClientRects()[0];

  return clientRect ?? null;
}

function isPromiseLike<TValue>(
  value: TValue | Promise<TValue>,
): value is Promise<TValue> {
  return typeof (value as Promise<TValue>).then === 'function';
}
