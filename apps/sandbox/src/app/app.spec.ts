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
  HISTORY_PLUGIN_DEFAULT_OPTIONS,
  HistoryPlugin,
  LINK_PLUGIN_DEFAULT_OPTIONS,
  LinkPlugin,
  ListsPlugin,
  RteEditorController,
  TEXT_ALIGN_PLUGIN_DEFAULT_OPTIONS,
  TextAlignPlugin,
  TextFormattingKit,
  createRteEditor,
  createRtePlugin,
} from '@angular-rte/editor';
import { TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';

import { App } from './app';
import { SandboxLinkPopover } from './sandbox-link-popover';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App, SandboxLinkPopover],
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
      33,
    );
    expect(
      compiled.querySelector('[aria-label="Clear formatting"]'),
    ).not.toBeNull();
    expect(
      compiled.querySelector('[aria-label="Align center"]'),
    ).not.toBeNull();
    expect(
      compiled.querySelector('[aria-label="Teal text color"]'),
    ).not.toBeNull();
    expect(
      compiled.querySelector('[aria-label="Yellow background color"]'),
    ).not.toBeNull();
    expect(compiled.querySelector('[aria-label="Link URL"]')).toBeNull();
    expect(compiled.querySelector('.ProseMirror')?.textContent).toContain(
      'Angular RTE',
    );
    expect(compiled.querySelector('.ProseMirror ul')?.textContent).toContain(
      'Compose plugins in TypeScript.',
    );
    expect(compiled.querySelector('.ProseMirror ol')?.textContent).toContain(
      'Pick capabilities for the current product surface.',
    );
    expect(
      compiled.querySelector('.ProseMirror blockquote')?.textContent,
    ).toContain(
      'Quote important passages without taking ownership away from the consuming app.',
    );
    expect(
      compiled.querySelector('.ProseMirror code.language-typescript')
        ?.textContent,
    ).toContain('createRteEditor');
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
    const fixture = TestBed.createComponent(SandboxLinkPopover);
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
    const editor = createRteEditor({
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
      `<pre><code class="language-typescript">${snippet}</code></pre>`,
    );
    expect(editor.execute('setCodeBlockLanguage', 'go')).toBeTrue();
    expect(editor.query<string>('codeBlockLanguage')).toBe('go');
    expect(editor.html()).toBe(
      `<pre><code class="language-go">${snippet}</code></pre>`,
    );
    expect(editor.execute('toggleCodeBlock')).toBeTrue();
    expect(editor.isCommandActive('toggleCodeBlock')).toBeFalse();
    expect(editor.query<string>('codeBlockLanguage')).toBeNull();
    expect(editor.html()).toBe(`<p>${snippet}</p>`);

    editor.unmount(host);
  });

  it('should expose clear formatting through the public plugin', () => {
    const editor = createRteEditor({
      content:
        '<h2><strong><em><a href="https://angular.dev">Angular RTE</a></em></strong></h2>',
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
    expect(editor.html()).toBe('<p>Angular RTE</p>');
    expect(editor.canExecute('clearFormatting')).toBeFalse();
    expect(editor.execute('clearFormatting')).toBeFalse();

    editor.unmount(host);
  });

  it('should expose text and background color through the public plugin', () => {
    const editor = createRteEditor({
      content: '<p>Angular RTE</p>',
      plugins: [ColorPlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);
    selectEditorRange(editor, 1, 12);

    expect(ColorPlugin.key).toBe('color');
    expect(editor.canExecute('unsetTextColor')).toBeFalse();
    expect(editor.execute('setTextColor', 'not-a-color')).toBeFalse();
    expect(editor.execute('setTextColor', 'rgb(14, 116, 144)')).toBeTrue();
    expect(editor.query<string>('textColor')).toBe('rgb(14, 116, 144)');
    expect(editor.html()).toBe(
      '<p><span style="color: rgb(14, 116, 144);">Angular RTE</span></p>',
    );
    expect(
      editor.execute('setBackgroundColor', 'rgb(254, 240, 138)'),
    ).toBeTrue();
    expect(editor.query<string>('backgroundColor')).toBe(
      'rgb(254, 240, 138)',
    );
    expect(editor.html()).toBe(
      '<p><span style="color: rgb(14, 116, 144); background-color: rgb(254, 240, 138);">Angular RTE</span></p>',
    );
    expect(editor.execute('unsetTextColor')).toBeTrue();
    expect(editor.html()).toBe(
      '<p><span style="background-color: rgb(254, 240, 138);">Angular RTE</span></p>',
    );
    expect(editor.execute('unsetBackgroundColor')).toBeTrue();
    expect(editor.html()).toBe('<p>Angular RTE</p>');

    editor.unmount(host);
  });

  it('should parse serialized color marks through the public plugin', () => {
    const editor = createRteEditor({
      content:
        '<p><span style="color: #0e7490; background-color: #fef08a;">Angular RTE</span></p><p><font color="#be123c">Legacy color</font></p>',
      plugins: [ColorPlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);

    expect(editor.html()).toBe(
      '<p><span style="color: rgb(14, 116, 144); background-color: rgb(254, 240, 138);">Angular RTE</span></p><p><span style="color: rgb(190, 18, 60);">Legacy color</span></p>',
    );

    editor.unmount(host);
  });

  it('should clear code block formatting to a paragraph', () => {
    const editor = createRteEditor({
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
    const editor = createRteEditor({
      content: '<p>Angular RTE</p>',
      plugins: [HardBreakPlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);

    expect(HardBreakPlugin.key).toBe('hardBreak');
    expect(editor.canExecute('insertHardBreak')).toBeTrue();
    expect(editor.execute('insertHardBreak')).toBeTrue();
    expect(editor.html()).toBe('<p><br>Angular RTE</p>');

    editor.unmount(host);
  });

  it('should parse serialized hard breaks through the public plugin', () => {
    const editor = createRteEditor({
      content: '<p>Line one<br>Line two</p>',
      plugins: [HardBreakPlugin],
    });
    const host = document.createElement('div');

    editor.mount(host);

    expect(editor.html()).toBe('<p>Line one<br>Line two</p>');

    editor.unmount(host);
  });

  it('should insert hard breaks with Shift+Enter', () => {
    const editor = createRteEditor({
      content: '<p>Angular RTE</p>',
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
    expect(editor.html()).toBe('<p><br>Angular RTE</p>');

    editor.unmount(host);
  });

  it('should keep Shift+Enter out of code blocks', () => {
    const editor = createRteEditor({
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
    const editor = createRteEditor({
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
      '  fmt.Println("Angular RTE")',
      '}',
    ].join('\n');
    const editor = createRteEditor({
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
    const editor = createRteEditor({
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
    });
    expect(CodeBlockPlugin.options).toEqual(CODE_BLOCK_PLUGIN_DEFAULT_OPTIONS);
    expect(configured.options).toEqual({
      languages: ['plaintext', 'typescript', 'go'],
      defaultLanguage: 'go',
      languageClassPrefix: 'language-',
      indentText: '  ',
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
    const editor = createRteEditor({
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

  it('should expose text alignment through the public plugin', () => {
    const editor = createRteEditor({
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
    const editor = createRteEditor({
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
      createRteEditor({
        plugins: [
          createRtePlugin({
            key: 'badNodeExtension',
            extendNodes: () => ({ missing: { content: 'inline*' } }),
          }),
        ],
      }),
    ).toThrowError(
      'RTE plugin "badNodeExtension" extends unknown node "missing".',
    );
  });

  it('should expose configurable headings defaults and validation', () => {
    const configured = HeadingsPlugin.configure({
      levels: [2, 3, 4],
    });

    expect(HEADINGS_PLUGIN_DEFAULT_OPTIONS).toEqual({
      levels: [1, 2, 3],
    });
    expect(HeadingsPlugin.options).toEqual(HEADINGS_PLUGIN_DEFAULT_OPTIONS);
    expect(configured.options).toEqual({
      levels: [2, 3, 4],
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
    });
    expect(LinkPlugin.options).toEqual(LINK_PLUGIN_DEFAULT_OPTIONS);
    expect(configured.options).toEqual({
      allowedProtocols: ['http', 'https', 'mailto', 'tel'],
      allowRelativeLinks: false,
      defaultTarget: '_blank',
      defaultRel: 'noopener noreferrer',
    });
    expect(() =>
      LinkPlugin.configure({
        allowedProtocols: [],
      }),
    ).toThrowError(
      'LinkPlugin allowedProtocols must include at least one protocol.',
    );
  });
});

function selectEditorRange(
  editor: RteEditorController,
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
