import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormControl,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import {
  HardBreakPlugin,
  HistoryPlugin,
  ListsPlugin,
  PasteRulesPlugin,
  PlaceholderPlugin,
  QalmaCommand,
  QalmaContent,
  QalmaEditor,
  QalmaToolbar,
  TextFormattingKit,
  createQalmaEditor,
} from '@qalma/editor';
import { QalmaControlValueAccessor } from '@qalma/editor/forms';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideBold, lucideItalic, lucideList } from '@ng-icons/lucide';

type Tone = 'valid' | 'invalid' | 'on' | 'off';

interface StateChip {
  readonly label: string;
  readonly tone: Tone;
}

/**
 * Example: a live form-state inspector. The editor is bound to a reactive
 * `FormControl` through `@qalma/editor/forms`, so Angular owns validity,
 * `touched`, `dirty`, `disabled`, and resets. Validators toggle at runtime and
 * every control state is mirrored as a chip — the clearest way to show the
 * adapter is a real Angular form control, not a bespoke value box.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-form-states',
  imports: [
    ReactiveFormsModule,
    NgIcon,
    QalmaCommand,
    QalmaContent,
    QalmaControlValueAccessor,
    QalmaEditor,
    QalmaToolbar,
  ],
  providers: [provideIcons({ lucideBold, lucideItalic, lucideList })],
  template: `
    @let snapshot = state();

    <div
      class="overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm"
    >
      <div class="border-b border-border px-4 py-2.5 text-sm font-medium">
        Form state
      </div>

      <div class="space-y-4 p-4">
        <qalma-editor
          class="block overflow-hidden rounded-lg border border-border bg-card focus-within:border-accent focus-within:ring-2 focus-within:ring-ring/25"
          [editor]="editor"
          [formControl]="body"
        >
          <qalma-toolbar
            class="flex items-center gap-0.5 border-b border-border px-1.5 py-1.5"
          >
            <button [class]="btnClass" qalmaCommand="toggleBold" aria-label="Bold">
              <ng-icon [class]="iconClass" name="lucideBold" aria-hidden="true" />
            </button>
            <button
              [class]="btnClass"
              qalmaCommand="toggleItalic"
              aria-label="Italic"
            >
              <ng-icon
                [class]="iconClass"
                name="lucideItalic"
                aria-hidden="true"
              />
            </button>
            <button
              [class]="btnClass"
              qalmaCommand="toggleBulletList"
              aria-label="Bullet list"
            >
              <ng-icon [class]="iconClass" name="lucideList" aria-hidden="true" />
            </button>
          </qalma-toolbar>

          <qalma-content
            class="block max-h-40 overflow-y-auto px-3 py-2.5 text-sm [&_.ProseMirror]:min-h-16 [&_.ProseMirror]:break-words [&_.ProseMirror]:outline-none"
          />
        </qalma-editor>

        <div class="flex flex-wrap gap-1.5">
          @for (chip of chips(); track chip.label) {
            <span
              class="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium"
              [class]="chipTone[chip.tone]"
            >
              <span
                class="size-1.5 rounded-full"
                [class]="dotTone[chip.tone]"
                aria-hidden="true"
              ></span>
              {{ chip.label }}
            </span>
          }
        </div>

        @if (errors().length) {
          <ul class="space-y-1">
            @for (message of errors(); track message) {
              <li class="flex items-start gap-1.5 text-xs text-destructive">
                <svg
                  class="mt-0.5 size-3.5 shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1.8"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 9v4M12 17h.01" />
                  <path
                    d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
                  />
                </svg>
                {{ message }}
              </li>
            }
          </ul>
        }

        <div class="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-border pt-3.5">
          <span class="text-xs font-medium text-muted-foreground">Validators</span>
          <button
            type="button"
            (click)="toggleRequired()"
            [attr.aria-pressed]="requiredOn()"
            [class]="requiredOn() ? toggleOnClass : toggleOffClass"
          >
            required
          </button>
          <button
            type="button"
            (click)="toggleMinLength()"
            [attr.aria-pressed]="minLengthOn()"
            [class]="minLengthOn() ? toggleOnClass : toggleOffClass"
          >
            min 20 chars
          </button>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button type="button" (click)="reset()" [class]="actionClass">
            Reset
          </button>
          <button type="button" (click)="toggleDisabled()" [class]="actionClass">
            {{ snapshot.disabled ? 'Enable' : 'Disable' }}
          </button>
          <button type="button" (click)="markTouched()" [class]="actionClass">
            Mark touched
          </button>
        </div>

        <div>
          <p class="mb-1 text-xs font-medium text-muted-foreground">
            Control value
          </p>
          <pre
            class="overflow-x-auto whitespace-pre-wrap break-words rounded-md border border-border bg-secondary/40 px-3 py-2 text-xs text-muted-foreground"
          ><code>{{ valueText() }}</code></pre>
        </div>
      </div>
    </div>
  `,
})
export class FormStates {
  protected readonly requiredOn = signal(true);
  protected readonly minLengthOn = signal(false);

  // Empty editors normalize to '' via the adapter, so Validators.required works.
  protected readonly body = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  protected readonly editor = createQalmaEditor({
    plugins: [
      ...TextFormattingKit,
      ListsPlugin,
      PlaceholderPlugin.configure({
        placeholder: 'Type, format, blur — watch the form react…',
      }),
      HardBreakPlugin,
      PasteRulesPlugin,
      HistoryPlugin,
    ],
  });

  // `AbstractControl.events` emits on value/status/touched/pristine changes;
  // bridging it to a signal keeps this OnPush, zoneless view in sync.
  private readonly events = toSignal(this.body.events);

  protected readonly state = computed(() => {
    this.events();

    return {
      status: this.body.status,
      valid: this.body.valid,
      touched: this.body.touched,
      dirty: this.body.dirty,
      disabled: this.body.disabled,
      errors: this.body.errors,
      value: this.body.value,
    };
  });

  protected readonly chips = computed<readonly StateChip[]>(() => {
    const snapshot = this.state();

    return [
      {
        label: snapshot.status,
        tone: snapshot.disabled ? 'off' : snapshot.valid ? 'valid' : 'invalid',
      },
      {
        label: snapshot.touched ? 'Touched' : 'Untouched',
        tone: snapshot.touched ? 'on' : 'off',
      },
      {
        label: snapshot.dirty ? 'Dirty' : 'Pristine',
        tone: snapshot.dirty ? 'on' : 'off',
      },
      {
        label: snapshot.disabled ? 'Disabled' : 'Enabled',
        tone: snapshot.disabled ? 'off' : 'on',
      },
    ];
  });

  protected readonly errors = computed<readonly string[]>(() => {
    const snapshot = this.state();

    if (!snapshot.errors || !(snapshot.touched || snapshot.dirty)) {
      return [];
    }

    const messages: string[] = [];

    if (snapshot.errors['required']) {
      messages.push('Content is required.');
    }

    const minLength = snapshot.errors['minTextLength'] as
      | { required: number; actual: number }
      | undefined;

    if (minLength) {
      messages.push(
        `Needs at least ${minLength.required} characters — has ${minLength.actual}.`,
      );
    }

    return messages;
  });

  protected readonly valueText = computed(() => this.state().value || '(empty)');

  protected readonly chipTone: Record<Tone, string> = {
    valid:
      'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    invalid: 'border-destructive/30 bg-destructive/10 text-destructive',
    on: 'border-accent/40 bg-accent-subtle text-accent',
    off: 'border-border bg-secondary/50 text-muted-foreground',
  };
  protected readonly dotTone: Record<Tone, string> = {
    valid: 'bg-emerald-500',
    invalid: 'bg-destructive',
    on: 'bg-accent',
    off: 'bg-muted-foreground/50',
  };

  protected readonly btnClass =
    'inline-flex h-[1.85rem] w-[1.85rem] cursor-pointer items-center justify-center rounded-[0.4rem] border border-transparent text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40 [&.qalma-command-active]:border-accent/40 [&.qalma-command-active]:bg-accent-subtle [&.qalma-command-active]:text-accent';
  protected readonly iconClass = 'text-[0.9rem]';
  protected readonly toggleOnClass =
    'cursor-pointer rounded-full border border-accent/40 bg-accent-subtle px-3 py-1 text-xs font-medium text-accent transition';
  protected readonly toggleOffClass =
    'cursor-pointer rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground';
  protected readonly actionClass =
    'inline-flex h-8 cursor-pointer items-center rounded-md border border-border bg-card px-3 text-xs font-medium text-foreground transition hover:bg-secondary';

  protected toggleRequired(): void {
    this.requiredOn.update((on) => !on);
    this.applyValidators();
  }

  protected toggleMinLength(): void {
    this.minLengthOn.update((on) => !on);
    this.applyValidators();
  }

  protected reset(): void {
    this.body.reset('');
  }

  protected toggleDisabled(): void {
    if (this.body.disabled) {
      this.body.enable();
    } else {
      this.body.disable();
    }
  }

  protected markTouched(): void {
    this.body.markAsTouched();
  }

  private applyValidators(): void {
    const validators: ValidatorFn[] = [];

    if (this.requiredOn()) {
      validators.push(Validators.required);
    }

    if (this.minLengthOn()) {
      validators.push(minTextLength(20));
    }

    this.body.setValidators(validators);
    this.body.updateValueAndValidity();
  }
}

// A rich-text-aware length check: count visible text, not HTML markup.
function minTextLength(min: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const text = String(control.value ?? '')
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;|\u00a0/g, ' ')
      .trim();

    return text.length >= min
      ? null
      : { minTextLength: { required: min, actual: text.length } };
  };
}
