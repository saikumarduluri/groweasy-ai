interface ImportSummaryProps {
  totalImported: number;
  totalSkipped: number;
}

export default function ImportSummary({ totalImported, totalSkipped }: ImportSummaryProps) {
  const total = totalImported + totalSkipped;
  const successRate = total > 0 ? Math.round((totalImported / total) * 100) : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard label="Successfully Imported" value={totalImported} accent="text-brand-600 dark:text-brand-400" />
      <StatCard label="Skipped" value={totalSkipped} accent="text-red-500 dark:text-red-400" />
      <StatCard label="Success Rate" value={`${successRate}%`} accent="text-slate-800 dark:text-slate-200" />
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number | string; accent: string }) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}
