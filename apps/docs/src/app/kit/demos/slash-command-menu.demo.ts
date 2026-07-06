import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  afterNextRender,
  signal,
  viewChild,
} from '@angular/core';
import {
  QalmaSlashCommandMenu,
  QalmaSlashCommandOption,
  SuggestionMenuPlacement,
  flipAbovePlacement,
} from '@qalma/kit';

/**
 * `QalmaSlashCommandMenu` renders the command palette; your controller owns
 * filtering and command execution. This demo drives it from a sample anchor so
 * the surface is visible. In an editor you would feed `placement` from the
 * caret rect and run `option.command` on `pick`.
 */
@Component({
  selector: 'app-kit-slash-command-menu-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QalmaSlashCommandMenu],
  template: `
    <div class="min-h-72 rounded-lg border border-border bg-card p-4">
      <p class="text-sm leading-6 text-muted-foreground">
        Click the token to recompute placement, then use ArrowUp / ArrowDown.
      </p>
      <button
        #anchor
        type="button"
        class="mt-4 inline-flex cursor-pointer rounded-md border border-dashed border-accent/50 bg-accent-subtle px-2 py-1 text-sm text-accent"
        (click)="refreshPlacement()"
      >
        /heading
      </button>

      <qalma-slash-command-menu
        [placement]="placement()"
        [options]="options"
        [activeIndex]="activeIndex()"
        (activate)="activeIndex.set($event)"
        (pick)="activeIndex.set(0)"
        (dismiss)="placement.set(null)"
      />
    </div>
  `,
})
export class KitSlashCommandMenuDemo {
  private readonly anchor =
    viewChild.required<ElementRef<HTMLElement>>('anchor');

  protected readonly activeIndex = signal(1);
  protected readonly placement = signal<SuggestionMenuPlacement | null>(null);
  protected readonly options: readonly QalmaSlashCommandOption[] = [
    {
      id: 'paragraph',
      label: 'Paragraph',
      description: 'Plain text block',
      icon: 'lucidePilcrow',
      shortcut: 'P',
      command: 'setParagraph',
      keywords: ['text', 'body'],
    },
    {
      id: 'heading-2',
      label: 'Heading 2',
      description: 'Section heading',
      icon: 'lucideHeading2',
      shortcut: 'H2',
      command: 'toggleHeading2',
      keywords: ['title', 'section'],
    },
    {
      id: 'bullet-list',
      label: 'Bullet list',
      description: 'Create unordered list',
      icon: 'lucideList',
      shortcut: '-',
      command: 'toggleBulletList',
      keywords: ['ul', 'list'],
    },
  ];

  constructor() {
    afterNextRender(() => this.refreshPlacement());
  }

  @HostListener('window:resize')
  @HostListener('window:scroll')
  protected refreshPlacement(): void {
    const rect = this.anchor().nativeElement.getBoundingClientRect();

    this.placement.set(
      flipAbovePlacement(rect, {
        width: 320,
        desiredHeight: 232,
        minHeight: 112,
      }),
    );
  }
}
