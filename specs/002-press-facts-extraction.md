# SPEC 002 — PressNoteFacts extraction (next feat)

Trigger job `press-note/extract`: Mistral OCR pages {text,conf,bbox} /
Sarvam `saaras:v4` codemix + OpenAI `gpt-transcribe` fallback → verbatim
segments → PII redact → structuring LLM temp 0, strict JSON schema, every fact
`{value, segment_ids, quote}`, missing → `null + not_stated`, conflicts →
`status:conflicting + candidates[]` → Jev Noul verify (max P(wrong) > 0.7 →
one retry, then human) → neutrality gate → EN+HI bundle (3 headlines ≤15w,
80w summary, 400w detail, sentence citations). New code goes in
`src/lib/press-facts` as a deep module with the same Result/fake-adapter shape
as `src/lib/r2`. Blocked on: Trigger.dev login (human) + paid AI Gateway (or
direct provider keys).
