# Findings: security

Detector: detect-security. Coverage: authz traced for all 5 api/ handlers (parse, analyze, share GET/POST, og) and for the Supabase anon-key path (timelines/events/storage RLS keyed on the x-device-id header in supabase-migration.sql, client in src/lib/db.js, src/lib/photoSync.js). No server-side authorization gap found: the API has no user model by design, shared_timelines is RLS-locked to service_role, and the device RLS policies hold for insert/update/upsert. gitleaks ran (0 findings) and .env.example holds placeholders only, so secret coverage is tool-backed. semgrep FAILED this run, so known-insecure-pattern coverage is AI-only (hence --partial). eslint-sonar hotspots in the brief (slow-regex, pseudo-random in tests and importWorker id generation, code-eval in tests) were not restated; the pseudo-random ones are in tests or non-security ids. Left to api: share POST stores caller events unvalidated (client re-validates on read via parseLooseEvents), anon-key fallback in api/share.js and api/og.js. No architecture-level observations. [coverage=partial]

## PH-509 Supabase sync drops recurrence and attachments, and remote wins on reload

```yaml
id: PH-509
category: security
title: Supabase sync drops recurrence and attachments, and remote wins on reload
severity: major
traffic: 0.10694046755254454
confidence: ai-suspected
evidence:
  - src/lib/db.js:9
  - src/lib/db.js:29
  - supabase-migration.sql:18
  - src/schemas/event.js:36
  - src/store/slices/timelinesSlice.js:131
  - src/store/slices/timelinesSlice.js:164
source:
  - detect-security
repair_cost: M
fingerprint: security:src/lib/db.js:remote-schema-drops-event-fields
partial: true
```

The event model declares recurrence and attachments (schemas/event.js:36-37), but the events table has no columns for them and mapEventToRow/mapRowToEvent neither write nor read them. hydrateFromRemote keeps the remote copy whenever its updated_at is not older than the local timeline's updatedAt. upsertTimeline stamps updated_at with the sync time on every sync, while the local updatedAt changes only on snapshot or switch, so the remote copy usually wins. On the next load the active timeline's events are replaced with rows that have lost every recurrence rule and link. The schema no longer covers what the client model promises, and nothing flags the loss. The same thing happened to location before commit 9b70984 added it to the mapper.

## PH-510 Reference schema cannot produce a working sync DB: events.location column missing

```yaml
id: PH-510
category: security
title: "Reference schema cannot produce a working sync DB: events.location
  column missing"
severity: minor
traffic: 0.08921192976283292
confidence: ai-suspected
evidence:
  - supabase-migration.sql:18
  - src/lib/db.js:24
  - src/lib/db.js:43
  - 9b70984
source:
  - detect-security
repair_cost: S
fingerprint: security:supabase-migration.sql:migration-missing-location-column
partial: true
```

Commit 9b70984 began writing and reading events.location in db.js, but supabase-migration.sql (the only schema source, run by hand from its header instructions) never gained the column. A project built from empty with this file rejects every events upsert because the location column is unknown. The sync retries 3 times and ends in a permanent Sync failed toast. Existing deployments work only because their DB was hand-fixed outside the repo, so the schema cannot be rebuilt from the repo.

## PH-511 Device ID, the sole sync credential, is embedded in signed photo URLs shown to users

```yaml
id: PH-511
category: security
title: Device ID, the sole sync credential, is embedded in signed photo URLs
  shown to users
severity: minor
traffic: 0.082112476587939
confidence: ai-suspected
evidence:
  - src/lib/photoSync.js:20
  - src/lib/photoSync.js:126
  - src/hooks/useResolvedPhotos.js:26
  - src/lib/supabase.js:30
  - supabase-migration.sql:52
source:
  - detect-security
repair_cost: M
fingerprint: security:src/lib/photoSync.js:device-id-bearer-in-photo-urls
partial: true
```

Every RLS policy on timelines, events and storage.objects authorizes only by the x-device-id header, so the device ID is a bearer credential that never expires and cannot be rotated. Photo storage paths are {deviceId}/{filename}, and createSignedUrl returns a URL with that path in it. The URL is rendered as an image src, so a user who copies an image address and shares it also hands out their device ID. Anyone holding it can use the public anon key to read, overwrite and delete all of that device's timelines, events and photos. Fixes: use an opaque per-object path, or keep the device ID out of the storage path, for example under a hashed prefix.

## PH-512 Rate limiter is per-instance memory, the only spend control on unauthenticated Claude endpoints

```yaml
id: PH-512
category: security
title: Rate limiter is per-instance memory, the only spend control on
  unauthenticated Claude endpoints
severity: minor
traffic: 0.2043498187424466
confidence: ai-suspected
evidence:
  - api/rateLimit.js:5
  - api/rateLimit.js:8
  - api/parse.js:25
  - api/analyze.js:4
  - api/parse.js:207
source:
  - detect-security
repair_cost: M
fingerprint: security:api/rateLimit.js:in-memory-rate-limit-cost-exposure
partial: true
```

parse and analyze are public, unauthenticated, and call Claude with the server ANTHROPIC_API_KEY (parse allows up to 16384 output tokens per call). The only guard is checkRateLimit, a module-level Map. It resets on every cold start and is not shared between concurrent instances, so DAILY_BUDGET_MAX (100 parse, 50 analyze per IP) is not a real daily cap. The header comment says production can use Upstash env vars, but no code path reads them, which tells operators a persistent limit is available when it is not. A caller rotating IPs, or simply spreading load across instances, can drive Anthropic spend with no bound.

## PH-513 CSP keeps script-src unsafe-inline for a single static prerender script

```yaml
id: PH-513
category: security
title: CSP keeps script-src unsafe-inline for a single static prerender script
severity: minor
traffic: 0.10421886379321653
confidence: ai-suspected
evidence:
  - vercel.json:51
  - scripts/prerender.mjs:47
source:
  - detect-security
repair_cost: S
fingerprint: security:vercel.json:csp-unsafe-inline-script
partial: true
```

The only inline script the app ships is the removal script generated at build time by prerender.mjs. Its content is fixed per route, so it can be allowed by hash. Instead the CSP allows unsafe-inline for all scripts, which removes the CSP backstop against injected script. That backstop matters here because an XSS would read the localStorage device ID (the sole sync credential) and the full local timeline. This is defence in depth, not a live hole: no injection sink was found and attachment hrefs are filtered by isSafeLinkUrl.
