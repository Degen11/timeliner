# Verdicts: knowledge

Inspector: inspect-knowledge. Coverage: every finding judged; all evidence refs opened and commit refs checked with git show/log. AI-only category, no tool corroboration available.

## PH-909 refuted

```yaml
id: PH-909
verdict: refuted
reason: "miscategorized: wrong category — this is signage debt because
  supabase-migration.sql is a runnable setup script (line 3: 'Run this in your
  Supabase SQL Editor', README setup step 2 points at it) and the cost claimed
  is a newcomer's fresh Supabase setup failing on every syncEvents upsert; the
  drift itself is real (events table lines 18-35 lack location while
  src/lib/db.js:24/:43 write/read it since 9b70984; schema touched 4 times
  after, not 5) — re-file under signage"
fingerprint: knowledge:supabase-migration.sql:reference-schema-missing-location-column
```

## PH-910 confirmed

```yaml
id: PH-910
verdict: confirmed
reason: "evidence resolves: api/rateLimit.js:5-6 tells operators to set
  UPSTASH_REDIS_REST_URL/TOKEN and install @upstash packages, but no file
  outside that comment mentions upstash and package.json declares neither;
  limiter is the module Map at :8 unconditionally; parse.js:25
  DAILY_BUDGET_MAX=100 is held per instance; comment added in 8b36ce6 and never
  followed up; line 4's 'resets on cold start' only partly documents the
  daily-scope gap; minor kept"
fingerprint: knowledge:api/rateLimit.js:phantom-upstash-rate-limit-path
```

## PH-911 confirmed

```yaml
id: PH-911
verdict: confirmed
reason: "evidence resolves (timelinesSlice.js:131 whole-timeline updatedAt
  string compare, :160 active-events replace; db.js:113/:136 syncStartedAt
  delete guard) and no rationale for the conflict policy exists in CLAUDE.md,
  README, survey or code comments (grep for conflict/merge/last-writer finds
  none); lowered to minor per study-case Case 4: cited fix commits
  f38dd45/0701b57/48e13f2 address timeline-switch persistence, loadInitialData
  error handling and undo — not this merge rule — and traffic is 0.11, so no
  evidence the cost has landed"
fingerprint: knowledge:src/store/slices/timelinesSlice.js:undocumented-sync-merge-rule
severity: minor
severity_was: major
```
