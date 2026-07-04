import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { QalmaEditorController, QalmaToolbar } from '@qalma/editor';
import { QalmaToolbarButton } from '@qalma/kit';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideAlignCenter,
  lucideAlignJustify,
  lucideAlignLeft,
  lucideAlignRight,
  lucideBaseline,
  lucideBetweenHorizontalEnd,
  lucideBetweenVerticalEnd,
  lucideBold,
  lucideCode,
  lucideColumns3,
  lucideEraser,
  lucideHeading,
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
  lucideLetterText,
  lucideOutdent,
  lucidePaintBucket,
  lucidePilcrow,
  lucideRedo2,
  lucideRows3,
  lucideSquareCode,
  lucideStrikethrough,
  lucideSubscript,
  lucideSuperscript,
  lucideTable,
  lucideTextQuote,
  lucideTrash2,
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
  imports: [
    NgIcon,
    QalmaToolbar,
    QalmaToolbarButton,
    PlaygroundColorPicker,
  ],
  providers: [
    provideIcons({
      lucideAlignCenter,
      lucideAlignJustify,
      lucideAlignLeft,
      lucideAlignRight,
      lucideBaseline,
      lucideBetweenHorizontalEnd,
      lucideBetweenVerticalEnd,
      lucideBold,
      lucideCode,
      lucideColumns3,
      lucideEraser,
      lucideHeading,
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
      lucideLetterText,
      lucideOutdent,
      lucidePaintBucket,
      lucidePilcrow,
      lucideRedo2,
      lucideRows3,
      lucideSquareCode,
      lucideStrikethrough,
      lucideSubscript,
      lucideSuperscript,
      lucideTable,
      lucideTextQuote,
      lucideTrash2,
      lucideUnderline,
      lucideUndo2,
      lucideUnlink,
    }),
  ],
  selector: 'app-playground-toolbar',
  template: `
    <qalma-toolbar
      class="flex w-fit max-w-full flex-wrap items-center gap-0.5 border-b border-border bg-secondary/40 px-1.5 py-1.5"
    >
      <!-- Block style -->
      <qalma-toolbar-button
        command="setParagraph"
        icon="lucidePilcrow"
        label="Paragraph"
      />
      <qalma-toolbar-button
        command="toggleHeading1"
        icon="lucideHeading1"
        label="Heading 1"
      />
      <qalma-toolbar-button
        command="toggleHeading2"
        icon="lucideHeading2"
        label="Heading 2"
      />
      <qalma-toolbar-button
        command="toggleHeading3"
        icon="lucideHeading3"
        label="Heading 3"
      />

      <span [class]="separatorClass" aria-hidden="true"></span>

      <!-- Inline formatting -->
      <qalma-toolbar-button
        command="toggleBold"
        icon="lucideBold"
        label="Bold"
      />
      <qalma-toolbar-button
        command="toggleItalic"
        icon="lucideItalic"
        label="Italic"
      />
      <qalma-toolbar-button
        command="toggleUnderline"
        icon="lucideUnderline"
        label="Underline"
      />
      <qalma-toolbar-button
        command="toggleStrike"
        icon="lucideStrikethrough"
        label="Strikethrough"
      />
      <qalma-toolbar-button
        command="toggleInlineCode"
        icon="lucideCode"
        label="Inline code"
      />
      <qalma-toolbar-button
        command="toggleMonospace"
        icon="lucideLetterText"
        label="Monospace"
      />
      <qalma-toolbar-button
        command="toggleSubscript"
        icon="lucideSubscript"
        label="Subscript"
      />
      <qalma-toolbar-button
        command="toggleSuperscript"
        icon="lucideSuperscript"
        label="Superscript"
      />

      <span [class]="separatorClass" aria-hidden="true"></span>

      <!-- Color: three distinct, labelled pickers -->
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
      <qalma-toolbar-button
        command="clearFormatting"
        icon="lucideEraser"
        label="Clear formatting"
      />

      <span [class]="separatorClass" aria-hidden="true"></span>

      <!-- Alignment -->
      <qalma-toolbar-button
        command="setTextAlignLeft"
        icon="lucideAlignLeft"
        label="Align left"
      />
      <qalma-toolbar-button
        command="setTextAlignCenter"
        icon="lucideAlignCenter"
        label="Align center"
      />
      <qalma-toolbar-button
        command="setTextAlignRight"
        icon="lucideAlignRight"
        label="Align right"
      />
      <qalma-toolbar-button
        command="setTextAlignJustify"
        icon="lucideAlignJustify"
        label="Justify"
      />

      <span [class]="separatorClass" aria-hidden="true"></span>

      <!-- Lists & blocks -->
      <qalma-toolbar-button
        command="toggleBulletList"
        icon="lucideList"
        label="Bullet list"
      />
      <qalma-toolbar-button
        command="toggleOrderedList"
        icon="lucideListOrdered"
        label="Ordered list"
      />
      <qalma-toolbar-button
        command="toggleTaskList"
        icon="lucideListTodo"
        label="Task list"
      />
      <qalma-toolbar-button
        command="liftListItem"
        icon="lucideOutdent"
        label="Outdent"
      />
      <qalma-toolbar-button
        command="sinkListItem"
        icon="lucideIndent"
        label="Indent"
      />
      <qalma-toolbar-button
        command="toggleBlockquote"
        icon="lucideTextQuote"
        label="Blockquote"
      />
      <qalma-toolbar-button
        command="toggleCodeBlock"
        icon="lucideSquareCode"
        label="Code block"
      />
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

      <span [class]="separatorClass" aria-hidden="true"></span>

      <!-- Insert -->
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
        <ng-icon [class]="iconClass" name="lucideImage" aria-hidden="true" />
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
        <ng-icon [class]="iconClass" name="lucideImageUp" aria-hidden="true" />
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
        <ng-icon [class]="iconClass" name="lucideLink" aria-hidden="true" />
      </button>
      <qalma-toolbar-button
        command="unsetLink"
        icon="lucideUnlink"
        label="Unlink"
      />

      <span [class]="separatorClass" aria-hidden="true"></span>

      <!-- Table -->
      <qalma-toolbar-button
        command="insertTable"
        icon="lucideTable"
        label="Insert table"
      />
      @if (inTable()) {
        <qalma-toolbar-button
        command="addRowAfter"
          icon="lucideBetweenHorizontalEnd"
          label="Add row"
      />
        <qalma-toolbar-button
        command="addColumnAfter"
          icon="lucideBetweenVerticalEnd"
          label="Add column"
      />
        <qalma-toolbar-button
        command="deleteRow"
          icon="lucideRows3"
          label="Delete row"
      />
        <qalma-toolbar-button
        command="deleteColumn"
          icon="lucideColumns3"
          label="Delete column"
      />
        <qalma-toolbar-button
        command="toggleHeaderRow"
          icon="lucideHeading"
          label="Toggle header row"
      />
        <qalma-toolbar-button
        command="deleteTable"
          icon="lucideTrash2"
          label="Delete table"
      />
      }

      <span [class]="separatorClass" aria-hidden="true"></span>

      <!-- History -->
      <qalma-toolbar-button
        command="undo"
        icon="lucideUndo2"
        label="Undo"
      />
      <qalma-toolbar-button
        command="redo"
        icon="lucideRedo2"
        label="Redo"
      />
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
  protected readonly inTable = computed(
    () => this.editor().query<boolean>('isInTable') ?? false,
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
    'inline-flex h-[1.85rem] w-[1.85rem] cursor-pointer items-center justify-center rounded-[0.4rem] border border-transparent text-muted-foreground transition hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45 [&.qalma-command-active]:border-accent/40 [&.qalma-command-active]:bg-accent-subtle [&.qalma-command-active]:text-accent';
  protected readonly iconClass = 'text-[0.9rem]';
  protected readonly separatorClass =
    'mx-0.5 h-5 w-px shrink-0 self-center bg-border';
  protected readonly languageSelectClass =
    'h-[1.85rem] cursor-pointer rounded-[0.4rem] border border-border bg-card px-1.5 text-xs font-medium text-foreground transition hover:border-accent focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/30';

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
