import { Directive, computed, inject, input } from '@angular/core';

import { RTE_EDITOR_CONTEXT } from './editor-context';

@Directive({
  selector: 'button[rteCommand]',
  host: {
    '(click)': 'execute()',
    '(mousedown)': 'preserveSelection($event)',
    '[attr.aria-pressed]': 'ariaPressed()',
    '[class.rte-command-active]': 'active()',
    '[disabled]': 'disabled()',
  },
})
export class RteCommand {
  readonly command = input.required<string>({ alias: 'rteCommand' });
  readonly rteCommandValue = input<unknown>();

  private readonly context = inject(RTE_EDITOR_CONTEXT);
  private readonly editor = computed(() => this.context.editor());

  protected readonly active = computed(() =>
    this.editor().isCommandActive(this.command()),
  );
  protected readonly disabled = computed(
    () =>
      !this.editor().canExecute(this.command(), this.rteCommandValue()),
  );
  protected readonly ariaPressed = computed(() =>
    this.editor().hasCommandState(this.command())
      ? String(this.active())
      : null,
  );

  protected execute(): void {
    this.editor().execute(this.command(), this.rteCommandValue());
  }

  protected preserveSelection(event: MouseEvent): void {
    event.preventDefault();
  }
}
