"use client";

import { FixedSizeList as List, ListChildComponentProps } from "react-window";
import { RawCsvRecord } from "@/types/lead";

interface CsvPreviewTableProps {
  headers: string[];
  rows: RawCsvRecord[];
}

const ROW_HEIGHT = 44;
const MAX_LIST_HEIGHT = 480;
const COL_WIDTH = 200;

export default function CsvPreviewTable({ headers, rows }: CsvPreviewTableProps) {
  const listHeight = Math.min(MAX_LIST_HEIGHT, rows.length * ROW_HEIGHT || ROW_HEIGHT);
  const tableWidth = Math.max(headers.length * COL_WIDTH, 640);

  function Row({ index, style }: ListChildComponentProps) {
    const row = rows[index];
    return (
      <div
        style={{ ...style, width: tableWidth }}
        className={`flex border-b border-slate-100 dark:border-slate-800 ${
          index % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/60 dark:bg-slate-900/40"
        }`}
      >
        {headers.map((h) => (
          <div
            key={h}
            style={{ width: COL_WIDTH, minWidth: COL_WIDTH }}
            className="px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 truncate"
            title={String(row[h] ?? "")}
          >
            {String(row[h] ?? "") || <span className="text-slate-300 dark:text-slate-600">—</span>}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ width: tableWidth }}>
          <div className="flex sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
            {headers.map((h) => (
              <div
                key={h}
                style={{ width: COL_WIDTH, minWidth: COL_WIDTH }}
                className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 truncate"
                title={h}
              >
                {h}
              </div>
            ))}
          </div>

          <List
            height={listHeight}
            itemCount={rows.length}
            itemSize={ROW_HEIGHT}
            width={tableWidth}
          >
            {Row}
          </List>
        </div>
      </div>
    </div>
  );
}
