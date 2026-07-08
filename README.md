# GrowEasy AI CSV Importer

An AI-powered CSV importer that accepts **any** CSV format (Facebook leads, Google Ads exports, Excel exports, real estate CRM exports, sales reports, manual spreadsheets — anything) and intelligently converts it into the GrowEasy CRM lead schema using an LLM, without assuming any fixed column names.

## How it works

1. **Upload** — drag & drop or pick any `.csv` file.
2. **Preview** — the file is parsed entirely in the browser (no AI call yet) and shown in a scrollable, sticky-header table so you can sanity-check it before sending anything anywhere.
3. **Confirm Import** — only on your explicit click, the raw rows are sent to the backend.
4. **AI mapping** — the backend batches the rows and sends each batch to OpenAI with a strict extraction prompt that maps arbitrary columns into the fixed CRM schema, retries failed batches with backoff, and validates every field server-side.
5. **Results** — you get a summary (imported / skipped / success rate) plus full tables of both successfully imported leads and skipped rows (with reasons).

## Tech stack

| Layer    | Stack |
|----------|-------|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS, react-window (virtualized tables), PapaParse |
| Backend  | Node.js, Express, TypeScript, Zod validation, OpenAI SDK |
| AI       | OpenAI Chat Completions API (`gpt-4o-mini` by default, configurable) |

The app is stateless — no database. Each import is processed in memory and returned directly in the API response.

## CRM Lead Schema

Every row is mapped to:

```ts
{
  created_at: string;                    // ISO date, works with new Date(created_at)
  name: string;
  email: string;
  country_code: string;
  mobile_without_country_code: string;
  company: string;
  city: string;
  state: string;
  country: string;
  lead_owner: string;
  crm_status: "GOOD_LEAD_FOLLOW_UP" | "DID_NOT_CONNECT" | "BAD_LEAD" | "SALE_DONE" | "";
  crm_note: string;
  data_source: "leads_on_demand" | "meridian_tower" | "eden_park" | "varah_swamy" | "sarjapur_plots" | "";
  possession_time: string;
  description: string;
}
```

**Field rules enforced by the AI prompt and re-validated in code:**
- `crm_status` and `data_source` are restricted to the exact enums above — the AI is instructed to return `""` rather than invent a value, and the backend coerces anything else back to `""` as a safety net.
- `created_at` is always coerced into a valid ISO string server-side.
- Extra emails/phone numbers beyond the first are appended into `crm_note` rather than dropped.
- Rows missing **both** an email and a phone number are skipped, with a human-readable reason returned to the frontend.

## Project structure

```
groweasy-ai-csv-importer/
├── backend/
│   ├── src/
│   │   ├── index.ts               # Express app entrypoint
│   │   ├── config/env.ts          # Typed environment config
│   │   ├── routes/importRoutes.ts
│   │   ├── controllers/importController.ts
│   │   ├── services/
│   │   │   ├── aiService.ts       # Prompt, batching, retries, normalization
│   │   │   └── csvService.ts      # Row sanitization
│   │   ├── validators/importValidator.ts   # Zod schema for the request body
│   │   ├── middleware/errorHandler.ts
│   │   └── types/lead.ts
│   ├── Dockerfile
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx               # Upload → Preview → Import → Results flow
│   │   └── globals.css
│   ├── components/
│   │   ├── CsvUploader.tsx
│   │   ├── CsvPreviewTable.tsx    # Virtualized, sticky-header, scrollable
│   │   ├── ResultsTable.tsx
│   │   ├── ImportSummary.tsx
│   │   ├── StepIndicator.tsx
│   │   ├── ThemeToggle.tsx        # Dark mode
│   │   └── ToastProvider.tsx
│   ├── hooks/useCsvImport.ts      # Client-side state machine for the whole flow
│   ├── services/api.ts            # Typed API layer
│   ├── lib/csvParser.ts           # Browser-side CSV parsing (PapaParse)
│   ├── types/lead.ts
│   ├── Dockerfile
│   ├── vercel.json
│   ├── .env.example
│   └── package.json
├── docker-compose.yml
├── .gitignore
└── README.md
```

## Installation & running locally

Requires **Node.js 18+**.

### 1. Backend

```bash
cd backend
cp .env.example .env
# edit .env and set OPENAI_API_KEY
npm install
npm run dev
```

Backend runs on `http://localhost:4000`. Health check: `GET http://localhost:4000/health`.

### 2. Frontend

In a second terminal:

```bash
cd frontend
cp .env.example .env.local
# NEXT_PUBLIC_API_BASE_URL defaults to http://localhost:4000, adjust if needed
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`.

Open `http://localhost:3000`, upload any CSV, preview it, click **Confirm Import**, and watch the AI-mapped results appear.

## Environment variables

**backend/.env**

| Variable | Required | Default | Description |
|---|---|---|---|
| `PORT` | no | `4000` | Port the Express server listens on |
| `OPENAI_API_KEY` | **yes** | — | Your OpenAI API key. Never commit this. |
| `OPENAI_MODEL` | no | `gpt-4o-mini` | Any OpenAI chat model that supports JSON mode |
| `CORS_ORIGIN` | no | `*` | Comma-separated allowed origins for CORS |
| `AI_BATCH_SIZE` | no | `10` | Rows sent to the AI per request |
| `AI_MAX_RETRIES` | no | `3` | Retries per batch on failure, with exponential backoff |

**frontend/.env.local**

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_API_BASE_URL` | no | `http://localhost:4000` | Base URL of the backend API |

## Testing instructions

1. **Smoke test the backend**: `curl http://localhost:4000/health` should return `{"status":"ok",...}`.
2. **Try messy CSVs**: test with real exports that have different column names, missing fields, multiple emails/phones in one cell, and different date formats — the whole point of the AI layer is that it doesn't assume fixed column names.
3. **Check skip logic**: include a row with no email and no phone number — it should appear in the "Skipped" tab with a clear reason.
4. **Check enum safety**: inspect a few imported rows — `crm_status` and `data_source` should only ever be one of the allowed values or `""`, never anything else.
5. **Large files**: try a CSV with several thousand rows to confirm the preview table (virtualized) stays smooth and the backend correctly batches requests.

## Docker

Run both services together:

```bash
cp backend/.env.example backend/.env      # fill in OPENAI_API_KEY
docker compose up --build
```

Frontend: `http://localhost:3000`, Backend: `http://localhost:4000`.

Each service also has its own standalone `Dockerfile` if you want to build/run them independently.

## Deployment

### Frontend → Vercel

1. Push this repo to GitHub.
2. In Vercel, "Add New Project" → import the repo → set **Root Directory** to `frontend`.
3. Vercel auto-detects Next.js (a `vercel.json` is included as well for explicit config).
4. Add environment variable `NEXT_PUBLIC_API_BASE_URL` pointing to your deployed backend URL.
5. Deploy.

### Backend → Render / Railway

**Render**
1. New → Web Service → connect the repo, set **Root Directory** to `backend`.
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Add environment variables from `backend/.env.example` (set your real `OPENAI_API_KEY`, and set `CORS_ORIGIN` to your Vercel frontend URL).

**Railway**
1. New Project → Deploy from GitHub repo → set root/service directory to `backend`.
2. Railway auto-detects Node; if needed set build command `npm run build` and start command `npm start`.
3. Add the same environment variables as above.

Either platform also works directly from the included `backend/Dockerfile` if you prefer container-based deploys.

## Notes on the AI layer

- The extraction prompt lives entirely in `backend/src/services/aiService.ts` and is designed to be read and tuned independently of any other code.
- Every AI response is validated: enum fields are coerced back to `""` if the model returns anything outside the allowed list, dates are re-parsed and normalized, and rows missing both email and phone are force-skipped even if the model didn't flag them — the API contract is guaranteed regardless of what the model actually returns.
- If an entire batch fails after all retries, those rows are marked as skipped with the failure reason rather than failing the whole import.
