# Verdicts: api

Inspector: inspect-api. Coverage: every finding judged (2/2); all evidence refs opened. AI-only slice - no tool covers api debt. Both refuted on the evidence route: analyze.js refs point past end of a 274-line file.

## PH-1109 refuted

```yaml
id: PH-1109
verdict: refuted
reason: "evidence: api/analyze.js:481 and api/analyze.js:486 do not resolve -
  analyze.js is 274 lines at a54960b (the X-RateLimit headers and 429 body are
  at analyze.js:233-238). The parse/share/og refs resolve; also note all four
  handlers already meet the declared CLAUDE.md contract (429 + Retry-After), and
  each endpoint has one same-owner consumer that reads neither header (study
  case 2 Not-this). Next scan may refile with correct refs."
fingerprint: api:api:rate-limit-response-contract-per-endpoint
```

## PH-1110 refuted

```yaml
id: PH-1110
verdict: refuted
reason: "evidence: api/analyze.js:490 does not resolve - analyze.js is 274 lines
  at a54960b (the missing-ANTHROPIC_API_KEY 500 is at analyze.js:241-242).
  parse.js:218 (500), share.js:224 (503) and og.js:252 (fallback) resolve and
  the parse-vs-share split is real, so the next scan may refile it with correct
  refs."
fingerprint: api:api:missing-config-status-per-endpoint
```
