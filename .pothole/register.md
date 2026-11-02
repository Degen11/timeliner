# Pothole Register: timeliner

Verified: 32 confirmed, 8 refuted, 0 not verified — 40 finding(s) across 10 category file(s).
Detector coverage: Detector: detect-api. Coverage: all 5 Vercel endpoints tabulated (parse, analyze, share GET/POST, og, plus the shared rateLimit helpers) for envelope, error shape, status mapping and rate-limit contract, and all 4 in-repo consumers read (InlineImportPanel, uiSlice.fetchInsights, shareEncoder.createServerShare, SharedViewPage). No tool covers api debt in this phase - no OpenAPI or spectral linting is wired - so this slice is entirely AI-only. Error bodies are uniformly {error} and success envelopes are named top-level keys, so no envelope or error-body finding. Each endpoint has exactly one in-repo consumer shipped by the same owner, which is why both findings stay minor. Out of category: api/share.js:147 maps every Supabase read error to 404 Share not found, and SharedViewPage.jsx:66-85 branches only on 404/410 so 429/503/500 fall through to the hash decoder and show an invalid-link error - an outage reads as a deleted share (code/reliability). api/share.js:227-237 consumes rate-limit budget before rejecting an unsupported method with 405, unlike parse/analyze/og (trivial, not filed). [coverage=full]
Detector coverage: Detector: detect-architecture. Coverage: madge ran and reported 0 import cycles, so file-level cycle detection is tool-backed and clean. Drift checked against the CLAUDE.md declarations recorded in the survey: api/ imports nothing from src/ (clean), components/ui imports no store/feature code (Tooltip only pulls CAN_HOVER from constants), heavy views are React.lazy in both dispatchers, store slices only write events via commitEvents/undo/redo or timeline load/switch, photoMap only written inside slices. God-module check: constants.js, dateUtils.js, selectors.js, dataService.js import no feature/component code back, so they are libraries, not god modules. Zombie-path and god-module coverage is AI-only. Seen but not reported (no declared layering rule covers them): src/hooks/useTimelineShell.jsx imports components/layout/Sidebar and timeline/TimelineToolbar, and src/hooks/useLightbox.jsx imports shared/PhotoLightbox (hooks layer depending on components); components/shared/SharedViewPage is a route page that imports four timeline views, giving a directory-level shared<->timeline loop madge cannot see at file level. Architecture should recheck these if the survey ever declares a hooks/components or shared/timeline direction. [coverage=full]
Detector coverage: Detector: detect-build. Coverage: .github/workflows/ci.yml, .github/dependabot.yml, package.json scripts and engines, .npmrc, vercel.json, vite.config.js, scripts/prerender.mjs, .env.example and the README setup and deployment sections read end to end; every process.env and import.meta.env read in src/, api/ and scripts/ cross-checked against .env.example; commit subjects grepped for retry/re-run/flaky/again/lint over workflow and build paths (no workflow retries exist; the one parse retry hit is app code). No release doc exists; deploys are Vercel git integration. No tool in this phase reads build inputs, so build coverage is AI-only. Not reported: ALLOWED_ORIGIN and the non-prefixed SUPABASE_URL/SUPABASE_ANON_KEY aliases are absent from .env.example but optional with safe defaults. Out of category: (signage) README.md:47 says Node.js 18+ (pipeline half reported here) and README.md:52-59 implies npm run dev plus ANTHROPIC_API_KEY in .env enables AI parsing, but vite dev has no /api proxy and the Vercel CLI is not a dependency, so api/ functions never run locally; (dependency) .npmrc:1 sets legacy-peer-deps=true repo-wide since 543274f with no comment naming which peer conflict it masks. No credentials seen in build inputs. [coverage=full]
Detector coverage: Detector: detect-code. Coverage: marker grep (zero TODO/FIXME/HACK/XXX in src, api, scripts), copy-admission grep, sibling twin comparison across api/ vs src/ and the import worker vs importHelpers with git history of both sides, flag/dead-branch grep (no feature flags exist), god-file check against the hotspot and coupling tables. Sonar server not configured and semgrep failed, so complexity is eslint-sonar and repowise only; repowise-health truncated at 60 of 201. Deliberately not restated: jscpd PH-096..099, PH-101/102 and PH-144..148 (the clone blocks behind both findings; these findings add the divergence and the missed fixes), and the TimelinePage/EventCard/InlineImportPanel complexity findings. TimelinePage was judged and not filed as a god file: one export, Shell coupling already broken out into useTimelineShell. Out-of-category observations: (1) bug, not debt: JSON import drops location in both copies (src/utils/importHelpers.js:57 normalizeJSONEvents and src/workers/importWorker.js:119 parseJSON never pass location), so a JSON export re-imported loses places. (2) api/analyze.js callClaude has no stop_reason=max_tokens handling at max_tokens 4096, while parse.js got truncation salvage in 5005a08; a truncated insights reply becomes a 502. Low risk at 3-15 insights, so not filed. (3) The worker csv case (src/workers/importWorker.js:246) is never sent: useFileImport routes CSV through Papa on the main thread and never calls parseInWorker for it. That is an unreachable branch with no flag, folded into the worker finding rather than filed separately. No test files were touched or judged. [coverage=full]
Detector coverage: Detector: detect-dependency. Coverage: package.json, package-lock.json, vite.config.js, eslint.config.js and .github/dependabot.yml read; every declared dependency traced to import sites in src/, api/, scripts/ and config files. osv-scanner ran and reported 0 advisories, so there was no reachability work to do. Unused-dependency coverage is my own reading only (knip is not run). Abandonment was checked against npm registry metadata for the candidates; nothing is archived. No credentials seen in manifests or lockfile. [coverage=full]
Detector coverage: Detector: detect-knowledge. Coverage: no ADR directory exists; CLAUDE.md (declared architecture per survey) claims spot-verified against code (models/max_tokens, debounce/undo/retry constants, render caps, tag palette indices, commit lock, file layout, OG cache-buster) and found accurate; supabase-migration.sql reference schema and README Key Concepts checked against src/lib; every process.env / import.meta.env read traced (all required values documented in CLAUDE.md env table or at read site). Author data from the brief: bus-factor-1 hot files are ~80-100% AI-assistant commits plus one human (all hill.degen addresses); CLAUDE.md documents TimelinePage/EventCard/eventsSlice well enough that concentration alone was not filed — the undocumented part (sync merge rule) is filed as missing rationale. AI-only category, no tool corroborates any of it. Out of category, seen not covered: (correctness) src/lib/db.js mapEventToRow/mapRowToEvent drop recurrence and attachments, so a remote-wins hydrate in timelinesSlice.js replaces local events and loses those fields; (build) .env.example lists only VITE_SUPABASE_URL/ANON_KEY and omits ANTHROPIC_API_KEY, SUPABASE_SERVICE_ROLE_KEY, ALLOWED_ORIGIN, PUBLIC_BASE_URL; (signage) README env table omits PUBLIC_BASE_URL, README tech stack lists html2canvas which package.json does not declare, and README Supabase setup step 2 leads to the schema drift filed here; (architecture) MAX_HISTORY in eventsSlice.js and RETRY_DELAYS in useTimelineStore.js are magic numbers outside constants.js contrary to CLAUDE.md. Survey declares no ADRs, so architecture should recheck once intent for sync/rate-limiting is declared. [coverage=full]
Detector coverage: Detector: detect-security. Coverage: authz traced for all 5 api/ handlers (parse, analyze, share GET/POST, og) and for the Supabase anon-key path (timelines/events/storage RLS keyed on the x-device-id header in supabase-migration.sql, client in src/lib/db.js, src/lib/photoSync.js). No server-side authorization gap found: the API has no user model by design, shared_timelines is RLS-locked to service_role, and the device RLS policies hold for insert/update/upsert. gitleaks ran (0 findings) and .env.example holds placeholders only, so secret coverage is tool-backed. semgrep FAILED this run, so known-insecure-pattern coverage is AI-only (hence --partial). eslint-sonar hotspots in the brief (slow-regex, pseudo-random in tests and importWorker id generation, code-eval in tests) were not restated; the pseudo-random ones are in tests or non-security ids. Left to api: share POST stores caller events unvalidated (client re-validates on read via parseLooseEvents), anon-key fallback in api/share.js and api/og.js. No architecture-level observations. [coverage=partial]
Detector coverage: Detector: detect-signage. Coverage: 4 simulated newcomer tasks (change card click behaviour across views; add a batch tag action; group events by year in a new view/export; run AI parsing locally from the README) plus a CLAUDE.md/README claim-by-claim check against code (routes, rewrites, constants, caps, shortcuts, storage keys, env vars, tests, hydration order) and a name/doc contradiction sweep of lib/, store/, utils/, hooks/. Most CLAUDE.md claims verified accurate. knip/ts-prune are not run in this phase, so dead-export coverage is AI-only. Single-leg dead export noted (not a finding): src/hooks/useClickOutside.js is documented but has zero importers and there is no hooks barrel; DatePicker, EventPhotoUploader, HorizontalView, HorizontalFilmStrip hand-roll the same mousedown-outside listener (code: diverged twins). Out of category: AnimatedModal.jsx:49, PhotoLightbox.jsx:55, EventPhotoUploader.jsx:72 use manual keydown listeners against the CLAUDE.md rule useHotkeys only (architecture: code violates a declared convention). eventsSlice mergeEvents (eventsSlice.js:404) deletes the merged source remotely at once, bypassing the 6s deferred-delete window that CLAUDE.md describes for deletes (code). semgrep failed and sonar was skipped; neither bounds this category. [coverage=full]
Detector coverage: Detector: detect-swerve. Coverage: full git log for 24 months (693 commits incl. merges) grepped for workaround/hack/temporary/revert/race/guard/UTC/timezone; folklore grep (DO NOT, fragile, careful, TODO/FIXME/HACK, eslint-disable) over src/ api/ scripts/; wrapper-chain and catch-and-swallow scan of src/lib and src/utils; flag scan (none exist). No folklore comments survived: eslint-disable lines all carry reasons, exportText.js split is documented bundle-size signage, api/parse.js JSON salvage is an external model constraint. Out of category: src/lib/dexieDb.js:4 comment claims a Version 2 that the code never declares (doc rot, code/knowledge). No architecture-level cycle or layer violation observed. [coverage=full]
Detector coverage: Detector: detect-test. Coverage: lcov did NOT run (no committed coverage/lcov.info), so no coverage percentage is claimed anywhere here; untested-behaviour findings rest on reading which source symbols no test file references. Assertion, skip, coupling and nondeterminism review is AI-only: no mutation testing, no flake detection, no run history. No .skip/.only/xit/xdescribe exists in any of the 26 test files and vite.config.js test block sets no retry. Not covered: per-component behaviour of the ~60 untested UI components beyond the hotspots sampled (TimelinePage, EventCard, InlineImportPanel, views). Out of category for code: flushPendingDeletes (src/store/slices/eventsSlice.js:57) removes the localStorage queue before any remote delete resolves, so a failed retry is logged and dropped and the event resurrects on next sync; syncWithRetry (src/store/useTimelineStore.js:38) snapshots events once before the retry loop, so a retry after 2-8s re-sends a stale event list. [coverage=partial]
Tool coverage: Tools run: eslint-sonar (80 findings), jscpd (68 findings), gitleaks (0 findings), osv-scanner (0 findings), madge (0 findings), repowise-dead-code (0 findings), repowise-health (60 findings). Skipped (not measured): sonar — set SONAR_HOST_URL, SONAR_TOKEN, SONAR_PROJECT_KEY (or sonar-project.properties); semgrep — failed (exit 2; message withheld — tool output can echo repo contents); lcov — no coverage/lcov.info in the repo (Pothole never runs the target's tests, so it cannot produce one): coverage is not measured. Coverage notes: repowise-health — TRUNCATED at 60 of 201 health findings: coverage is partial.
Coverage flags: unverified=0 partial-findings=14 missing-verdicts=0 never-scanned=0 stale-verdicts=0 unparseable=0 tool-coverage=partial
Category status: code=verified+full architecture=verified+full test=verified+partial dependency=verified+full knowledge=verified+full build=verified+full api=verified+full security=verified+partial swerve=verified+full signage=verified+full
A category with 0 confirmed findings is "nothing confirmed", never "no debt". Read the coverage clauses above before drawing any conclusion from a count.

## Confirmed

Survived an adversarial Inspector. These are the register: everything downstream — scoring, work zones, issues — derives from this section only.

## PH-709 Shared-link page keeps its own view dispatcher that never received the per-view error boundary or skeleton fixes

```yaml
id: PH-709
category: architecture
title: Shared-link page keeps its own view dispatcher that never received the
  per-view error boundary or skeleton fixes
severity: major
traffic: 0.21056578289863104
confidence: confirmed
evidence:
  - src/components/shared/SharedViewPage.jsx:221
  - src/components/timeline/TimelineViewRenderer.jsx:163
  - src/components/timeline/TimelineViewRenderer.jsx:18
  - 98d208a
source:
  - detect-architecture
repair_cost: M
fingerprint: architecture:src/components/shared:shared-view-dispatcher-zombie
verdict_reason: "evidence resolves: SharedViewPage.jsx:221-233 renders
  Vertical/Horizontal/Grid bare with ad-hoc Loader2 Suspense fallbacks, while
  TimelineViewRenderer.jsx:18 (ViewErrorBoundary) and :163 (ViewSkeleton
  fallback) are absent from it; git show 98d208a touches TimelineViewRenderer
  only, not SharedViewPage. Both paths are live (App.jsx:56 /s route vs editor)
  with separate fix histories, so Case 3 bar met, not a
  -legacy/dead/function-twin trap; no doc records the split as intended. Caveat:
  the shared->timeline direction sub-claim has no declared layering rule in the
  survey and is not relied on."
```

## PH-1012 package.json engines declares node >=18 but the locked toolchain requires Node 20.19+/22.12+

```yaml
id: PH-1012
category: build
title: package.json engines declares node >=18 but the locked toolchain requires
  Node 20.19+/22.12+
severity: minor
traffic: 1
confidence: confirmed
evidence:
  - package.json:8
  - package-lock.json:10858
  - package-lock.json:8137
  - .github/workflows/ci.yml:21
source:
  - detect-build
repair_cost: S
fingerprint: build:package.json:engines-node-range-below-toolchain-minimum
verdict_reason: "Checked: package.json:8 declares node >=18.0.0;
  package-lock.json:10858 (vite) requires ^20.19.0 || >=22.12.0 and :8137
  (jsdom, used by scripts/prerender.mjs in npm run build) requires ^20.19.0 ||
  ^22.13.0 || >=24; no .nvmrc/.node-version exists and only ci.yml:21 hardcodes
  22. No comment documents the gap; not a trap (the declared range is wrong, not
  merely unpinned). Minor stands."
```

## PH-1013 CI never runs lint, yet Dependabot PRs auto-merge on that CI alone

```yaml
id: PH-1013
category: build
title: CI never runs lint, yet Dependabot PRs auto-merge on that CI alone
severity: minor
traffic: 1
confidence: confirmed
evidence:
  - .github/workflows/ci.yml:27-31
  - .github/workflows/ci.yml:33-52
  - package.json:19
  - e00e916
source:
  - detect-build
repair_cost: S
fingerprint: build:.github/workflows/ci.yml:ci-missing-lint-gate-before-auto-merge
verdict_reason: "Checked: ci.yml:24-31 runs npm ci, test and build only;
  package.json:19 defines lint; ci.yml:33-52 auto-merges non-major Dependabot
  PRs after that job; no lint step anywhere in .github and no hook. Headline
  claim stands at minor. Caveat: e00e916 does not show violations accumulating
  unseen — it was a manual ESLint/react-hooks MAJOR upgrade (which
  dependabot.yml ignores) ending at 0 errors — so the cost rests on ci.yml
  alone."
```

## PH-209 Import web worker is a stale copy of importHelpers that missed the date-validation and ICS fixes

```yaml
id: PH-209
category: code
title: Import web worker is a stale copy of importHelpers that missed the
  date-validation and ICS fixes
severity: major
traffic: 0.31737583906559763
confidence: confirmed
evidence:
  - src/workers/importWorker.js:25
  - src/workers/importWorker.js:29
  - src/workers/importWorker.js:150
  - src/workers/importWorker.js:177
  - src/workers/importWorker.js:222
  - src/utils/importHelpers.js:108
  - src/utils/importHelpers.js:136
  - src/utils/importHelpers.js:238
  - src/utils/dateUtils.js:55
  - src/hooks/useFileImport.jsx:83
  - commit e6985f8 worker created as a copy of the import parsers (its only
    commit)
  - "commit 3f3f102 Fix import/print reliability: ICS line unfolding, all-day
    DTEND shift, markdown global date strip (importHelpers only)"
source:
  - detect-code
repair_cost: M
fingerprint: code:src/workers:diverged-twin-import-worker-parsers
kind: duplication
repair: Delete the hand-copied parsers in importWorker.js and import
  normalizeJSONEvents, normalizeICSEvents and normalizeMarkdownEvents from
  importHelpers (the worker is already created with type module).
verdict_reason: "All four routes fail. evidence: importWorker.js:25-33 validates
  with new Date(str), which in node/V8 accepts 2024-02-30 and 2023-02-29 (rolls
  to March), while dateUtils.js:55 uses safeParse. Worker parseICS (:150) has no
  line unfolding, all-day DTEND shift or RRULE, and parseMarkdown (:222) strips
  only the first date token, all fixed only in importHelpers.js (108/136/238) by
  3f3f102. The worker's only commit is e6985f8. useFileImport.jsx:83 routes
  JSON/ICS/Markdown files over 50KB to the worker, so the drift is reachable.
  Not a trap: it is one parser per format copied from a shared origin, not
  separate contexts. No comment documents the divergence."
```

## PH-210 api/parse.js looseEventSchema copy missed the semantic ISO date validation added to the client schema

```yaml
id: PH-210
category: code
title: api/parse.js looseEventSchema copy missed the semantic ISO date
  validation added to the client schema
severity: major
traffic: 0.27051323455460075
confidence: confirmed
evidence:
  - api/parse.js:4
  - api/parse.js:9
  - api/parse.js:10
  - src/schemas/event.js:52
  - src/schemas/event.js:53
  - src/components/timeline/InlineImportPanel.jsx:413
  - commit 8104913 both looseEventSchema copies introduced together
  - "commit 7692302 Fix 4 data bugs: Date validation via parseISO+isValid
    (src/schemas/event.js only)"
source:
  - detect-code
repair_cost: M
fingerprint: code:api:diverged-twin-api-loose-event-schema
kind: duplication
repair: Port the YYYY(-MM(-DD)) regex plus calendar check into a local
  isValidISODate in api/parse.js and apply it to dateStart/dateEnd, or have
  InlineImportPanel run parseLooseEvents on the /api/parse response before
  review.
verdict_reason: "All four routes fail. evidence: api/parse.js:9-10 pass any
  string for dateStart/dateEnd. src/schemas/event.js:52-53 gate them on
  isValidISODate, added by 7692302 to the client side only. normalizeEvents
  (api/parse.js:184) adds no other check. InlineImportPanel.jsx:413 then passes
  data.events straight to the review overlay and commit with no client re-parse;
  parseLooseEvents is used only by SharedViewPage. documented does not refute
  it: CLAUDE.md requires api/ to keep a local copy and records that the copy
  skips recurrence/attachments. It says nothing about date validation, and the
  finding is about drift and its cost, not that the copy exists."
```

## PH-610 eslint-plugin-react-compiler duplicates the React Compiler rules already in eslint-plugin-react-hooks 7

```yaml
id: PH-610
category: dependency
title: eslint-plugin-react-compiler duplicates the React Compiler rules already
  in eslint-plugin-react-hooks 7
severity: minor
traffic: 1
confidence: confirmed
evidence:
  - package.json:79
  - package.json:80
  - eslint.config.js:6
  - eslint.config.js:29
  - eslint.config.js:31
  - src/test/reactCompiler.test.js:16
source:
  - detect-dependency
repair_cost: S
fingerprint: dependency:eslint.config.js:duplicate-react-compiler-lint-plugins
verdict_reason: "Checked: eslint.config.js:6/24/31 loads standalone
  eslint-plugin-react-compiler (lockfile 19.1.0-rc.2) while :29 spreads
  reactHooks.configs.recommended from eslint-plugin-react-hooks 7.1.1, whose
  lockfile deps (@babel/core, hermes-parser, zod) are the embedded compiler and
  whose recommended set includes the compiler rules; reactCompiler.test.js:16
  filters only react-compiler/react-compiler. CLAUDE.md documents the plugin but
  not why both are needed — documented route does not refute the duplication
  cost."
```

## PH-611 @radix-ui/react-dialog is declared but never imported

```yaml
id: PH-611
category: dependency
title: "@radix-ui/react-dialog is declared but never imported"
severity: cosmetic
traffic: 1
confidence: confirmed
evidence:
  - package.json:28
  - src/components/shared/AnimatedModal.jsx:4
source:
  - detect-dependency
repair_cost: S
fingerprint: dependency:package.json:unused-radix-dialog
verdict_reason: "Checked: grep of src/, api/, scripts/ finds no
  @radix-ui/react-dialog import; src/components/ui has no Dialog wrapper;
  AnimatedModal.jsx:4 uses vaul, and lockfile shows vaul depends on
  @radix-ui/react-dialog ^1.1.1, so the direct entry at package.json:28 is
  redundant. No survey migration or exclusion covers it."
```

## PH-612 @testing-library/dom sits in production dependencies though only tests use it

```yaml
id: PH-612
category: dependency
title: "@testing-library/dom sits in production dependencies though only tests use it"
severity: cosmetic
traffic: 1
confidence: confirmed
evidence:
  - package.json:38
  - package.json:73
  - src/components/__tests__/Badge.test.jsx:2
source:
  - detect-dependency
repair_cost: S
fingerprint: dependency:package.json:test-library-in-prod-deps
verdict_reason: "Checked: no direct import of @testing-library/dom in src/,
  api/, scripts/ or vite config; lockfile shows it is a peerDependency of
  @testing-library/react (devDependency, package.json:73) used only from
  __tests__ (e.g. Badge.test.jsx:2); listing it at package.json:38 under
  dependencies misstates what ships. Cosmetic as filed."
```

## PH-910 rateLimit.js documents an Upstash production path that was never implemented; daily AI budget is per warm instance

```yaml
id: PH-910
category: knowledge
title: rateLimit.js documents an Upstash production path that was never
  implemented; daily AI budget is per warm instance
severity: minor
traffic: 0.2043498187424466
confidence: confirmed
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
verdict_reason: "evidence resolves: api/rateLimit.js:5-6 tells operators to set
  UPSTASH_REDIS_REST_URL/TOKEN and install @upstash packages, but no file
  outside that comment mentions upstash and package.json declares neither;
  limiter is the module Map at :8 unconditionally; parse.js:25
  DAILY_BUDGET_MAX=100 is held per instance; comment added in 8b36ce6 and never
  followed up; line 4's 'resets on cold start' only partly documents the
  daily-scope gap; minor kept"
```

## PH-911 Cross-device sync conflict rule (whole-timeline last-writer-wins by client clock) has no recorded rationale

```yaml
id: PH-911
category: knowledge
title: Cross-device sync conflict rule (whole-timeline last-writer-wins by
  client clock) has no recorded rationale
severity: minor
traffic: 0.10694046755254454
confidence: confirmed
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
severity_was: major
verdict_reason: "evidence resolves (timelinesSlice.js:131 whole-timeline
  updatedAt string compare, :160 active-events replace; db.js:113/:136
  syncStartedAt delete guard) and no rationale for the conflict policy exists in
  CLAUDE.md, README, survey or code comments (grep for
  conflict/merge/last-writer finds none); lowered to minor per study-case Case
  4: cited fix commits f38dd45/0701b57/48e13f2 address timeline-switch
  persistence, loadInitialData error handling and undo — not this merge rule —
  and traffic is 0.11, so no evidence the cost has landed"
```

## PH-509 Supabase sync drops recurrence and attachments, and remote wins on reload

```yaml
id: PH-509
category: security
title: Supabase sync drops recurrence and attachments, and remote wins on reload
severity: major
traffic: 0.10694046755254454
confidence: confirmed
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
verdict_reason: "All refs resolve: mapEventToRow/mapRowToEvent (db.js:9-45) and
  the events table (migration:18-35) carry no recurrence/attachments while
  schemas/event.js:36-37 declares them; hydrateFromRemote
  (timelinesSlice.js:131,164) takes remote events when remote updated_at >=
  local, and upsertTimeline (db.js:75) stamps updated_at at sync time after
  persistActiveTimeline sets local updatedAt (timelinesSlice.js:43), so remote
  normally wins. No trap (schema-invariant Case 3 is in-category), no doc,
  reachable whenever Supabase is configured."
```

## PH-510 Reference schema cannot produce a working sync DB: events.location column missing

```yaml
id: PH-510
category: security
title: "Reference schema cannot produce a working sync DB: events.location
  column missing"
severity: minor
traffic: 0.08921192976283292
confidence: confirmed
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
verdict_reason: "db.js:24 writes and db.js:43 reads events.location (added by
  9b70984, which touched only db.js), but supabase-migration.sql:18-35 has no
  location column and it is the only SQL file tracked; a fresh project built
  from it would reject the upsert. Not the squashed-baseline trap: no documented
  starting point or ALTER note exists."
```

## PH-511 Device ID, the sole sync credential, is embedded in signed photo URLs shown to users

```yaml
id: PH-511
category: security
title: Device ID, the sole sync credential, is embedded in signed photo URLs
  shown to users
severity: minor
traffic: 0.082112476587939
confidence: confirmed
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
verdict_reason: storagePath is deviceId/filename (photoSync.js:20-21),
  createSignedUrl on it (photoSync.js:126) returns a URL containing that path,
  rendered via useResolvedPhotos (used by EventCard, EventDetailView,
  PhotoPreview, EditEventModal) when a photo is not local; supabase.js:30 and
  migration RLS (timelines/events/storage) authorize solely on x-device-id, so
  the leaked id grants full read/write/delete. No trap or documented acceptance
  found.
```

## PH-512 Rate limiter is per-instance memory, the only spend control on unauthenticated Claude endpoints

```yaml
id: PH-512
category: security
title: Rate limiter is per-instance memory, the only spend control on
  unauthenticated Claude endpoints
severity: minor
traffic: 0.2043498187424466
confidence: confirmed
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
verdict_reason: rateLimit.js:8 is a module-level Map, reset on cold start and
  per-instance; parse.js:25 and analyze.js:3-4 budgets are applied only through
  it (parse.js:207); no Upstash/Redis code or dependency exists anywhere despite
  the rateLimit.js:5-6 comment, and vercel.json has no firewall rule. The
  comment documents burst-only intent, which does not refute the spend-exposure
  claim.
```

## PH-513 CSP keeps script-src unsafe-inline for a single static prerender script

```yaml
id: PH-513
category: security
title: CSP keeps script-src unsafe-inline for a single static prerender script
severity: minor
traffic: 0.10421886379321653
confidence: confirmed
evidence:
  - vercel.json:51
  - scripts/prerender.mjs:47
source:
  - detect-security
repair_cost: S
fingerprint: security:vercel.json:csp-unsafe-inline-script
partial: true
verdict_reason: vercel.json:51 sets script-src 'self' 'unsafe-inline'; the only
  executable inline script is the fixed per-route removalScript
  (prerender.mjs:45-49) - index.html has only an ld+json block (not subject to
  script-src) and the module entry, and VitePWA uses default external
  registerSW. Hashable, so unsafe-inline is unnecessary; finding itself scopes
  it as defence in depth, matching minor.
```

## PH-409 Plural batchAddTags/batchRemoveTags are labelled back-compat aliases but are the only production API; the singular names have no app callers

```yaml
id: PH-409
category: signage
title: Plural batchAddTags/batchRemoveTags are labelled back-compat aliases but
  are the only production API; the singular names have no app callers
severity: major
traffic: 0.538977022897614
confidence: confirmed
evidence:
  - src/store/slices/eventsSlice.js:439
  - src/store/slices/eventsSlice.js:455
  - src/components/timeline/BatchActionBar.jsx:94
  - src/components/timeline/BatchActionBar.jsx:95
  - CLAUDE.md:211
source:
  - detect-signage
repair_cost: S
fingerprint: signage:src/store/slices:batch-tag-plural-alias-marked-backcompat-but-only-caller
verdict_reason: "All refs resolve: eventsSlice.js:439/455 mark the plurals as
  back-compat aliases and CLAUDE.md:211 repeats it, yet grep over src/api shows
  BatchActionBar.jsx:94-95 (used at :158/:163) is the only app caller and it
  uses the plurals; the singulars are called only in eventsSlice.test.js. No
  trap or documented intent explains the inversion."
```

## PH-410 CLAUDE.md names useCardClick as the card-click helper, but EventCard no longer uses it and click now opens the detail view instead of editing

```yaml
id: PH-410
category: signage
title: CLAUDE.md names useCardClick as the card-click helper, but EventCard no
  longer uses it and click now opens the detail view instead of editing
severity: major
traffic: 0.8257399982582982
confidence: confirmed
evidence:
  - CLAUDE.md:208
  - CLAUDE.md:218
  - src/hooks/useCardClick.js:21
  - src/components/timeline/EventCard.jsx:116
  - src/components/timeline/EventCard.jsx:155
source:
  - detect-signage
repair_cost: M
fingerprint: signage:src/hooks:use-card-click-documented-canonical-but-primary-card-diverged
verdict_reason: CLAUDE.md:208/218 send readers to useCardClick, whose click
  calls onEdit (useCardClick.js:21). EventCard.jsx:116 comment and :155 handler
  open the detail view instead and never import the hook. Only the six variant
  views use the helper, through useEventCard, and there click wires to
  setEditingEvent (TimelinePage.jsx:399). Nothing marks which behaviour is
  current.
```

## PH-411 groupByYear doc claims it is shared by selectors, but selectors use a separate getEventsByYear with different (sort-preserving) semantics

```yaml
id: PH-411
category: signage
title: groupByYear doc claims it is shared by selectors, but selectors use a
  separate getEventsByYear with different (sort-preserving) semantics
severity: minor
traffic: 0.31737583906559763
confidence: confirmed
evidence:
  - src/utils/dateUtils.js:197
  - src/utils/dateUtils.js:200
  - src/store/selectors.js:91
  - src/store/selectors.js:92
source:
  - detect-signage
repair_cost: S
fingerprint: signage:src/utils:group-by-year-doc-claims-shared-with-selectors
verdict_reason: dateUtils.js:197 says groupByYear is shared by selectors, but
  grep shows it is imported only by exportHelpers.js and exportText.js.
  selectors.js:91 has its own getEventsByYear, which keeps the caller's order
  and supports DATE_DESC, while groupByYear re-sorts ascending
  (dateUtils.js:200). A provable contradiction between the doc and the code.
```

## PH-412 README tells you to put ANTHROPIC_API_KEY in .env and run npm run dev, but the Vite dev server never serves api/, so AI parsing cannot work that way

```yaml
id: PH-412
category: signage
title: README tells you to put ANTHROPIC_API_KEY in .env and run npm run dev,
  but the Vite dev server never serves api/, so AI parsing cannot work that way
severity: major
traffic: 0.27051323455460075
confidence: confirmed
evidence:
  - README.md:54
  - README.md:56
  - README.md:59
  - README.md:65
  - README.md:149
  - src/components/timeline/InlineImportPanel.jsx:394
  - .env.example:1
source:
  - detect-signage
repair_cost: S
fingerprint: signage:README.md:readme-local-ai-parsing-setup-fails
verdict_reason: README.md:54/56/59/65 tell readers to set ANTHROPIC_API_KEY in
  .env and run npm run dev, which is plain vite (package.json). vite.config.js
  has no proxy, middleware or server config for /api, so fetch('/api/parse') at
  InlineImportPanel.jsx:394 cannot reach api/parse.js. .env.example has no
  ANTHROPIC_API_KEY, and neither README nor CLAUDE.md mentions vercel dev. A
  reader following the steps fails at a step (Case 3).
```

## PH-413 README project map puts Button in shared/ and lists html2canvas as an export dependency; Button lives in ui/ and html2canvas is not a dependency

```yaml
id: PH-413
category: signage
title: README project map puts Button in shared/ and lists html2canvas as an
  export dependency; Button lives in ui/ and html2canvas is not a dependency
severity: cosmetic
traffic: 0.11103525586894254
confidence: confirmed
evidence:
  - README.md:119
  - README.md:40
  - src/components/ui/Button.jsx:1
source:
  - detect-signage
repair_cost: S
fingerprint: signage:README.md:readme-structure-map-drift
verdict_reason: README.md:119 puts Button in shared/, but it lives at
  src/components/ui/Button.jsx and the README map leaves out ui/ entirely.
  README.md:40 lists html2canvas, but package.json and src never reference it.
  Cosmetic as filed.
```

## PH-414 dexieDb comment documents a 'Version 2' schema bump that the code never declares

```yaml
id: PH-414
category: signage
title: dexieDb comment documents a 'Version 2' schema bump that the code never
  declares
severity: cosmetic
traffic: 0.007958059796402633
confidence: confirmed
evidence:
  - src/lib/dexieDb.js:5
  - src/lib/dexieDb.js:8
source:
  - detect-signage
repair_cost: S
fingerprint: signage:src/lib:dexie-db-version-comment-contradicts-code
severity_was: minor
verdict_reason: "The contradiction is real: dexieDb.js:5 documents a Version 2,
  the only declaration is db.version(1) at :8, and git log -S shows no
  version(2) ever existed. The stated cost does not hold. Dexie multiplies
  declared versions by 10, so the on-disk IDB version is 10 (above the old
  raw-IDB versions from idbHelper.js before 43bf707), and any version a misled
  reader declared (2 or 3) would still open. The evidence supports only a
  misleading comment, not a migration hazard."
```

## PH-415 getEventColor docstring says untagged events fall back to blue; the fallback is neutral gray

```yaml
id: PH-415
category: signage
title: getEventColor docstring says untagged events fall back to blue; the
  fallback is neutral gray
severity: cosmetic
traffic: 0.5620266767429299
confidence: confirmed
evidence:
  - src/utils/constants.js:455
  - src/utils/constants.js:451
source:
  - detect-signage
repair_cost: S
fingerprint: signage:src/utils:get-event-color-fallback-doc-wrong-color
verdict_reason: "constants.js:455 says the fallback is a default blue.
  DEFAULT_EVENT_COLOR at :451 is #525252/#F5F5F5/#D4D4D4, which is neutral gray,
  and getEventColor returns it for untagged events. CLAUDE.md names this as the
  canonical color helper. Cosmetic as filed."
```

## PH-309 Module-scoped undo stacks patched around repeatedly instead of moved into per-timeline store state

```yaml
id: PH-309
category: swerve
title: Module-scoped undo stacks patched around repeatedly instead of moved into
  per-timeline store state
severity: major
traffic: 0.538977022897614
confidence: confirmed
evidence:
  - src/store/slices/eventsSlice.js:66
  - src/store/slices/eventsSlice.js:97
  - src/store/slices/eventsSlice.js:245
  - src/store/slices/eventsSlice.js:182
  - CLAUDE.md:245
  - "commit f38dd45 Fix 5 critical bugs: crash on import, data loss, broken
    undo, stale commits, overlay glitch"
  - commit 0dda7c7 UI enhancements, duplicate detection feedback, and
    commitEvents race fix
  - commit 0701b57 Fix data-loss and undo/redo correctness bugs
  - "commit d988672 Medium fixes: relative dates, dedup race, photo fetch churn,
    edit modal, API robustness"
  - commit 4965aab Fix delete-toast Undo reverting the wrong edit and decade
    dates east of UTC
source:
  - detect-swerve
repair_cost: M
fingerprint: swerve:src/store/slices:undo-history-module-scope-detours
verdict_reason: "Survived all routes. evidence: eventsSlice.js:66-71
  module-scoped stacks + historyByTimeline, :97 originTimeline bail-out, :182
  showUndoableToast calls bare get().undo(), :245 delete-only afterDelete check
  + restoreDeleted; CLAUDE.md:245 Known issues line. All 5 commits touch
  eventsSlice undo machinery (f38dd45 origin bail-out, 0dda7c7 FIFO queue,
  0701b57 timeline guard on delete undo, d988672 liveIds in append, 4965aab
  restoreDeleted). documented: CLAUDE.md records the module scope as 'safe in
  practice', which refutes 'unexplained' but not the cost claim; the guards
  still cover deletes only, and the six showUndoableToast callers (lines
  337-495) have neither the edit-in-window check nor the timeline-switch check.
  Not a trap: repeated patches, no exit condition. Caveat: the root cause is
  undo being stack-global rather than action-targeted, more than where the stack
  lives."
```

## PH-310 Timezone rollback handled by noon-shift and string-slice helpers patched one call site at a time

```yaml
id: PH-310
category: swerve
title: Timezone rollback handled by noon-shift and string-slice helpers patched
  one call site at a time
severity: major
traffic: 0.31737583906559763
confidence: confirmed
evidence:
  - src/utils/dateUtils.js:17
  - src/utils/dateUtils.js:28
  - src/utils/dateUtils.js:135
  - src/utils/dateUtils.js:328
  - commit b91c01f Fix date timezone bugs, add validation/DatePicker, clean up
    toolbar
  - commit cce41b9 Fix year-grouping bug for events with year-only dates
  - "commit d988672 Medium fixes: relative dates, dedup race, photo fetch churn,
    edit modal, API robustness"
  - "commit ac45f30 Cleanup: dead code, leak guards, and minor UX correctness"
  - commit 4965aab Fix delete-toast Undo reverting the wrong edit and decade
    dates east of UTC
source:
  - detect-swerve
repair_cost: L
fingerprint: swerve:src/utils/dateUtils.js:timezone-rollback-noon-shift-detours
verdict_reason: "Survived all routes. evidence: dateUtils.js:17-25 noon-shift
  with docstring claiming parseISO yields UTC midnight, :28-34 safeGetUTCYear
  string-slices despite its name, :135 comment says local midnight (the
  contradiction is real), :328 getRelativeDate moved onto the noon-shift.
  Commits b91c01f, cce41b9, d988672, ac45f30 (WelcomeBanner moved to
  safeGetUTCYear) and 4965aab (effectivePrecision) each move one caller onto the
  helpers after a timezone bug. documented: the CLAUDE.md:229 rule documents the
  detour and does not refute its cost. Not a trap: there is no upstream
  constraint and no exit. getDateRangeDuration (dateUtils.js:228) still uses UTC
  getters on parseISO local dates, which supports 'one call site at a time'."
```

## PH-809 Remote hydration merge (last-write-wins across local and Supabase timelines) has no test

```yaml
id: PH-809
category: test
title: Remote hydration merge (last-write-wins across local and Supabase
  timelines) has no test
severity: major
traffic: 0.10694046755254454
confidence: confirmed
evidence:
  - src/store/slices/timelinesSlice.js:103-177
  - 0701b57
  - src/store/__tests__/timelinesSlice.test.js:82-158
source:
  - detect-test
repair_cost: L
fingerprint: test:src/store/slices/timelinesSlice.js:untested-remote-hydration-merge
repair: Add timelinesSlice tests that call hydrateFromRemote with mocked
  fetchRemoteData covering newer-local, newer-remote, remote-only, local-only
  and empty-local-events cases, asserting the resulting timelines and events.
partial: true
verdict_reason: "Checked: hydrateFromRemote (timelinesSlice.js:103-177) does the
  updatedAt last-write-wins merge and the live-events replace; no test file
  references hydrateFromRemote (timelinesSlice.test.js covers loadTimeline,
  _hydrating guard, deleteTimeline only). 0701b57 fixed a data-loss bug in
  loadInitialData whose empty lists flowed through exactly this merge, so a bug
  has shipped through this path; major/L stands. No trap, no documented
  exemption, reached on every startup from App.jsx."
```

## PH-810 syncEvents remote delete sweep and loadInitialData partial-failure guard are untested; the data-loss fix landed without a regression test

```yaml
id: PH-810
category: test
title: syncEvents remote delete sweep and loadInitialData partial-failure guard
  are untested; the data-loss fix landed without a regression test
severity: major
traffic: 0.08921192976283292
confidence: confirmed
evidence:
  - src/lib/db.js:108-156
  - src/lib/db.js:194-215
  - 0701b57
source:
  - detect-test
repair_cost: M
fingerprint: test:src/lib/db.js:untested-remote-sync-reconciliation
repair: Add a db.js test with a mocked supabase client asserting that syncEvents
  deletes only pre-sync-start remote ids missing locally, and that
  loadInitialData returns null when the events query errors.
partial: true
verdict_reason: "Checked: syncEvents delete sweep (db.js:108-156) and the
  loadInitialData events-error null return (db.js:194-215) are as described; the
  only test touching ../db (dataService.test.js) mocks it wholesale, so db.js is
  never executed by a test. git show --stat 0701b57 confirms the guard landed
  with only eventsSlice.test.js changed. Shipped data-loss bug justifies major."
```

## PH-811 commitEvents queue test never enqueues: sequential calls leave the lock and drain path unexercised

```yaml
id: PH-811
category: test
title: "commitEvents queue test never enqueues: sequential calls leave the lock
  and drain path unexercised"
severity: major
traffic: 0.2543626862864197
confidence: confirmed
evidence:
  - src/store/__tests__/eventsSlice.test.js:108-119
  - src/store/slices/eventsSlice.js:90-126
  - 0dda7c7
source:
  - detect-test
repair_cost: S
fingerprint: test:src/store/__tests__/eventsSlice.test.js:commit-queue-test-never-contends
repair: Add a test whose transformer itself calls commitEvents (and one that
  switches activeTimelineId mid-queue), then assert ordering, the skipped stale
  commit, and the undo stack after the microtask drains.
partial: true
verdict_reason: "Checked: eventsSlice.test.js:108-119 makes two synchronous
  commitEvents calls; each finds isCommitting false and drains inline, so the
  queueMicrotask re-drain and the activeTimelineId skip
  (eventsSlice.js:97,107-110) never run, and no other test reaches them. The
  FIFO queue was introduced as a race fix in 0dda7c7 with no test change, so a
  bug has shipped from this code. Note: the test name says 'sequential' and is
  not itself false; the debt is the unexercised queue/skip branches."
```

## PH-812 Crash-surviving pending-delete queue and its startup flush have no test

```yaml
id: PH-812
category: test
title: Crash-surviving pending-delete queue and its startup flush have no test
severity: minor
traffic: 0.2543626862864197
confidence: confirmed
evidence:
  - src/store/slices/eventsSlice.js:23-64
source:
  - detect-test
repair_cost: S
fingerprint: test:src/store/slices/eventsSlice.js:untested-pending-delete-flush
repair: Add eventsSlice tests that seed timeliner_pending_deletes in
  localStorage, call flushPendingDeletes with a mock that resolves and one that
  rejects, and assert which deletes fire and what remains queued.
partial: true
verdict_reason: "Checked: updatePendingDeletes/add/remove/flushPendingDeletes
  (eventsSlice.js:23-64) exist as described; flushPendingDeletes runs at store
  init (useTimelineStore.js:148); no test references flushPendingDeletes, the
  pending-deletes key or localStorage in eventsSlice/timelinesSlice tests.
  minor/S appropriate."
```

## PH-813 Debounced Supabase sync retry and final error toast are untested

```yaml
id: PH-813
category: test
title: Debounced Supabase sync retry and final error toast are untested
severity: minor
traffic: 0.251418831310741
confidence: confirmed
evidence:
  - src/store/useTimelineStore.js:32-80
source:
  - detect-test
repair_cost: M
fingerprint: test:src/store/useTimelineStore.js:untested-sync-retry
repair: Extract syncWithRetry so it can be imported, then test it with fake
  timers and a failing syncEventsRemote mock, asserting the retry count, save
  status transitions and the Retry toast.
partial: true
verdict_reason: "Checked: syncWithRetry (useTimelineStore.js:37-73) is
  module-private with 3 retries, 2/4/8s backoff, saveStatus flips and the Retry
  toast; all three test files that touch the store vi.mock
  @/store/useTimelineStore wholesale, so the function never executes under test.
  Real, minor."
```

## PH-815 View smoke tests named for specific behaviour only assert that something rendered

```yaml
id: PH-815
category: test
title: View smoke tests named for specific behaviour only assert that something
  rendered
severity: minor
traffic: 0.026506220253271366
confidence: confirmed
evidence:
  - src/components/__tests__/views.smoke.test.jsx:100-104
  - src/components/__tests__/views.smoke.test.jsx:144-148
  - src/components/__tests__/views.smoke.test.jsx:204-208
source:
  - detect-test
repair_cost: S
fingerprint: test:src/components/__tests__/views.smoke.test.jsx:behaviour-named-smoke-tests-assert-nothing
repair: "Rename these to plain no-crash smoke tests, or assert what the name
  promises: compact-row markup for compact mode, month group headers for
  groupZoom month, the empty-state text for GraphView."
partial: true
verdict_reason: "Checked: views.smoke.test.jsx:100-104 ('renders in compact
  mode') and :144-148 ('renders grouped by month') assert only
  container.firstChild truthy, which passes if the prop is ignored. The third
  ref (:204-208, GraphView empty array) matches the 'Not this' trap of an
  explicit no-throw contract: it is named 'renders without crashing' with a
  comment saying no-crash is the intended assertion, so only two of three refs
  stand; minor still fits."
```

## PH-816 Six lazy view variants and both render caps are never exercised by any test

```yaml
id: PH-816
category: test
title: Six lazy view variants and both render caps are never exercised by any test
severity: minor
traffic: 0.19242993821823773
confidence: confirmed
evidence:
  - src/components/__tests__/views.smoke.test.jsx:78-82
  - src/components/timeline/GraphView.jsx:63-67
  - src/components/timeline/HorizontalFilmStrip.jsx:180-181
source:
  - detect-test
repair_cost: M
fingerprint: test:src/components/timeline:untested-view-variants-and-caps
repair: Extend views.smoke.test.jsx to render each Vertical and Horizontal
  variant, plus one fixture with more than HORIZONTAL_RENDER_CAP events and more
  than GRAPH_MAX_PEOPLE people, asserting the 'Showing first N' notice appears.
partial: true
verdict_reason: "Checked: no test file imports
  VerticalCinematic/Magazine/Narrative or HorizontalPanoramic/FilmStrip/Wave;
  the smoke fixture is three events (views.smoke.test.jsx:77-81) with two
  people, far below HORIZONTAL_RENDER_CAP=200 and GRAPH_MAX_PEOPLE=60
  (constants.js:86-87), so the caps at GraphView.jsx:63-67 and
  HorizontalFilmStrip.jsx:180-181 (and HorizontalView/Panoramic/Wave) never
  trigger in tests. Evidence ref 78-82 is off by one (array is 77-81) but
  resolves to the fixture. minor/M stands."
```

## PH-817 Import review-before-commit invariant in InlineImportPanel is untested

```yaml
id: PH-817
category: test
title: Import review-before-commit invariant in InlineImportPanel is untested
severity: minor
traffic: 0.27051323455460075
confidence: confirmed
evidence:
  - src/components/timeline/InlineImportPanel.jsx:425-460
source:
  - detect-test
repair_cost: M
fingerprint: test:src/components/timeline/InlineImportPanel.jsx:untested-import-review-gate
repair: Add a component test that mocks the /api/parse fetch, submits text,
  asserts appendEvents/setEvents are not called until the ReviewOverlay confirm
  button is clicked, and that only the included events are committed.
partial: true
verdict_reason: "Checked: InlineImportPanel.jsx:425-438 routes parsed events
  into review state ('instead of auto-committing') and handleReviewConfirm
  (:452-460) calls appendEvents or setEvents; no test file imports
  InlineImportPanel or ReviewOverlay. The CLAUDE.md never-auto-commit invariant
  and append-vs-replace choice are unguarded. minor/M stands."
```

## Refuted

Judged false positives, kept with their reasons **so the same false positive does not return** on the next run: the next Inspector reads these before judging, and overturning one needs a reason that answers the refutation.

## PH-1109 Rate-limit (429) contract differs per endpoint: parse/analyze send X-RateLimit headers and a retry hint, share/og do not

```yaml
id: PH-1109
category: api
title: "Rate-limit (429) contract differs per endpoint: parse/analyze send
  X-RateLimit headers and a retry hint, share/og do not"
severity: minor
traffic: 0.2509477199194409
confidence: refuted
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
refutation: "evidence: api/analyze.js:481 and api/analyze.js:486 do not resolve
  - analyze.js is 274 lines at a54960b (the X-RateLimit headers and 429 body are
  at analyze.js:233-238). The parse/share/og refs resolve; also note all four
  handlers already meet the declared CLAUDE.md contract (429 + Retry-After), and
  each endpoint has one same-owner consumer that reads neither header (study
  case 2 Not-this). Next scan may refile with correct refs."
```

## PH-1110 Service-not-configured failure maps to 500 in parse/analyze but 503 in share and a 302 fallback in og

```yaml
id: PH-1110
category: api
title: Service-not-configured failure maps to 500 in parse/analyze but 503 in
  share and a 302 fallback in og
severity: minor
traffic: 0.2509477199194409
confidence: refuted
evidence:
  - api/parse.js:218
  - api/analyze.js:490
  - api/share.js:224
  - api/og.js:252
source:
  - detect-api
repair_cost: S
fingerprint: api:api:missing-config-status-per-endpoint
refutation: "evidence: api/analyze.js:490 does not resolve - analyze.js is 274
  lines at a54960b (the missing-ANTHROPIC_API_KEY 500 is at analyze.js:241-242).
  parse.js:218 (500), share.js:224 (503) and og.js:252 (fallback) resolve and
  the parse-vs-share split is real, so the next scan may refile it with correct
  refs."
```

## PH-1009 .env.example omits ANTHROPIC_API_KEY, which gates AI parsing and insights

```yaml
id: PH-1009
category: build
title: .env.example omits ANTHROPIC_API_KEY, which gates AI parsing and insights
severity: minor
traffic: 0.2043498187424466
confidence: refuted
evidence:
  - api/parse.js:217
  - api/analyze.js:241
  - .env.example:1
source:
  - detect-build
repair_cost: S
fingerprint: build:.env.example:env-example-missing-anthropic-api-key
refutation: "unreachable: .env.example only feeds local `npm run dev` (copied to
  gitignored .env, .gitignore:16), and vite.config.js has no /api proxy and the
  Vercel CLI is not a dependency, so api/parse.js and api/analyze.js never read
  it; deploys are configured in Vercel per README.md:61-68 and :131, which name
  ANTHROPIC_API_KEY explicitly (and README.md:149 points at it on failure), so
  no deploy is configured from the sample and the claimed silent missing name
  does not occur."
```

## PH-1010 .env.example omits SUPABASE_SERVICE_ROLE_KEY, which gates server-side sharing and OG images

```yaml
id: PH-1010
category: build
title: .env.example omits SUPABASE_SERVICE_ROLE_KEY, which gates server-side
  sharing and OG images
severity: minor
traffic: 0.2509477199194409
confidence: refuted
evidence:
  - api/share.js:11
  - api/og.js:17
  - .env.example:2
source:
  - detect-build
repair_cost: S
fingerprint: build:.env.example:env-example-missing-supabase-service-role-key
refutation: "unreachable: same as PH-1009 — the sample env file is not an input
  to any environment where api/share.js or api/og.js run (no /api in vite dev,
  no Vercel CLI); the deploy-side instructions README.md:68 and :77 ('Set the
  env vars above') list SUPABASE_SERVICE_ROLE_KEY, and api/share.js:4-8
  documents the requirement inline."
```

## PH-1011 .env.example omits PUBLIC_BASE_URL, so sample-configured deploys derive share URLs from the Host header

```yaml
id: PH-1011
category: build
title: .env.example omits PUBLIC_BASE_URL, so sample-configured deploys derive
  share URLs from the Host header
severity: minor
traffic: 0.2509477199194409
confidence: refuted
evidence:
  - api/share.js:51
  - .env.example:1
source:
  - detect-build
repair_cost: S
fingerprint: build:.env.example:env-example-missing-public-base-url
refutation: "unreachable: .env.example never configures a deploy (api/ does not
  run locally; Vercel reads dashboard vars), so its omission cannot cause the
  Host-header fallback. The real gap is that README.md's env table (61-68) and
  deploy steps (125-131) omit PUBLIC_BASE_URL while only CLAUDE.md:178 says to
  set it — that is signage debt, and the Host-header trust in api/share.js:51-55
  is security's to judge; refile there next scan."
```

## PH-609 Documented @vercel/og 0.8.x constraint is not enforced and Dependabot already moved past it

```yaml
id: PH-609
category: dependency
title: Documented @vercel/og 0.8.x constraint is not enforced and Dependabot
  already moved past it
severity: minor
traffic: 1
confidence: refuted
evidence:
  - api/og.js:12
  - package.json:40
  - .github/dependabot.yml:12
  - api/__tests__/og.test.js:28
  - 5dd591a
source:
  - detect-dependency
repair_cost: M
fingerprint: dependency:api/og.js:vercel-og-constraint-unenforced
refutation: "evidence: api/og.js:12-13 names 1.0.x (not 'newer builds') as the
  version that throws on import; package.json:40 ^0.11.1 caret on 0.x caps at
  <0.12.0 and dependabot.yml:18-20 ignores semver-major, so the stated hazard IS
  enforced and 5dd591a (0.8.6->0.11.1) never crossed it. Residual is a stale
  '0.8.x' wording in og.js and CLAUDE.md — documentation drift, not dependency
  debt; refile there next scan."
```

## PH-909 Reference Supabase schema has no events.location column that the sync code writes on every upsert

```yaml
id: PH-909
category: knowledge
title: Reference Supabase schema has no events.location column that the sync
  code writes on every upsert
severity: major
traffic: 0.08921192976283292
confidence: refuted
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
refutation: "miscategorized: wrong category — this is signage debt because
  supabase-migration.sql is a runnable setup script (line 3: 'Run this in your
  Supabase SQL Editor', README setup step 2 points at it) and the cost claimed
  is a newcomer's fresh Supabase setup failing on every syncEvents upsert; the
  drift itself is real (events table lines 18-35 lack location while
  src/lib/db.js:24/:43 write/read it since 9b70984; schema touched 4 times
  after, not 5) — re-file under signage"
```

## PH-814 Fake timers are restored at the end of test bodies, so one failing assertion leaks fake timers into later tests

```yaml
id: PH-814
category: test
title: Fake timers are restored at the end of test bodies, so one failing
  assertion leaks fake timers into later tests
severity: minor
traffic: 0.10404379040542859
confidence: refuted
evidence:
  - src/store/__tests__/eventsSlice.test.js:174-186
  - src/store/__tests__/eventsSlice.test.js:190-203
  - src/store/__tests__/eventsSlice.test.js:207-226
  - src/store/__tests__/eventsSlice.test.js:230-242
source:
  - detect-test
repair_cost: S
fingerprint: test:src/store/__tests__/eventsSlice.test.js:fake-timers-not-restored-on-failure
kind: flaky
repair: Move vi.useRealTimers() into an afterEach in the deleteEvent describe
  block, as rateLimit.test.js already does with try/finally.
partial: true
refutation: "evidence: the pattern exists (eventsSlice.test.js:174-242 call
  useRealTimers last, not in afterEach/finally), but the claimed cost does not:
  each of the four tests calls vi.useFakeTimers itself, and every later test in
  the file (undo/redo, switchHistory, resetHistory, appendEvents, batch tags,
  mergeEvents, lines 248-547) is synchronous with no setTimeout/Date/await
  dependence, while Vitest isolates fake-timer state per file. A leaked fake
  clock changes no later test's outcome here, so no follow-on reds can bury a
  first failure. If a timer-dependent test is later added below the deleteEvent
  block, refile then."
```

## Not verified

No verdict was recorded for these. They are neither confirmed nor absent — an Inspector did not complete, or its category has no verdicts file. Do not read this section as "less important"; read it as "unmeasured".

_None._
