# SPEC 002 — PressNoteFacts extraction (SKIT005 bullets 1–5)

## Goal
Unstructured PDF/image/audio + form → verified `PressNoteFacts` → EN+HI draft bundle. Never invent.

## Acceptance
- Trigger job `press-note/extract`: Mistral OCR (pages {text,conf,bbox}) / Sarvam saaras:v4 codemix+unknown triage + OpenAI gpt-transcribe fallback (segments, language, probs). Low-conf pages excluded from auto-cite, flagged.
- Structuring LLM temp 0, strict JSON schema (event/date/time/location/participants/outcomes/casualties{dead,injured,status}/alleged_crime/accused/action_taken; every scalar nullable + `not_stated`), each fact `{value, segment_ids, quote}`; missing → null+not_stated; conflict → `status:conflicting + candidates[]`.
- Jev Noul verify (hallucinated?/absent?/format?) max>0.7 → 1 retry then human; neutrality gate (guilt/communal/sensational) blocks.
- Draft bundle from facts only: 3× headlines ≤15w + 80w summary + 400w detail × EN+HI, sentence-level citations, HI native sarkari register, entities/sections/numbers invariant. Length+cite re-check.
- Test: conflicting FIR vs audio → "could not be confirmed" + footnote; missing date → "not stated", never upload date; casualty without citation → blocked. Audit bundle contains hashes/confidences/model pins/revisions.
