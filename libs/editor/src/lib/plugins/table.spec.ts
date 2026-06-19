import { TABLE_PLUGIN_DEFAULT_OPTIONS, TablePlugin } from '../../index';
import { mountEditor, selectEditorRange } from '../../../testing/editor-test-utils';

describe('TablePlugin', () => {
  it('exposes stable table insertion command and table-state query', () => {
    const mounted = mountEditor({
      content: '<p></p>',
      plugins: [
        TablePlugin.configure({
          resizable: false,
        }),
      ],
    });

    try {
      const { editor, host } = mounted;

      expect(TablePlugin.key).toBe('table');
      expect(editor.hasQuery('isInTable')).toBe(true);
      expect(editor.query<boolean>('isInTable')).toBe(false);
      expect(
        editor.execute('insertTable', {
          rows: 2,
          columns: 2,
          withHeaderRow: true,
        }),
      ).toBe(true);
      selectEditorRange(editor, 4, 4);

      expect(editor.query<boolean>('isInTable')).toBe(true);
      expect(host.querySelectorAll('table')).toHaveLength(1);
      expect(host.querySelectorAll('tr')).toHaveLength(2);
      expect(host.querySelectorAll('th')).toHaveLength(2);
      expect(host.querySelectorAll('td')).toHaveLength(2);
    } finally {
      mounted.unmount();
    }
  });

  it('runs core table structure commands while the selection is in a table', () => {
    const mounted = mountEditor({
      content: '<p></p>',
      plugins: [
        TablePlugin.configure({
          resizable: false,
        }),
      ],
    });

    try {
      const { editor, host } = mounted;

      expect(
        editor.execute('insertTable', {
          rows: 2,
          columns: 2,
          withHeaderRow: false,
        }),
      ).toBe(true);
      selectEditorRange(editor, 4, 4);

      expect(host.querySelectorAll('tr')).toHaveLength(2);
      expect(host.querySelectorAll('td')).toHaveLength(4);

      expect(editor.execute('addRowAfter')).toBe(true);
      expect(host.querySelectorAll('tr')).toHaveLength(3);

      expect(editor.execute('addColumnAfter')).toBe(true);
      expect(host.querySelectorAll('tr:first-child td')).toHaveLength(3);

      expect(editor.execute('toggleHeaderRow')).toBe(true);
      expect(host.querySelectorAll('th')).toHaveLength(3);

      expect(editor.execute('deleteColumn')).toBe(true);
      expect(host.querySelectorAll('th')).toHaveLength(2);

      expect(editor.execute('deleteRow')).toBe(true);
      expect(host.querySelectorAll('tr')).toHaveLength(2);

      expect(editor.execute('deleteTable')).toBe(true);
      expect(editor.query<boolean>('isInTable')).toBe(false);
      expect(host.querySelector('table')).toBeNull();
    } finally {
      mounted.unmount();
    }
  });

  it('sanitizes insert overrides with configured defaults', () => {
    const mounted = mountEditor({
      content: '<p></p>',
      plugins: [
        TablePlugin.configure({
          resizable: false,
          defaultRows: 2,
          defaultColumns: 4,
          defaultWithHeaderRow: false,
        }),
      ],
    });

    try {
      const { editor, host } = mounted;

      expect(
        editor.execute('insertTable', {
          rows: 0,
          columns: Number.NaN,
        }),
      ).toBe(true);
      expect(host.querySelectorAll('tr')).toHaveLength(1);
      expect(host.querySelectorAll('td')).toHaveLength(4);
      expect(host.querySelectorAll('th')).toHaveLength(0);
    } finally {
      mounted.unmount();
    }
  });

  it('exposes immutable defaults and validates configuration', () => {
    const configured = TablePlugin.configure({
      resizable: false,
      defaultRows: 2,
      defaultColumns: 4,
      defaultWithHeaderRow: false,
    });

    expect(Object.isFrozen(TABLE_PLUGIN_DEFAULT_OPTIONS)).toBe(true);
    expect(Object.isFrozen(TablePlugin.options)).toBe(true);
    expect(TABLE_PLUGIN_DEFAULT_OPTIONS).toEqual({
      resizable: true,
      defaultRows: 3,
      defaultColumns: 3,
      defaultWithHeaderRow: true,
    });
    expect(TablePlugin.options).toEqual(TABLE_PLUGIN_DEFAULT_OPTIONS);
    expect(configured.options).toEqual({
      resizable: false,
      defaultRows: 2,
      defaultColumns: 4,
      defaultWithHeaderRow: false,
    });
    expect(() =>
      TablePlugin.configure({
        resizable: 'yes' as never,
      }),
    ).toThrowError('TablePlugin resizable must be a boolean.');
    expect(() =>
      TablePlugin.configure({
        defaultWithHeaderRow: 'yes' as never,
      }),
    ).toThrowError('TablePlugin defaultWithHeaderRow must be a boolean.');
    expect(() =>
      TablePlugin.configure({
        defaultRows: 0,
      }),
    ).toThrowError('TablePlugin defaultRows must be an integer of at least 1.');
    expect(() =>
      TablePlugin.configure({
        defaultColumns: 0,
      }),
    ).toThrowError(
      'TablePlugin defaultColumns must be an integer of at least 1.',
    );
  });
});
