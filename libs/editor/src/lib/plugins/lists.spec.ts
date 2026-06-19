import { LISTS_PLUGIN_DEFAULT_OPTIONS, ListsPlugin } from '../../index';
import {
  dispatchModKey,
  mountEditor,
  placeCursorAfterText,
  selectEditorRange,
  selectText,
  typeText,
} from '../../../testing/editor-test-utils';

describe('ListsPlugin', () => {
  it('exposes stable list commands and command state', () => {
    const mounted = mountEditor({
      content: '<p>Plan</p>',
      plugins: [ListsPlugin],
    });

    try {
      const { editor } = mounted;

      expect(ListsPlugin.key).toBe('lists');
      expect(editor.hasCommandState('toggleBulletList')).toBe(true);
      expect(editor.hasCommandState('toggleOrderedList')).toBe(true);
      expect(editor.canExecute('toggleBulletList')).toBe(true);

      expect(editor.execute('toggleBulletList')).toBe(true);
      expect(editor.isCommandActive('toggleBulletList')).toBe(true);
      expect(editor.isCommandActive('toggleOrderedList')).toBe(false);
      expect(editor.html()).toBe('<ul><li><p>Plan</p></li></ul>');

      expect(editor.execute('toggleOrderedList')).toBe(true);
      expect(editor.isCommandActive('toggleBulletList')).toBe(false);
      expect(editor.isCommandActive('toggleOrderedList')).toBe(true);
      expect(editor.html()).toBe('<ol><li><p>Plan</p></li></ol>');

      expect(editor.execute('toggleOrderedList')).toBe(true);
      expect(editor.isCommandActive('toggleOrderedList')).toBe(false);
      expect(editor.html()).toBe('<p>Plan</p>');
    } finally {
      mounted.unmount();
    }
  });

  it('parses and serializes bullet and ordered list nodes', () => {
    const mounted = mountEditor({
      content:
        '<ul><li><p>Bullet</p></li></ul><ol start="3"><li><p>Ordered</p></li></ol>',
      plugins: [ListsPlugin],
    });

    try {
      expect(mounted.editor.html()).toBe(
        '<ul><li><p>Bullet</p></li></ul><ol start="3"><li><p>Ordered</p></li></ol>',
      );
    } finally {
      mounted.unmount();
    }
  });

  it('maps list shortcuts to bullet and ordered list toggles', () => {
    const bulletMounted = mountEditor({
      content: '<p>Bullet</p>',
      plugins: [ListsPlugin],
    });

    try {
      const event = dispatchModKey(bulletMounted.editor, '8', {
        shiftKey: true,
      });

      expect(event.defaultPrevented).toBe(true);
      expect(bulletMounted.editor.html()).toBe(
        '<ul><li><p>Bullet</p></li></ul>',
      );
    } finally {
      bulletMounted.unmount();
    }

    const orderedMounted = mountEditor({
      content: '<p>Ordered</p>',
      plugins: [ListsPlugin],
    });

    try {
      const event = dispatchModKey(orderedMounted.editor, '7', {
        shiftKey: true,
      });

      expect(event.defaultPrevented).toBe(true);
      expect(orderedMounted.editor.html()).toBe(
        '<ol><li><p>Ordered</p></li></ol>',
      );
    } finally {
      orderedMounted.unmount();
    }
  });

  it('nests, lifts, and splits list items through public commands', () => {
    const mounted = mountEditor({
      content: '<ul><li><p>One</p></li><li><p>Two</p></li></ul>',
      plugins: [ListsPlugin],
    });

    try {
      const { editor } = mounted;

      selectText(editor, 'Two');

      expect(editor.execute('sinkListItem')).toBe(true);
      expect(editor.html()).toBe(
        '<ul><li><p>One</p><ul><li><p>Two</p></li></ul></li></ul>',
      );

      expect(editor.execute('liftListItem')).toBe(true);
      expect(editor.html()).toBe(
        '<ul><li><p>One</p></li><li><p>Two</p></li></ul>',
      );

      placeCursorAfterText(editor, 'One');

      expect(editor.execute('splitListItem')).toBe(true);
      expect(editor.html()).toBe(
        '<ul><li><p>One</p></li><li><p></p></li><li><p>Two</p></li></ul>',
      );
    } finally {
      mounted.unmount();
    }
  });

  it('converts markdown list input with input rules', () => {
    const bulletMounted = mountEditor({
      content: '<p>-</p>',
      plugins: [ListsPlugin],
    });

    try {
      selectEditorRange(bulletMounted.editor, 2, 2);

      expect(typeText(bulletMounted.editor, ' ')).toBe(true);
      expect(bulletMounted.editor.html()).toBe('<ul><li><p></p></li></ul>');
    } finally {
      bulletMounted.unmount();
    }

    const orderedMounted = mountEditor({
      content: '<p>3.</p>',
      plugins: [ListsPlugin],
    });

    try {
      selectEditorRange(orderedMounted.editor, 3, 3);

      expect(typeText(orderedMounted.editor, ' ')).toBe(true);
      expect(orderedMounted.editor.html()).toBe(
        '<ol start="3"><li><p></p></li></ol>',
      );
    } finally {
      orderedMounted.unmount();
    }
  });

  it('exposes immutable defaults and validates options', () => {
    const configured = ListsPlugin.configure({
      inputRules: false,
    });

    expect(Object.isFrozen(LISTS_PLUGIN_DEFAULT_OPTIONS)).toBe(true);
    expect(Object.isFrozen(ListsPlugin.options)).toBe(true);
    expect(LISTS_PLUGIN_DEFAULT_OPTIONS).toEqual({
      inputRules: true,
    });
    expect(ListsPlugin.options).toEqual(LISTS_PLUGIN_DEFAULT_OPTIONS);
    expect(configured.options).toEqual({
      inputRules: false,
    });
    expect(() =>
      ListsPlugin.configure({
        inputRules: 'yes' as never,
      }),
    ).toThrowError('ListsPlugin inputRules must be a boolean.');
  });
});
