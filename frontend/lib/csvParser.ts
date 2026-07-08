import Papa from "papaparse";
import { ParsedCsv, RawCsvRecord } from "@/types/lead";

export class CsvParseError extends Error {}

export function parseCsvFile(file: File): Promise<ParsedCsv> {
  return new Promise((resolve, reject) => {
    if (!file.name.toLowerCase().endsWith(".csv") && file.type !== "text/csv") {
      reject(new CsvParseError("Please upload a valid .csv file."));
      return;
    }

    Papa.parse<RawCsvRecord>(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: false,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.errors && results.errors.length > 0) {
          const critical = results.errors.filter((e) => e.type === "Delimiter" || e.type === "Quotes");
          if (critical.length > 0 && (!results.data || results.data.length === 0)) {
            reject(new CsvParseError("Could not parse this CSV file. Please check its formatting."));
            return;
          }
        }

        const rows = (results.data || []).filter((row) =>
          Object.values(row).some((v) => v !== undefined && v !== null && String(v).trim() !== "")
        );

        if (rows.length === 0) {
          reject(new CsvParseError("The CSV file appears to be empty."));
          return;
        }

        const headers = results.meta.fields ? results.meta.fields.map((f) => f.trim()) : Object.keys(rows[0]);

        resolve({
          headers,
          rows,
          fileName: file.name,
          rowCount: rows.length,
        });
      },
      error: (err) => {
        reject(new CsvParseError(err.message || "Failed to parse CSV file."));
      },
    });
  });
}
