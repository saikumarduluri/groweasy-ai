import { Request, Response, NextFunction } from "express";
import { validateImportRequest } from "../validators/importValidator";
import { sanitizeRows } from "../services/csvService";
import { chunkRows, extractBatch } from "../services/aiService";
import { env } from "../config/env";
import { CrmLead, ImportResult, SkippedRecord } from "../types/lead";

export async function importLeads(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const parsed = validateImportRequest(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request payload",
        details: parsed.error.flatten(),
      });
    }

    const rows = sanitizeRows(parsed.data.records as never);

    if (rows.length === 0) {
      const empty: ImportResult = {
        success: true,
        records: [],
        skipped: [],
        totalImported: 0,
        totalSkipped: 0,
      };
      return res.status(200).json(empty);
    }

    const batches = chunkRows(rows, env.batchSize);

    const allLeads: CrmLead[] = [];
    const allSkipped: SkippedRecord[] = [];

    // Process batches sequentially to respect rate limits and keep memory
    // predictable; each batch already retries internally on failure.
    for (const batch of batches) {
      const outcome = await extractBatch(batch);
      allLeads.push(...outcome.leads);
      allSkipped.push(...outcome.skipped);
    }

    const result: ImportResult = {
      success: true,
      records: allLeads,
      skipped: allSkipped,
      totalImported: allLeads.length,
      totalSkipped: allSkipped.length,
    };

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}
