/**
 * Table — accessible data table with consistent styling.
 *
 * Usage:
 *   <Table
 *     columns={[{ key: 'name', header: 'Name', width: '40%' }, ...]}
 *     rows={data}
 *     getRowKey={(row) => row.id}
 *     renderCell={(row, colKey) => row[colKey]}
 *   />
 */

interface TableColumn<TKey extends string = string> {
  key: TKey;
  header: string;
  width?: string;
  /** Alignment — default 'left' */
  align?: 'left' | 'center' | 'right';
  /** Screen-reader-only column header (e.g. "Actions") */
  srOnly?: boolean;
}

interface TableProps<TRow> {
  columns: TableColumn[];
  rows: TRow[];
  getRowKey: (row: TRow) => string;
  renderCell: (row: TRow, colKey: string) => React.ReactNode;
  caption?: string;
  /** If true, show a loading skeleton overlay */
  loading?: boolean;
  className?: string;
}

const ALIGN_CLASS = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

export default function Table<TRow>({
  columns,
  rows,
  getRowKey,
  renderCell,
  caption,
  className = '',
}: TableProps<TRow>) {
  return (
    <div className={['overflow-x-auto rounded-lg border border-slate-200', className].join(' ')}>
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        {caption && (
          <caption className="sr-only">{caption}</caption>
        )}
        <thead className="bg-slate-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={col.width ? { width: col.width } : undefined}
                className={[
                  'px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500',
                  ALIGN_CLASS[col.align ?? 'left'],
                  col.srOnly ? 'sr-only' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {rows.map((row) => (
            <tr
              key={getRowKey(row)}
              className="transition-colors hover:bg-slate-50"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={[
                    'px-4 py-3 text-slate-700',
                    ALIGN_CLASS[col.align ?? 'left'],
                  ].join(' ')}
                >
                  {renderCell(row, col.key)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
