# SPEC 008 — Mistral OCR & Vision Engine ✅ implemented

Status: Implemented and Verified


## Architecture (§2 & §8 Step 3)
FIR scans, crime scene photographs, press release PDFs, and official circulars arrive via Cloudflare R2 presigned tickets.
The system extracts clean, structured markdown per page with image layout coordinates and confidence awareness.

## Deep Module (`src/lib/ocr/mistral.ts`)
- Port: `DocumentOcrEngine`
  - Input: `{ documentUrl?: string, imageUrl?: string, base64DataUrl?: string }`
  - Output: `Result<OcrEngineOutput, OcrError>` where `OcrEngineOutput` contains:
    - `pages`: array of `{ index, markdown, images }`
    - `fullMarkdown`: concatenated and normalized document text
    - `model`: OCR model identifier (default `mistral-ocr-latest`)
    - `pageCount`: total processed pages
  - Error union: `invalid-input | unauthorized | rate-limited | transport`
- Seams:
  - `createFakeOcrEngine`: zero-network deterministic mock adapter for test isolation.
  - `createMistralOcrEngine`: production HTTP adapter for `https://api.mistral.ai/v1/ocr`.
    Handles HTTP 401, 429, 400, 500 cleanly with no thrown exceptions.

## Durable Trigger.dev Task (`src/trigger/ocr-document.ts`)
- Task `processDocumentOcr`: durable execution with automatic retries and backoff.
- Attaches extracted OCR markdown and layout metadata to the document's sources in Lakebase Postgres.
- Feeds extracted evidence text into `extractPressFacts` for claim structure analysis.

## Verification Gates
1. Unit tests: `src/lib/ocr/mistral.test.ts` covering success paths, missing inputs, rate limits, and network errors.
2. Zero non-English literals in code logic.
3. Strict TypeScript with `noUncheckedIndexedAccess`, zero `any`, zero `@ts-ignore`.
