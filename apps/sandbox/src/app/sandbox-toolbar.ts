import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import {
  QalmaCommand,
  QalmaEditorController,
  QalmaToolbar,
} from '@qalma/editor';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideAlignCenter,
  lucideAlignJustify,
  lucideAlignLeft,
  lucideAlignRight,
  lucideBold,
  lucideEraser,
  lucideHeading1,
  lucideHeading2,
  lucideHeading3,
  lucideHighlighter,
  lucideImage,
  lucideImageUp,
  lucideIndent,
  lucideItalic,
  lucideLink,
  lucideList,
  lucideListOrdered,
  lucideListTodo,
  lucideOutdent,
  lucidePilcrow,
  lucideRedo2,
  lucideSquareCode,
  lucideStrikethrough,
  lucideSubscript,
  lucideSuperscript,
  lucideTextQuote,
  lucideUnderline,
  lucideUndo2,
  lucideUnlink,
} from '@ng-icons/lucide';

import {
  SANDBOX_CODE_BLOCK_LANGUAGES,
  SANDBOX_DEFAULT_CODE_BLOCK_LANGUAGE,
} from './sandbox-code-block';
import {
  SANDBOX_EXAMPLE_IMAGE_ALT,
  SANDBOX_EXAMPLE_IMAGE_SRC,
} from './sandbox-image';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, QalmaCommand, QalmaToolbar],
  providers: [
    provideIcons({
      lucideAlignCenter,
      lucideAlignJustify,
      lucideAlignLeft,
      lucideAlignRight,
      lucideBold,
      lucideEraser,
      lucideHeading1,
      lucideHeading2,
      lucideHeading3,
      lucideHighlighter,
      lucideImage,
      lucideImageUp,
      lucideIndent,
      lucideItalic,
      lucideLink,
      lucideList,
      lucideListOrdered,
      lucideListTodo,
      lucideOutdent,
      lucidePilcrow,
      lucideRedo2,
      lucideSquareCode,
      lucideStrikethrough,
      lucideSubscript,
      lucideSuperscript,
      lucideTextQuote,
      lucideUnderline,
      lucideUndo2,
      lucideUnlink,
    }),
  ],
  selector: 'app-sandbox-toolbar',
  template: `
    <qalma-toolbar
      class="flex flex-wrap items-center gap-1.5 border-b border-slate-200 bg-slate-50 p-2"
    >
      <button
        type="button"
        [class]="commandClass"
        qalmaCommand="setParagraph"
        title="Paragraph"
        aria-label="Paragraph"
      >
        <ng-icon name="lucidePilcrow" aria-hidden="true" />
      </button>
      <button
        type="button"
        [class]="commandClass"
        qalmaCommand="toggleHeading1"
        title="Heading 1"
        aria-label="Heading 1"
      >
        <ng-icon name="lucideHeading1" aria-hidden="true" />
      </button>
      <button
        type="button"
        [class]="commandClass"
        qalmaCommand="toggleHeading2"
        title="Heading 2"
        aria-label="Heading 2"
      >
        <ng-icon name="lucideHeading2" aria-hidden="true" />
      </button>
      <button
        type="button"
        [class]="commandClass"
        qalmaCommand="toggleHeading3"
        title="Heading 3"
        aria-label="Heading 3"
      >
        <ng-icon name="lucideHeading3" aria-hidden="true" />
      </button>
      <span class="mx-1 h-5 w-px bg-slate-300" aria-hidden="true"></span>
      <button
        type="button"
        [class]="commandClass"
        [class.qalma-command-active]="imageActive()"
        [attr.aria-pressed]="imageActive()"
        [disabled]="!canInsertImage()"
        (mousedown)="preserveSelection($event)"
        (click)="requestImageLink.emit()"
        title="Image URL"
        aria-label="Image URL"
      >
        <ng-icon name="lucideImage" aria-hidden="true" />
      </button>
      <button
        type="button"
        [class]="commandClass"
        [disabled]="!canInsertUploadedImage()"
        (mousedown)="preserveSelection($event)"
        (click)="requestImageUpload.emit()"
        title="Upload image"
        aria-label="Upload image"
      >
        <ng-icon name="lucideImageUp" aria-hidden="true" />
      </button>
      <span class="mx-1 h-5 w-px bg-slate-300" aria-hidden="true"></span>
      <button
        type="button"
        [class]="commandClass"
        qalmaCommand="setTextAlignLeft"
        title="Align left"
        aria-label="Align left"
      >
        <ng-icon name="lucideAlignLeft" aria-hidden="true" />
      </button>
      <button
        type="button"
        [class]="commandClass"
        qalmaCommand="setTextAlignCenter"
        title="Align center"
        aria-label="Align center"
      >
        <ng-icon name="lucideAlignCenter" aria-hidden="true" />
      </button>
      <button
        type="button"
        [class]="commandClass"
        qalmaCommand="setTextAlignRight"
        title="Align right"
        aria-label="Align right"
      >
        <ng-icon name="lucideAlignRight" aria-hidden="true" />
      </button>
      <button
        type="button"
        [class]="commandClass"
        qalmaCommand="setTextAlignJustify"
        title="Justify"
        aria-label="Justify"
      >
        <ng-icon name="lucideAlignJustify" aria-hidden="true" />
      </button>
      <span class="mx-1 h-5 w-px bg-slate-300" aria-hidden="true"></span>
      <button
        type="button"
        [class]="commandClass"
        qalmaCommand="toggleBold"
        title="Bold"
        aria-label="Bold"
      >
        <ng-icon name="lucideBold" aria-hidden="true" />
      </button>
      <button
        type="button"
        [class]="commandClass"
        qalmaCommand="toggleItalic"
        title="Italic"
        aria-label="Italic"
      >
        <ng-icon name="lucideItalic" aria-hidden="true" />
      </button>
      <button
        type="button"
        [class]="commandClass"
        qalmaCommand="toggleUnderline"
        title="Underline"
        aria-label="Underline"
      >
        <ng-icon name="lucideUnderline" aria-hidden="true" />
      </button>
      <button
        type="button"
        [class]="commandClass"
        qalmaCommand="toggleStrike"
        title="Strikethrough"
        aria-label="Strikethrough"
      >
        <ng-icon name="lucideStrikethrough" aria-hidden="true" />
      </button>
      <button
        type="button"
        [class]="commandClass"
        qalmaCommand="toggleSubscript"
        title="Subscript"
        aria-label="Subscript"
      >
        <ng-icon name="lucideSubscript" aria-hidden="true" />
      </button>
      <button
        type="button"
        [class]="commandClass"
        qalmaCommand="toggleSuperscript"
        title="Superscript"
        aria-label="Superscript"
      >
        <ng-icon name="lucideSuperscript" aria-hidden="true" />
      </button>
      <span class="mx-1 h-5 w-px bg-slate-300" aria-hidden="true"></span>
      <button
        type="button"
        [class]="commandClass"
        qalmaCommand="setHighlight"
        title="Highlight"
        aria-label="Highlight"
      >
        <ng-icon name="lucideHighlighter" aria-hidden="true" />
      </button>
      @for (color of highlightColors; track color.value) {
        <button
          type="button"
          [class]="colorSwatchClass"
          [class.qalma-command-active]="isHighlightColorActive(color.value)"
          [attr.aria-pressed]="isHighlightColorActive(color.value)"
          [disabled]="!canSetHighlight(color.value)"
          (mousedown)="preserveSelection($event)"
          (click)="setHighlight(color.value)"
          [title]="color.label"
          [attr.aria-label]="color.label"
        >
          <span
            class="block h-4 w-4 rounded-sm border border-slate-300"
            [style.background-color]="color.value"
            aria-hidden="true"
          ></span>
        </button>
      }
      <button
        type="button"
        [class]="commandClass"
        qalmaCommand="unsetHighlight"
        title="Clear highlight"
        aria-label="Clear highlight"
      >
        <ng-icon name="lucideEraser" aria-hidden="true" />
      </button>
      <span class="mx-1 h-5 w-px bg-slate-300" aria-hidden="true"></span>
      @for (color of textColors; track color.value) {
        <button
          type="button"
          [class]="colorSwatchClass"
          [class.qalma-command-active]="isTextColorActive(color.value)"
          [attr.aria-pressed]="isTextColorActive(color.value)"
          [disabled]="!canSetTextColor(color.value)"
          (mousedown)="preserveSelection($event)"
          (click)="setTextColor(color.value)"
          [title]="color.label"
          [attr.aria-label]="color.label"
        >
          <span
            class="block h-4 w-4 rounded-sm border border-slate-300"
            [style.background-color]="color.value"
            aria-hidden="true"
          ></span>
        </button>
      }
      <button
        type="button"
        [class]="commandClass"
        [disabled]="!canUnsetTextColor()"
        (mousedown)="preserveSelection($event)"
        (click)="unsetTextColor()"
        title="Clear text color"
        aria-label="Clear text color"
      >
        <ng-icon name="lucideEraser" aria-hidden="true" />
      </button>
      @for (color of backgroundColors; track color.value) {
        <button
          type="button"
          [class]="colorSwatchClass"
          [class.qalma-command-active]="isBackgroundColorActive(color.value)"
          [attr.aria-pressed]="isBackgroundColorActive(color.value)"
          [disabled]="!canSetBackgroundColor(color.value)"
          (mousedown)="preserveSelection($event)"
          (click)="setBackgroundColor(color.value)"
          [title]="color.label"
          [attr.aria-label]="color.label"
        >
          <span
            class="block h-4 w-4 rounded-sm border border-slate-300"
            [style.background-color]="color.value"
            aria-hidden="true"
          ></span>
        </button>
      }
      <button
        type="button"
        [class]="commandClass"
        [disabled]="!canUnsetBackgroundColor()"
        (mousedown)="preserveSelection($event)"
        (click)="unsetBackgroundColor()"
        title="Clear background color"
        aria-label="Clear background color"
      >
        <ng-icon name="lucideEraser" aria-hidden="true" />
      </button>
      <button
        type="button"
        [class]="commandClass"
        qalmaCommand="clearFormatting"
        title="Clear formatting"
        aria-label="Clear formatting"
      >
        <ng-icon name="lucideEraser" aria-hidden="true" />
      </button>
      <span class="mx-1 h-5 w-px bg-slate-300" aria-hidden="true"></span>
      <button
        type="button"
        [class]="commandClass"
        qalmaCommand="toggleBulletList"
        title="Bullet list"
        aria-label="Bullet list"
      >
        <ng-icon name="lucideList" aria-hidden="true" />
      </button>
      <button
        type="button"
        [class]="commandClass"
        qalmaCommand="toggleOrderedList"
        title="Ordered list"
        aria-label="Ordered list"
      >
        <ng-icon name="lucideListOrdered" aria-hidden="true" />
      </button>
      <button
        type="button"
        [class]="commandClass"
        qalmaCommand="toggleTaskList"
        title="Task list"
        aria-label="Task list"
      >
        <ng-icon name="lucideListTodo" aria-hidden="true" />
      </button>
      <button
        type="button"
        [class]="commandClass"
        qalmaCommand="toggleBlockquote"
        title="Blockquote"
        aria-label="Blockquote"
      >
        <ng-icon name="lucideTextQuote" aria-hidden="true" />
      </button>
      <button
        type="button"
        [class]="commandClass"
        qalmaCommand="toggleCodeBlock"
        title="Code block"
        aria-label="Code block"
      >
        <ng-icon name="lucideSquareCode" aria-hidden="true" />
      </button>
      @if (codeBlockActive()) {
        <select
          [class]="languageSelectClass"
          [value]="codeBlockLanguage()"
          (change)="setCodeBlockLanguage($event)"
          aria-label="Code block language"
        >
          @for (language of codeBlockLanguages; track language.value) {
            <option
              [value]="language.value"
              [selected]="language.value === codeBlockLanguage()"
            >
              {{ language.label }}
            </option>
          }
        </select>
      }
      <button
        type="button"
        [class]="commandClass"
        qalmaCommand="liftListItem"
        title="Lift list item"
        aria-label="Lift list item"
      >
        <ng-icon name="lucideOutdent" aria-hidden="true" />
      </button>
      <button
        type="button"
        [class]="commandClass"
        qalmaCommand="sinkListItem"
        title="Sink list item"
        aria-label="Sink list item"
      >
        <ng-icon name="lucideIndent" aria-hidden="true" />
      </button>
      <span class="mx-1 h-5 w-px bg-slate-300" aria-hidden="true"></span>
      <button
        type="button"
        [class]="commandClass"
        [class.qalma-command-active]="linkActive()"
        [attr.aria-pressed]="linkActive()"
        [disabled]="!canSetLink()"
        (mousedown)="preserveSelection($event)"
        (click)="requestLink.emit($event)"
        title="Link"
        aria-label="Link"
      >
        <ng-icon name="lucideLink" aria-hidden="true" />
      </button>
      <button
        type="button"
        [class]="commandClass"
        qalmaCommand="unsetLink"
        title="Unlink"
        aria-label="Unlink"
      >
        <ng-icon name="lucideUnlink" aria-hidden="true" />
      </button>
      <span class="mx-1 h-5 w-px bg-slate-300" aria-hidden="true"></span>
      <button
        type="button"
        [class]="commandClass"
        qalmaCommand="undo"
        title="Undo"
        aria-label="Undo"
      >
        <ng-icon name="lucideUndo2" aria-hidden="true" />
      </button>
      <button
        type="button"
        [class]="commandClass"
        qalmaCommand="redo"
        title="Redo"
        aria-label="Redo"
      >
        <ng-icon name="lucideRedo2" aria-hidden="true" />
      </button>
    </qalma-toolbar>
  `,
})
export class SandboxToolbar {
  readonly editor = input.required<QalmaEditorController>();
  readonly requestLink = output<MouseEvent>();
  readonly requestImageLink = output<void>();
  readonly requestImageUpload = output<void>();

  protected readonly canInsertImage = computed(() =>
    this.editor().canExecute('insertImage', {
      src: SANDBOX_EXAMPLE_IMAGE_SRC,
      alt: SANDBOX_EXAMPLE_IMAGE_ALT,
    }),
  );
  protected readonly canInsertUploadedImage = computed(() =>
    this.editor().canExecute('insertImage', {
      src: '/uploads/example-image.png',
      alt: SANDBOX_EXAMPLE_IMAGE_ALT,
    }),
  );
  protected readonly canSetLink = computed(() =>
    this.editor().canExecute('setLink', 'https://angular.dev'),
  );
  protected readonly imageActive = computed(() =>
    this.editor().isCommandActive('insertImage'),
  );
  protected readonly linkActive = computed(() =>
    this.editor().isCommandActive('setLink'),
  );
  protected readonly codeBlockActive = computed(() =>
    this.editor().isCommandActive('toggleCodeBlock'),
  );
  protected readonly codeBlockLanguage = computed(
    () =>
      this.editor().query<string>('codeBlockLanguage') ??
      SANDBOX_DEFAULT_CODE_BLOCK_LANGUAGE,
  );
  protected readonly textColor = computed(() =>
    this.editor().query<string>('textColor'),
  );
  protected readonly backgroundColor = computed(() =>
    this.editor().query<string>('backgroundColor'),
  );
  protected readonly highlightColor = computed(() =>
    this.editor().query<string>('highlightColor'),
  );

  protected readonly codeBlockLanguages = SANDBOX_CODE_BLOCK_LANGUAGES;
  protected readonly highlightColors = [
    { label: 'Yellow highlight', value: 'rgb(254, 240, 138)' },
    { label: 'Mint highlight', value: 'rgb(187, 247, 208)' },
    { label: 'Sky highlight', value: 'rgb(186, 230, 253)' },
    { label: 'Pink highlight', value: 'rgb(251, 207, 232)' },
  ] as const;
  protected readonly textColors = [
    { label: 'Slate text color', value: 'rgb(15, 23, 42)' },
    { label: 'Teal text color', value: 'rgb(14, 116, 144)' },
    { label: 'Rose text color', value: 'rgb(190, 18, 60)' },
    { label: 'Violet text color', value: 'rgb(109, 40, 217)' },
  ] as const;
  protected readonly backgroundColors = [
    { label: 'Yellow background color', value: 'rgb(254, 240, 138)' },
    { label: 'Mint background color', value: 'rgb(187, 247, 208)' },
    { label: 'Sky background color', value: 'rgb(186, 230, 253)' },
    { label: 'Pink background color', value: 'rgb(251, 207, 232)' },
  ] as const;
  protected readonly commandClass =
    'inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 transition hover:border-sky-600 hover:bg-sky-50 hover:text-sky-900 disabled:cursor-not-allowed disabled:opacity-45 [&.qalma-command-active]:border-sky-600 [&.qalma-command-active]:bg-sky-50 [&.qalma-command-active]:text-sky-900';
  protected readonly colorSwatchClass =
    'inline-flex h-8 w-8 items-center justify-center rounded-md border border-slate-300 bg-white transition hover:border-sky-600 hover:bg-sky-50 disabled:cursor-not-allowed disabled:opacity-45 [&.qalma-command-active]:border-sky-600 [&.qalma-command-active]:bg-sky-50';
  protected readonly languageSelectClass =
    'h-8 rounded-md border border-slate-300 bg-white px-2 text-xs font-medium text-slate-700 transition hover:border-sky-600 hover:bg-sky-50 hover:text-sky-900 focus:border-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-200';

  protected preserveSelection(event: MouseEvent): void {
    event.preventDefault();
  }

  protected setCodeBlockLanguage(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      this.editor().execute('setCodeBlockLanguage', target.value);
    }
  }

  protected isTextColorActive(color: string): boolean {
    return this.textColor() === color;
  }

  protected isBackgroundColorActive(color: string): boolean {
    return this.backgroundColor() === color;
  }

  protected isHighlightColorActive(color: string): boolean {
    return this.highlightColor() === color;
  }

  protected canSetTextColor(color: string): boolean {
    return this.editor().canExecute('setTextColor', color);
  }

  protected canSetBackgroundColor(color: string): boolean {
    return this.editor().canExecute('setBackgroundColor', color);
  }

  protected canSetHighlight(color: string): boolean {
    return this.editor().canExecute('setHighlight', color);
  }

  protected canUnsetTextColor(): boolean {
    return this.editor().canExecute('unsetTextColor');
  }

  protected canUnsetBackgroundColor(): boolean {
    return this.editor().canExecute('unsetBackgroundColor');
  }

  protected setTextColor(color: string): void {
    this.editor().execute('setTextColor', color);
  }

  protected setBackgroundColor(color: string): void {
    this.editor().execute('setBackgroundColor', color);
  }

  protected setHighlight(color: string): void {
    this.editor().execute('setHighlight', color);
  }

  protected unsetTextColor(): void {
    this.editor().execute('unsetTextColor');
  }

  protected unsetBackgroundColor(): void {
    this.editor().execute('unsetBackgroundColor');
  }
}
