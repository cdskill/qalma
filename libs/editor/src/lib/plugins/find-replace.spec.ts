import { FindReplacePlugin, FindReplaceState } from '../../index';
import { getEditorView, mountEditor } from '../../../testing/editor-test-utils';

describe('FindReplacePlugin', () => {
  it('finds text across mark boundaries and navigates cyclically', () => {
    const mounted = mountEditor({
      content: '<p>one t<strong>wo</strong> one</p>',
      plugins: [FindReplacePlugin],
    });

    try {
      expect(mounted.editor.execute('setFindQuery', 'two')).toBe(true);
      expect(mounted.editor.query<FindReplaceState>('findReplace')).toEqual({
        query: 'two',
        caseSensitive: false,
        wholeWord: false,
        total: 1,
        activeMatch: null,
        current: null,
      });
      expect(
        mounted.host.querySelectorAll('[data-qalma-find-match]'),
      ).toHaveLength(1);

      expect(mounted.editor.execute('findNext')).toBe(true);
      expect(
        mounted.editor.query<FindReplaceState>('findReplace')?.activeMatch,
      ).toBe(1);
      expect(getEditorView(mounted.editor).state.selection.content().size).toBe(
        3,
      );
      expect(mounted.editor.execute('findPrevious')).toBe(true);
      expect(
        mounted.editor.query<FindReplaceState>('findReplace')?.activeMatch,
      ).toBe(1);
    } finally {
      mounted.unmount();
    }
  });

  it('supports case-sensitive whole-word matching', () => {
    const mounted = mountEditor({
      content: '<p>Cat catalog cat</p>',
      plugins: [FindReplacePlugin],
    });

    try {
      mounted.editor.execute('setFindQuery', {
        query: 'Cat',
        caseSensitive: true,
        wholeWord: true,
      });

      expect(mounted.editor.query<FindReplaceState>('findReplace')?.total).toBe(
        1,
      );
    } finally {
      mounted.unmount();
    }
  });

  it('replaces the current match or every match and clears search state', () => {
    const mounted = mountEditor({
      content: '<p>cat cat cat</p>',
      plugins: [FindReplacePlugin],
    });

    try {
      mounted.editor.execute('setFindQuery', 'cat');
      mounted.editor.execute('findNext');
      expect(mounted.editor.execute('replaceCurrent', 'dog')).toBe(true);
      expect(mounted.editor.getMarkdown()).toBe('dog cat cat');
      expect(mounted.editor.query<FindReplaceState>('findReplace')?.total).toBe(
        2,
      );

      expect(mounted.editor.execute('replaceAll', { replacement: 'fox' })).toBe(
        true,
      );
      expect(mounted.editor.getMarkdown()).toBe('dog fox fox');
      expect(mounted.editor.query<FindReplaceState>('findReplace')?.total).toBe(
        0,
      );

      expect(mounted.editor.execute('clearFind')).toBe(true);
      expect(mounted.editor.query<FindReplaceState>('findReplace')?.query).toBe(
        '',
      );
    } finally {
      mounted.unmount();
    }
  });

  it('validates options and rejects malformed command values', () => {
    expect(() =>
      FindReplacePlugin.configure({ className: 'two classes' }),
    ).toThrow(/one non-empty CSS class name/);

    const mounted = mountEditor({
      plugins: [FindReplacePlugin],
    });

    try {
      expect(mounted.editor.execute('setFindQuery', { query: 42 })).toBe(false);
      expect(mounted.editor.execute('replaceAll', {})).toBe(false);
      expect(mounted.editor.execute('findNext')).toBe(false);
    } finally {
      mounted.unmount();
    }
  });
});
