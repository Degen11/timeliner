# Verdicts: security

Inspector: inspect-security. Coverage: every finding judged; all evidence refs opened (plus git show 9b70984). Judged on repo source only; no tests or builds run.

## PH-509 confirmed

```yaml
id: PH-509
verdict: confirmed
reason: "All refs resolve: mapEventToRow/mapRowToEvent (db.js:9-45) and the
  events table (migration:18-35) carry no recurrence/attachments while
  schemas/event.js:36-37 declares them; hydrateFromRemote
  (timelinesSlice.js:131,164) takes remote events when remote updated_at >=
  local, and upsertTimeline (db.js:75) stamps updated_at at sync time after
  persistActiveTimeline sets local updatedAt (timelinesSlice.js:43), so remote
  normally wins. No trap (schema-invariant Case 3 is in-category), no doc,
  reachable whenever Supabase is configured."
fingerprint: security:src/lib/db.js:remote-schema-drops-event-fields
```

## PH-510 confirmed

```yaml
id: PH-510
verdict: confirmed
reason: "db.js:24 writes and db.js:43 reads events.location (added by 9b70984,
  which touched only db.js), but supabase-migration.sql:18-35 has no location
  column and it is the only SQL file tracked; a fresh project built from it
  would reject the upsert. Not the squashed-baseline trap: no documented
  starting point or ALTER note exists."
fingerprint: security:supabase-migration.sql:migration-missing-location-column
```

## PH-511 confirmed

```yaml
id: PH-511
verdict: confirmed
reason: storagePath is deviceId/filename (photoSync.js:20-21), createSignedUrl
  on it (photoSync.js:126) returns a URL containing that path, rendered via
  useResolvedPhotos (used by EventCard, EventDetailView, PhotoPreview,
  EditEventModal) when a photo is not local; supabase.js:30 and migration RLS
  (timelines/events/storage) authorize solely on x-device-id, so the leaked id
  grants full read/write/delete. No trap or documented acceptance found.
fingerprint: security:src/lib/photoSync.js:device-id-bearer-in-photo-urls
```

## PH-512 confirmed

```yaml
id: PH-512
verdict: confirmed
reason: rateLimit.js:8 is a module-level Map, reset on cold start and
  per-instance; parse.js:25 and analyze.js:3-4 budgets are applied only through
  it (parse.js:207); no Upstash/Redis code or dependency exists anywhere despite
  the rateLimit.js:5-6 comment, and vercel.json has no firewall rule. The
  comment documents burst-only intent, which does not refute the spend-exposure
  claim.
fingerprint: security:api/rateLimit.js:in-memory-rate-limit-cost-exposure
```

## PH-513 confirmed

```yaml
id: PH-513
verdict: confirmed
reason: vercel.json:51 sets script-src 'self' 'unsafe-inline'; the only
  executable inline script is the fixed per-route removalScript
  (prerender.mjs:45-49) - index.html has only an ld+json block (not subject to
  script-src) and the module entry, and VitePWA uses default external
  registerSW. Hashable, so unsafe-inline is unnecessary; finding itself scopes
  it as defence in depth, matching minor.
fingerprint: security:vercel.json:csp-unsafe-inline-script
```
