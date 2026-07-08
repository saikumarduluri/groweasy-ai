import dotenv from "dotenv";

dotenv.config();

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (value === undefined) {
    // We don't throw at import time for OPENAI_API_KEY so the server can
    // still boot (and return a clear error on the /api/import call) rather
    // than crash-looping in environments where env vars are injected late.
    return "";
  }
  return value;
}

export const env = {
  port: parseInt(process.env.PORT || "4000", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  openaiApiKey: required("OPENAI_API_KEY"),
  openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
  corsOrigin: process.env.CORS_ORIGIN || "*",
  batchSize: parseInt(process.env.AI_BATCH_SIZE || "10", 10),
  maxRetries: parseInt(process.env.AI_MAX_RETRIES || "3", 10),
};
