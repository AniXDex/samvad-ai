# SPEC 002 — PressNoteFacts core ✅ implemented deterministic core + LLM claim extractor

Module `src/lib/press-facts` (`facts.ts` + `neutrality.ts` + `bundle.ts`).
`structureFacts` enforces: missing → `not_stated`, uncited → `unverified`,
disagreeing spans → `conflicting` with candidates retained, dangling span
indexes → reported issues. `checkNeutrality` flags presumption-of-guilt /
sensational / unverified-scale spans (assistive pre-check; Laya + human remain
the real gates). `buildDraftBundle` renders the fixed EN+HI bundle
(3 headlines ≤15w enforced, summary, inverted-pyramid detail) from cited
values only — unconfirmed renders as "could not be confirmed", and template
output self-passes the neutrality check in tests.

AI Claim Extractor (`src/lib/ai/claim-extractor.ts`):
- Deep module producing `{spans, claims}` from raw evidence text.
- Seam: `createFakeClaimExtractor` for zero-network deterministic unit tests and `createLlmClaimExtractor` for LiteLLM/Mistral OpenAI-compatible gateway endpoints.
- Fully wired into Trigger.dev background task `extractPressFacts` (`src/trigger/extract-facts.ts`).

17 tests across facts, neutrality, bundle, and claim-extractor through module interfaces. Zero non-English literals in code logic.
