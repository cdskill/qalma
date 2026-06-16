import {
  HeadingsPlugin,
  HistoryPlugin,
  ListsPlugin,
  QalmaEditorController,
  QalmaPlugin,
  SlashCommandPlugin,
  SlashCommandState,
  createQalmaEditor,
} from '@qalma/editor';
import { TextSelection } from 'prosemirror-state';
import { EditorView } from 'prosemirror-view';
import { describe, expect, it } from 'vitest';

import {
  PlaygroundSlashCommandController,
  PlaygroundSlashCommandOption,
} from './slash-command';

describe('PlaygroundSlashCommandController.insert', () => {
  it('renders the block on a new line instead of transforming the current block', () => {
    const { editor, host } = mountEditor('<h1>Title /</h1>', [
      SlashCommandPlugin,
      HeadingsPlugin,
      ListsPlugin,
    ]);
    // caret right after the trigger inside the non-empty heading
    selectRange(editor, 8, 8);

    new PlaygroundSlashCommandController(editor).insert(
      option('toggleHeading2'),
    );

    expect(editor.html()).toBe('<h1>Title </h1><h2></h2>');

    editor.unmount(host);
  });

  it('transforms an empty block in place without leaving a stray line', () => {
    const { editor, host } = mountEditor('<p>/</p>', [
      SlashCommandPlugin,
      HeadingsPlugin,
      ListsPlugin,
    ]);
    selectRange(editor, 2, 2);

    new PlaygroundSlashCommandController(editor).insert(
      option('toggleHeading1'),
    );

    expect(editor.html()).toBe('<h1></h1>');

    editor.unmount(host);
  });

  it('keeps the list item and lifts the result out of the list', () => {
    const { editor, host } = mountEditor('<ul><li><p>Item /</p></li></ul>', [
      SlashCommandPlugin,
      ListsPlugin,
      HeadingsPlugin,
    ]);
    // caret right after the trigger inside the list item paragraph
    selectRange(editor, 9, 9);

    new PlaygroundSlashCommandController(editor).insert(
      option('toggleHeading1'),
    );

    expect(editor.html()).toBe('<ul><li><p>Item </p></li></ul><h1></h1>');

    editor.unmount(host);
  });
});

describe('SlashCommandPlugin', () => {
  it('re-detects a slash command after the deletion is undone', () => {
    const { editor, host } = mountEditor('<p>/he</p>', [
      SlashCommandPlugin,
      HistoryPlugin,
    ]);
    selectRange(editor, 4, 4);

    expect(editor.execute('deleteSlashCommand')).toBe(true);
    expect(editor.html()).toBe('<p></p>');

    // undo restores the text; the menu must re-trigger (no sticky dismissedId)
    expect(editor.execute('undo')).toBe(true);
    expect(editor.html()).toBe('<p>/he</p>');
    expect(editor.query<SlashCommandState>('slashCommand')).toEqual({
      from: 1,
      to: 4,
      query: 'he',
      trigger: '/',
    });

    editor.unmount(host);
  });

  it('re-detects a dismissed slash command after the user keeps typing', () => {
    const { editor, host } = mountEditor('<p>/</p>', [SlashCommandPlugin]);
    selectRange(editor, 2, 2);

    expect(editor.execute('dismissSlashCommand')).toBe(true);
    expect(editor.query<SlashCommandState>('slashCommand')).toBeNull();

    insertText(editor, 'h');

    expect(editor.query<SlashCommandState>('slashCommand')).toEqual({
      from: 1,
      to: 3,
      query: 'h',
      trigger: '/',
    });

    editor.unmount(host);
  });
});

function mountEditor(
  content: string,
  plugins: readonly QalmaPlugin[],
): { editor: QalmaEditorController; host: HTMLElement } {
  const editor = createQalmaEditor({ content, plugins });
  const host = document.createElement('div');

  editor.mount(host);

  return { editor, host };
}

function selectRange(
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

function insertText(editor: QalmaEditorController, text: string): void {
  const view = (editor as unknown as { editorView: EditorView | undefined })
    .editorView;

  if (!view) {
    throw new Error('Editor view is not mounted.');
  }

  view.dispatch(view.state.tr.insertText(text));
}

function option(command: string): PlaygroundSlashCommandOption {
  return {
    id: command,
    label: command,
    description: '',
    command,
    shortcut: '',
    icon: '',
    keywords: [],
  };
}
