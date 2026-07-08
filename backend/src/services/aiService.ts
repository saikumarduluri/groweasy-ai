import OpenAI from "openai";
import { env } from "../config/env";
import { CrmLead, RawCsvRecord, SkippedRecord } from "../types/lead";

const ALLOWED_CRM_STATUS = [
  "GOOD_LEAD_FOLLOW_UP",
  "DID_NOT_CONNECT",
  "BAD_LEAD",
  "SALE_DONE",
];

const ALLOWED_DATA_SOURCE = [
  "leads_on_demand",
  "meridian_tower",
  "eden_park",
  "varah_swamy",
  "sarjapur_plots",
];

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) {
    if (!env.openaiApiKey) {
      throw new Error(
        "OPENAI_API_KEY is not configured on the server. Set it in your .env file."
      );
    }
    client = new OpenAI({ apiKey: env.openaiApiKey });
  }
  return client;
}

const SYSTEM_PROMPT = `You are a precise data-extraction engine for GrowEasy CRM.

Your job: given an array of raw CSV rows (arbitrary, unknown column names, possibly messy,
possibly in different languages, possibly missing data), convert EACH row into a single
GrowEasy CRM lead object matching this EXACT schema and field names:

{
  "created_at": string,
  "name": string,
  "email": string,
  "country_code": string,
  "mobile_without_country_code": string,
  "company": string,
  "city": string,
  "state": string,
  "country": string,
  "lead_owner": string,
  "crm_status": string,
  "crm_note": string,
  "data_source": string,
  "possession_time": string,
  "description": string
}

STRICT FIELD RULES (do not violate these under any circumstance):

1. crm_status must be EXACTLY one of: ${ALLOWED_CRM_STATUS.join(", ")}.
   If nothing in the row indicates status clearly, return "" (empty string). Never invent
   a value outside this list.

2. data_source must be EXACTLY one of: ${ALLOWED_DATA_SOURCE.join(", ")}.
   Only set this if you are confident the row refers to one of these projects/sources
   (by name, project, or campaign). If not confident, return "" (empty string). Never
   invent a value outside this list.

3. created_at must be a valid date string parseable by JavaScript's "new Date(value)".
   Prefer ISO 8601 format (e.g. "2024-05-21T10:30:00.000Z" or "2024-05-21"). If the source
   date format is ambiguous (e.g. DD/MM/YYYY vs MM/DD/YYYY), make the most reasonable
   inference. If there is no date anywhere in the row, use the string "" (empty), and the
   caller will default it.

4. crm_note is a free-text field. Populate it with: remarks, follow-up notes, comments,
   any EXTRA emails beyond the first, any EXTRA phone numbers beyond the first, and any
   other useful unmapped data found in the row that doesn't fit another field. Join
   multiple pieces of info with " | ".

5. Multiple emails in a row: the FIRST valid email goes into "email". Any additional
   emails must be appended into "crm_note" (do not drop them).

6. Multiple phone numbers in a row: the FIRST valid phone number's national number (digits
   only, no country code) goes into "mobile_without_country_code", and its country calling
   code (digits only, no "+") goes into "country_code" if determinable, otherwise "".
   Any additional phone numbers must be appended into "crm_note" (do not drop them).
   Clean phone numbers: strip spaces, dashes, parentheses, and any non-digit characters
   before splitting into country_code / mobile_without_country_code.

7. If BOTH email AND a phone number are missing/unusable for a row, this row is INVALID.
   For invalid rows, instead of a lead object, return:
   { "__skip__": true, "reason": "<short human-readable reason>" }
   in that row's position in the output array.

8. Never fabricate data that is not present or reasonably inferable in the row. Leave
   fields as "" (empty string) when unknown. Every field must be a string (use "" not
   null/undefined).

9. Translate/normalize non-English text where reasonably possible so the CRM record is
   usable, but keep proper nouns (names, companies, cities) in their original form.

10. Handle messy formatting gracefully: extra whitespace, inconsistent casing, merged
    columns, HTML entities, stray punctuation, and duplicate columns.

OUTPUT FORMAT (critical):
Return ONLY a raw JSON object (no markdown fences, no prose, no explanation) of the shape:
{ "records": [ ... ] }
where "records" is an array with exactly one element per input row, in the SAME ORDER as
the input rows. Each element is either a full CRM lead object (schema above, all 15 fields
as strings) OR a skip marker { "__skip__": true, "reason": string }.

Do not add commentary before or after the JSON object.`;

function buildUserPrompt(rows: RawCsvRecord[]): string {
  return `Convert the following ${rows.length} raw CSV row(s) into the GrowEasy CRM lead schema, following all rules exactly. Input rows (JSON array, arbitrary columns):\n\n${JSON.stringify(
    rows,
    null,
    2
  )}`;
}

function safeString(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

function coerceCrmStatus(value: unknown): CrmLead["crm_status"] {
  const s = safeString(value).trim().toUpperCase();
  return (ALLOWED_CRM_STATUS as string[]).includes(s)
    ? (s as CrmLead["crm_status"])
    : "";
}

function coerceDataSource(value: unknown): CrmLead["data_source"] {
  const s = safeString(value).trim().toLowerCase();
  return (ALLOWED_DATA_SOURCE as string[]).includes(s)
    ? (s as CrmLead["data_source"])
    : "";
}

function coerceCreatedAt(value: unknown): string {
  const s = safeString(value).trim();
  if (!s) return new Date().toISOString();
  const parsed = new Date(s);
  if (isNaN(parsed.getTime())) {
    return new Date().toISOString();
  }
  return parsed.toISOString();
}

function normalizeLead(raw: Record<string, unknown>): CrmLead {
  return {
    created_at: coerceCreatedAt(raw.created_at),
    name: safeString(raw.name),
    email: safeString(raw.email),
    country_code: safeString(raw.country_code),
    mobile_without_country_code: safeString(raw.mobile_without_country_code),
    company: safeString(raw.company),
    city: safeString(raw.city),
    state: safeString(raw.state),
    country: safeString(raw.country),
    lead_owner: safeString(raw.lead_owner),
    crm_status: coerceCrmStatus(raw.crm_status),
    crm_note: safeString(raw.crm_note),
    data_source: coerceDataSource(raw.data_source),
    possession_time: safeString(raw.possession_time),
    description: safeString(raw.description),
  };
}

/**
 * Extracts a JSON array from a model response, tolerating stray markdown
 * fences or leading/trailing prose that some models add despite instructions.
 */
function extractJsonArray(text: string): unknown[] {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/^```(json)?/i, "").replace(/```$/, "").trim();

  const firstBracket = cleaned.indexOf("[");
  const lastBracket = cleaned.lastIndexOf("]");
  if (firstBracket === -1 || lastBracket === -1 || lastBracket < firstBracket) {
    throw new Error("AI response did not contain a JSON array");
  }
  const jsonSlice = cleaned.slice(firstBracket, lastBracket + 1);
  const parsed = JSON.parse(jsonSlice);
  if (!Array.isArray(parsed)) {
    throw new Error("AI response JSON was not an array");
  }
  return parsed;
}

async function callModelWithRetry(
  rows: RawCsvRecord[],
  maxRetries: number
): Promise<unknown[]> {
  let lastError: unknown = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const openai = getClient();
      const response = await openai.chat.completions.create({
        model: env.openaiModel,
        temperature: 0,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(rows) },
        ],
        response_format: { type: "json_object" as const },
      });

      const content = response.choices[0]?.message?.content || "";
      // Primary contract: { "records": [...] }. Fall back to tolerating a
      // raw array or differently-named keys in case the model deviates.
      let parsedArray: unknown[];
      try {
        const asObject = JSON.parse(content);
        if (Array.isArray(asObject)) {
          parsedArray = asObject;
        } else {
          const candidate =
            asObject.records ?? asObject.data ?? asObject.results;
          if (!Array.isArray(candidate)) {
            throw new Error("Could not locate array in AI response object");
          }
          parsedArray = candidate;
        }
      } catch {
        parsedArray = extractJsonArray(content);
      }

      if (parsedArray.length !== rows.length) {
        throw new Error(
          `AI returned ${parsedArray.length} results for ${rows.length} input rows`
        );
      }

      return parsedArray;
    } catch (err) {
      lastError = err;
      const backoffMs = Math.min(1000 * 2 ** (attempt - 1), 8000);
      if (attempt < maxRetries) {
        await new Promise((r) => setTimeout(r, backoffMs));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Unknown AI extraction error");
}

export interface BatchExtractionOutcome {
  leads: CrmLead[];
  skipped: SkippedRecord[];
}

/**
 * Sends one batch of raw CSV rows to the AI, validates/normalizes the
 * response, and separates valid leads from skipped rows.
 */
export async function extractBatch(
  rows: RawCsvRecord[]
): Promise<BatchExtractionOutcome> {
  if (rows.length === 0) return { leads: [], skipped: [] };

  try {
    const results = await callModelWithRetry(rows, env.maxRetries);

    const leads: CrmLead[] = [];
    const skipped: SkippedRecord[] = [];

    results.forEach((item, idx) => {
      const originalRecord = rows[idx] as Record<string, unknown>;

      if (
        item &&
        typeof item === "object" &&
        (item as Record<string, unknown>).__skip__
      ) {
        skipped.push({
          originalRecord,
          reason:
            safeString((item as Record<string, unknown>).reason) ||
            "Missing both email and mobile number",
        });
        return;
      }

      if (!item || typeof item !== "object") {
        skipped.push({
          originalRecord,
          reason: "AI returned an unreadable result for this row",
        });
        return;
      }

      const lead = normalizeLead(item as Record<string, unknown>);

      // Defense-in-depth: enforce the "must have email or phone" rule
      // server-side even if the model didn't flag it.
      if (!lead.email && !lead.mobile_without_country_code) {
        skipped.push({
          originalRecord,
          reason: "Missing both email and mobile number",
        });
        return;
      }

      leads.push(lead);
    });

    return { leads, skipped };
  } catch (err) {
    // Whole-batch failure after retries: skip every row in the batch with a
    // clear reason rather than failing the entire import.
    const reason =
      err instanceof Error
        ? `AI extraction failed for this batch: ${err.message}`
        : "AI extraction failed for this batch";
    return {
      leads: [],
      skipped: rows.map((r) => ({
        originalRecord: r as Record<string, unknown>,
        reason,
      })),
    };
  }
}

export function chunkRows(
  rows: RawCsvRecord[],
  batchSize: number
): RawCsvRecord[][] {
  const chunks: RawCsvRecord[][] = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    chunks.push(rows.slice(i, i + batchSize));
  }
  return chunks;
}
