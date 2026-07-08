import { RawCsvRecord } from "../types/lead";

/**
 * Trims stray whitespace from keys/values and drops fully-empty rows before
 * they are sent to the AI, saving tokens and avoiding wasted batch slots.
 */
export function sanitizeRows(rows: RawCsvRecord[]): RawCsvRecord[] {
  return rows
    .map((row) => {
      const cleaned: RawCsvRecord = {};
      for (const [key, value] of Object.entries(row)) {
        const cleanKey = key.trim();
        if (!cleanKey) continue;
        cleaned[cleanKey] = typeof value === "string" ? value.trim() : value;
      }
      return cleaned;
    })
    .filter((row) =>
      Object.values(row).some(
        (v) => v !== null && v !== undefined && String(v).trim() !== ""
      )
    );
}
