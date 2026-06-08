import { computed, signal } from '@angular/core';
import {
  MentionCommandValue,
  MentionState,
  RteEditorController,
} from '@angular-rte/editor';

export interface SandboxMentionOption {
  id: string;
  label: string;
  description: string;
}

export type SandboxMentionSource =
  | {
      kind: 'eager';
      items: readonly SandboxMentionOption[];
    }
  | {
      kind: 'lazy';
      load: (
        mention: MentionState,
      ) =>
        | readonly SandboxMentionOption[]
        | Promise<readonly SandboxMentionOption[]>;
    };

export interface SandboxMentionPlacement {
  left: number;
  top: number | null;
  bottom: number | null;
  maxHeight: number;
}

const MENTION_MENU_WIDTH = 280;
const MENTION_MENU_MAX_HEIGHT = 320;
const MENTION_MENU_MARGIN = 12;
const MENTION_MENU_GAP = 8;
const MENTION_MENU_OPTION_HEIGHT = 56;
const MENTION_MENU_VERTICAL_PADDING = 12;
const MENTION_MENU_LOADING_HEIGHT = 44;

const SANDBOX_MENTION_OPTIONS: readonly SandboxMentionOption[] = [
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

export function createSandboxMentionSource(
  mode: 'eager' | 'lazy',
): SandboxMentionSource {
  return mode === 'eager'
    ? {
        kind: 'eager',
        items: SANDBOX_MENTION_OPTIONS,
      }
    : {
        kind: 'lazy',
        load: async (mention) =>
          filterMentionOptions(SANDBOX_MENTION_OPTIONS, mention.query),
      };
}

export class SandboxMentionController {
  readonly mention = signal<MentionState | null>(null);
  readonly placement = signal<SandboxMentionPlacement | null>(null);
  readonly suggestions = signal<readonly SandboxMentionOption[]>([]);
  readonly loading = signal(false);
  readonly activeIndex = signal(0);
  readonly open = computed(
    () =>
      Boolean(this.mention() && this.placement()) &&
      (this.loading() || this.suggestions().length > 0),
  );

  private requestId = 0;

  constructor(
    private readonly editor: RteEditorController,
    private readonly source: SandboxMentionSource,
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

    if (key === 'ArrowDown') {
      this.moveActiveOption(1);

      return true;
    }

    if (key === 'ArrowUp') {
      this.moveActiveOption(-1);

      return true;
    }

    if (key === 'Enter' || key === 'Tab' || key === ' ' || key === 'Spacebar') {
      const option = this.suggestions()[this.activeIndex()];

      if (option) {
        this.insert(option);

        return true;
      }
    }

    return false;
  }

  setActiveIndex(index: number): void {
    if (index >= 0 && index < this.suggestions().length) {
      this.activeIndex.set(index);
    }
  }

  insert(option: SandboxMentionOption): void {
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

  private moveActiveOption(delta: number): void {
    const length = this.suggestions().length;

    if (length === 0) {
      return;
    }

    this.activeIndex.update((index) => (index + delta + length) % length);
  }
}

function resolveMentionSource(
  source: SandboxMentionSource,
  mention: MentionState,
):
  | readonly SandboxMentionOption[]
  | Promise<readonly SandboxMentionOption[]> {
  if (source.kind === 'lazy') {
    const result = source.load(mention);

    return isPromiseLike(result)
      ? result.then((options) => filterMentionOptions(options, mention.query))
      : filterMentionOptions(result, mention.query);
  }

  return filterMentionOptions(source.items, mention.query);
}

function filterMentionOptions(
  options: readonly SandboxMentionOption[],
  query: string,
): readonly SandboxMentionOption[] {
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
): SandboxMentionPlacement | null {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0) {
    return null;
  }

  const range = selection.getRangeAt(0).cloneRange();
  const rect = getRangeRect(range);

  if (!rect) {
    return null;
  }

  const desiredHeight = getMentionMenuHeight(optionCount, loading);
  const availableBelow =
    window.innerHeight - rect.bottom - MENTION_MENU_MARGIN - MENTION_MENU_GAP;
  const availableAbove = rect.top - MENTION_MENU_MARGIN - MENTION_MENU_GAP;
  const openAbove =
    availableBelow < desiredHeight && availableAbove > availableBelow;
  const availableHeight = Math.max(
    MENTION_MENU_LOADING_HEIGHT,
    openAbove ? availableAbove : availableBelow,
  );
  const maxHeight = Math.min(desiredHeight, availableHeight);
  const leftBoundary = Math.max(
    MENTION_MENU_MARGIN,
    window.innerWidth - MENTION_MENU_WIDTH - MENTION_MENU_MARGIN,
  );

  return {
    left: Math.min(Math.max(rect.left, MENTION_MENU_MARGIN), leftBoundary),
    top: openAbove ? null : rect.bottom + MENTION_MENU_GAP,
    bottom: openAbove
      ? window.innerHeight - rect.top + MENTION_MENU_GAP
      : null,
    maxHeight,
  };
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
