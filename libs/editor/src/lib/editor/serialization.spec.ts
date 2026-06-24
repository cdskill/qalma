import {
  BlockquotePlugin,
  CodeBlockPlugin,
  HardBreakPlugin,
  HeadingsPlugin,
  HighlightPlugin,
  HorizontalRulePlugin,
  ImagePlugin,
  InlineCodePlugin,
  LinkPlugin,
  ListsPlugin,
  MentionPlugin,
  QalmaPlugin,
  SubscriptSuperscriptPlugin,
  TaskListPlugin,
  TextFormattingKit,
} from '../../index';
import { TablePlugin } from '@qalma/editor/table';
import { mountEditor } from '../../../testing/editor-test-utils';

function markdownOf(html: string, plugins: readonly QalmaPlugin[]): string {
  const mounted = mountEditor({ content: html, plugins });

  try {
    return mounted.editor.getMarkdown();
  } finally {
    mounted.unmount();
  }
}

describe('JSON serialization', () => {
  it('round-trips a document through getJSON/setJSON without losing content', () => {
    const source = mountEditor({
      content: '<h2>Title</h2><p><strong>bold</strong> text</p>',
      plugins: [HeadingsPlugin, ...TextFormattingKit],
    });

    try {
      const json = source.editor.getJSON();

      expect(json.type).toBe('doc');

      const target = mountEditor({
        plugins: [HeadingsPlugin, ...TextFormattingKit],
      });

      try {
        target.editor.setJSON(json);

        expect(target.editor.html()).toBe(source.editor.html());
        expect(target.editor.getJSON()).toEqual(json);
      } finally {
        target.unmount();
      }
    } finally {
      source.unmount();
    }
  });

  it('serializes the initial content before the view is mounted', () => {
    const editor = mountEditor({
      content: '<p>Hello</p>',
      plugins: [...TextFormattingKit],
    });
    editor.unmount();

    // getJSON must work without a live view, from the seeded content.
    expect(editor.editor.getJSON().type).toBe('doc');
  });
});

describe('Markdown serialization', () => {
  it('serializes headings with the matching number of hashes', () => {
    expect(markdownOf('<h1>One</h1>', [HeadingsPlugin]).trim()).toBe('# One');
    expect(
      markdownOf('<h3>Three</h3>', [HeadingsPlugin.configure({ levels: [1, 2, 3] })]).trim(),
    ).toBe('### Three');
  });

  it('serializes inline emphasis and code marks', () => {
    expect(
      markdownOf('<p><strong>b</strong> <em>i</em> <s>s</s></p>', [
        ...TextFormattingKit,
      ]).trim(),
    ).toBe('**b** *i* ~~s~~');
    expect(
      markdownOf('<p><code>x = 1</code></p>', [InlineCodePlugin]).trim(),
    ).toBe('`x = 1`');
  });

  it('serializes links', () => {
    expect(
      markdownOf('<p><a href="https://qalma.dev">Qalma</a></p>', [LinkPlugin]).trim(),
    ).toBe('[Qalma](https://qalma.dev)');
  });

  it('serializes blockquotes', () => {
    expect(
      markdownOf('<blockquote><p>quoted</p></blockquote>', [BlockquotePlugin]).trim(),
    ).toBe('> quoted');
  });

  it('serializes fenced code blocks with their language', () => {
    expect(
      markdownOf('<pre><code>plain()</code></pre>', [CodeBlockPlugin]).trim(),
    ).toBe('```\nplain()\n```');
    expect(
      markdownOf('<pre><code class="language-js">const a = 1;</code></pre>', [
        CodeBlockPlugin.configure({ languages: ['plaintext', 'js'] }),
      ]).trim(),
    ).toBe('```js\nconst a = 1;\n```');
  });

  it('serializes bullet and ordered lists', () => {
    expect(
      markdownOf('<ul><li>a</li><li>b</li></ul>', [ListsPlugin]).trim(),
    ).toBe('- a\n- b');
    expect(
      markdownOf('<ol><li>a</li><li>b</li></ol>', [ListsPlugin]).trim(),
    ).toBe('1. a\n2. b');
  });

  it('serializes task lists as GFM checkboxes', () => {
    const md = markdownOf(
      '<ul data-type="task-list">' +
        '<li data-type="task-item" data-checked="true"><p>done</p></li>' +
        '<li data-type="task-item" data-checked="false"><p>todo</p></li>' +
        '</ul>',
      [TaskListPlugin],
    ).trim();

    expect(md).toBe('- [x] done\n- [ ] todo');
  });

  it('serializes horizontal rules and hard breaks', () => {
    expect(markdownOf('<hr>', [HorizontalRulePlugin]).trim()).toBe('---');
    expect(markdownOf('<p>a<br>b</p>', [HardBreakPlugin]).trim()).toBe('a\\\nb');
  });

  it('serializes images', () => {
    expect(
      markdownOf('<p><img src="a.png" alt="Alt text"></p>', [ImagePlugin]).trim(),
    ).toBe('![Alt text](a.png)');
  });

  it('serializes tables as GFM pipe tables', () => {
    const md = markdownOf(
      '<table>' +
        '<tr><th>H1</th><th>H2</th></tr>' +
        '<tr><td>a</td><td>b</td></tr>' +
        '</table>',
      [TablePlugin],
    ).trim();

    expect(md).toBe('| H1 | H2 |\n| --- | --- |\n| a | b |');
  });

  describe('HTML fallback for marks Markdown cannot represent', () => {
    it('wraps underline, sub/superscript, highlight, and color in inline HTML', () => {
      expect(
        markdownOf('<p><u>under</u></p>', [...TextFormattingKit]).trim(),
      ).toBe('<u>under</u>');
      expect(
        markdownOf('<p><sub>lo</sub><sup>hi</sup></p>', [
          SubscriptSuperscriptPlugin,
        ]).trim(),
      ).toBe('<sub>lo</sub><sup>hi</sup>');
      expect(
        markdownOf('<p><mark>hl</mark></p>', [HighlightPlugin]).trim(),
      ).toContain('<mark');
    });

    it('renders a mention as its label text', () => {
      const md = markdownOf(
        '<p><span data-qalma-mention data-mention-id="1" data-mention-label="Ada">@Ada</span></p>',
        [MentionPlugin],
      ).trim();

      expect(md).toBe('@Ada');
    });
  });
});
