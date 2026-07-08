"use client";

import { useEffect } from "react";
import CsvUploader from "@/components/CsvUploader";
import CsvPreviewTable from "@/components/CsvPreviewTable";
import ResultsTable from "@/components/ResultsTable";
import ImportSummary from "@/components/ImportSummary";
import StepIndicator from "@/components/StepIndicator";
import ThemeToggle from "@/components/ThemeToggle";
import { useCsvImport } from "@/hooks/useCsvImport";
import { useToast } from "@/components/ToastProvider";

export default function HomePage() {
  const {
    stage,
    parsedCsv,
    result,
    isLoading,
    error,
    uploadFile,
    confirmImport,
    reset,
    backToUpload,
  } = useCsvImport();

  const { showToast } = useToast();

  useEffect(() => {
    if (error) showToast(error, "error");
  }, [error, showToast]);

  useEffect(() => {
    if (stage === "results" && result) {
      showToast(
        `Import complete: ${result.totalImported} imported, ${result.totalSkipped} skipped.`,
        result.totalSkipped > 0 ? "info" : "success"
      );
    }
  }, [stage, result, showToast]);

  async function handleFileSelected(file: File) {
    await uploadFile(file);
  }

  return (
    <main className="mx-auto max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            GrowEasy <span className="text-brand-600 dark:text-brand-400">AI</span> CSV Importer
          </h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Upload any CSV format — AI will intelligently map it to your CRM lead schema.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <div className="mb-8">
        <StepIndicator current={stage} />
      </div>

      {stage === "upload" && (
        <section>
          <CsvUploader onFileSelected={handleFileSelected} isLoading={isLoading} />
        </section>
      )}

      {stage === "preview" && parsedCsv && (
        <section className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-semibold text-slate-800 dark:text-slate-100">{parsedCsv.fileName}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {parsedCsv.rowCount} rows · {parsedCsv.headers.length} columns detected
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={backToUpload}
                className="rounded-lg border border-slate-200 dark:border-slate-700 px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Choose a different file
              </button>
              <button
                onClick={confirmImport}
                className="rounded-lg bg-brand-600 hover:bg-brand-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors"
              >
                Confirm Import
              </button>
            </div>
          </div>

          <CsvPreviewTable headers={parsedCsv.headers} rows={parsedCsv.rows} />
        </section>
      )}

      {stage === "importing" && (
        <section className="flex flex-col items-center justify-center gap-4 py-24 text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          <p className="text-slate-700 dark:text-slate-300 font-medium">
            AI is analyzing and mapping your leads…
          </p>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            This can take a moment for large files — rows are processed in batches with automatic retries.
          </p>
        </section>
      )}

      {stage === "results" && result && (
        <section className="space-y-6">
          <ImportSummary totalImported={result.totalImported} totalSkipped={result.totalSkipped} />
          <ResultsTable records={result.records} skipped={result.skipped} />
          <div className="flex justify-end">
            <button
              onClick={reset}
              className="rounded-lg bg-brand-600 hover:bg-brand-700 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors"
            >
              Import Another File
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
