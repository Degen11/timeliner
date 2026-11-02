# Findings: knowledge

Detector: detect-knowledge. Coverage: no ADR directory exists; CLAUDE.md (declared architecture per survey) claims spot-verified against code (models/max_tokens, debounce/undo/retry constants, render caps, tag palette indices, commit lock, file layout, OG cache-buster) and found accurate; supabase-migration.sql reference schema and README Key Concepts checked against src/lib; every process.env / import.meta.env read traced (all required values documented in CLAUDE.md env table or at read site). Author data from the brief: bus-factor-1 hot files are ~80-100% AI-assistant commits plus one human (all hill.degen addresses); CLAUDE.md documents TimelinePage/EventCard/eventsSlice well enough that concentration alone was not filed — the undocumented part (sync merge rule) is filed as missing rationale. AI-only category, no tool corroborates any of it. Out of category, seen not covered: (correctness) src/lib/db.js mapEventToRow/mapRowToEvent drop recurrence and attachments, so a remote-wins hydrate in timelinesSlice.js replaces local events and loses those fields; (build) .env.example lists only VITE_SUPABASE_URL/ANON_KEY and omits ANTHROPIC_API_KEY, SUPABASE_SERVICE_ROLE_KEY, ALLOWED_ORIGIN, PUBLIC_BASE_URL; (signage) README env table omits PUBLIC_BASE_URL, README tech stack lists html2canvas which package.json does not declare, and README Supabase setup step 2 leads to the schema drift filed here; (architecture) MAX_HISTORY in eventsSlice.js and RETRY_DELAYS in useTimelineStore.js are magic numbers outside constants.js contrary to CLAUDE.md. Survey declares no ADRs, so architecture should recheck once intent for sync/rate-limiting is declared. [coverage=full]

## PH-909 Reference Supabase schema has no events.location column that the sync code writes on every upsert

```yaml
id: PH-909
category: knowledge
title: Reference Supabase schema has no events.location column that the sync
  code writes on every upsert
severity: major
traffic: 0.08921192976283292
confidence: ai-suspected
evidence:
  - supabase-migration.sql:18
  - supabase-migration.sql:31
  - src/lib/db.js:24
  - src/lib/db.js:43
  - 9b70984
source:
  - detect-knowledge
repair_cost: S
fingerprint: knowledge:supabase-migration.sql:reference-schema-missing-location-column
```

CLAUDE.md calls supabase-migration.sql the reference DB schema and README Supabase Setup says to run it. Its events table (lines 18-35) ends at photos/sort_index/created_at with no location column, but mapEventToRow has sent location since commit 9b70984 (2026-03-06, 'location sync') and mapRowToEvent reads row.location. The schema file was edited five times afterwards without picking it up. Anyone building a Supabase project from the record gets a PostgREST unknown-column error on every syncEvents upsert, which the local-first design swallows into a console error and syncError, so the stale record yields a deployment where cloud sync silently never stores events.

## PH-910 rateLimit.js documents an Upstash production path that was never implemented; daily AI budget is per warm instance

```yaml
id: PH-910
category: knowledge
title: rateLimit.js documents an Upstash production path that was never
  implemented; daily AI budget is per warm instance
severity: minor
traffic: 0.2043498187424466
confidence: ai-suspected
evidence:
  - api/rateLimit.js:4
  - api/rateLimit.js:5
  - api/rateLimit.js:8
  - api/parse.js:25
  - 8b36ce6
source:
  - detect-knowledge
repair_cost: S
fingerprint: knowledge:api/rateLimit.js:phantom-upstash-rate-limit-path
```

The header comment says production should set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN and install @upstash packages for persistent limits. No code anywhere reads those variables or imports those packages (grep finds only this comment, added in 8b36ce6 and never followed up); the limiter is the module-level Map on line 8 regardless. An operator who follows the comment sets two env vars that change nothing. Meanwhile parse.js/analyze.js name their cap DAILY_BUDGET_MAX = 100 and CLAUDE.md describes burst/daily limiting, but a daily count held in one serverless instance's memory resets on cold start and is not shared across instances, so the Claude-spend budget a reader believes exists is not enforced. Fix the record: drop or rewrite the comment and state the actual per-instance scope.

## PH-911 Cross-device sync conflict rule (whole-timeline last-writer-wins by client clock) has no recorded rationale

```yaml
id: PH-911
category: knowledge
title: Cross-device sync conflict rule (whole-timeline last-writer-wins by
  client clock) has no recorded rationale
severity: major
traffic: 0.10694046755254454
confidence: ai-suspected
evidence:
  - src/store/slices/timelinesSlice.js:131
  - src/store/slices/timelinesSlice.js:160
  - src/lib/db.js:113
  - src/lib/db.js:136
  - 0701b57
  - f38dd45
source:
  - detect-knowledge
repair_cost: S
fingerprint: knowledge:src/store/slices/timelinesSlice.js:undocumented-sync-merge-rule
```

hydrateFromRemote keeps a whole timeline from whichever side has the lexically greater updatedAt (client wall-clock ISO strings, ties go to remote) and replaces the active events array wholesale; syncEvents deletes remote rows absent locally only if created before syncStartedAt. That is a non-obvious conflict policy that discards the losing device's edits, yet CLAUDE.md (the declared architecture; no ADRs exist), README Key Concepts and the survey describe only debounce/retry tiers and never say how local and remote conflicts resolve or why event-level merge was rejected. The cost has landed: this path has been through repeated data-loss fix commits (f38dd45, 0701b57, 48e13f2). Both timelinesSlice.js and useTimelineStore.js are on the brief's bus-factor-1 list with commits almost entirely from AI sessions plus one human, so the rule lives in no head and no doc. Repair is writing the policy and its rationale into CLAUDE.md.
