import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { QalmaEditorController } from '@qalma/editor';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBan, lucideCheck, lucideChevronDown } from '@ng-icons/lucide';
import {
  BrnPopover,
  BrnPopoverContent,
  BrnPopoverTrigger,
} from '@spartan-ng/brain/popover';

export interface PlaygroundColorSwatch {
  readonly label: string;
  readonly value: string;
}

/**
 * A single, self-explanatory color control: an icon-labelled trigger whose
 * swatch reflects the active color, opening a Spartan popover with a labelled
 * grid of swatches plus a "None" reset. Three distinct instances (text,
 * highlight, background) replace the old wall of look-alike color squares.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, BrnPopover, BrnPopoverTrigger, BrnPopoverContent],
  providers: [provideIcons({ lucideBan, lucideCheck, lucideChevronDown })],
  selector: 'app-playground-color-picker',
  template: `
    <brn-popover #popover="brnPopover" sideOffset="8" align="start">
      <button
        type="button"
        brnPopoverTrigger
        [brnPopoverTriggerFor]="popover"
        [class]="triggerClass"
        [class.qalma-command-active]="!!activeColor()"
        [disabled]="disabled()"
        (mousedown)="preserveSelection($event)"
        [title]="label()"
        [attr.aria-label]="label()"
      >
        <span class="relative flex flex-col items-center justify-center">
          <ng-icon class="text-[0.9rem]" [name]="icon()" aria-hidden="true" />
          <span
            class="mt-0.5 h-[3px] w-3 rounded-full"
            [style.background-color]="
              activeColor() || 'var(--color-muted-foreground)'
            "
            aria-hidden="true"
          ></span>
        </span>
        <ng-icon
          class="absolute right-0.5 top-0.5 text-[0.5rem] text-muted-foreground"
          name="lucideChevronDown"
          aria-hidden="true"
        />
      </button>

      <div
        *brnPopoverContent
        class="w-40 rounded-lg border border-border bg-popover p-2.5 text-popover-foreground shadow-lg outline-none"
      >
        <p
          class="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
        >
          {{ label() }}
        </p>
        <div class="grid grid-cols-4 gap-1.5">
          @for (swatch of colors(); track swatch.value) {
            <button
              type="button"
              class="group relative inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-[0.35rem] border border-border transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-40"
              [class.ring-2]="isActive(swatch.value)"
              [class.ring-accent]="isActive(swatch.value)"
              [class.ring-offset-2]="isActive(swatch.value)"
              [class.ring-offset-popover]="isActive(swatch.value)"
              [style.background-color]="swatch.value"
              [disabled]="!canSet(swatch.value)"
              (mousedown)="preserveSelection($event)"
              (click)="apply(swatch.value); popover.close()"
              [title]="swatch.label"
              [attr.aria-label]="swatch.label"
              [attr.aria-pressed]="isActive(swatch.value)"
            >
              @if (isActive(swatch.value)) {
                <ng-icon
                  class="text-sm text-foreground mix-blend-luminosity"
                  name="lucideCheck"
                  aria-hidden="true"
                />
              }
            </button>
          }
        </div>
        <button
          type="button"
          class="mt-3 flex w-full cursor-pointer items-center gap-2 rounded-md border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          [class.qalma-command-active]="!activeColor()"
          [disabled]="!canClear()"
          (mousedown)="preserveSelection($event)"
          (click)="clear(); popover.close()"
        >
          <ng-icon name="lucideBan" aria-hidden="true" />
          None
        </button>
      </div>
    </brn-popover>
  `,
})
export class PlaygroundColorPicker {
  readonly editor = input.required<QalmaEditorController>();
  readonly label = input.required<string>();
  readonly icon = input.required<string>();
  readonly colors = input.required<readonly PlaygroundColorSwatch[]>();
  /** Command that applies a color, e.g. `setTextColor`. */
  readonly setCommand = input.required<string>();
  /** Command that removes the color, e.g. `unsetTextColor`. */
  readonly unsetCommand = input.required<string>();
  /** Query key exposing the active color, e.g. `textColor`. */
  readonly queryKey = input.required<string>();

  protected readonly activeColor = computed(() =>
    this.editor().query<string>(this.queryKey()),
  );
  protected readonly disabled = computed(
    () =>
      !this.canClear() &&
      !this.colors().some((swatch) => this.canSet(swatch.value)),
  );

  protected readonly triggerClass =
    'relative inline-flex h-[1.85rem] w-[1.85rem] cursor-pointer items-center justify-center rounded-[0.4rem] border border-border bg-card text-muted-foreground transition hover:border-accent hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45 [&.qalma-command-active]:border-accent [&.qalma-command-active]:text-foreground';

  protected isActive(color: string): boolean {
    return this.activeColor() === color;
  }

  protected canSet(color: string): boolean {
    return this.editor().canExecute(this.setCommand(), color);
  }

  protected canClear(): boolean {
    return this.editor().canExecute(this.unsetCommand());
  }

  protected apply(color: string): void {
    this.editor().execute(this.setCommand(), color);
  }

  protected clear(): void {
    this.editor().execute(this.unsetCommand());
  }

  protected preserveSelection(event: MouseEvent): void {
    event.preventDefault();
  }
}
