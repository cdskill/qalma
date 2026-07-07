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
  QalmaMentionMenu,
  QalmaMentionOption,
  SuggestionMenuPlacement,
  flipAbovePlacement,
} from '@qalma/kit';

/**
 * `QalmaMentionMenu` is presentational: your controller owns filtering, async
 * loading, keyboard state, and insertion. This demo drives it from a sample
 * anchor so the surface itself is visible; in an editor you would feed
 * `placement` from the caret rect and `pick` into a mention insert command.
 */
@Component({
  selector: 'app-kit-mention-menu-demo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [QalmaMentionMenu],
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
        &#64;ada
      </button>

      <qalma-mention-menu
        [placement]="placement()"
        [suggestions]="suggestions"
        [activeIndex]="activeIndex()"
        (activate)="activeIndex.set($event)"
        (pick)="activeIndex.set(0)"
        (dismiss)="placement.set(null)"
      />
    </div>
  `,
})
export class KitMentionMenuDemo {
  private readonly anchor =
    viewChild.required<ElementRef<HTMLElement>>('anchor');

  protected readonly activeIndex = signal(1);
  protected readonly placement = signal<SuggestionMenuPlacement | null>(null);
  protected readonly suggestions: readonly QalmaMentionOption[] = [
    { id: 'ada', label: 'Ada Lovelace', description: 'Mathematical notes' },
    { id: 'grace', label: 'Grace Hopper', description: 'Compiler pioneer' },
    {
      id: 'katherine',
      label: 'Katherine Johnson',
      description: 'Orbital mechanics',
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
        width: 280,
        desiredHeight: 156,
        minHeight: 72,
      }),
    );
  }
}
