import {
  CODE_BLOCK_PLUGIN_DEFAULT_OPTIONS,
  CodeBlockPlugin,
} from '../../index';
import {
  dispatchKey,
  dispatchModKey,
  mountEditor,
  selectEditorRange,
  typeText,
} from '../../../testing/editor-test-utils';

describe('CodeBlockPlugin', () => {
  it('exposes stable commands, command state, and language query', () => {
    const snippet =
      'const enabled = language.length > 0; console.log(enabled);';
    const serializedSnippet = snippet.split('>').join('&gt;');
    const mounted = mountEditor({
      content: `<p>${snippet}</p>`,
      plugins: [
        CodeBlockPlugin.configure({
          languages: ['plaintext', 'typescript', 'go'],
          defaultLanguage: 'typescript',
        }),
      ],
    });

    try {
      const { editor } = mounted;

      expect(CodeBlockPlugin.key).toBe('codeBlock');
      expect(editor.hasCommandState('toggleCodeBlock')).toBe(true);
      expect(editor.hasQuery('codeBlockLanguage')).toBe(true);
      expect(editor.canExecute('toggleCodeBlock', 'ruby')).toBe(false);
      expect(editor.execute('setCodeBlockLanguage', 'go')).toBe(false);

      expect(editor.execute('toggleCodeBlock')).toBe(true);
      expect(editor.isCommandActive('toggleCodeBlock')).toBe(true);
      expect(editor.query<string>('codeBlockLanguage')).toBe('typescript');
      expect(editor.html()).toBe(
        `<pre><code class="language-typescript">${serializedSnippet}</code></pre>`,
      );

      expect(editor.execute('setCodeBlockLanguage', 'GO')).toBe(true);
      expect(editor.query<string>('codeBlockLanguage')).toBe('go');
      expect(editor.html()).toBe(
        `<pre><code class="language-go">${serializedSnippet}</code></pre>`,
      );
      expect(editor.execute('setCodeBlockLanguage', 'ruby')).toBe(false);
      expect(editor.query<string>('codeBlockLanguage')).toBe('go');

      expect(editor.execute('toggleCodeBlock')).toBe(true);
      expect(editor.isCommandActive('toggleCodeBlock')).toBe(false);
      expect(editor.query<string>('codeBlockLanguage')).toBeNull();
      expect(editor.html()).toBe(`<p>${serializedSnippet}</p>`);
    } finally {
      mounted.unmount();
    }
  });

  it('parses code blocks and falls back to the configured default language', () => {
    const snippet = ['package main', '', 'func main() {}'].join('\n');
    const mounted = mountEditor({
      content: [
        `<pre><code class="language-go">${snippet}</code></pre>`,
        '<pre><code class="lang-rust">fn main() {}</code></pre>',
        '<pre><code class="language-ruby">puts "Qalma"</code></pre>',
      ].join(''),
      plugins: [
        CodeBlockPlugin.configure({
          languages: ['plaintext', 'go', 'rust'],
        }),
      ],
    });

    try {
      expect(mounted.editor.html()).toBe(
        [
          `<pre><code class="language-go">${snippet
            .split('\n')
            .join('&#10;')}</code></pre>`,
          '<pre><code class="language-rust">fn main() {}</code></pre>',
          '<pre><code class="language-plaintext">puts "Qalma"</code></pre>',
        ].join(''),
      );
    } finally {
      mounted.unmount();
    }
  });

  it('maps Mod-Alt-c and markdown input rules to code blocks', () => {
    const shortcutMounted = mountEditor({
      content: '<p>Qalma</p>',
      plugins: [CodeBlockPlugin],
    });

    try {
      const event = dispatchModKey(shortcutMounted.editor, 'c', {
        altKey: true,
      });

      expect(event.defaultPrevented).toBe(true);
      expect(shortcutMounted.editor.html()).toBe(
        '<pre><code class="language-plaintext">Qalma</code></pre>',
      );
    } finally {
      shortcutMounted.unmount();
    }

    const inputRuleMounted = mountEditor({
      content: '<p>```go</p>',
      plugins: [
        CodeBlockPlugin.configure({
          languages: ['plaintext', 'go'],
        }),
      ],
    });

    try {
      selectEditorRange(inputRuleMounted.editor, 6, 6);

      expect(typeText(inputRuleMounted.editor, ' ')).toBe(true);
      expect(inputRuleMounted.editor.html()).toBe(
        '<pre><code class="language-go"></code></pre>',
      );
    } finally {
      inputRuleMounted.unmount();
    }
  });

  it('keeps Tab and Shift-Tab inside active code blocks', () => {
    const mounted = mountEditor({
      content:
        '<pre><code class="language-typescript">const answer = 42;</code></pre>',
      plugins: [
        CodeBlockPlugin.configure({
          languages: ['plaintext', 'typescript'],
          defaultLanguage: 'typescript',
        }),
      ],
    });

    try {
      const tabEvent = dispatchKey(mounted.editor, 'Tab');

      expect(tabEvent.defaultPrevented).toBe(true);
      expect(mounted.editor.html()).toBe(
        '<pre><code class="language-typescript">  const answer = 42;</code></pre>',
      );

      const shiftTabEvent = dispatchKey(mounted.editor, 'Tab', {
        shiftKey: true,
      });

      expect(shiftTabEvent.defaultPrevented).toBe(true);
      expect(mounted.editor.html()).toBe(
        '<pre><code class="language-typescript">const answer = 42;</code></pre>',
      );
    } finally {
      mounted.unmount();
    }
  });

  it('exposes immutable defaults and validates configuration', () => {
    const configured = CodeBlockPlugin.configure({
      languages: ['plaintext', 'typescript', 'go'],
      defaultLanguage: 'go',
      languageClassPrefix: 'lang-',
      indentText: '\t',
      inputRules: false,
    });

    expect(Object.isFrozen(CODE_BLOCK_PLUGIN_DEFAULT_OPTIONS)).toBe(true);
    expect(Object.isFrozen(CodeBlockPlugin.options)).toBe(true);
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
      languageClassPrefix: 'lang-',
      indentText: '\t',
      inputRules: false,
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
        languageClassPrefix: 'language prefix',
      }),
    ).toThrowError(
      'CodeBlockPlugin languageClassPrefix must be a non-empty string without whitespace.',
    );
    expect(() =>
      CodeBlockPlugin.configure({
        indentText: '->',
      }),
    ).toThrowError(
      'CodeBlockPlugin indentText must be a non-empty string containing only spaces or tabs.',
    );
  });
});
