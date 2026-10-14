# SPEC 007 — Laya verifier ✅ implemented (Jev migration)

No Jev key exists — migrated per laya.studio/docs/jev-migration (same
`/v1/systemone` wire protocol, base `https://api.laya.studio`, Bearer
`lsk_live_…`, `{state, questions, model?}`, answers under same ids).
`LAYA_API_KEY` stored (41 chars), verified: `/v1/usage` 200
(`credit_balance: 6000`, free plan), one live Noul passed.

Module `src/lib/verify` (`verify.ts`): `FactVerifier.verifyNoul` port —
Laya HTTP adapter (injected baseUrl/key/post) + `createFakeVerifier`
(internal test seam). Guards from the docs: ≤32 questions, unique ids,
oversize states rejected (default ~512-token char budget, tunable) instead
of silent truncation; thresholds stay with callers (confidence ranks, never
certifies — re-derive per task). Failures: invalid-input/unauthorized/transport.

Honest diffs vs Jev (from their docs, not assumed): confidence computed
differently (1−entropy / max(p,1−p)); large label sets weaker (split coarse→fine);
512 EN / 1024 multilingual token read limit; $0.0357/1M input (15% less).
SPEC 002's "Jev" references now mean this module. Shadow/both-vendors step
skipped (no Jev key to shadow against) — stated, not hidden.
