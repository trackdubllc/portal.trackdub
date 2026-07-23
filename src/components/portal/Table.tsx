import type { ReactNode } from "react";
import { LoadingSpinner } from "./LoadingSpinner";

export interface Column<T> {
  key: string;
  header: ReactNode;
  render: (item: T, index: number) => ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
  "aria-label"?: string;
}

export function Table<T>({
  columns,
  data,
  keyExtractor,
  loading = false,
  emptyMessage = "No data available.",
  className = "",
  "aria-label": ariaLabel,
}: TableProps<T>) {
  if (loading) {
    return <LoadingSpinner message="Loading data…" />;
  }

  if (data.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-gray-500" role="status">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table
        className="min-w-full divide-y divide-gray-200"
        aria-label={ariaLabel}
      >
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 ${col.className ?? ""}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {data.map((item, idx) => (
            <tr
              key={keyExtractor(item, idx)}
              className="hover:bg-gray-50 transition-colors"
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={`whitespace-nowrap px-4 py-3 text-sm text-gray-700 ${col.className ?? ""}`}
                >
                  {col.render(item, idx)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
