import { ImportResult, RawCsvRecord } from "@/types/lead";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export class ApiError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.status = status;
  }
}

export async function importCsvRecords(
  records: RawCsvRecord[]
): Promise<ImportResult> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records }),
    });
  } catch {
    throw new ApiError(
      "Could not reach the import server. Check your connection and the backend URL."
    );
  }

  let payload: ImportResult & { error?: string };
  try {
    payload = await response.json();
  } catch {
    throw new ApiError(
      `Server returned an unexpected response (status ${response.status}).`,
      response.status
    );
  }

  if (!response.ok || !payload.success) {
    throw new ApiError(
      payload.error || `Import failed with status ${response.status}.`,
      response.status
    );
  }

  return payload;
}

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}
