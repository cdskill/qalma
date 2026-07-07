import { TestBed } from '@angular/core/testing';
import {
  BlockquotePlugin,
  CODE_BLOCK_PLUGIN_DEFAULT_OPTIONS,
  ClearFormattingPlugin,
  CodeBlockPlugin,
  ColorPlugin,
  HardBreakPlugin,
  HEADINGS_PLUGIN_DEFAULT_OPTIONS,
  HeadingsPlugin,
  HIGHLIGHT_PLUGIN_DEFAULT_OPTIONS,
  HighlightPlugin,
  HISTORY_PLUGIN_DEFAULT_OPTIONS,
  HistoryPlugin,
  IMAGE_PLUGIN_DEFAULT_OPTIONS,
  ImagePlugin,
  ImageState,
  INLINE_CODE_PLUGIN_DEFAULT_OPTIONS,
  InlineCodePlugin,
  LINK_PLUGIN_DEFAULT_OPTIONS,
  LinkPlugin,
  ListsPlugin,
  MENTION_PLUGIN_DEFAULT_OPTIONS,
  MentionPlugin,
  MentionState,
  MonospacePlugin,
  PASTE_RULES_PLUGIN_DEFAULT_OPTIONS,
  PasteRulesPlugin,
  PLACEHOLDER_PLUGIN_DEFAULT_OPTIONS,
  PlaceholderPlugin,
  QalmaEditorController,
  SLASH_COMMAND_PLUGIN_DEFAULT_OPTIONS,
  SlashCommandPlugin,
  SlashCommandState,
  SubscriptSuperscriptPlugin,
  TaskItemState,
  TaskListPlugin,
  TEXT_ALIGN_PLUGIN_DEFAULT_OPTIONS,
  TextAlignPlugin,
  TextFormattingKit,
  TrailingParagraphPlugin,
  createQalmaEditor,
  createQalmaPlugin,
} from '@qalma/editor';
import { QalmaLinkPopover } from '@qalma/kit';
import { TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { App } from './app';
import {
  SANDBOX_EXAMPLE_IMAGE_ALT,
  SANDBOX_EXAMPLE_IMAGE_SRC,
  SANDBOX_EXAMPLE_IMAGE_TITLE,
} from './sandbox-image';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, QalmaLinkPopover],
    }).compileComponents();
  });

  it('should render the editor sandbox title', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h1')?.textContent).toContain(
      'ProseMirror editor foundation',
    );
    expect(compiled.querySelectorAll('[role="toolbar"] button')).toHaveLength(
      46,
    );
    expect(
      compiled.querySelector('[aria-label="Clear formatting"]'),
    ).not.toBeNull();
    expect(
      compiled.querySelector('[aria-label="Align center"]'),
    ).not.toBeNull();
    expect(compiled.querySelector('[aria-label="Highlight"]')).not.toBeNull();
    expect(
      compiled.querySelector('[aria-label="Yellow highlight"]'),
    ).not.toBeNull();
    expect(
      compiled.querySelector('[aria-label="Teal text color"]'),
    ).not.toBeNull();
    expect(
      compiled.querySelector('[aria-label="Yellow background color"]'),
    ).not.toBeNull();
    expect(compiled.querySelector('[aria-label="Subscript"]')).not.toBeNull();
    expect(compiled.querySelector('[aria-label="Superscript"]')).not.toBeNull();
    expect(compiled.querySelector('[aria-label="Inline code"]')).not.toBeNull();
    expect(compiled.querySelector('[aria-label="Monospace"]')).not.toBeNull();
    expect(compiled.querySelector('[aria-label="Task list"]')).not.toBeNull();
    expect(compiled.querySelector('[aria-label="Image URL"]')).not.toBeNull();
    expect(
      compiled.querySelector('[aria-label="Upload image"]'),
    ).not.toBeNull();
    expect(
      compiled.querySelector('[aria-label="Upload image file"]'),
    ).not.toBeNull();
    expect(compiled.querySelector('[aria-label="Link URL"]')).toBeNull();
    expect(compiled.querySelector('.ProseMirror')?.textContent).toContain(
      'Qalma',
    );
    expect(compiled.querySelector('.ProseMirror ul')?.textContent).toContain(
      'Compose plugins in TypeScript.',
    );
    expect(compiled.querySelector('.ProseMirror ol')?.textContent).toContain(
      'Pick capabilities for the current product surface.',
    );
    expect(
      compiled.querySelector('.ProseMirror ul[data-type="task-list"]')
        ?.textContent,
    ).toContain('Ship engine behavior from a plugin.');
    expect(
      compiled.querySelector<HTMLInputElement>(
        '.ProseMirror li[data-type="task-item"] input[type="checkbox"]',
      )?.checked,
    ).toBeTrue();
    expect(
      compiled.querySelector('.ProseMirror blockquote')?.textContent,
    ).toContain(
      'Quote important passages without taking ownership away from the consuming app.',
    );
    expect(
      compiled.querySelector('.ProseMirror code.language-typescript')
        ?.textContent,
    ).toContain('createQalmaEditor');
    expect(
      compiled.querySelector('.ProseMirror code.language-go')?.textContent,
    ).toContain('fmt.Println');
    expect(
      compiled.querySelector(
        '.ProseMirror code.language-typescript .hljs-keyword',
      )?.textContent,
    ).toContain('import');
    expect(
      compiled.querySelector('.ProseMirror code.language-go .hljs-keyword')
        ?.textContent,
    ).toContain('package');
    expect(
      compiled.querySelector(
        '.ProseMirror span[style*="color: rgb(14, 116, 144)"]',
      )?.textContent,
    ).toContain('color');
    expect(
      compiled.querySelector('.ProseMirror [data-qalma-mention]')?.textContent,
    ).toBe('@Ada Lovelace');
    expect(
      compiled.querySelector<HTMLImageElement>('.ProseMirror img')?.alt,
    ).toBe(SANDBOX_EXAMPLE_IMAGE_ALT);
    expect(
      compiled.querySelector<HTMLImageElement>('.ProseMirror img')?.src,
    ).toBe(SANDBOX_EXAMPLE_IMAGE_SRC);
    expect(
      compiled.querySelector<HTMLImageElement>('.ProseMirror img')?.title,
    ).toBe(SANDBOX_EXAMPLE_IMAGE_TITLE);
    expect(compiled.querySelector('.ProseMirror mark')?.textContent).toContain(
      'highlight',
    );
    expect(
      compiled.querySelector('.ProseMirror p code:not([class])')?.textContent,
    ).toBe('inline code');
    expect(
      compiled.querySelector('.ProseMirror [data-qalma-monospace]')
        ?.textContent,
    ).toBe('monospace labels');
    expect(compiled.querySelector('.ProseMirror sub')?.textContent).toBe('2');
    expect(compiled.querySelector('.ProseMirror sup')?.textContent).toBe('2');
    expect(
      Array.from(
        compiled.querySelectorAll('.ProseMirror .sandbox-code-block-language'),
      ).map((element) => element.textContent?.trim()),
    ).toEqual(['TypeScript', 'Go']);
    expect(
      Array.from(
        compiled.querySelectorAll<HTMLButtonElement>(
          '.ProseMirror .sandbox-code-block-copy',
        ),
      ).map((button) => button.getAttribute('aria-label')),
    ).toEqual(['Copy TypeScript code', 'Copy Go code']);
  });

  it('should render icon-only actions in the link popover', async () => {
    const fixture = TestBed.createComponent(QalmaLinkPopover);
    const popover = {
      editing: false,
      element: null,
      href: 'https://angular.dev',
      left: 16,
      rel: 'noopener noreferrer',
      target: '_blank' as const,
      text: 'Angular',
      top: 16,
    };

    fixture.componentRef.setInput('href', popover.href);
    fixture.componentRef.setInput('popover', popover);
    await fixture.whenStable();
    fixture.detectChanges();

    let compiled = fixture.nativeElement as HTMLElement;

    expect(
      Array.from(compiled.querySelectorAll('button')).map((button) =>
        button.getAttribute('aria-label'),
      ),
    ).toEqual(['Edit link', 'Unlink']);
    expect(compiled.querySelectorAll('ng-icon').length).toBeGreaterThanOrEqual(
      3,
    );

    fixture.componentRef.setInput('popover', {
      ...popover,
      editing: true,
    });
    await fixture.whenStable();
    fixture.detectChanges();
    compiled = fixture.nativeElement as HTMLElement;

    expect(
      Array.from(compiled.querySelectorAll('button')).map((button) =>
        button.getAttribute('aria-label'),
      ),
    ).toEqual(['Save link', 'Cancel']);
    expect(compiled.querySelectorAll('ng-icon').length).toBeGreaterThanOrEqual(
      3,
    );
  });

  it('should expose code block commands through the public plugin', () => {
    const snippet =
      'const language = "typescript"; const enabled = language.length > 0; console.log({ enabled, language });';
    const serializedSnippet = snippet.replace('>', '&gt;');
    const editor = createQalmaEditor({
      content: `<p>${snippet}</p>`,
      plugins: [
        CodeBlockPlugin.configure({
          languages: ['plaintext', 'typescript', 'javascript', 'csharp', 'go'],
          defaultLanguage: 'typescript',
        }),
      ],
    });
    const host = document.createElement('div');

    editor.mount(host);

    expect(CodeBlockPlugin.key).toBe('codeBlock');
    expect(editor.execute('toggleCodeBlock')).toBeTrue();
    expect(editor.isCommandActive('toggleCodeBlock')).toBeTrue();
    expect(editor.query<string>('codeBlockLanguage')).toBe('typescript');
    expect(editor.html()).toBe(
      `<pre><code class="language-typescript">${serializedSnippet}</code></pre>`,
    );
    expect(editor.execute('setCodeBlockLanguage', 'go')).toBeTrue();
    expect(editor.query<string>('codeBlockLanguage')).toBe('go');
    expect(editor.html()).toBe(
      `<pre><code class="language-go">${serializedSnippet}</code></pre>`,
    );
    expect(editor.execute('toggleCodeBlock')).toBeTrue();
    expect(editor.isCommandActive('toggleCodeBlock')).toBeFalse();
    expect(editor.query<string>('codeBlockLanguage')).toBeNull();
    expect(editor.html()).toBe(`<p>${serializedSnippet}</p>`);

    editor.unmount(host);
  });

  it('should expose clear formatting through the public plugin', () => {
    const editor = createQalmaEditor({
      content:
        '<h2><strong><em><a href="https://angular.dev">Qalma</a></em></strong></h2>',
      plugins: [
        HeadingsPlugin,
        ...TextFormattingKit,
        LinkPlugin,
        ClearFormattingPlugin,
      ],
    });
    const host = document.createElement('div');

    editor.mount(host);

    expect(ClearFormattingPlugin.key).toBe('clearFormatting');
    expect(editor.execute('selectLink')).toBeTrue();
    expect(editor.canExecute('clearFormatting')).toBeTrue();
    expect(editor.execute('clearFormatting')).toBeTrue();
    expect(editor.html()).toBe('<p>Qalma</p>');
    expect(editor.canExecute('clearFormatting')).toBeFalse();
    expect(editor.execute('clearFormatting')).toBeFalse();

    editor.unmount(host);
  });

  it('should expose inline code through the public plugin', () => {
    const editor = createQalmaEditor({
      content: '<p>Use createQalmaEditor to start.</p>',
      plugins: [InlineCodePlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);
    selectEditorRange(editor, 5, 22);

    expect(InlineCodePlugin.key).toBe('inlineCode');
    expect(editor.canExecute('toggleInlineCode')).toBeTrue();
    expect(editor.execute('toggleInlineCode')).toBeTrue();
    expect(editor.isCommandActive('toggleInlineCode')).toBeTrue();
    expect(editor.html()).toBe(
      '<p>Use <code>createQalmaEditor</code> to start.</p>',
    );
    expect(editor.execute('toggleInlineCode')).toBeTrue();
    expect(editor.isCommandActive('toggleInlineCode')).toBeFalse();
    expect(editor.html()).toBe('<p>Use createQalmaEditor to start.</p>');

    editor.unmount(host);
  });

  it('should parse serialized inline code through the public plugin', () => {
    const editor = createQalmaEditor({
      content: '<p>Use <code>createQalmaEditor</code> to start.</p>',
      plugins: [InlineCodePlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);
    selectEditorRange(editor, 5, 22);

    expect(editor.html()).toBe(
      '<p>Use <code>createQalmaEditor</code> to start.</p>',
    );
    expect(editor.isCommandActive('toggleInlineCode')).toBeTrue();

    editor.unmount(host);
  });

  it('should expose monospace through the public plugin', () => {
    const editor = createQalmaEditor({
      content: '<p>Use PRODUCT_TOKEN as a label.</p>',
      plugins: [MonospacePlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);
    selectEditorRange(editor, 5, 18);

    expect(MonospacePlugin.key).toBe('monospace');
    expect(editor.canExecute('toggleMonospace')).toBeTrue();
    expect(editor.execute('toggleMonospace')).toBeTrue();
    expect(editor.isCommandActive('toggleMonospace')).toBeTrue();
    expect(editor.html()).toBe(
      '<p>Use <span data-qalma-monospace="">PRODUCT_TOKEN</span> as a label.</p>',
    );
    expect(editor.execute('toggleMonospace')).toBeTrue();
    expect(editor.isCommandActive('toggleMonospace')).toBeFalse();
    expect(editor.html()).toBe('<p>Use PRODUCT_TOKEN as a label.</p>');

    editor.unmount(host);
  });

  it('should parse serialized monospace through the public plugin', () => {
    const editor = createQalmaEditor({
      content:
        '<p>Use <span data-qalma-monospace="">PRODUCT_TOKEN</span> as a label.</p>',
      plugins: [MonospacePlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);
    selectEditorRange(editor, 5, 18);

    expect(editor.html()).toBe(
      '<p>Use <span data-qalma-monospace="">PRODUCT_TOKEN</span> as a label.</p>',
    );
    expect(editor.isCommandActive('toggleMonospace')).toBeTrue();

    editor.unmount(host);
  });

  it('should apply inline code with the Mod-e shortcut', () => {
    const editor = createQalmaEditor({
      content: '<p>Use createQalmaEditor to start.</p>',
      plugins: [InlineCodePlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);
    selectEditorRange(editor, 5, 22);

    const event = dispatchModKey(editor, 'e');

    expect(event.defaultPrevented).toBeTrue();
    expect(editor.html()).toBe(
      '<p>Use <code>createQalmaEditor</code> to start.</p>',
    );

    editor.unmount(host);
  });

  it('should convert matching backticks to inline code', () => {
    const editor = createQalmaEditor({
      content: '<p>`createQalmaEditor</p>',
      plugins: [InlineCodePlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);
    selectEditorRange(editor, 19, 19);

    expect(typeText(editor, '`')).toBeTrue();
    expect(editor.html()).toBe('<p><code>createQalmaEditor</code></p>');

    editor.unmount(host);
  });

  it('should expose configurable inline code defaults and validation', () => {
    const configured = InlineCodePlugin.configure({
      inputRules: false,
    });

    expect(INLINE_CODE_PLUGIN_DEFAULT_OPTIONS).toEqual({
      inputRules: true,
    });
    expect(InlineCodePlugin.options).toEqual(
      INLINE_CODE_PLUGIN_DEFAULT_OPTIONS,
    );
    expect(configured.options).toEqual({
      inputRules: false,
    });
    expect(() =>
      InlineCodePlugin.configure({
        inputRules: 'yes' as never,
      }),
    ).toThrowError('InlineCodePlugin inputRules must be a boolean.');
  });

  it('should expose text and background color through the public plugin', () => {
    const editor = createQalmaEditor({
      content: '<p>Qalma</p>',
      plugins: [ColorPlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);
    selectEditorRange(editor, 1, 6);

    expect(ColorPlugin.key).toBe('color');
    expect(editor.canExecute('unsetTextColor')).toBeFalse();
    expect(editor.execute('setTextColor', 'not-a-color')).toBeFalse();
    expect(editor.execute('setTextColor', 'rgb(14, 116, 144)')).toBeTrue();
    expect(editor.query<string>('textColor')).toBe('rgb(14, 116, 144)');
    expect(editor.html()).toBe(
      '<p><span style="color: rgb(14, 116, 144);">Qalma</span></p>',
    );
    expect(
      editor.execute('setBackgroundColor', 'rgb(254, 240, 138)'),
    ).toBeTrue();
    expect(editor.query<string>('backgroundColor')).toBe('rgb(254, 240, 138)');
    expect(editor.html()).toBe(
      '<p><span style="color: rgb(14, 116, 144); background-color: rgb(254, 240, 138);">Qalma</span></p>',
    );
    expect(editor.execute('unsetTextColor')).toBeTrue();
    expect(editor.html()).toBe(
      '<p><span style="background-color: rgb(254, 240, 138);">Qalma</span></p>',
    );
    expect(editor.execute('unsetBackgroundColor')).toBeTrue();
    expect(editor.html()).toBe('<p>Qalma</p>');

    editor.unmount(host);
  });

  it('should parse serialized color marks through the public plugin', () => {
    const editor = createQalmaEditor({
      content:
        '<p><span style="color: #0e7490; background-color: #fef08a;">Qalma</span></p><p><font color="#be123c">Legacy color</font></p>',
      plugins: [ColorPlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);

    expect(editor.html()).toBe(
      '<p><span style="color: rgb(14, 116, 144); background-color: rgb(254, 240, 138);">Qalma</span></p><p><span style="color: rgb(190, 18, 60);">Legacy color</span></p>',
    );

    editor.unmount(host);
  });

  it('should expose image commands and state through the public plugin', () => {
    const editor = createQalmaEditor({
      content: '<p>Before</p>',
      plugins: [ImagePlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);
    selectEditorRange(editor, 7, 7);

    expect(ImagePlugin.key).toBe('image');
    expect(editor.execute('insertImage', 'javascript:alert(1)')).toBeFalse();
    expect(
      editor.execute('insertImage', {
        src: 'https://example.com/photo.png',
        alt: 'Example photo',
        title: 'Photo',
      }),
    ).toBeTrue();
    expect(editor.isCommandActive('insertImage')).toBeTrue();
    expect(editor.query<ImageState>('image')).toEqual({
      from: 7,
      to: 8,
      src: 'https://example.com/photo.png',
      alt: 'Example photo',
      title: 'Photo',
      previewSrc: null,
    });
    expect(editor.html()).toBe(
      '<p>Before<img src="https://example.com/photo.png" alt="Example photo" title="Photo"></p>',
    );
    expect(
      editor.execute('updateImage', {
        src: 'https://example.com/updated.png',
        alt: 'Updated photo',
      }),
    ).toBeTrue();
    expect(editor.query<ImageState>('image')?.src).toBe(
      'https://example.com/updated.png',
    );
    expect(editor.html()).toBe(
      '<p>Before<img src="https://example.com/updated.png" alt="Updated photo" title="Photo"></p>',
    );
    expect(editor.execute('removeImage')).toBeTrue();
    expect(editor.html()).toBe('<p>Before</p>');
    expect(editor.execute('removeImage')).toBeFalse();

    editor.unmount(host);
  });

  it('should keep image upload previews out of serialized HTML', () => {
    const editor = createQalmaEditor({
      content: '<p>Before</p>',
      plugins: [ImagePlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);
    selectEditorRange(editor, 7, 7);

    expect(
      editor.execute('insertImage', {
        src: '/uploads/photo.png',
        alt: 'Uploaded photo',
        title: 'Photo',
        previewSrc: 'blob:http://localhost/photo-preview',
      }),
    ).toBeTrue();
    expect(editor.query<ImageState>('image')?.previewSrc).toBe(
      'blob:http://localhost/photo-preview',
    );
    expect(editor.html()).toBe(
      '<p>Before<img src="/uploads/photo.png" alt="Uploaded photo" title="Photo"></p>',
    );

    editor.unmount(host);
  });

  it('should parse serialized images through the public plugin', () => {
    const editor = createQalmaEditor({
      content:
        '<img src="https://example.com/photo.png" alt="Example" title="Photo"><img src="javascript:alert(1)" alt="Bad">',
      plugins: [ImagePlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);

    expect(editor.html()).toBe(
      '<p><img src="https://example.com/photo.png" alt="Example" title="Photo"></p>',
    );

    editor.unmount(host);
  });

  it('should expose subscript and superscript through the public plugin', () => {
    const editor = createQalmaEditor({
      content: '<p>H2O and E=mc2</p>',
      plugins: [SubscriptSuperscriptPlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);
    selectEditorRange(editor, 2, 3);

    expect(SubscriptSuperscriptPlugin.key).toBe('subscriptSuperscript');
    expect(editor.execute('toggleSubscript')).toBeTrue();
    expect(editor.isCommandActive('toggleSubscript')).toBeTrue();
    expect(editor.html()).toBe('<p>H<sub>2</sub>O and E=mc2</p>');

    selectEditorRange(editor, 13, 14);

    expect(editor.execute('toggleSuperscript')).toBeTrue();
    expect(editor.isCommandActive('toggleSuperscript')).toBeTrue();
    expect(editor.html()).toBe('<p>H<sub>2</sub>O and E=mc<sup>2</sup></p>');
    expect(editor.execute('toggleSubscript')).toBeTrue();
    expect(editor.isCommandActive('toggleSubscript')).toBeTrue();
    expect(editor.isCommandActive('toggleSuperscript')).toBeFalse();
    expect(editor.html()).toBe('<p>H<sub>2</sub>O and E=mc<sub>2</sub></p>');
    expect(editor.execute('toggleSubscript')).toBeTrue();
    expect(editor.html()).toBe('<p>H<sub>2</sub>O and E=mc2</p>');

    editor.unmount(host);
  });

  it('should parse serialized subscript and superscript marks', () => {
    const editor = createQalmaEditor({
      content:
        '<p>Formula H<sub>2</sub>O and E=mc<sup>2</sup></p><p><span style="vertical-align: sub;">sub</span> <span style="vertical-align: super;">sup</span></p>',
      plugins: [SubscriptSuperscriptPlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);

    expect(editor.html()).toBe(
      '<p>Formula H<sub>2</sub>O and E=mc<sup>2</sup></p><p><sub>sub</sub> <sup>sup</sup></p>',
    );

    editor.unmount(host);
  });

  it('should expose highlight through the public plugin', () => {
    const editor = createQalmaEditor({
      content: '<p>Qalma</p>',
      plugins: [HighlightPlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);
    selectEditorRange(editor, 1, 6);

    expect(HighlightPlugin.key).toBe('highlight');
    expect(editor.canExecute('unsetHighlight')).toBeFalse();
    expect(editor.execute('setHighlight', 'not-a-color')).toBeFalse();
    expect(editor.execute('setHighlight')).toBeTrue();
    expect(editor.isCommandActive('setHighlight')).toBeTrue();
    expect(editor.query<string>('highlightColor')).toBe('rgb(254, 240, 138)');
    expect(editor.html()).toBe('<p><mark>Qalma</mark></p>');
    expect(editor.execute('setHighlight', 'rgb(186, 230, 253)')).toBeTrue();
    expect(editor.query<string>('highlightColor')).toBe('rgb(186, 230, 253)');
    expect(editor.html()).toBe(
      '<p><mark style="background-color: rgb(186, 230, 253);">Qalma</mark></p>',
    );
    expect(editor.execute('unsetHighlight')).toBeTrue();
    expect(editor.html()).toBe('<p>Qalma</p>');

    editor.unmount(host);
  });

  it('should parse serialized highlights through the public plugin', () => {
    const editor = createQalmaEditor({
      content:
        '<p><mark>Default highlight</mark></p><p><mark style="background-color: #bae6fd;">Sky highlight</mark></p>',
      plugins: [HighlightPlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);

    expect(editor.html()).toBe(
      '<p><mark>Default highlight</mark></p><p><mark style="background-color: rgb(186, 230, 253);">Sky highlight</mark></p>',
    );

    editor.unmount(host);
  });

  it('should expose placeholder decorations through the public plugin', () => {
    const editor = createQalmaEditor({
      content: '<p></p>',
      plugins: [
        PlaceholderPlugin.configure({
          placeholder: 'Start here',
          className: 'custom-placeholder',
        }),
      ],
    });
    const host = document.createElement('div');

    editor.mount(host);

    const placeholder = host.querySelector(
      '.custom-placeholder[data-placeholder="Start here"]',
    );

    expect(PlaceholderPlugin.key).toBe('placeholder');
    expect(placeholder?.tagName).toBe('P');
    expect(editor.html()).toBe('<p></p>');

    editor.setHtml('<p>Qalma</p>');

    expect(
      host.querySelector('.custom-placeholder[data-placeholder="Start here"]'),
    ).toBeNull();
    expect(editor.html()).toBe('<p>Qalma</p>');

    editor.unmount(host);
  });

  it('should expose trailing paragraph behavior through the public plugin', async () => {
    const editor = createQalmaEditor({
      content:
        '<pre><code class="language-typescript">const answer = 42;</code></pre>',
      plugins: [
        CodeBlockPlugin.configure({
          languages: ['plaintext', 'typescript'],
          defaultLanguage: 'typescript',
        }),
        TrailingParagraphPlugin,
      ],
    });
    const host = document.createElement('div');

    editor.mount(host);
    await flushMicrotasks();

    expect(TrailingParagraphPlugin.key).toBe('trailingParagraph');
    expect(editor.html()).toBe(
      '<pre><code class="language-typescript">const answer = 42;</code></pre><p></p>',
    );

    editor.setHtml('<p>Qalma</p>');
    await flushMicrotasks();

    expect(editor.html()).toBe('<p>Qalma</p><p></p>');

    editor.setHtml('<p>Qalma</p><p></p>');
    await flushMicrotasks();

    expect(editor.html()).toBe('<p>Qalma</p><p></p>');

    editor.setHtml('<p></p>');
    await flushMicrotasks();

    expect(editor.html()).toBe('<p></p>');

    editor.unmount(host);
  });

  it('should clear code block formatting to a paragraph', () => {
    const editor = createQalmaEditor({
      content:
        '<pre><code class="language-typescript">const answer = 42;</code></pre>',
      plugins: [
        CodeBlockPlugin.configure({
          languages: ['plaintext', 'typescript'],
          defaultLanguage: 'typescript',
        }),
        ClearFormattingPlugin,
      ],
    });
    const host = document.createElement('div');

    editor.mount(host);

    expect(editor.canExecute('clearFormatting')).toBeTrue();
    expect(editor.execute('clearFormatting')).toBeTrue();
    expect(editor.html()).toBe('<p>const answer = 42;</p>');
    expect(editor.isCommandActive('toggleCodeBlock')).toBeFalse();

    editor.unmount(host);
  });

  it('should expose hard break commands through the public plugin', () => {
    const editor = createQalmaEditor({
      content: '<p>Qalma</p>',
      plugins: [HardBreakPlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);

    expect(HardBreakPlugin.key).toBe('hardBreak');
    expect(editor.canExecute('insertHardBreak')).toBeTrue();
    expect(editor.execute('insertHardBreak')).toBeTrue();
    expect(editor.html()).toBe('<p><br>Qalma</p>');

    editor.unmount(host);
  });

  it('should parse serialized hard breaks through the public plugin', () => {
    const editor = createQalmaEditor({
      content: '<p>Line one<br>Line two</p>',
      plugins: [HardBreakPlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);

    expect(editor.html()).toBe('<p>Line one<br>Line two</p>');

    editor.unmount(host);
  });

  it('should insert hard breaks with Shift+Enter', () => {
    const editor = createQalmaEditor({
      content: '<p>Qalma</p>',
      plugins: [HardBreakPlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);

    const surface = host.querySelector('.ProseMirror');
    const shiftEnterEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Enter',
      shiftKey: true,
    });

    surface?.dispatchEvent(shiftEnterEvent);

    expect(shiftEnterEvent.defaultPrevented).toBeTrue();
    expect(editor.html()).toBe('<p><br>Qalma</p>');

    editor.unmount(host);
  });

  it('should keep Shift+Enter out of code blocks', () => {
    const editor = createQalmaEditor({
      content:
        '<pre><code class="language-typescript">const answer = 42;</code></pre>',
      plugins: [
        CodeBlockPlugin.configure({
          languages: ['plaintext', 'typescript'],
          defaultLanguage: 'typescript',
        }),
        HardBreakPlugin,
      ],
    });
    const host = document.createElement('div');

    editor.mount(host);

    const surface = host.querySelector('.ProseMirror');
    const shiftEnterEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Enter',
      shiftKey: true,
    });

    surface?.dispatchEvent(shiftEnterEvent);

    expect(shiftEnterEvent.defaultPrevented).toBeFalse();
    expect(editor.canExecute('insertHardBreak')).toBeFalse();
    expect(editor.html()).toBe(
      '<pre><code class="language-typescript">const answer = 42;</code></pre>',
    );

    editor.unmount(host);
  });

  it('should preserve code block line breaks when clearing formatting with hard breaks enabled', () => {
    const editor = createQalmaEditor({
      content:
        '<pre><code class="language-typescript">const first = 1;&#10;const second = 2;</code></pre>',
      plugins: [
        CodeBlockPlugin.configure({
          languages: ['plaintext', 'typescript'],
          defaultLanguage: 'typescript',
        }),
        HardBreakPlugin,
        ClearFormattingPlugin,
      ],
    });
    const host = document.createElement('div');

    editor.mount(host);

    expect(editor.execute('clearFormatting')).toBeTrue();
    expect(editor.html()).toBe('<p>const first = 1;<br>const second = 2;</p>');

    editor.unmount(host);
  });

  it('should parse serialized code blocks through the public plugin', () => {
    const snippet = [
      'package main',
      '',
      'import "fmt"',
      '',
      'func main() {',
      '  fmt.Println("Qalma")',
      '}',
    ].join('\n');
    const editor = createQalmaEditor({
      content: `<pre><code class="language-go">${snippet}</code></pre>`,
      plugins: [
        CodeBlockPlugin.configure({
          languages: ['plaintext', 'typescript', 'javascript', 'csharp', 'go'],
        }),
      ],
    });
    const host = document.createElement('div');

    editor.mount(host);

    expect(editor.html()).toBe(
      `<pre><code class="language-go">${snippet.replaceAll(
        '\n',
        '&#10;',
      )}</code></pre>`,
    );
    expect(editor.isCommandActive('toggleCodeBlock')).toBeTrue();
    expect(editor.query<string>('codeBlockLanguage')).toBe('go');

    editor.unmount(host);
  });

  it('should keep Tab inside code blocks for indentation', () => {
    const editor = createQalmaEditor({
      content:
        '<pre><code class="language-typescript">const answer = 42;</code></pre>',
      plugins: [
        CodeBlockPlugin.configure({
          languages: ['plaintext', 'typescript'],
          defaultLanguage: 'typescript',
        }),
      ],
    });
    const host = document.createElement('div');

    editor.mount(host);

    const surface = host.querySelector('.ProseMirror');
    const tabEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Tab',
    });

    surface?.dispatchEvent(tabEvent);

    expect(tabEvent.defaultPrevented).toBeTrue();
    expect(editor.html()).toBe(
      '<pre><code class="language-typescript">  const answer = 42;</code></pre>',
    );

    const shiftTabEvent = new KeyboardEvent('keydown', {
      bubbles: true,
      cancelable: true,
      key: 'Tab',
      shiftKey: true,
    });

    surface?.dispatchEvent(shiftTabEvent);

    expect(shiftTabEvent.defaultPrevented).toBeTrue();
    expect(editor.html()).toBe(
      '<pre><code class="language-typescript">const answer = 42;</code></pre>',
    );

    editor.unmount(host);
  });

  it('should expose configurable code block defaults and validation', () => {
    const configured = CodeBlockPlugin.configure({
      languages: ['plaintext', 'typescript', 'go'],
      defaultLanguage: 'go',
    });

    expect(CODE_BLOCK_PLUGIN_DEFAULT_OPTIONS).toEqual({
      languages: ['plaintext'],
      defaultLanguage: 'plaintext',
      languageClassPrefix: 'language-',
      indentText: '  ',
      inputRules: true,
    });
    expect(CodeBlockPlugin.options).toEqual(CODE_BLOCK_PLUGIN_DEFAULT_OPTIONS);
    expect(configured.options).toEqual({
      languages: ['plaintext', 'typescript', 'go'],
      defaultLanguage: 'go',
      languageClassPrefix: 'language-',
      indentText: '  ',
      inputRules: true,
    });
    expect(() =>
      CodeBlockPlugin.configure({
        languages: [],
      }),
    ).toThrowError(
      'CodeBlockPlugin languages must include at least one language.',
    );
    expect(() =>
      CodeBlockPlugin.configure({
        languages: ['typescript', 'typescript'],
      }),
    ).toThrowError('CodeBlockPlugin languages entries must be unique.');
    expect(() =>
      CodeBlockPlugin.configure({
        languages: ['typescript'],
        defaultLanguage: 'go',
      }),
    ).toThrowError(
      'CodeBlockPlugin defaultLanguage must be included in languages.',
    );
    expect(() =>
      CodeBlockPlugin.configure({
        indentText: '->',
      }),
    ).toThrowError(
      'CodeBlockPlugin indentText must be a non-empty string containing only spaces or tabs.',
    );
  });

  it('should expose blockquote commands through the public plugin', () => {
    const editor = createQalmaEditor({
      content: '<p>Quoted text</p>',
      plugins: [BlockquotePlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);

    expect(BlockquotePlugin.key).toBe('blockquote');
    expect(editor.execute('toggleBlockquote')).toBeTrue();
    expect(editor.isCommandActive('toggleBlockquote')).toBeTrue();
    expect(editor.html()).toBe('<blockquote><p>Quoted text</p></blockquote>');
    expect(editor.execute('toggleBlockquote')).toBeTrue();
    expect(editor.isCommandActive('toggleBlockquote')).toBeFalse();
    expect(editor.html()).toBe('<p>Quoted text</p>');

    editor.unmount(host);
  });

  it('should expose task list commands and state through the public plugin', () => {
    const editor = createQalmaEditor({
      content: '<p>Plan the release</p>',
      plugins: [TaskListPlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);

    expect(TaskListPlugin.key).toBe('taskList');
    expect(editor.execute('toggleTaskList')).toBeTrue();
    expect(editor.isCommandActive('toggleTaskList')).toBeTrue();
    expect(editor.query<TaskItemState>('taskItem')).toEqual({
      checked: false,
    });
    expect(editor.html()).toContain('<ul data-type="task-list">');
    expect(editor.html()).toContain(
      '<li data-type="task-item" data-checked="false">',
    );
    expect(editor.html()).toContain(
      '<div data-task-item-content=""><p>Plan the release</p></div>',
    );

    expect(editor.execute('toggleTaskItemChecked')).toBeTrue();
    expect(editor.isCommandActive('toggleTaskItemChecked')).toBeTrue();
    expect(editor.query<TaskItemState>('taskItem')).toEqual({
      checked: true,
    });
    expect(editor.html()).toContain(
      '<li data-type="task-item" data-checked="true">',
    );

    expect(editor.execute('setTaskItemChecked', false)).toBeTrue();
    expect(editor.query<TaskItemState>('taskItem')).toEqual({
      checked: false,
    });
    expect(editor.canExecute('setTaskItemChecked')).toBeFalse();

    const checkbox = host.querySelector<HTMLInputElement>(
      'li[data-type="task-item"] input[type="checkbox"]',
    );

    if (!checkbox) {
      throw new Error('Expected task item checkbox to render.');
    }

    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    expect(editor.query<TaskItemState>('taskItem')).toEqual({
      checked: true,
    });

    editor.unmount(host);
  });

  it('should expose text alignment through the public plugin', () => {
    const editor = createQalmaEditor({
      content: '<p>Aligned text</p>',
      plugins: [TextAlignPlugin, HeadingsPlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);

    expect(TextAlignPlugin.key).toBe('textAlign');
    expect(editor.canExecute('setTextAlignCenter')).toBeTrue();
    expect(editor.isCommandActive('setTextAlignLeft')).toBeTrue();
    expect(editor.query('textAlign')).toBe('left');
    expect(editor.execute('setTextAlignCenter')).toBeTrue();
    expect(editor.isCommandActive('setTextAlignCenter')).toBeTrue();
    expect(editor.query('textAlign')).toBe('center');
    expect(editor.html()).toBe(
      '<p style="text-align: center;">Aligned text</p>',
    );
    expect(editor.execute('setTextAlignLeft')).toBeTrue();
    expect(editor.html()).toBe('<p>Aligned text</p>');

    editor.setHtml('<h2 style="text-align: right;">Aligned heading</h2>');

    expect(editor.isCommandActive('setTextAlignRight')).toBeTrue();
    expect(editor.query('textAlign')).toBe('right');
    expect(editor.execute('setTextAlignJustify')).toBeTrue();
    expect(editor.html()).toBe(
      '<h2 style="text-align: justify;">Aligned heading</h2>',
    );

    editor.unmount(host);
  });

  it('should align list items and blockquotes at the container level', () => {
    const editor = createQalmaEditor({
      content:
        '<ul><li><p>Aligned list item</p></li></ul><blockquote><p>Aligned quote</p></blockquote>',
      plugins: [TextAlignPlugin, ListsPlugin, BlockquotePlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);

    expect(editor.execute('setTextAlignCenter')).toBeTrue();
    expect(editor.html()).toContain(
      '<li style="text-align: center;"><p>Aligned list item</p></li>',
    );
    expect(editor.execute('setTextAlignLeft')).toBeTrue();
    expect(editor.html()).toContain('<li><p>Aligned list item</p></li>');

    editor.setHtml('<blockquote><p>Aligned quote</p></blockquote>');

    expect(editor.execute('setTextAlignRight')).toBeTrue();
    expect(editor.html()).toBe(
      '<blockquote style="text-align: right;"><p>Aligned quote</p></blockquote>',
    );

    editor.unmount(host);
  });

  it('should expose configurable text alignment defaults and validation', () => {
    const configured = TextAlignPlugin.configure({
      alignments: ['left', 'center'],
      nodes: ['paragraph'],
    });

    expect(TEXT_ALIGN_PLUGIN_DEFAULT_OPTIONS).toEqual({
      alignments: ['left', 'center', 'right', 'justify'],
      nodes: ['paragraph', 'heading', 'listItem', 'blockquote'],
    });
    expect(TextAlignPlugin.options).toEqual(TEXT_ALIGN_PLUGIN_DEFAULT_OPTIONS);
    expect(configured.options).toEqual({
      alignments: ['left', 'center'],
      nodes: ['paragraph'],
    });
    expect(() =>
      TextAlignPlugin.configure({
        alignments: [],
      }),
    ).toThrowError(
      'TextAlignPlugin alignments must include at least one value.',
    );
    expect(() =>
      TextAlignPlugin.configure({
        alignments: ['center', 'center'],
      }),
    ).toThrowError('TextAlignPlugin alignments entries must be unique.');
    expect(() =>
      TextAlignPlugin.configure({
        nodes: ['paragraph', 'paragraph'],
      }),
    ).toThrowError('TextAlignPlugin nodes entries must be unique.');
    expect(() =>
      createQalmaEditor({
        plugins: [
          createQalmaPlugin({
            key: 'badNodeExtension',
            extendNodes: () => ({ missing: { content: 'inline*' } }),
          }),
        ],
      }),
    ).toThrowError(
      'QALMA plugin "badNodeExtension" extends unknown node "missing".',
    );
  });

  it('should expose configurable headings defaults and validation', () => {
    const configured = HeadingsPlugin.configure({
      levels: [2, 3, 4],
    });

    expect(HEADINGS_PLUGIN_DEFAULT_OPTIONS).toEqual({
      levels: [1, 2, 3],
      inputRules: true,
    });
    expect(HeadingsPlugin.options).toEqual(HEADINGS_PLUGIN_DEFAULT_OPTIONS);
    expect(configured.options).toEqual({
      levels: [2, 3, 4],
      inputRules: true,
    });
    expect(() =>
      HeadingsPlugin.configure({
        levels: [],
      }),
    ).toThrowError(
      'HeadingsPlugin levels must include at least one heading level.',
    );
    expect(() =>
      HeadingsPlugin.configure({
        levels: [1, 1],
      }),
    ).toThrowError('HeadingsPlugin levels entries must be unique.');
  });

  it('should expose configurable highlight defaults and validation', () => {
    const configured = HighlightPlugin.configure({
      defaultColor: '#bae6fd',
    });

    expect(HIGHLIGHT_PLUGIN_DEFAULT_OPTIONS).toEqual({
      defaultColor: 'rgb(254, 240, 138)',
    });
    expect(HighlightPlugin.options).toEqual(HIGHLIGHT_PLUGIN_DEFAULT_OPTIONS);
    expect(configured.options).toEqual({
      defaultColor: '#bae6fd',
    });
    expect(() =>
      HighlightPlugin.configure({
        defaultColor: 'not-a-color',
      }),
    ).toThrowError('HighlightPlugin defaultColor must be a valid CSS color.');
  });

  it('should expose configurable placeholder defaults and validation', () => {
    const configured = PlaceholderPlugin.configure({
      placeholder: 'Start here',
      className: 'custom-placeholder',
    });

    expect(PLACEHOLDER_PLUGIN_DEFAULT_OPTIONS).toEqual({
      placeholder: 'Write something...',
      className: 'qalma-placeholder',
    });
    expect(PlaceholderPlugin.options).toEqual(
      PLACEHOLDER_PLUGIN_DEFAULT_OPTIONS,
    );
    expect(configured.options).toEqual({
      placeholder: 'Start here',
      className: 'custom-placeholder',
    });
    expect(() =>
      PlaceholderPlugin.configure({
        placeholder: '',
      }),
    ).toThrowError('PlaceholderPlugin placeholder must be a non-empty string.');
    expect(() =>
      PlaceholderPlugin.configure({
        className: 'bad placeholder',
      }),
    ).toThrowError(
      'PlaceholderPlugin className must be a non-empty CSS class name.',
    );
  });

  it('should expose configurable history defaults', () => {
    const configured = HistoryPlugin.configure({
      depth: 200,
    });

    expect(HISTORY_PLUGIN_DEFAULT_OPTIONS).toEqual({
      depth: 100,
      newGroupDelay: 500,
    });
    expect(HistoryPlugin.options).toEqual(HISTORY_PLUGIN_DEFAULT_OPTIONS);
    expect(configured.options).toEqual({
      depth: 200,
      newGroupDelay: 500,
    });
  });

  it('should expose configurable link defaults and validation', () => {
    const configured = LinkPlugin.configure({
      allowRelativeLinks: false,
      defaultTarget: '_blank',
      defaultRel: 'noopener noreferrer',
    });

    expect(LINK_PLUGIN_DEFAULT_OPTIONS).toEqual({
      allowedProtocols: ['http', 'https', 'mailto', 'tel'],
      allowRelativeLinks: true,
      defaultTarget: '_blank',
      defaultRel: 'noopener noreferrer',
      onClick: null,
    });
    expect(LinkPlugin.options).toEqual(LINK_PLUGIN_DEFAULT_OPTIONS);
    expect(configured.options).toEqual({
      allowedProtocols: ['http', 'https', 'mailto', 'tel'],
      allowRelativeLinks: false,
      defaultTarget: '_blank',
      defaultRel: 'noopener noreferrer',
      onClick: null,
    });
    expect(() =>
      LinkPlugin.configure({
        allowedProtocols: [],
      }),
    ).toThrowError(
      'LinkPlugin allowedProtocols must include at least one protocol.',
    );
    expect(() =>
      LinkPlugin.configure({
        onClick: 'open' as never,
      }),
    ).toThrowError('LinkPlugin onClick must be a function or null.');
  });

  it('should expose configurable image defaults and validation', () => {
    const configured = ImagePlugin.configure({
      allowedProtocols: ['https'],
      allowRelativeImages: false,
      defaultAlt: 'Image',
    });

    expect(IMAGE_PLUGIN_DEFAULT_OPTIONS).toEqual({
      allowedProtocols: ['http', 'https'],
      allowRelativeImages: true,
      defaultAlt: '',
    });
    expect(ImagePlugin.options).toEqual(IMAGE_PLUGIN_DEFAULT_OPTIONS);
    expect(configured.options).toEqual({
      allowedProtocols: ['https'],
      allowRelativeImages: false,
      defaultAlt: 'Image',
    });
    expect(() =>
      ImagePlugin.configure({
        allowedProtocols: [],
      }),
    ).toThrowError(
      'ImagePlugin allowedProtocols must include at least one protocol.',
    );
    expect(() =>
      ImagePlugin.configure({
        allowedProtocols: ['https', 'https'],
      }),
    ).toThrowError('ImagePlugin allowedProtocols entries must be unique.');
  });

  it('should expose mention queries and insertion through the public plugin', () => {
    const editor = createQalmaEditor({
      content: '<p>Hello @gr</p>',
      plugins: [MentionPlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);
    selectEditorRange(editor, 10, 10);

    expect(MentionPlugin.key).toBe('mention');
    expect(editor.query<MentionState>('mention')).toEqual({
      from: 7,
      to: 10,
      query: 'gr',
      trigger: '@',
    });
    expect(
      editor.execute('insertMention', {
        id: 'grace-hopper',
        label: 'Grace Hopper',
      }),
    ).toBeTrue();
    expect(editor.html()).toBe(
      '<p>Hello <span data-qalma-mention="" data-mention-id="grace-hopper" data-mention-label="Grace Hopper" data-mention-trigger="@" contenteditable="false">@Grace Hopper</span> </p>',
    );
    expect(getEditorSelectionFrom(editor)).toBe(8);

    editor.unmount(host);
  });

  it('should expose slash command state through the public plugin', () => {
    const editor = createQalmaEditor({
      content: '<p>/he</p>',
      plugins: [SlashCommandPlugin, HeadingsPlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);
    selectEditorRange(editor, 4, 4);

    expect(SlashCommandPlugin.key).toBe('slashCommand');
    expect(editor.query<SlashCommandState>('slashCommand')).toEqual({
      from: 1,
      to: 4,
      query: 'he',
      trigger: '/',
    });
    expect(editor.execute('deleteSlashCommand')).toBeTrue();
    expect(editor.html()).toBe('<p></p>');
    expect(editor.execute('toggleHeading1')).toBeTrue();
    expect(editor.html()).toBe('<h1></h1>');

    editor.unmount(host);
  });

  it('should dismiss slash commands without changing content', () => {
    const editor = createQalmaEditor({
      content: '<p>Ask /</p>',
      plugins: [SlashCommandPlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);
    selectEditorRange(editor, 6, 6);

    expect(editor.query<SlashCommandState>('slashCommand')).toEqual({
      from: 5,
      to: 6,
      query: '',
      trigger: '/',
    });
    expect(editor.execute('dismissSlashCommand')).toBeTrue();
    expect(editor.query<SlashCommandState>('slashCommand')).toBeNull();
    expect(editor.html()).toBe('<p>Ask /</p>');

    editor.unmount(host);
  });

  it('should keep slash commands disabled inside code blocks', () => {
    const editor = createQalmaEditor({
      content: '<pre><code>/he</code></pre>',
      plugins: [CodeBlockPlugin, SlashCommandPlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);
    selectEditorRange(editor, 4, 4);

    expect(editor.query<SlashCommandState>('slashCommand')).toBeNull();
    expect(editor.canExecute('deleteSlashCommand')).toBeFalse();
    expect(editor.execute('deleteSlashCommand')).toBeFalse();
    expect(editor.html()).toBe(
      '<pre><code class="language-plaintext">/he</code></pre>',
    );

    editor.unmount(host);
  });

  it('should keep slash commands disabled inside inline code', () => {
    const editor = createQalmaEditor({
      content: '<p><code>/he</code></p>',
      plugins: [InlineCodePlugin, SlashCommandPlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);
    selectEditorRange(editor, 4, 4);

    expect(editor.query<SlashCommandState>('slashCommand')).toBeNull();
    expect(editor.canExecute('deleteSlashCommand')).toBeFalse();
    expect(editor.execute('deleteSlashCommand')).toBeFalse();
    expect(editor.html()).toBe('<p><code>/he</code></p>');

    editor.unmount(host);
  });

  it('should expose configurable slash command defaults and validation', () => {
    const configured = SlashCommandPlugin.configure({
      trigger: '+',
      minQueryLength: 1,
      maxQueryLength: 24,
    });

    expect(SLASH_COMMAND_PLUGIN_DEFAULT_OPTIONS).toEqual({
      trigger: '/',
      minQueryLength: 0,
      maxQueryLength: 64,
    });
    expect(SlashCommandPlugin.options).toEqual(
      SLASH_COMMAND_PLUGIN_DEFAULT_OPTIONS,
    );
    expect(configured.options).toEqual({
      trigger: '+',
      minQueryLength: 1,
      maxQueryLength: 24,
    });
    expect(() =>
      SlashCommandPlugin.configure({
        trigger: '//',
      }),
    ).toThrowError(
      'SlashCommandPlugin trigger must be a single non-whitespace character.',
    );
    expect(() =>
      SlashCommandPlugin.configure({
        minQueryLength: 3,
        maxQueryLength: 2,
      }),
    ).toThrowError(
      'SlashCommandPlugin maxQueryLength must be greater than or equal to minQueryLength.',
    );
  });

  it('should keep mentions disabled inside code blocks', () => {
    const editor = createQalmaEditor({
      content: '<pre><code>@gr</code></pre>',
      plugins: [CodeBlockPlugin, MentionPlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);
    selectEditorRange(editor, 4, 4);

    expect(editor.query<MentionState>('mention')).toBeNull();
    expect(
      editor.canExecute('insertMention', {
        id: 'grace-hopper',
        label: 'Grace Hopper',
      }),
    ).toBeFalse();
    expect(
      editor.execute('insertMention', {
        id: 'grace-hopper',
        label: 'Grace Hopper',
      }),
    ).toBeFalse();
    expect(editor.html()).toBe(
      '<pre><code class="language-plaintext">@gr</code></pre>',
    );

    editor.unmount(host);
  });

  it('should keep mentions disabled inside inline code', () => {
    const editor = createQalmaEditor({
      content: '<p><code>@gr</code></p>',
      plugins: [InlineCodePlugin, MentionPlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);
    selectEditorRange(editor, 4, 4);

    expect(editor.query<MentionState>('mention')).toBeNull();
    expect(
      editor.canExecute('insertMention', {
        id: 'grace-hopper',
        label: 'Grace Hopper',
      }),
    ).toBeFalse();
    expect(editor.html()).toBe('<p><code>@gr</code></p>');

    editor.unmount(host);
  });

  it('should parse serialized mentions and validate configurable defaults', () => {
    const configured = MentionPlugin.configure({
      trigger: '#',
      minQueryLength: 1,
      maxQueryLength: 24,
      appendSpaceOnInsert: false,
    });
    const editor = createQalmaEditor({
      content:
        '<p>Ask <span data-qalma-mention data-mention-id="ada-lovelace" data-mention-label="Ada Lovelace" data-mention-trigger="@">@Ada Lovelace</span>.</p>',
      plugins: [MentionPlugin],
    });

    expect(MENTION_PLUGIN_DEFAULT_OPTIONS).toEqual({
      trigger: '@',
      minQueryLength: 0,
      maxQueryLength: 64,
      appendSpaceOnInsert: true,
    });
    expect(MentionPlugin.options).toEqual(MENTION_PLUGIN_DEFAULT_OPTIONS);
    expect(configured.options).toEqual({
      trigger: '#',
      minQueryLength: 1,
      maxQueryLength: 24,
      appendSpaceOnInsert: false,
    });
    expect(editor.html()).toBe(
      '<p>Ask <span data-qalma-mention data-mention-id="ada-lovelace" data-mention-label="Ada Lovelace" data-mention-trigger="@">@Ada Lovelace</span>.</p>',
    );
    expect(() =>
      MentionPlugin.configure({
        trigger: '::',
      }),
    ).toThrowError(
      'MentionPlugin trigger must be a single non-whitespace character.',
    );
    expect(() =>
      MentionPlugin.configure({
        minQueryLength: 3,
        maxQueryLength: 2,
      }),
    ).toThrowError(
      'MentionPlugin maxQueryLength must be greater than or equal to minQueryLength.',
    );
  });

  it('should autolink plain text URLs on paste through the public plugin', () => {
    const editor = createQalmaEditor({
      content: '<p></p>',
      plugins: [LinkPlugin, PasteRulesPlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);

    expect(PasteRulesPlugin.key).toBe('pasteRules');
    pastePlainText(editor, 'Read https://angular.dev/docs.');

    expect(editor.html()).toBe(
      '<p>Read <a href="https://angular.dev/docs" target="_blank" rel="noopener noreferrer">https://angular.dev/docs</a>.</p>',
    );

    editor.unmount(host);
  });

  it('should clean pasted HTML links through the public plugin', () => {
    const editor = createQalmaEditor({
      content: '<p></p>',
      plugins: [LinkPlugin, ColorPlugin, PasteRulesPlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);
    pasteClipboard(editor, {
      html: '<a href="/docs/features/server-side-rendering" class="text-red-500" style="color: red;"><span style="color: red;">Server-Side Rendering</span></a>',
      text: 'Server-Side Rendering',
    });

    expect(editor.html()).toBe(
      '<p><a href="/docs/features/server-side-rendering" target="_blank" rel="noopener noreferrer">Server-Side Rendering</a></p>',
    );

    editor.unmount(host);
  });

  it('should use clipboard URL metadata when pasted HTML omits the anchor', () => {
    const editor = createQalmaEditor({
      content: '<p></p>',
      plugins: [LinkPlugin, ColorPlugin, PasteRulesPlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);
    pasteClipboard(editor, {
      html: '<span class="text-red-500" style="color: red;">Server-Side Rendering</span>',
      text: 'Server-Side Rendering',
      uriList: 'https://analogjs.org/docs/features/server-side-rendering',
    });

    expect(editor.html()).toBe(
      '<p><a href="https://analogjs.org/docs/features/server-side-rendering" target="_blank" rel="noopener noreferrer">Server-Side Rendering</a></p>',
    );

    editor.unmount(host);
  });

  it('should expose configurable paste rule defaults and validation', () => {
    const configured = PasteRulesPlugin.configure({
      allowedProtocols: ['https'],
      defaultProtocol: 'https',
    });

    expect(PASTE_RULES_PLUGIN_DEFAULT_OPTIONS).toEqual({
      autolink: true,
      allowedProtocols: ['http', 'https', 'mailto', 'tel'],
      allowRelativeLinks: true,
      cleanHtml: true,
      defaultProtocol: 'https',
    });
    expect(PasteRulesPlugin.options).toEqual(
      PASTE_RULES_PLUGIN_DEFAULT_OPTIONS,
    );
    expect(configured.options).toEqual({
      autolink: true,
      allowedProtocols: ['https'],
      allowRelativeLinks: true,
      cleanHtml: true,
      defaultProtocol: 'https',
    });
    expect(() =>
      PasteRulesPlugin.configure({
        allowedProtocols: [],
      }),
    ).toThrowError(
      'PasteRulesPlugin allowedProtocols must include at least one protocol.',
    );
    expect(() =>
      PasteRulesPlugin.configure({
        allowedProtocols: ['mailto'],
      }),
    ).toThrowError(
      'PasteRulesPlugin defaultProtocol must be included in allowedProtocols.',
    );
  });
});

function selectEditorRange(
  editor: QalmaEditorController,
  from: number,
  to: number,
): void {
  const view = (editor as unknown as { editorView: EditorView | undefined })
    .editorView;

  if (!view) {
    throw new Error('Editor view is not mounted.');
  }

  view.dispatch(
    view.state.tr.setSelection(TextSelection.create(view.state.doc, from, to)),
  );
}

function getEditorSelectionFrom(editor: QalmaEditorController): number {
  const view = (editor as unknown as { editorView: EditorView | undefined })
    .editorView;

  if (!view) {
    throw new Error('Editor view is not mounted.');
  }

  return view.state.selection.from;
}

function typeText(editor: QalmaEditorController, text: string): boolean {
  const view = getEditorView(editor);
  const { from, to } = view.state.selection;
  let handled = false;

  view.someProp('handleTextInput', (handler) => {
    handled =
      handler(view, from, to, text, () =>
        view.state.tr.insertText(text, from, to),
      ) === true;

    return handled;
  });

  if (!handled) {
    view.dispatch(view.state.tr.insertText(text, from, to));
  }

  return handled;
}

function dispatchModKey(
  editor: QalmaEditorController,
  key: string,
): KeyboardEvent {
  const view = getEditorView(editor);
  const event = new KeyboardEvent('keydown', {
    bubbles: true,
    cancelable: true,
    key,
    ctrlKey: !isMacPlatform(),
    metaKey: isMacPlatform(),
  });

  view.dom.dispatchEvent(event);

  return event;
}

function getEditorView(editor: QalmaEditorController): EditorView {
  const view = (editor as unknown as { editorView: EditorView | undefined })
    .editorView;

  if (!view) {
    throw new Error('Editor view is not mounted.');
  }

  return view;
}

function isMacPlatform(): boolean {
  return /Mac|iP(hone|[oa]d)/.test(navigator.platform);
}

function pastePlainText(editor: QalmaEditorController, text: string): void {
  pasteClipboard(editor, { text });
}

interface TestClipboardData {
  html?: string;
  text: string;
  uriList?: string;
}

function pasteClipboard(
  editor: QalmaEditorController,
  clipboardData: TestClipboardData,
): void {
  const view = (editor as unknown as { editorView: EditorView | undefined })
    .editorView;

  if (!view) {
    throw new Error('Editor view is not mounted.');
  }

  const event = new Event('paste', {
    bubbles: true,
    cancelable: true,
  }) as ClipboardEvent;

  Object.defineProperty(event, 'clipboardData', {
    value: {
      getData: (type: string) => {
        if (type === 'text/html') {
          return clipboardData.html ?? '';
        }

        if (type === 'text/uri-list') {
          return clipboardData.uriList ?? '';
        }

        return type === 'text/plain' ? clipboardData.text : '';
      },
    },
  });

  view.dom.dispatchEvent(event);
}

async function flushMicrotasks(): Promise<void> {
  await Promise.resolve();
}
