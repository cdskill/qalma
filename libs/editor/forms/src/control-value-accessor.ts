import {
  Directive,
  ElementRef,
  Injector,
  OnInit,
  effect,
  forwardRef,
  inject,
} from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { QalmaEditor } from '@qalma/editor';

const EMPTY_EDITOR_HTML = '<p></p>';

/* eslint-disable @angular-eslint/directive-selector */
@Directive({
  selector:
    'qalma-editor[formControl],qalma-editor[formControlName],qalma-editor[ngModel]',
  standalone: true,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => QalmaControlValueAccessor),
      multi: true,
    },
  ],
  host: {
    '(focusout)': 'handleFocusOut($event)',
  },
})
/* eslint-enable @angular-eslint/directive-selector */
export class QalmaControlValueAccessor
  implements ControlValueAccessor, OnInit
{
  private readonly editorHost = inject(QalmaEditor);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  private initialized = false;
  private lastValue = '';
  private pendingValue: string | undefined;
  private onChange: (value: string) => void = () => undefined;
  private onTouched: () => void = () => undefined;

  ngOnInit(): void {
    this.initialized = true;

    if (this.pendingValue !== undefined) {
      this.writeValue(this.pendingValue);
      this.pendingValue = undefined;
    } else {
      this.lastValue = this.currentValue();
    }

    effect(
      () => {
        const value = this.currentValue();

        if (value === this.lastValue) {
          return;
        }

        this.lastValue = value;
        this.onChange(value);
      },
      { injector: this.injector },
    );
  }

  writeValue(value: unknown): void {
    const formValue = normalizeFormValue(value);

    if (!this.initialized) {
      this.pendingValue = formValue;
      this.lastValue = formValue;

      return;
    }

    this.editorHost.editor().setHtml(formValueToHtml(formValue));
    this.lastValue = this.currentValue();
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(disabled: boolean): void {
    this.editorHost.editor().setEditable(!disabled);
  }

  /**
   * Current control value for the editor. Reads `html()` unconditionally so the
   * `effect` tracks it, then collapses an empty document to `''` via the
   * DOM-free `isEmpty()` query (so `Validators.required` behaves).
   */
  private currentValue(): string {
    const editor = this.editorHost.editor();
    const html = editor.html();

    return editor.isEmpty() ? '' : html;
  }

  protected handleFocusOut(event: FocusEvent): void {
    const host = this.host.nativeElement;
    const nextTarget = event.relatedTarget;

    if (nextTarget instanceof Node && host.contains(nextTarget)) {
      return;
    }

    queueMicrotask(() => {
      const activeElement = host.ownerDocument.activeElement;

      if (!activeElement || !host.contains(activeElement)) {
        this.onTouched();
      }
    });
  }
}

function normalizeFormValue(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function formValueToHtml(value: string): string {
  return value === '' ? EMPTY_EDITOR_HTML : value;
}
