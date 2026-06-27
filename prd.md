# CropGuard GH — Smart Farmer Assistant
## Product Requirements Document for Cursor / AI Coding Agent Build

**Event:** Npontu Hackathon 2026 (Snwolley AI APIs)
**Team size:** 2-4 people · **Timebox:** 24-48 hours
**Read this whole document before generating code.** It specifies exact API contracts,
file structure, database schema, and scope boundaries. Do not invent additional features,
additional API fields, or a different tech stack than what's specified here.

---

## 1. What We're Building

A web app where a farmer photographs a crop, and the app:

1. Sends the photo to the **Snwolley Vision API** → gets back a text description of
   visible symptoms (disease/pest damage).
2. Sends that description to the **Snwolley Agents API** → gets back a plain-language
   diagnosis + care recommendation, with a self-reported confidence score.
3. Sends the diagnosis text to the **Snwolley Text-to-Speech API** → gets back audio
   the farmer can listen to.
4. Hashes the diagnosis + confidence + status and appends it to a **tamper-evident
   hash-chain ledger** stored in Postgres, so nothing can be silently altered after
   the fact. A "Verify Chain Integrity" button recomputes the whole chain and proves
   it's intact (or flags exactly where it was tampered with).
5. Awards the farmer reputation points for each diagnosis submitted, shown on a
   dashboard.

This is **not** a real blockchain (no consensus, no distributed nodes) and **not** a
real hallucination-detection system (confidence comes from the AI agent's own
self-report, parsed from text, plus light heuristics). Both simplifications are
intentional and should be reflected honestly in code comments and any UI copy —
do not claim more than what's actually implemented.

### Problem this solves (for any UI copy / pitch text generated)

Ghanaian smallholder farmers often can't get timely, accurate diagnosis of crop
disease because agricultural extension officers can't reach everyone, and informal
advice is inconsistent with no record of what was actually recommended. This app
gives instant AI-assisted diagnosis with an audit trail, while explicitly
recommending in-person follow-up when confidence is low.

---

## 2. Real, Confirmed Third-Party API Contracts

These are taken directly from the official Snwolley API documentation. **Use these
exact shapes — do not guess or use an OpenAI-style schema.**

### 2.1 Two separate credentials (do not conflate)

| Credential | Used for | Header | Notes |
|---|---|---|---|
| **Hackathon team key** | STT, TTS, Vision | `X-API-Key` | One per team (e.g. `hk_team01_...`), issued by organizers. Only live during the event window — will be deactivated after. |
| **Snwolley platform key** | Agents API only | `X-API-Key` | Separate credential. Either issued directly by organizers, or self-generated at `https://v1.snwolley.ai` → "My Organization" → API settings. |

### 2.2 Vision API

```
POST https://v1.snwolley.ai/api/v1/hackathon/vision
Header: X-API-Key: <team key>
```

Two input modes (use one per request):

**Option A — multipart file upload:**
- Field `image`: the image file.
- Optional field `prompt`: text guiding what to look for.

**Option B — JSON body with a public URL:**
```json
{
  "image_url": "https://example.com/photo.jpg",
  "prompt": "What crop disease is visible?"
}
```

**Success response:**
```json
{ "description": "..." }
```
(Common response envelope also includes `success`, `model`, `provider` fields —
ignore these, only `description` matters.)

**Error response (any non-2xx):**
```json
{ "error": "Human-readable error message" }
```

### 2.3 Agents API (chat completions)

```
POST https://v1.snwolley.ai/v1/chat/completions
Header: X-API-Key: <platform key>
```

**Request body:**
```json
{
  "message": "string, required — the prompt",
  "agent": "string, required — agent ID, e.g. \"107\"",
  "stream": false,
  "chat_id": null
}
```
- `chat_id`: pass a previous response's `chat_id` to continue the same conversation
  thread. For this app's main flow, each diagnosis is a fresh independent call, so
  `chat_id` is `null`. Still implement the parameter so a "follow-up question"
  feature could be added later without changing the client.

**Success response:**
```json
{ "chat_id": "54", "content": "..." }
```

**There is no structured confidence field in this API.** To get a confidence score,
the system prompt must explicitly instruct the agent to include a line in its reply
like `CONFIDENCE: 82`, which the backend then parses out of the free text. Do not
invent a `confidence` field in the request or assume one exists in the response.

### 2.4 Text-to-Speech API

```
POST https://v1.snwolley.ai/api/v1/hackathon/tts
Header: X-API-Key: <team key>
```

**Request body:**
```json
{ "text": "string to convert to speech" }
```

**Success response:** binary WAV audio (not JSON). Handle as a raw buffer/array
buffer, not as JSON.

### 2.5 Speech-to-Text API — NOT USED in this build

Documented for completeness (`POST /api/v1/hackathon/stt`, multipart `audio` field,
returns `{ text }`), but **out of scope** for this MVP since input is a photo, not
voice. Do not build STT integration. It can be mentioned as a roadmap item in any
generated pitch copy ("ask follow-up questions by voice").

### 2.6 Common error shape (all Snwolley APIs)

```json
{ "error": "Human-readable error message" }
```

| HTTP Status | Meaning |
|---|---|
| 400 | Bad request |
| 401 | Unauthorized (bad/missing API key) |
| 429 | Rate limited |
| 500 | Server error |
| 503 | APIs disabled (e.g. outside hackathon window) |

All Snwolley API calls in this codebase must:
- Use a request timeout (8 seconds default, configurable via env var) so a hung
  call can't freeze the demo.
- Wrap errors in a single custom error type (e.g. `SnwolleyApiError`) carrying the
  HTTP status, so route handlers can return a clear message distinguishing "Snwolley
  API issue" from "our own bug."

---

## 3. Tech Stack (do not substitute)

| Layer | Technology |
|---|---|
| Frontend | React + Vite + TypeScript |
| Backend | Node.js + Express + TypeScript |
| Database | PostgreSQL |
| File upload | `multer` (memory storage, NOT disk storage — 8MB limit) |
| Hashing | Node's built-in `crypto` module (SHA-256) — no external crypto libraries |
| HTTP client | native `fetch` (Node 18+) — no axios/node-fetch dependency needed |

No Next.js. No Docker. No deployment config needed for the hackathon itself — local
run only, since the competition requires a **live** demo, not a deployed one.

---

## 4. Repository Structure

```
npoutu/
├── server/
│   ├── src/
│   │   ├── index.ts                    # Express app entrypoint
│   │   ├── db/
│   │   │   ├── pool.ts                 # pg Pool setup + query helper
│   │   │   └── schema.sql              # full DB schema (see section 5)
│   │   ├── routes/
│   │   │   ├── diagnose.ts             # POST /api/diagnose
│   │   │   ├── ledger.ts               # GET /api/ledger, GET /api/ledger/verify
│   │   │   ├── activity.ts             # GET /api/activity/:userId, POST /api/activity/lesson-complete
│   │   │   └── users.ts                # POST /api/users, GET /api/users/:id
│   │   └── services/
│   │       ├── visionClient.ts         # Snwolley Vision API wrapper
│   │       ├── agentsClient.ts         # Snwolley Agents API wrapper + prompt builder + reply parser
│   │       ├── ttsClient.ts            # Snwolley TTS API wrapper
│   │       ├── verificationEngine.ts   # confidence -> status classification
│   │       ├── ledgerService.ts        # hash-chain append + verify logic
│   │       ├── diagnosisService.ts     # orchestrates the full pipeline
│   │       └── activityService.ts      # reputation points + lesson completion
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── client/
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── pages/
│   │   │   └── Dashboard.tsx           # main single-page view
│   │   ├── components/
│   │   │   ├── PhotoUpload.tsx         # camera/file input + submit
│   │   │   ├── DiagnosisResult.tsx     # shows description, diagnosis, confidence badge, audio player
│   │   │   ├── LedgerExplorer.tsx      # recent ledger entries feed
│   │   │   ├── ChainIntegrityCheck.tsx # "Verify Chain" button + pass/fail display
│   │   │   └── ReputationBadge.tsx     # points + activity list
│   │   └── services/
│   │       └── api.ts                  # fetch wrappers for the backend
│   ├── package.json
│   ├── vite.config.ts
│   └── .env.example
└── README.md
```

---

## 5. Database Schema (PostgreSQL)

Create exactly these tables (`server/src/db/schema.sql`):

```sql
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name    TEXT NOT NULL,
  reputation_score INTEGER NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS diagnoses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  image_ref           TEXT NOT NULL,            -- URL or original filename, NOT the raw image
  vision_description  TEXT NOT NULL,            -- raw output from Snwolley Vision API
  diagnosis           TEXT NOT NULL,            -- plain-language diagnosis from Snwolley Agents API
  confidence          INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  status              TEXT NOT NULL CHECK (status IN ('verified', 'needs_review', 'low_confidence')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS activities (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type        TEXT NOT NULL CHECK (type IN ('diagnosis_submitted', 'lesson_completed', 'community_activity')),
  points      INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Append-only hash chain. Rows should never be UPDATEd or DELETEd in normal
-- operation. There is no DB-level enforcement of immutability (would need
-- triggers/permissions in production) -- "tampering" for demo purposes means
-- directly editing a row via SQL, which GET /api/ledger/verify will detect.
CREATE TABLE IF NOT EXISTS ledger_entries (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seq             SERIAL UNIQUE NOT NULL,     -- defines chain order
  prev_hash       TEXT NOT NULL,
  content_hash    TEXT NOT NULL,
  payload_summary TEXT NOT NULL,              -- human-readable, NOT raw PII or raw images
  ref_type        TEXT NOT NULL CHECK (ref_type IN ('diagnosis', 'activity')),
  ref_id          UUID NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_diagnoses_user ON diagnoses(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_ledger_seq ON ledger_entries(seq);
```

**Important:** `gen_random_uuid()` requires the `pgcrypto` extension OR PostgreSQL
13+ with `gen_random_uuid()` built into `pgcrypto`/core (PG 13+ has it natively
available via `CREATE EXTENSION IF NOT EXISTS pgcrypto;` if needed — add that as
the first line of the schema file to be safe across Postgres versions).

---

## 6. Hash-Chain Ledger — Exact Algorithm (this is the centerpiece feature)

This is the most important piece of logic in the app. Implement it precisely:

### 6.1 Hash computation

```
contentHash = SHA256(prevHash + "|" + refType + "|" + refId + "|" + payloadSummary + "|" + createdAtIso)
```

Where `createdAtIso` is the ISO 8601 string of the entry's timestamp.

**Critical implementation detail:** Postgres may return `TIMESTAMPTZ` values with
different string formatting than what JavaScript's `new Date().toISOString()`
produces at insert time. To guarantee the hash is reproducible on verification,
ALWAYS pass the timestamp through `new Date(value).toISOString()` on both the
write path and the verify path before hashing — never hash a raw DB timestamp
string directly. This single detail is the most common source of false "chain
broken" results — test it explicitly.

### 6.2 Genesis entry

The first entry in the chain has `prevHash = "0".repeat(64)` (64 zero characters,
matching SHA-256 hex length).

### 6.3 Appending an entry (must be transaction-safe)

To prevent two concurrent writes from both reading the same "last hash" and
producing two entries with the same `prevHash` (which would corrupt the chain),
appending an entry must:

1. Open a DB transaction.
2. `LOCK TABLE ledger_entries IN EXCLUSIVE MODE` inside the transaction.
3. Read the current last row's `content_hash` (or use genesis hash if the table
   is empty).
4. Compute the new hash per 6.1.
5. Insert the new row.
6. Commit.
7. On any error, roll back.

### 6.4 Verifying the chain

`GET /api/ledger/verify` must:

1. Read every row ordered by `seq ASC`.
2. Walk the rows in order, tracking an `expectedPrevHash` starting at genesis.
3. For each row:
   - Check `row.prev_hash === expectedPrevHash`. If not, the chain is broken at
     this `seq` (a row was deleted, inserted out of order, or reordered).
   - Recompute the hash from the row's own stored fields per 6.1. If it doesn't
     match `row.content_hash`, the chain is broken at this `seq` (the row's
     content was edited after the fact).
   - Set `expectedPrevHash = row.content_hash` and continue.
4. Return a result like:
   ```json
   {
     "valid": true,
     "totalEntries": 12,
     "brokenAtSeq": null,
     "message": "All 12 entries verified. The chain is intact."
   }
   ```
   or, if broken:
   ```json
   {
     "valid": false,
     "totalEntries": 12,
     "brokenAtSeq": 7,
     "message": "Chain broken at entry #7: recomputed hash does not match stored hash..."
   }
   ```

### 6.5 What goes in `payload_summary` (privacy rule)

Never put raw images, full diagnosis text beyond ~100 characters, or any other
potentially sensitive content directly in the ledger payload. Use a short,
truncated, human-readable summary only, e.g.:

```
[CropDiagnosis] status=verified confidence=91 :: "Likely cassava mosaic virus based on leaf..."
```

---

## 7. AI Verification Engine — Confidence Classification

This is a transparency layer on top of the agent's self-reported confidence, NOT a
real hallucination detector. Implement exactly this logic:

**Thresholds:**
- `confidence >= 85` → status `verified`
- `60 <= confidence < 85` → status `needs_review`
- `confidence < 60` → status `low_confidence`

**Heuristic adjustment before classifying:** if the diagnosis text contains hedging
language (e.g. "not sure", "cannot confirm", "unable to determine", "hard to tell",
"unclear from"), OR the vision description itself was vague (e.g. contains "no
clear", "no visible", "unable to identify", "too blurry", "not enough detail"), cap
the effective confidence at 60 (the `needs_review` boundary) even if the agent
self-reported higher. This prevents an agent that hedges in prose but states a high
number from being marked "verified."

**System prompt requirement for the Agents API call:** instruct the agent to end its
reply with a line in the exact format `CONFIDENCE: <integer 0-100>` so it can be
reliably parsed out of the free-text response with a regex like
`/CONFIDENCE:\s*(\d{1,3})/i`. If parsing fails for any reason, default confidence to
50 rather than crashing.

---

## 8. Backend API Routes — Exact Specification

### 8.1 `POST /api/diagnose`

Accepts either multipart form data or JSON:
- Multipart: field `userId` (string), field `image` (file, max 8MB).
- JSON: `{ "userId": "...", "imageUrl": "https://..." }`

Pipeline (must run in this order, with the described error handling):
1. Call Vision API with the image. If this fails, return the error — fatal.
2. Call Agents API with a prompt built from the vision description (see section 7
   for the prompt's confidence-line requirement). If this fails, return the error —
   fatal.
3. Parse the confidence line, classify via the verification engine.
4. Call TTS API with the diagnosis text. **If this fails, log the error and
   continue without audio** — non-fatal, since the text diagnosis is still useful
   without voice playback.
5. Insert a row into `diagnoses`.
6. Append a ledger entry (`refType: 'diagnosis'`).
7. Insert a row into `activities` (`type: 'diagnosis_submitted'`, 5 points).
8. Increment the user's `reputation_score` by 5.
9. Return the full diagnosis record, including `audio_base64` (base64-encoded WAV,
   or `null` if TTS failed) so the frontend can play it directly without a separate
   audio-fetch round trip.

Response shape:
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "image_ref": "string",
  "vision_description": "string",
  "diagnosis": "string",
  "confidence": 91,
  "status": "verified",
  "audio_base64": "base64-string-or-null",
  "created_at": "ISO 8601 string"
}
```

Error responses: Snwolley API failures should return HTTP 502 (or 401 if it's
specifically an auth failure) with `{ "error": "Snwolley API issue: ..." }`. Our own
bugs return 500 with a generic message.

### 8.2 `GET /api/ledger?limit=25`

Returns the most recent ledger entries (default limit 25, max 100), ordered newest
first.

### 8.3 `GET /api/ledger/verify`

Runs the full chain verification (section 6.4) and returns the result object.

### 8.4 `GET /api/activity/:userId`

Returns `{ user: {...}, activities: [...] }` — the user's reputation score and their
recent activity history (up to 50 entries, newest first). 404 if user not found.

### 8.5 `POST /api/activity/lesson-complete`

Body: `{ "userId": "...", "lessonTitle": "..." }`. Demo-only endpoint to simulate a
farmer completing a short farming-tip lesson. Awards 15 points, inserts an
`activities` row (`type: 'lesson_completed'`), and appends a ledger entry
(`refType: 'activity'`).

### 8.6 `POST /api/users`

Body: `{ "displayName": "..." }`. Creates a demo user (no auth — this is a
hackathon MVP, not a production auth system). Returns the created user row.

### 8.7 `GET /api/users/:id`

Returns the user row, or 404.

### 8.8 `GET /api/health`

Returns `{ "status": "ok", "service": "npoutu-api" }`. Useful for confirming the
server is up before a demo.

---

## 9. Frontend Requirements

Single-page dashboard (no routing library needed — one view is enough for this
scope). Sections:

1. **Photo upload panel** — file input with `capture="environment"` so mobile
   browsers default to the rear camera; shows a preview thumbnail before submit;
   submit button calls `POST /api/diagnose` with a loading state (the pipeline has
   three sequential API calls, so this can take several seconds — show a spinner
   with a short status label, e.g. "Analyzing image...", that's fine as a static
   label, no need for real progress streaming).

2. **Diagnosis result panel** — once a diagnosis returns, show:
   - The vision description (smaller/secondary text).
   - The diagnosis text (primary, larger text).
   - A confidence badge color-coded by status: green for `verified`, yellow for
     `needs_review`, red for `low_confidence`.
   - An HTML5 `<audio>` element wired to `data:audio/wav;base64,<audio_base64>` if
     audio is present; hide the player entirely if `audio_base64` is null.

3. **Ledger explorer panel** — fetches `GET /api/ledger` and displays recent entries
   as a feed: short hash prefix (e.g. first 10 hex chars), payload summary,
   timestamp, ref type. Poll or refresh after each new diagnosis so it visibly
   updates live during a demo.

4. **Chain integrity check** — a button labeled "Verify Chain Integrity" that calls
   `GET /api/ledger/verify` and displays a clear pass (green, "✓ Chain intact, N
   entries verified") or fail (red, showing the `message` and `brokenAtSeq`) state.

5. **Reputation badge** — shows the current demo user's `reputation_score` and a
   short activity list, fetched from `GET /api/activity/:userId`.

Keep styling simple and clean — Tailwind CSS utility classes are fine if convenient,
but a hand-rolled minimal CSS file is also acceptable. Prioritize working
functionality and clarity over visual polish; this is a hackathon judged partly on
UX (15% weight) but more on technical implementation (25%) and problem relevance
(20%).

For demo purposes, hardcode or locally persist (e.g. `localStorage` is fine on the
*client* — note this is different from the "no localStorage" rule that applies to
sandboxed artifacts, not to this standalone app) a single demo `userId` created via
`POST /api/users` on first load, so the demo doesn't need a login flow.

---

## 10. Environment Variables

### `server/.env.example`
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/npoutu
PORT=4000

# Hackathon team key -- STT/TTS/Vision (one per team, issued by organizers)
SNWOLLEY_HACKATHON_API_KEY=hk_teamXX_your_team_key_here
SNWOLLEY_HACKATHON_BASE_URL=https://v1.snwolley.ai/api/v1/hackathon

# Snwolley platform key -- Agents API ONLY (separate credential)
SNWOLLEY_AGENT_API_KEY=your_snwolley_platform_key_here
SNWOLLEY_AGENTS_URL=https://v1.snwolley.ai/v1/chat/completions
SNWOLLEY_AGENT_ID=107

SNWOLLEY_TIMEOUT_MS=8000
```

### `client/.env.example`
```
VITE_API_BASE_URL=http://localhost:4000/api
```

---

## 11. Explicitly Out of Scope — Do Not Build

- Speech-to-Text integration.
- Real blockchain / distributed consensus / multi-node setup.
- DID / cryptographic wallet identity system.
- User authentication / login (use the no-auth demo-user approach in section 9).
- Multi-language TTS output selection.
- Docker, CI/CD, or any production deployment configuration.
- Document/PDF vision parsing beyond the single crop-photo flow.
- A "rights assistant" chatbot for government services — that was an earlier
  concept; this build is scoped to crop diagnosis only.

If asked to add any of the above, treat it as a scope change requiring explicit
confirmation, not an implicit yes.

---

## 12. Live-Demo Risk Mitigation (build this in from the start)

The competition requires a **live** demo — recorded-only demos are rejected. Since
Snwolley's hackathon endpoints are only guaranteed live during the event window and
could be rate-limited or slow:

- Set the per-request timeout (`SNWOLLEY_TIMEOUT_MS`, default 8000ms) on every
  Snwolley call so a hung request fails fast instead of stalling the demo.
- Test the exact photos you plan to demo with multiple times before presenting —
  API behavior can vary.
- Keep the TTS failure path non-fatal (section 8.1, step 4) so a flaky TTS call
  never blocks the core diagnosis result from displaying.

---

## 13. Build Order (recommended for a 24-48hr team)

1. DB schema + Postgres connection — no API keys needed, start immediately.
2. Ledger service (hash chain) — write the append + verify functions, and manually
   test by inserting a few entries, then directly editing one via SQL and confirming
   `GET /api/ledger/verify` correctly reports it broken. **This is the single most
   important thing to get right and test before building anything else on top of it.**
3. Snwolley client wrappers (`visionClient.ts`, `agentsClient.ts`, `ttsClient.ts`) —
   test each independently (e.g. via curl/Postman) the moment API keys arrive,
   before wiring them into the full pipeline.
4. `diagnosisService.ts` orchestration + `POST /api/diagnose` route.
5. Remaining routes (ledger, activity, users).
6. React dashboard.
7. End-to-end test with 3-4 real crop photos, then lock those in as your demo set.

---

## 14. Acceptance Checklist (use this to verify the build is complete)

- [ ] `POST /api/diagnose` with a real crop photo returns a diagnosis with a
      confidence score and status within ~15 seconds.
- [ ] The returned `audio_base64` plays back correctly as WAV audio in a browser
      `<audio>` element.
- [ ] `GET /api/ledger` shows the new entry immediately after a diagnosis.
- [ ] `GET /api/ledger/verify` returns `valid: true` after several diagnoses.
- [ ] Manually editing any `diagnoses` or `ledger_entries` row via SQL and re-calling
      `GET /api/ledger/verify` returns `valid: false` with the correct `brokenAtSeq`.
- [ ] A missing or invalid Snwolley API key produces a clear `SnwolleyApiError`
      message in the API response, not a generic crash.
- [ ] `POST /api/activity/lesson-complete` increases the user's `reputation_score`
      and appears in both `GET /api/activity/:userId` and the ledger.
- [ ] The frontend dashboard shows all four sections (upload, result, ledger
      explorer, integrity check) and the reputation badge updates after each action.