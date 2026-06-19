import {
  BoldPlugin,
  ItalicPlugin,
  QalmaPlugin,
  StrikePlugin,
  TextFormattingKit,
  UnderlinePlugin,
} from '../../index';
import {
  dispatchModKey,
  mountEditor,
  selectEditorRange,
} from '../../../testing/editor-test-utils';

interface MarkPluginCase {
  name: string;
  plugin: QalmaPlugin;
  key: string;
  command: string;
  html: string;
  shortcut?: string;
}

const markPluginCases: readonly MarkPluginCase[] = [
  {
    name: 'bold',
    plugin: BoldPlugin,
    key: 'bold',
    command: 'toggleBold',
    shortcut: 'b',
    html: '<p><strong>Qalma</strong> text</p>',
  },
  {
    name: 'italic',
    plugin: ItalicPlugin,
    key: 'italic',
    command: 'toggleItalic',
    shortcut: 'i',
    html: '<p><em>Qalma</em> text</p>',
  },
  {
    name: 'underline',
    plugin: UnderlinePlugin,
    key: 'underline',
    command: 'toggleUnderline',
    shortcut: 'u',
    html: '<p><u>Qalma</u> text</p>',
  },
  {
    name: 'strike',
    plugin: StrikePlugin,
    key: 'strike',
    command: 'toggleStrike',
    html: '<p><s>Qalma</s> text</p>',
  },
];

describe('text formatting plugins', () => {
  it('keeps the kit as the public first-party mark collection', () => {
    expect(TextFormattingKit).toEqual([
      BoldPlugin,
      ItalicPlugin,
      UnderlinePlugin,
      StrikePlugin,
    ]);
  });

  for (const markCase of markPluginCases) {
    it(`exposes ${markCase.name} commands and command state`, () => {
      const mounted = mountEditor({
        content: '<p>Qalma text</p>',
        plugins: [markCase.plugin],
      });

      try {
        const { editor } = mounted;

        selectEditorRange(editor, 1, 6);

        expect(markCase.plugin.key).toBe(markCase.key);
        expect(editor.hasCommandState(markCase.command)).toBe(true);
        expect(editor.canExecute(markCase.command)).toBe(true);
        expect(editor.execute(markCase.command)).toBe(true);
        expect(editor.isCommandActive(markCase.command)).toBe(true);
        expect(editor.html()).toBe(markCase.html);

        expect(editor.execute(markCase.command)).toBe(true);
        expect(editor.isCommandActive(markCase.command)).toBe(false);
        expect(editor.html()).toBe('<p>Qalma text</p>');
      } finally {
        mounted.unmount();
      }
    });

    const shortcut = markCase.shortcut;

    if (shortcut) {
      it(`maps ${markCase.name} to its conventional Mod shortcut`, () => {
        const mounted = mountEditor({
          content: '<p>Qalma text</p>',
          plugins: [markCase.plugin],
        });

        try {
          const { editor } = mounted;

          selectEditorRange(editor, 1, 6);

          const event = dispatchModKey(editor, shortcut);

          expect(event.defaultPrevented).toBe(true);
          expect(editor.html()).toBe(markCase.html);
        } finally {
          mounted.unmount();
        }
      });
    }
  }

  it('parses semantic and style-based mark DOM into stable Qalma HTML', () => {
    const mounted = mountEditor({
      content: [
        '<p><b>Bold</b> <span style="font-weight: 600;">weight</span></p>',
        '<p><i>Italic</i> <span style="font-style: italic;">style</span></p>',
        '<p><span style="text-decoration: underline;">Underline</span></p>',
        '<p><del>Strike</del> <span style="text-decoration: line-through;">style</span></p>',
      ].join(''),
      plugins: TextFormattingKit,
    });

    try {
      expect(mounted.editor.html()).toBe(
        [
          '<p><strong>Bold</strong> <strong>weight</strong></p>',
          '<p><em>Italic</em> <em>style</em></p>',
          '<p><u>Underline</u></p>',
          '<p><s>Strike</s> <s>style</s></p>',
        ].join(''),
      );
    } finally {
      mounted.unmount();
    }
  });
});
