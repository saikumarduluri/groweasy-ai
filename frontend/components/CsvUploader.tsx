"use client";

import { useCallback, useRef, useState } from "react";

interface CsvUploaderProps {
  onFileSelected: (file: File) => void;
  isLoading: boolean;
}

export default function CsvUploader({ onFileSelected, isLoading }: CsvUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);
      if (isLoading) return;
      const file = e.dataTransfer.files?.[0];
      if (file) onFileSelected(file);
    },
    [onFileSelected, isLoading]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) onFileSelected(file);
      e.target.value = "";
    },
    [onFileSelected]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        if (!isLoading) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      onClick={() => !isLoading && inputRef.current?.click()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if ((e.key === "Enter" || e.key === " ") && !isLoading) inputRef.current?.click();
      }}
      aria-label="Upload CSV file"
      className={`group relative flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed p-10 sm:p-16 text-center transition-colors cursor-pointer
        ${isDragging
          ? "border-brand-500 bg-brand-50 dark:bg-brand-900/20"
          : "border-slate-300 dark:border-slate-700 hover:border-brand-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"}
        ${isLoading ? "opacity-60 pointer-events-none" : ""}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleInputChange}
        disabled={isLoading}
      />

      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300 group-hover:scale-105 transition-transform">
        {isLoading ? (
          <svg className="h-8 w-8 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
        ) : (
          <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0l-4 4m4-4l4 4M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
          </svg>
        )}
      </div>

      <div>
        <p className="text-base font-semibold text-slate-800 dark:text-slate-100">
          {isLoading ? "Reading your file…" : "Drag & drop your CSV here"}
        </p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          or click to browse — any CSV format is supported
        </p>
      </div>

      <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-medium text-slate-500 dark:text-slate-400">
        .csv files only
      </span>
    </div>
  );
}
