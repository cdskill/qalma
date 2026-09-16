import { createQalmaEditor } from '../../index';
import { EssentialsKit } from '@qalma/editor/essentials';

describe('EssentialsKit', () => {
  it('provides an immutable, collision-free authoring baseline', () => {
    const keys = EssentialsKit.map((plugin) => plugin.key);

    expect(new Set(keys).size).toBe(keys.length);
    expect(keys).toEqual([
      'headings',
      'bold',
      'italic',
      'underline',
      'strike',
      'inlineCode',
      'blockquote',
      'lists',
      'codeBlock',
      'horizontalRule',
      'hardBreak',
      'link',
      'history',
      'clearFormatting',
      'pasteRules',
      'trailingParagraph',
    ]);
    expect(() =>
      createQalmaEditor({
        plugins: [...EssentialsKit],
      }),
    ).not.toThrow();
  });
});
