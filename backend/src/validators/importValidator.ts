import { z } from "zod";

// A CSV row can have arbitrary column names with string/number/null values.
const rawRowSchema = z.record(
  z.union([z.string(), z.number(), z.null(), z.undefined()])
);

export const importRequestSchema = z.object({
  records: z
    .array(rawRowSchema)
    .min(1, "records must contain at least one row")
    .max(20000, "records cannot exceed 20000 rows per request"),
  dataSourceHint: z.string().optional(),
});

export type ImportRequestBody = z.infer<typeof importRequestSchema>;

export function validateImportRequest(body: unknown) {
  return importRequestSchema.safeParse(body);
}
