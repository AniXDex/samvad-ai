# SPEC 002 — PressNoteFacts core ✅ implemented deterministic core (feat 3)

Module `src/lib/press-facts` (`facts.ts` + `neutrality.ts` + `bundle.ts`).
`structureFacts` enforces: missing → `not_stated`, uncited → `unverified`,
disagreeing spans → `conflicting` with candidates retained, dangling span
indexes → reported issues. `checkNeutrality` flags presumption-of-guilt /
sensational / unverified-scale spans (assistive pre-check; Jev + human remain
the real gates). `buildDraftBundle` renders the fixed EN+HI bundle
(3 headlines ≤15w enforced, summary, inverted-pyramid detail) from cited
values only — unconfirmed renders as "could not be confirmed", and template
output self-passes the neutrality check in tests.

13 tests, all through the module interfaces. Still open (needs keys):
LLM claim extractor producing `{field, value, spanIndex}` claims, real Jev
`FactVerifier` port adapter, LLM fluency renderer behind the bundle seam.
The Trigger job `press-note/extract` (OCR/STT → claims) wires in once
Trigger.dev login + provider keys exist.
