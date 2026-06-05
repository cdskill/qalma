import { Component, computed, input, output } from '@angular/core';
import { RteCommand, RteEditorController, RteToolbar } from '@angular-rte/editor';

@Component({
  imports: [RteCommand, RteToolbar],
  selector: 'app-sandbox-toolbar',
  template: `
    <rte-toolbar
      class="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-slate-50 p-2"
    >
      <button
        type="button"
        [class]="commandClass"
        rteCommand="toggleBold"
        title="Bold"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        [class]="commandClass"
        rteCommand="toggleItalic"
        title="Italic"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        [class]="commandClass"
        rteCommand="toggleUnderline"
        title="Underline"
      >
        <u>U</u>
      </button>
      <button
        type="button"
        [class]="commandClass"
        rteCommand="toggleStrike"
        title="Strikethrough"
      >
        <s>S</s>
      </button>
      <span class="mx-1 h-5 w-px bg-slate-300" aria-hidden="true"></span>
      <button
        type="button"
        [class]="commandClass"
        [class.rte-command-active]="linkActive()"
        [attr.aria-pressed]="linkActive()"
        [disabled]="!canSetLink()"
        (mousedown)="preserveSelection($event)"
        (click)="requestLink.emit($event)"
        title="Link"
      >
        Link
      </button>
      <button
        type="button"
        [class]="commandClass"
        rteCommand="unsetLink"
        title="Unlink"
      >
        Unlink
      </button>
      <span class="mx-1 h-5 w-px bg-slate-300" aria-hidden="true"></span>
      <button
        type="button"
        [class]="commandClass"
        rteCommand="undo"
        title="Undo"
      >
        Undo
      </button>
      <button
        type="button"
        [class]="commandClass"
        rteCommand="redo"
        title="Redo"
      >
        Redo
      </button>
    </rte-toolbar>
  `,
})
export class SandboxToolbar {
  readonly editor = input.required<RteEditorController>();
  readonly requestLink = output<MouseEvent>();

  protected readonly canSetLink = computed(() =>
    this.editor().canExecute('setLink', 'https://angular.dev'),
  );
  protected readonly linkActive = computed(() =>
    this.editor().isCommandActive('setLink'),
  );

  protected readonly commandClass =
    'min-h-8 min-w-8 rounded-md border border-slate-300 bg-white px-2.5 text-center text-sm font-semibold leading-none text-slate-700 transition hover:border-sky-600 hover:bg-sky-50 hover:text-sky-900 disabled:cursor-not-allowed disabled:opacity-45 [&.rte-command-active]:border-sky-600 [&.rte-command-active]:bg-sky-50 [&.rte-command-active]:text-sky-900';

  protected preserveSelection(event: MouseEvent): void {
    event.preventDefault();
  }
}
