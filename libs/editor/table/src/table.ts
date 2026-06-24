import { keymap } from 'prosemirror-keymap';
import { Node as ProseMirrorNode, NodeType, Schema } from 'prosemirror-model';
import { EditorState, Selection } from 'prosemirror-state';
import {
  addColumnAfter,
  addColumnBefore,
  addRowAfter,
  addRowBefore,
  columnResizing,
  deleteColumn,
  deleteRow,
  deleteTable,
  goToNextCell,
  isInTable,
  mergeCells,
  splitCell,
  tableEditing,
  tableNodeTypes,
  tableNodes,
  toggleHeaderCell,
  toggleHeaderColumn,
  toggleHeaderRow,
} from 'prosemirror-tables';

import {
  createConfigurableQalmaPlugin,
  createQalmaPlugin,
  QalmaCommandHandler,
  QalmaCommandValue,
  QalmaPlugin,
} from '@qalma/editor';

export interface InsertTableValue {
  rows?: number;
  columns?: number;
  withHeaderRow?: boolean;
}

export interface TablePluginOptions {
  /** Render the column-resizing handles and node view. */
  resizable: boolean;
  /** Rows created by `insertTable` when no value overrides it. */
  defaultRows: number;
  /** Columns created by `insertTable` when no value overrides it. */
  defaultColumns: number;
  /** Make the first row a header row in `insertTable` by default. */
  defaultWithHeaderRow: boolean;
}

export const TABLE_PLUGIN_DEFAULT_OPTIONS: Readonly<TablePluginOptions> =
  Object.freeze({
    resizable: true,
    defaultRows: 3,
    defaultColumns: 3,
    defaultWithHeaderRow: true,
  });

// Cells hold block content (paragraphs, lists, headings…) and carry the
// colspan/rowspan/colwidth attributes prosemirror-tables manages internally.
const tableSpecs = tableNodes({
  tableGroup: 'block',
  cellContent: 'block+',
  cellAttributes: {},
});

export const TablePlugin = /* @__PURE__ */ createConfigurableQalmaPlugin(
  TABLE_PLUGIN_DEFAULT_OPTIONS,
  (options) => {
    assertTablePluginOptions(options);

    return createQalmaPlugin({
      key: 'table',
      nodes: {
        table: tableSpecs.table,
        table_row: tableSpecs.table_row,
        table_cell: tableSpecs.table_cell,
        table_header: tableSpecs.table_header,
      },
      commands: (schema) => ({
        insertTable: createInsertTableCommand(schema, options),
        addRowBefore,
        addRowAfter,
        addColumnBefore,
        addColumnAfter,
        deleteRow,
        deleteColumn,
        deleteTable,
        mergeCells,
        splitCell,
        toggleHeaderRow,
        toggleHeaderColumn,
        toggleHeaderCell,
      }),
      queries: () => ({
        isInTable: (state) => isInTable(state),
      }),
      // Tab/Shift-Tab run here (not via the shortcut registry) so they compose
      // with the lists plugin's Tab: goToNextCell returns false outside a
      // table, letting list indentation handle the key instead.
      prosemirrorPlugins: () => [
        keymap({
          Tab: goToNextCell(1),
          'Shift-Tab': goToNextCell(-1),
        }),
        ...(options.resizable ? [columnResizing()] : []),
        tableEditing(),
      ],
    });
  },
);

export const TableKit: readonly QalmaPlugin[] = [TablePlugin];

function createInsertTableCommand(
  schema: Schema,
  options: Readonly<TablePluginOptions>,
): QalmaCommandHandler {
  const tableType = schema.nodes['table'];

  return (state, dispatch, _view, value) => {
    if (!canInsert(state, tableType)) {
      return false;
    }

    if (dispatch) {
      const table = createTableNode(schema, resolveInsertTableValue(value, options));
      const tr = state.tr.replaceSelectionWith(table);
      const cursor = tr.doc.resolve(tr.mapping.map(state.selection.from));

      dispatch(tr.setSelection(Selection.near(cursor)).scrollIntoView());
    }

    return true;
  };
}

function createTableNode(
  schema: Schema,
  value: Required<InsertTableValue>,
): ProseMirrorNode {
  const types = tableNodeTypes(schema);
  const rows: ProseMirrorNode[] = [];

  for (let row = 0; row < value.rows; row++) {
    const cellType =
      value.withHeaderRow && row === 0 ? types.header_cell : types.cell;
    const cells: ProseMirrorNode[] = [];

    for (let column = 0; column < value.columns; column++) {
      const cell = cellType.createAndFill();

      if (cell) {
        cells.push(cell);
      }
    }

    rows.push(types.row.create(null, cells));
  }

  return types.table.create(null, rows);
}

function resolveInsertTableValue(
  value: QalmaCommandValue,
  options: Readonly<TablePluginOptions>,
): Required<InsertTableValue> {
  const override = (value ?? {}) as InsertTableValue;

  return {
    rows: toPositiveInteger(override.rows, options.defaultRows),
    columns: toPositiveInteger(override.columns, options.defaultColumns),
    withHeaderRow: override.withHeaderRow ?? options.defaultWithHeaderRow,
  };
}

function toPositiveInteger(value: number | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(1, Math.floor(value));
}

function canInsert(state: EditorState, nodeType: NodeType): boolean {
  const { $from } = state.selection;

  for (let depth = $from.depth; depth >= 0; depth--) {
    const index = $from.index(depth);

    if ($from.node(depth).canReplaceWith(index, index, nodeType)) {
      return true;
    }
  }

  return false;
}

function assertTablePluginOptions(
  options: Readonly<TablePluginOptions>,
): void {
  if (typeof options.resizable !== 'boolean') {
    throw new TypeError('TablePlugin resizable must be a boolean.');
  }

  if (typeof options.defaultWithHeaderRow !== 'boolean') {
    throw new TypeError('TablePlugin defaultWithHeaderRow must be a boolean.');
  }

  assertPositiveInteger(options.defaultRows, 'defaultRows');
  assertPositiveInteger(options.defaultColumns, 'defaultColumns');
}

function assertPositiveInteger(value: number, name: string): void {
  if (!Number.isInteger(value) || value < 1) {
    throw new RangeError(`TablePlugin ${name} must be an integer of at least 1.`);
  }
}
