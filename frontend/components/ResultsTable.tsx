"use client";

import { useState } from "react";
import { CrmLead, SkippedRecord } from "@/types/lead";

interface ResultsTableProps {
  records: CrmLead[];
  skipped: SkippedRecord[];
}

const CRM_COLUMNS: (keyof CrmLead)[] = [
  "created_at",
  "name",
  "email",
  "country_code",
  "mobile_without_country_code",
  "company",
  "city",
  "state",
  "country",
  "lead_owner",
  "crm_status",
  "data_source",
  "possession_time",
  "crm_note",
  "description",
];

const STATUS_STYLES: Record<string, string> = {
  GOOD_LEAD_FOLLOW_UP:
    "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300",
  DID_NOT_CONNECT:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  BAD_LEAD: "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
  SALE_DONE:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  "": "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400",
};

export default function ResultsTable({ records, skipped }: ResultsTableProps) {
  const [tab, setTab] = useState<"imported" | "skipped">("imported");

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          onClick={() => setTab("imported")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "imported"
              ? "bg-brand-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          Imported ({records.length})
        </button>
        <button
          onClick={() => setTab("skipped")}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === "skipped"
              ? "bg-red-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          }`}
        >
          Skipped ({skipped.length})
        </button>
      </div>

      {tab === "imported" ? (
        records.length === 0 ? (
          <EmptyState message="No leads were successfully imported." />
        ) : (
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
                <tr>
                  {CRM_COLUMNS.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 whitespace-nowrap"
                    >
                      {col.replace(/_/g, " ")}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {records.map((rec, idx) => (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/60 dark:bg-slate-900/40"}
                  >
                    {CRM_COLUMNS.map((col) => (
                      <td key={col} className="px-4 py-2.5 max-w-[220px] truncate text-slate-700 dark:text-slate-300" title={String(rec[col] || "")}>
                        {col === "crm_status" ? (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[rec.crm_status] || STATUS_STYLES[""]}`}>
                            {rec.crm_status || "—"}
                          </span>
                        ) : (
                          String(rec[col] || "") || <span className="text-slate-300 dark:text-slate-600">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : skipped.length === 0 ? (
        <EmptyState message="No rows were skipped — everything imported successfully." />
      ) : (
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-slate-100 dark:bg-slate-800 z-10">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Reason
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  Original Row
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {skipped.map((s, idx) => (
                <tr key={idx} className={idx % 2 === 0 ? "bg-white dark:bg-slate-900" : "bg-slate-50/60 dark:bg-slate-900/40"}>
                  <td className="px-4 py-2.5 text-red-600 dark:text-red-400 max-w-[240px]">{s.reason}</td>
                  <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 max-w-[420px] truncate" title={JSON.stringify(s.originalRecord)}>
                    {JSON.stringify(s.originalRecord)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 dark:border-slate-800 py-12 text-center text-sm text-slate-500 dark:text-slate-400">
      {message}
    </div>
  );
}
