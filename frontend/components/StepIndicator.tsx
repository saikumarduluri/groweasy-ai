import { ImportStage } from "@/hooks/useCsvImport";

const STEPS: { key: ImportStage; label: string }[] = [
  { key: "upload", label: "Upload" },
  { key: "preview", label: "Preview" },
  { key: "importing", label: "AI Import" },
  { key: "results", label: "Results" },
];

export default function StepIndicator({ current }: { current: ImportStage }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);

  return (
    <ol className="flex items-center gap-2 sm:gap-4">
      {STEPS.map((step, idx) => {
        const isActive = idx === currentIndex;
        const isDone = idx < currentIndex;
        return (
          <li key={step.key} className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold transition-colors
                  ${isDone ? "bg-brand-600 text-white" : isActive ? "bg-brand-500 text-white ring-4 ring-brand-100 dark:ring-brand-900/40" : "bg-slate-200 text-slate-500 dark:bg-slate-800 dark:text-slate-400"}`}
              >
                {isDone ? "✓" : idx + 1}
              </div>
              <span
                className={`hidden sm:inline text-sm font-medium ${
                  isActive ? "text-slate-900 dark:text-slate-100" : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {step.label}
              </span>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={`h-px w-6 sm:w-10 ${isDone ? "bg-brand-500" : "bg-slate-200 dark:bg-slate-700"}`} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
