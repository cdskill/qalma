import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  input,
  output,
} from '@angular/core';
import { QalmaEditorController, QalmaToolbar } from '@qalma/editor';
import {
  QALMA_TOOLBAR_ALIGN,
  QALMA_TOOLBAR_CLEAR_FORMATTING,
  QALMA_TOOLBAR_HEADINGS,
  QALMA_TOOLBAR_HISTORY,
  QALMA_TOOLBAR_INLINE_MARKS,
  QALMA_TOOLBAR_LISTS,
  QALMA_TOOLBAR_TABLE_INSERT,
  QALMA_TOOLBAR_TABLE_OPS,
  QALMA_TOOLBAR_UNSET_LINK,
  QalmaToolbarRegistry,
  ToolbarGroup,
  provideQalmaToolbarIcons,
} from '@qalma/kit';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideBaseline,
  lucideHighlighter,
  lucideImage,
  lucideImageUp,
  lucideLink,
  lucidePaintBucket,
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
  imports: [NgIcon, QalmaToolbar, QalmaToolbarRegistry, PlaygroundColorPicker],
  providers: [
    provideQalmaToolbarIcons(),
    provideIcons({
      lucideBaseline,
      lucideHighlighter,
      lucideImage,
      lucideImageUp,
      lucideLink,
      lucidePaintBucket,
    }),
  ],
  selector: 'app-playground-toolbar',
  template: `
    <qalma-toolbar
      class="flex w-fit max-w-full flex-wrap items-center gap-0.5 border-b border-border bg-secondary/40 px-1.5 py-1.5"
    >
      <!-- Custom controls that don't fit a plain command button, referenced by
           the registry groups below via { template } items. -->
      <ng-template #colorControls>
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
      </ng-template>

      <ng-template #codeLanguageControl>
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
      </ng-template>

      <ng-template #insertControls>
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
          <ng-icon
            [class]="iconClass"
            name="lucideImageUp"
            aria-hidden="true"
          />
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
      </ng-template>

      <qalma-toolbar-registry
        [groups]="
          toolbarGroups(colorControls, codeLanguageControl, insertControls)
        "
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
  protected readonly languageSelectClass =
    'h-[1.85rem] cursor-pointer rounded-[0.4rem] border border-border bg-card px-1.5 text-xs font-medium text-foreground transition hover:border-accent focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/30';

  /**
   * Assembles the declarative registry, interleaving the custom-control
   * templates (color pickers, code-block language select, image/link buttons)
   * between the shared command fragments. Table editing ops only appear while
   * the selection is inside a table.
   */
  protected toolbarGroups(
    colorControls: TemplateRef<unknown>,
    codeLanguageControl: TemplateRef<unknown>,
    insertControls: TemplateRef<unknown>,
  ): readonly ToolbarGroup[] {
    return [
      QALMA_TOOLBAR_HEADINGS,
      QALMA_TOOLBAR_INLINE_MARKS,
      [{ template: colorControls }, QALMA_TOOLBAR_CLEAR_FORMATTING],
      QALMA_TOOLBAR_ALIGN,
      [...QALMA_TOOLBAR_LISTS, { template: codeLanguageControl }],
      [{ template: insertControls }, QALMA_TOOLBAR_UNSET_LINK],
      [
        QALMA_TOOLBAR_TABLE_INSERT,
        ...(this.inTable() ? QALMA_TOOLBAR_TABLE_OPS : []),
      ],
      QALMA_TOOLBAR_HISTORY,
    ];
  }

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
