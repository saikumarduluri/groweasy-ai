"use client";

import { useCallback, useState } from "react";
import { parseCsvFile, CsvParseError } from "@/lib/csvParser";
import { importCsvRecords, ApiError } from "@/services/api";
import { ImportResult, ParsedCsv } from "@/types/lead";

export type ImportStage = "upload" | "preview" | "importing" | "results";

interface UseCsvImportState {
  stage: ImportStage;
  parsedCsv: ParsedCsv | null;
  result: ImportResult | null;
  isLoading: boolean;
  error: string | null;
}

export function useCsvImport() {
  const [state, setState] = useState<UseCsvImportState>({
    stage: "upload",
    parsedCsv: null,
    result: null,
    isLoading: false,
    error: null,
  });

  const uploadFile = useCallback(async (file: File) => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const parsed = await parseCsvFile(file);
      setState((s) => ({
        ...s,
        parsedCsv: parsed,
        stage: "preview",
        isLoading: false,
      }));
      return { ok: true as const };
    } catch (err) {
      const message =
        err instanceof CsvParseError
          ? err.message
          : "Failed to read the CSV file.";
      setState((s) => ({ ...s, isLoading: false, error: message }));
      return { ok: false as const, message };
    }
  }, []);

  const confirmImport = useCallback(async () => {
    if (!state.parsedCsv) return;
    const rows = state.parsedCsv.rows;

    setState((s) => ({ ...s, stage: "importing", isLoading: true, error: null }));

    try {
      const result = await importCsvRecords(rows);
      setState((s) => ({ ...s, result, stage: "results", isLoading: false }));
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Import failed unexpectedly.";
      setState((s) => ({ ...s, isLoading: false, error: message, stage: "preview" }));
    }
  }, [state.parsedCsv]);

  const reset = useCallback(() => {
    setState({
      stage: "upload",
      parsedCsv: null,
      result: null,
      isLoading: false,
      error: null,
    });
  }, []);

  const backToUpload = useCallback(() => {
    setState((s) => ({ ...s, stage: "upload", parsedCsv: null, error: null }));
  }, []);

  return {
    ...state,
    uploadFile,
    confirmImport,
    reset,
    backToUpload,
  };
}
