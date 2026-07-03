import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import { QalmaEditorController } from '@qalma/editor';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideArrowDown,
  lucideArrowUp,
  lucideCopy,
  lucideGripVertical,
  lucideMousePointer2,
  lucideTrash2,
} from '@ng-icons/lucide';

import {
  PlaygroundDragBlockHighlight,
  PlaygroundDragDropIndicator,
  PlaygroundDragHandleView,
} from './drag-handle-controller';
import { QalmaButton } from '@qalma/kit';

export interface PlaygroundDragStart {
  event: PointerEvent;
  handle: PlaygroundDragHandleView;
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, QalmaButton],
  providers: [
    provideIcons({
      lucideArrowDown,
      lucideArrowUp,
      lucideCopy,
      lucideGripVertical,
      lucideMousePointer2,
      lucideTrash2,
    }),
  ],
  selector: 'app-playground-drag-handle',
  template: `
    @if (draggedBlockHighlight(); as highlight) {
      <div
        data-playground-dragging-block-highlight
        class="pointer-events-none fixed left-0 top-0 z-20 rounded-md border border-accent bg-accent-subtle/80 opacity-70 shadow-md will-change-transform"
        [style.transform]="highlight.transform"
        [style.width.px]="highlight.width"
        [style.height.px]="highlight.height"
      ></div>
    }

    @if (dropIndicator(); as indicator) {
      <div
        data-playground-drag-drop-line
        class="pointer-events-none fixed left-0 top-0 z-40 h-0.5 rounded-full bg-accent shadow-md will-change-transform"
        [style.transform]="indicator.transform"
        [style.width.px]="indicator.width"
      ></div>
    }

    @if (handle(); as handle) {
      <div
        data-playground-drag-handle
        class="fixed left-0 top-0 z-30 flex items-start gap-1 will-change-transform"
        tabindex="-1"
        [style.transform]="handle.transform"
        (mousedown)="preserveSelection($event)"
        (keydown.escape)="dismissFromKeyboard($event)"
      >
        <button
          qalmaBtn
          variant="ghost"
          size="icon"
          type="button"
          class="!h-[1.85rem] !w-[1.85rem] cursor-grab rounded-[0.4rem] border border-transparent bg-card/95 text-muted-foreground shadow-sm active:cursor-grabbing hover:border-border hover:bg-secondary hover:text-foreground"
          [class.border-accent]="menuOpen()"
          [class.text-accent]="menuOpen()"
          (pointerdown)="startDrag($event, handle)"
          (click)="toggleMenu()"
          title="Block actions"
          aria-label="Block actions"
          [attr.aria-expanded]="menuOpen()"
        >
          <ng-icon
            class="text-[0.9rem]"
            name="lucideGripVertical"
            aria-hidden="true"
          />
        </button>

        @if (menuOpen()) {
          <div
            role="menu"
            aria-label="Block actions"
            class="w-44 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg"
          >
            <button
              type="button"
              class="flex h-8 w-full cursor-pointer items-center gap-2 rounded-sm px-2 text-left text-xs font-medium text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-45"
              [disabled]="!canExecute('selectBlock', handle)"
              (mousedown)="preserveSelection($event)"
              (click)="execute('selectBlock', handle)"
              role="menuitem"
            >
              <ng-icon name="lucideMousePointer2" aria-hidden="true" />
              Select block
            </button>
            <button
              type="button"
              class="flex h-8 w-full cursor-pointer items-center gap-2 rounded-sm px-2 text-left text-xs font-medium text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-45"
              [disabled]="!handle.canMoveUp"
              (mousedown)="preserveSelection($event)"
              (click)="execute('moveBlockUp', handle)"
              role="menuitem"
            >
              <ng-icon name="lucideArrowUp" aria-hidden="true" />
              Move up
            </button>
            <button
              type="button"
              class="flex h-8 w-full cursor-pointer items-center gap-2 rounded-sm px-2 text-left text-xs font-medium text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-45"
              [disabled]="!handle.canMoveDown"
              (mousedown)="preserveSelection($event)"
              (click)="execute('moveBlockDown', handle)"
              role="menuitem"
            >
              <ng-icon name="lucideArrowDown" aria-hidden="true" />
              Move down
            </button>
            <button
              type="button"
              class="flex h-8 w-full cursor-pointer items-center gap-2 rounded-sm px-2 text-left text-xs font-medium text-foreground transition hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-45"
              [disabled]="!canExecute('duplicateBlock', handle)"
              (mousedown)="preserveSelection($event)"
              (click)="execute('duplicateBlock', handle)"
              role="menuitem"
            >
              <ng-icon name="lucideCopy" aria-hidden="true" />
              Duplicate
            </button>
            <button
              type="button"
              class="flex h-8 w-full cursor-pointer items-center gap-2 rounded-sm px-2 text-left text-xs font-medium text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-45"
              [disabled]="!canExecute('deleteBlock', handle)"
              (mousedown)="preserveSelection($event)"
              (click)="execute('deleteBlock', handle)"
              role="menuitem"
            >
              <ng-icon name="lucideTrash2" aria-hidden="true" />
              Delete
            </button>
          </div>
        }
      </div>
    }
  `,
})
export class PlaygroundDragHandle {
  readonly editor = input.required<QalmaEditorController>();
  readonly handle = input<PlaygroundDragHandleView | null>(null);
  readonly dropIndicator = input<PlaygroundDragDropIndicator | null>(null);
  readonly draggedBlockHighlight = input<PlaygroundDragBlockHighlight | null>(
    null,
  );
  readonly dismiss = output<void>();
  readonly dragStart = output<PlaygroundDragStart>();

  protected readonly menuOpen = signal(false);

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected startDrag(
    event: PointerEvent,
    handle: PlaygroundDragHandleView,
  ): void {
    this.menuOpen.set(false);
    this.dragStart.emit({ event, handle });
  }

  protected canExecute(
    command: string,
    handle: PlaygroundDragHandleView,
  ): boolean {
    return this.editor().canExecute(command, handle.target);
  }

  protected execute(command: string, handle: PlaygroundDragHandleView): void {
    if (this.editor().execute(command, handle.target)) {
      this.dismissHandle();
    }
  }

  protected preserveSelection(event: MouseEvent): void {
    event.preventDefault();
  }

  protected dismissFromKeyboard(event: Event): void {
    event.preventDefault();
    this.dismissHandle();
  }

  protected dismissHandle(): void {
    this.menuOpen.set(false);
    this.dismiss.emit();
  }
}
