// The one table style used across the dashboard. You describe the columns; it
// applies the shared look: small grey headings, light row dividers, and numbers
// right-aligned with equal-width digits so they line up.
//
// A server component: it's turned into HTML on the server and sends no JavaScript.

export interface Column<T> {
  header: string;
  cell: (row: T) => React.ReactNode; // what to show in this column for a row
  align?: "left" | "right"; // default: left for the first column, right for the rest (numbers)
  className?: string; // extra classes for this column's cells, e.g. a font or a max width
  title?: (row: T) => string; // text shown on hover, e.g. the full text of a cut-off cell
}

interface DataTableProps<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string; // a unique, stable id for each row (React needs it, see Module 2)
}

// Written out in full on purpose: Tailwind only creates classes it can find spelled
// out in the code, so a class built while running (`text-${align}`) would never work.
const ALIGN_CLASS = { left: "text-left", right: "text-right" } as const;

export default function DataTable<T>({ rows, columns, rowKey }: DataTableProps<T>) {
  const alignOf = (column: Column<T>, index: number) => column.align ?? (index === 0 ? "left" : "right");
  // The first column has space on its right; the others have space on their left.
  const paddingOf = (index: number) => (index === 0 ? "pr-4" : "pl-4");

  return (
    // On narrow screens the table scrolls sideways inside its card instead of
    // stretching the whole page.
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-xs font-medium text-gray-500">
            {columns.map((column, i) => (
              <th
                key={column.header}
                scope="col"
                className={`py-2 ${paddingOf(i)} ${ALIGN_CLASS[alignOf(column, i)]} font-medium`}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={rowKey(row)} className="border-b border-gray-100 last:border-0">
              {columns.map((column, i) => (
                <td
                  key={column.header}
                  title={column.title?.(row)}
                  className={`py-2 ${paddingOf(i)} ${ALIGN_CLASS[alignOf(column, i)]} ${
                    alignOf(column, i) === "right" ? "tabular-nums" : ""
                  } text-gray-900 ${column.className ?? ""}`}
                >
                  {column.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
