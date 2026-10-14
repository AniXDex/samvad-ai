# SPEC 006 — AI keys + dev loops ✅ keys stored, Inngest live (feat 5)

Keys (lengths-only in logs, values in gitignored `.env.local`):
`MISTRAL_API_KEY` (45), `LITELLM_API_KEY` (25) + `LITELLM_BASE_URL`
(`https://llm.corsair.dev/v1`) + `LITELLM_MODEL=gpt-5.4-mini` per
docs.corsair.dev/llm-gateway (OpenAI-compatible; always custom baseURL, never
default OpenAI provider), `SARVAM_API_KEY` (36).

Verified: gateway `/models` lists 8 (`gpt-5.6-sol … gpt-5.4-nano`); 15-token
`gpt-5.4-nano` smoke 200 "ok". Gateway `/key/info` 500s server-side
(`LiteLLM.VerificationToken.budget_fallbacks` missing — their schema drift,
not our key). Mistral key 200 via models list (OCR model pin at extraction
feat). Sarvam unverified until first STT run — stated, not assumed.

Inngest dev: `inngest` package, `src/inngest/{client,functions}.ts`
(app id `samvaad-ai`, never rename), `/api/inngest` serve route, first
`upload/complete` function. Live: route 200 dev mode, `function_count: 1`.
SDK note: installed v4.23 uses two-arg `createFunction({id, triggers},
handler)` — project skill's three-arg form predates it (fixed per installed
types). Prod keys later; `INNGEST_DEV=1` already set.

Trigger.dev: SDK+build installed (CLI 4.7.3 cached). Login is human-gated:
resumable authorization started, user must open the printed URL, then resume
(`npx trigger.dev login --no-browser`) → dashboard project ref →
`trigger.config.ts` + dev `TRIGGER_SECRET_KEY`. Nothing fabricated meanwhile.

Vulns: 13 → 21 (9→12 high) from inngest + trigger transitive deps; no
`--force` fix (breaking risk, out of scope).
