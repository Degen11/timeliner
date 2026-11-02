# Findings: api

Detector: detect-api. Coverage: all 5 Vercel endpoints tabulated (parse, analyze, share GET/POST, og, plus the shared rateLimit helpers) for envelope, error shape, status mapping and rate-limit contract, and all 4 in-repo consumers read (InlineImportPanel, uiSlice.fetchInsights, shareEncoder.createServerShare, SharedViewPage). No tool covers api debt in this phase - no OpenAPI or spectral linting is wired - so this slice is entirely AI-only. Error bodies are uniformly {error} and success envelopes are named top-level keys, so no envelope or error-body finding. Each endpoint has exactly one in-repo consumer shipped by the same owner, which is why both findings stay minor. Out of category: api/share.js:147 maps every Supabase read error to 404 Share not found, and SharedViewPage.jsx:66-85 branches only on 404/410 so 429/503/500 fall through to the hash decoder and show an invalid-link error - an outage reads as a deleted share (code/reliability). api/share.js:227-237 consumes rate-limit budget before rejecting an unsupported method with 405, unlike parse/analyze/og (trivial, not filed). [coverage=full]

## PH-1109 Rate-limit (429) contract differs per endpoint: parse/analyze send X-RateLimit headers and a retry hint, share/og do not

```yaml
id: PH-1109
category: api
title: "Rate-limit (429) contract differs per endpoint: parse/analyze send
  X-RateLimit headers and a retry hint, share/og do not"
severity: minor
traffic: 0.2509477199194409
confidence: ai-suspected
evidence:
  - api/parse.js:209
  - api/parse.js:214
  - api/analyze.js:481
  - api/analyze.js:486
  - api/share.js:229
  - api/share.js:231
  - api/og.js:250
source:
  - detect-api
repair_cost: M
fingerprint: api:api:rate-limit-response-contract-per-endpoint
```

parse and analyze set X-RateLimit-Limit/X-RateLimit-Remaining on every response and put the wait time in the 429 body (Try again in N seconds), while share and og omit both headers and return a bare Rate limit exceeded. All four call the same checkRateLimit, so the shape of a throttled response is decided by copy-paste in each handler rather than by rateLimit.js. A consumer cannot rely on X-RateLimit-Remaining to pace itself, and the user-facing message (consumers surface err.error verbatim) tells you when to retry on one endpoint but not the other. Minor rather than major: no consumer reads the headers or branches on the difference yet. M, not S: the fix is one helper in rateLimit.js that writes headers and the 429 body, adopted by four handlers and their tests (parse.test.js already asserts X-RateLimit-Remaining).

## PH-1110 Service-not-configured failure maps to 500 in parse/analyze but 503 in share and a 302 fallback in og

```yaml
id: PH-1110
category: api
title: Service-not-configured failure maps to 500 in parse/analyze but 503 in
  share and a 302 fallback in og
severity: minor
traffic: 0.2509477199194409
confidence: ai-suspected
evidence:
  - api/parse.js:218
  - api/analyze.js:490
  - api/share.js:224
  - api/og.js:252
source:
  - detect-api
repair_cost: S
fingerprint: api:api:missing-config-status-per-endpoint
```

The same failure mode - a required server secret is absent - is reported as 500 Service temporarily unavailable by parse and analyze, 503 Share service not configured by share, and a redirect to the static image by og. The declared contract (400 validation, 429 rate limit, 502 AI, 500 unexpected) has no slot for missing configuration, so each handler chose its own, and the tests pin the split (parse.test.js and analyze.test.js assert 500). A consumer or monitor cannot tell a misconfigured deployment from a crash on parse/analyze, while it can on share. og's fallback is reasonable for an image URL; the disagreement that matters is parse/analyze vs share. S: pick one status, change two lines and two test assertions.
