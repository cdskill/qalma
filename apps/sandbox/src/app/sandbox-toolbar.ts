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
  QALMA_TOOLBAR_UNSET_LINK,
  QalmaToolbarRegistry,
  TOOLBAR_BUTTON_CLASS,
  ToolbarCommandItem,
  ToolbarGroup,
  provideQalmaToolbarIcons,
} from '@qalma/kit';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
  lucideHighlighter,
  lucideImage,
  lucideImageUp,
  lucideLink,
} from '@ng-icons/lucide';

import {
  SANDBOX_CODE_BLOCK_LANGUAGES,
  SANDBOX_DEFAULT_CODE_BLOCK_LANGUAGE,
} from './sandbox-code-block';
import {
  SANDBOX_EXAMPLE_IMAGE_ALT,
  SANDBOX_EXAMPLE_IMAGE_SRC,
} from './sandbox-image';

const HIGHLIGHT_ITEM: ToolbarCommandItem = {
  command: 'setHighlight',
  icon: 'lucideHighlighter',
  label: 'Highlight',
};
const UNSET_HIGHLIGHT_ITEM: ToolbarCommandItem = {
  command: 'unsetHighlight',
  icon: 'lucideEraser',
  label: 'Clear highlight',
};

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [NgIcon, QalmaToolbar, QalmaToolbarRegistry],
  providers: [
    provideQalmaToolbarIcons(),
    provideIcons({
      lucideHighlighter,
      lucideImage,
      lucideImageUp,
      lucideLink,
    }),
  ],
  selector: 'app-sandbox-toolbar',
  template: `
    <qalma-toolbar
      class="flex w-fit max-w-full flex-wrap items-center gap-0.5 border-b border-border bg-secondary/40 px-1.5 py-1.5"
    >
      <ng-template #imageControls>
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
      </ng-template>

      <ng-template #highlightSwatches>
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
              class="block h-4 w-4 rounded-sm border border-border"
              [style.background-color]="color.value"
              aria-hidden="true"
            ></span>
          </button>
        }
      </ng-template>

      <ng-template #colorControls>
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
              class="block h-4 w-4 rounded-sm border border-border"
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
          <ng-icon [class]="iconClass" name="lucideEraser" aria-hidden="true" />
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
              class="block h-4 w-4 rounded-sm border border-border"
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
          <ng-icon [class]="iconClass" name="lucideEraser" aria-hidden="true" />
        </button>
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

      <ng-template #linkControl>
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
          toolbarGroups(
            imageControls,
            highlightSwatches,
            colorControls,
            codeLanguageControl,
            linkControl
          )
        "
      />
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

  protected readonly commandClass = TOOLBAR_BUTTON_CLASS;
  protected readonly iconClass = 'text-[0.9rem]';
  protected readonly colorSwatchClass =
    'inline-flex h-[1.85rem] w-[1.85rem] cursor-pointer items-center justify-center rounded-[0.4rem] border border-border bg-card transition hover:border-accent disabled:cursor-not-allowed disabled:opacity-45 [&.qalma-command-active]:border-accent [&.qalma-command-active]:bg-accent-subtle';
  protected readonly languageSelectClass =
    'h-[1.85rem] cursor-pointer rounded-[0.4rem] border border-border bg-card px-1.5 text-xs font-medium text-foreground transition hover:border-accent focus:border-accent focus:outline-none focus:ring-2 focus:ring-ring/30';

  /**
   * Assembles the declarative registry in the sandbox's own order, interleaving
   * the custom controls (image/upload, highlight & colour swatches, code-block
   * language select, link) as `<ng-template>` items between the shared command
   * fragments.
   */
  protected toolbarGroups(
    imageControls: TemplateRef<unknown>,
    highlightSwatches: TemplateRef<unknown>,
    colorControls: TemplateRef<unknown>,
    codeLanguageControl: TemplateRef<unknown>,
    linkControl: TemplateRef<unknown>,
  ): readonly ToolbarGroup[] {
    return [
      QALMA_TOOLBAR_HEADINGS,
      [{ template: imageControls }],
      QALMA_TOOLBAR_ALIGN,
      QALMA_TOOLBAR_INLINE_MARKS,
      [HIGHLIGHT_ITEM, { template: highlightSwatches }, UNSET_HIGHLIGHT_ITEM],
      [{ template: colorControls }, QALMA_TOOLBAR_CLEAR_FORMATTING],
      [...QALMA_TOOLBAR_LISTS, { template: codeLanguageControl }],
      [{ template: linkControl }, QALMA_TOOLBAR_UNSET_LINK],
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
