import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { QalmaCommand, QalmaEditorController, QalmaToolbar } from '@qalma/editor';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideAlignCenter,
  lucideAlignJustify,
  lucideAlignLeft,
  lucideAlignRight,
  lucideBaseline,
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
  lucideOutdent,
  lucidePaintBucket,
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
  PLAYGROUND_CODE_BLOCK_LANGUAGES,
  PLAYGROUND_DEFAULT_CODE_BLOCK_LANGUAGE,
} from './code-block';
import { PlaygroundColorPicker, PlaygroundColorSwatch } from './color-picker';
import {
  PLAYGROUND_EXAMPLE_IMAGE_ALT,
  PLAYGROUND_EXAMPLE_IMAGE_SRC,
} from './image';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, QalmaCommand, QalmaToolbar, PlaygroundColorPicker],
  providers: [
    provideIcons({
      lucideAlignCenter,
      lucideAlignJustify,
      lucideAlignLeft,
      lucideAlignRight,
      lucideBaseline,
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
      lucideOutdent,
      lucidePaintBucket,
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
  selector: 'app-playground-toolbar',
  template: `
    <qalma-toolbar
      class="flex flex-wrap items-center gap-1 border-b border-border bg-secondary/40 p-2"
    >
      <!-- Block style -->
      <div class="flex items-center gap-0.5">
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
      </div>

      <span [class]="separatorClass" aria-hidden="true"></span>

      <!-- Inline formatting -->
      <div class="flex items-center gap-0.5">
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
      </div>

      <span [class]="separatorClass" aria-hidden="true"></span>

      <!-- Color: three distinct, labelled pickers -->
      <div class="flex items-center gap-0.5">
        <app-playground-color-picker
          [editor]="editor()"
          label="Text color"
          icon="lucideBaseline"
          [colors]="textColors"
          setCommand="setTextColor"
          unsetCommand="unsetTextColor"
          queryKey="textColor"
        />
        <app-playground-color-picker
          [editor]="editor()"
          label="Highlight"
          icon="lucideHighlighter"
          [colors]="highlightColors"
          setCommand="setHighlight"
          unsetCommand="unsetHighlight"
          queryKey="highlightColor"
        />
        <app-playground-color-picker
          [editor]="editor()"
          label="Background"
          icon="lucidePaintBucket"
          [colors]="backgroundColors"
          setCommand="setBackgroundColor"
          unsetCommand="unsetBackgroundColor"
          queryKey="backgroundColor"
        />
        <button
          type="button"
          [class]="commandClass"
          qalmaCommand="clearFormatting"
          title="Clear formatting"
          aria-label="Clear formatting"
        >
          <ng-icon name="lucideEraser" aria-hidden="true" />
        </button>
      </div>

      <span [class]="separatorClass" aria-hidden="true"></span>

      <!-- Alignment -->
      <div class="flex items-center gap-0.5">
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
      </div>

      <span [class]="separatorClass" aria-hidden="true"></span>

      <!-- Lists & blocks -->
      <div class="flex items-center gap-0.5">
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
          qalmaCommand="liftListItem"
          title="Outdent"
          aria-label="Outdent"
        >
          <ng-icon name="lucideOutdent" aria-hidden="true" />
        </button>
        <button
          type="button"
          [class]="commandClass"
          qalmaCommand="sinkListItem"
          title="Indent"
          aria-label="Indent"
        >
          <ng-icon name="lucideIndent" aria-hidden="true" />
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
      </div>

      <span [class]="separatorClass" aria-hidden="true"></span>

      <!-- Insert -->
      <div class="flex items-center gap-0.5">
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
      </div>

      <span [class]="separatorClass" aria-hidden="true"></span>

      <!-- History -->
      <div class="flex items-center gap-0.5">
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
      </div>
    </qalma-toolbar>
  `,
})
export class PlaygroundToolbar {
  readonly editor = input.required<QalmaEditorController>();
  readonly requestLink = output<MouseEvent>();
  readonly requestImageLink = output<void>();
  readonly requestImageUpload = output<void>();

  protected readonly canInsertImage = computed(() =>
    this.editor().canExecute('insertImage', {
      src: PLAYGROUND_EXAMPLE_IMAGE_SRC,
      alt: PLAYGROUND_EXAMPLE_IMAGE_ALT,
    }),
  );
  protected readonly canInsertUploadedImage = computed(() =>
    this.editor().canExecute('insertImage', {
      src: '/uploads/example-image.png',
      alt: PLAYGROUND_EXAMPLE_IMAGE_ALT,
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
      PLAYGROUND_DEFAULT_CODE_BLOCK_LANGUAGE,
  );

  protected readonly codeBlockLanguages = PLAYGROUND_CODE_BLOCK_LANGUAGES;
  protected readonly highlightColors: readonly PlaygroundColorSwatch[] = [
    { label: 'Yellow highlight', value: 'rgb(254, 240, 138)' },
    { label: 'Mint highlight', value: 'rgb(187, 247, 208)' },
    { label: 'Sky highlight', value: 'rgb(186, 230, 253)' },
    { label: 'Pink highlight', value: 'rgb(251, 207, 232)' },
  ];
  protected readonly textColors: readonly PlaygroundColorSwatch[] = [
    { label: 'Ink text color', value: 'rgb(28, 25, 23)' },
    { label: 'Sepia text color', value: 'rgb(140, 90, 43)' },
    { label: 'Rose text color', value: 'rgb(190, 18, 60)' },
    { label: 'Indigo text color', value: 'rgb(67, 56, 202)' },
  ];
  protected readonly backgroundColors: readonly PlaygroundColorSwatch[] = [
    { label: 'Yellow background color', value: 'rgb(254, 240, 138)' },
    { label: 'Mint background color', value: 'rgb(187, 247, 208)' },
    { label: 'Sky background color', value: 'rgb(186, 230, 253)' },
    { label: 'Pink background color', value: 'rgb(251, 207, 232)' },
  ];

  protected readonly commandClass =
    'inline-flex h-9 w-9 items-center justify-center rounded-md border border-transparent text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45 [&.qalma-command-active]:border-accent/40 [&.qalma-command-active]:bg-accent-subtle [&.qalma-command-active]:text-accent';
  protected readonly separatorClass = 'mx-1 h-6 w-px shrink-0 bg-border';
  protected readonly languageSelectClass =
    'h-9 rounded-md border border-border bg-card px-2 text-xs font-medium text-foreground transition hover:border-accent focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/30';

  protected preserveSelection(event: MouseEvent): void {
    event.preventDefault();
  }

  protected setCodeBlockLanguage(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      this.editor().execute('setCodeBlockLanguage', target.value);
    }
  }
}
