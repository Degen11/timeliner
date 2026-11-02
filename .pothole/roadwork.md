# Roadwork: timeliner

## What this is scored from

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

**Every RQI below is an upper bound on quality, not a score** — at least one finding came from a partial detector run, so its slice is a floor rather than a total; 2 category/ies were only partly measured (security, test), so their slices are floors rather than totals; deterministic tools were skipped, so the slices they own are unmeasured. Unmeasured debt cannot lower an RQI, so a good number here means "nothing worse was found", never "nothing worse is there".

Scored: 32 confirmed · excluded: 8 refuted, 0 unverified. Refuted and unverified findings are **not** work and appear in no zone below; the unverified ones are not absent either — they were never judged.

Model (`lib/scoring.mjs`): interest = severity weight × traffic × amplifier, priority = interest ÷ repair cost, RQI = 100 × exp(−interest ÷ files). Severity weights {"cosmetic":0.1,"minor":0.3,"major":0.7,"structural":1}; cost weights {"S":1,"M":3,"L":8,"XL":20}; a confirmed swerve or signage finding amplifies its module's other findings ×1.5, once, never compounded.

## Scoreboard

Repo total: **32 confirmed finding(s), 5.3559 interest** across 8 module(s) and 181 file(s) in the traffic model.

_No repo-wide RQI is reported. Density across a whole repo is dominated by its clean files — every real repo lands at 95-100 whatever it carries — so the number could not move and would read as a clean bill of health. RQI is meaningful per module, where the denominator is the module's own size._

| module | findings | interest | RQI | files |
|---|---|---:|---:|---:|
| src/store | 7 | 1.7869 | 84 | 10 |
| . _(unattributed: repo-root files and git-ref evidence — not a module)_ | 9 | 1.6365 | 87 | 12 |
| src/utils | 3 | 0.5604 | 97 | 16 |
| api | 3 | 0.312 | 94 | 5 |
| .github/workflows | 1 | 0.3 | 74 | 1 |
| src/components | 4 | 0.2942 | 100 | 87 |
| src/lib | 4 | 0.2437 | 97 | 9 |
| src/workers | 1 | 0.2222 | 80 | 1 |

_Ordered by accumulated interest — the burden — not by RQI. RQI is a density, so ranking on it puts the smallest directory on top: a two-file deploy directory with one finding outranks a seven-finding module carrying five times the interest. Anchors: one hot major finding per file ≈ 50, one hot structural per file ≈ 37._

## Work zones (repair in this order)

Findings are grouped by module, and across modules when git history says their files change together (coupling ≥ 0.5). Close the road once.

**Read the order with its bias in mind.** Zones rank by *summed priority*, and priority divides interest by repair cost, so this order favours many cheap repairs over one large one: eight hot cosmetic S findings outrank one hot major S, and because `XL` divides by 20 while `S` divides by 1, the largest structural work will always appear near the bottom however severe it is. That is the intended reading — cheap wins first — but it means **the interest column, not the position, is what says how much a zone actually costs the team.** Where the two disagree, the disagreement is the information.

### Zone 1: api + src/lib + src/store — priority 1.4626, cost L

Why together: coupled — src/lib/supabase.js ↔ src/store/useTimelineStore.js (co 4, strength 1.00); src/lib/db.js ↔ src/lib/supabase.js (co 3, strength 0.75); api/rateLimit.js ↔ src/store/slices/eventsSlice.js (co 3, strength 0.50); api/rateLimit.js ↔ src/store/slices/timelinesSlice.js (co 3, strength 0.50).

| id | category | severity | traffic | interest | priority | cost | title |
|---|---|---|---:|---:|---:|---|---|
| PH-409 | signage | major ×amp | 0.54 | 0.5659 | 0.5659 | S | Plural batchAddTags/batchRemoveTags are labelled back-compat aliases but are the only production API; the singular names have no app callers |
| PH-811 | test | major ×amp | 0.25 | 0.2671 | 0.2671 | S | commitEvents queue test never enqueues: sequential calls leave the lock and drain path unexercised |
| PH-309 | swerve | major ×amp | 0.54 | 0.5659 | 0.1886 | M | Module-scoped undo stacks patched around repeatedly instead of moved into per-timeline store state |
| PH-812 | test | minor ×amp | 0.25 | 0.1145 | 0.1145 | S | Crash-surviving pending-delete queue and its startup flush have no test |
| PH-210 | code | major | 0.27 | 0.1894 | 0.0631 | M | api/parse.js looseEventSchema copy missed the semantic ISO date validation added to the client schema |
| PH-910 | knowledge | minor | 0.20 | 0.0613 | 0.0613 | S | rateLimit.js documents an Upstash production path that was never implemented; daily AI budget is per warm instance |
| PH-911 | knowledge | minor ×amp | 0.11 | 0.0481 | 0.0481 | S | Cross-device sync conflict rule (whole-timeline last-writer-wins by client clock) has no recorded rationale |
| PH-813 | test | minor ×amp | 0.25 | 0.1131 | 0.0377 | M | Debounced Supabase sync retry and final error toast are untested |
| PH-509 | security | major ×amp | 0.11 | 0.1123 | 0.0374 | M | Supabase sync drops recurrence and attachments, and remote wins on reload |
| PH-810 | test | major ×amp | 0.09 | 0.0937 | 0.0312 | M | syncEvents remote delete sweep and loadInitialData partial-failure guard are untested; the data-loss fix landed without a regression test |
| PH-512 | security | minor | 0.20 | 0.0613 | 0.0204 | M | Rate limiter is per-instance memory, the only spend control on unauthenticated Claude endpoints |
| PH-809 | test | major ×amp | 0.11 | 0.1123 | 0.014 | L | Remote hydration merge (last-write-wins across local and Supabase timelines) has no test |
| PH-511 | security | minor ×amp | 0.08 | 0.037 | 0.0123 | M | Device ID, the sole sync credential, is embedded in signed photo URLs shown to users |
| PH-414 | signage | cosmetic | 0.01 | 0.0008 | 0.0008 | S | dexieDb comment documents a 'Version 2' schema bump that the code never declares |

Files this zone opens:
- 0701b57
- 0dda7c7
- 8b36ce6
- CLAUDE.md:211
- CLAUDE.md:245
- api/analyze.js:4
- api/parse.js:10
- api/parse.js:207
- api/parse.js:25
- api/parse.js:4
- api/parse.js:9
- api/rateLimit.js:4
- api/rateLimit.js:5
- api/rateLimit.js:8
- commit 0701b57 Fix data-loss and undo/redo correctness bugs
- commit 0dda7c7 UI enhancements, duplicate detection feedback, and commitEvents race fix
- commit 4965aab Fix delete-toast Undo reverting the wrong edit and decade dates east of UTC
- commit 7692302 Fix 4 data bugs: Date validation via parseISO+isValid (src/schemas/event.js only)
- commit 8104913 both looseEventSchema copies introduced together
- commit d988672 Medium fixes: relative dates, dedup race, photo fetch churn, edit modal, API robustness
- commit f38dd45 Fix 5 critical bugs: crash on import, data loss, broken undo, stale commits, overlay glitch
- f38dd45
- src/components/timeline/BatchActionBar.jsx:94
- src/components/timeline/BatchActionBar.jsx:95
- src/components/timeline/InlineImportPanel.jsx:413
- src/hooks/useResolvedPhotos.js:26
- src/lib/db.js:108-156
- src/lib/db.js:113
- src/lib/db.js:136
- src/lib/db.js:194-215
- src/lib/db.js:29
- src/lib/db.js:9
- src/lib/dexieDb.js:5
- src/lib/dexieDb.js:8
- src/lib/photoSync.js:126
- src/lib/photoSync.js:20
- src/lib/supabase.js:30
- src/schemas/event.js:36
- src/schemas/event.js:52
- src/schemas/event.js:53
- src/store/__tests__/eventsSlice.test.js:108-119
- src/store/__tests__/timelinesSlice.test.js:82-158
- src/store/slices/eventsSlice.js:182
- src/store/slices/eventsSlice.js:23-64
- src/store/slices/eventsSlice.js:245
- src/store/slices/eventsSlice.js:439
- src/store/slices/eventsSlice.js:455
- src/store/slices/eventsSlice.js:66
- src/store/slices/eventsSlice.js:90-126
- src/store/slices/eventsSlice.js:97
- src/store/slices/timelinesSlice.js:103-177
- src/store/slices/timelinesSlice.js:131
- src/store/slices/timelinesSlice.js:160
- src/store/slices/timelinesSlice.js:164
- src/store/useTimelineStore.js:32-80
- supabase-migration.sql:18
- supabase-migration.sql:52

### Zone 2: . — priority 0.3, cost S

Why together: same module.

| id | category | severity | traffic | interest | priority | cost | title |
|---|---|---|---:|---:|---:|---|---|
| PH-1012 | build | minor | 1.00 | 0.3 | 0.3 | S | package.json engines declares node >=18 but the locked toolchain requires Node 20.19+/22.12+ |

Files this zone opens:
- .github/workflows/ci.yml:21
- package-lock.json:10858
- package-lock.json:8137
- package.json:8

### Zone 3: . — priority 0.3, cost S

Why together: same module.

| id | category | severity | traffic | interest | priority | cost | title |
|---|---|---|---:|---:|---:|---|---|
| PH-610 | dependency | minor | 1.00 | 0.3 | 0.3 | S | eslint-plugin-react-compiler duplicates the React Compiler rules already in eslint-plugin-react-hooks 7 |

Files this zone opens:
- eslint.config.js:29
- eslint.config.js:31
- eslint.config.js:6
- package.json:79
- package.json:80
- src/test/reactCompiler.test.js:16

### Zone 4: .github/workflows — priority 0.3, cost S

Why together: same module.

| id | category | severity | traffic | interest | priority | cost | title |
|---|---|---|---:|---:|---:|---|---|
| PH-1013 | build | minor | 1.00 | 0.3 | 0.3 | S | CI never runs lint, yet Dependabot PRs auto-merge on that CI alone |

Files this zone opens:
- .github/workflows/ci.yml:27-31
- .github/workflows/ci.yml:33-52
- e00e916
- package.json:19

### Zone 5: src/utils — priority 0.2688, cost L

Why together: same module.

| id | category | severity | traffic | interest | priority | cost | title |
|---|---|---|---:|---:|---:|---|---|
| PH-411 | signage | minor ×amp | 0.32 | 0.1428 | 0.1428 | S | groupByYear doc claims it is shared by selectors, but selectors use a separate getEventsByYear with different (sort-preserving) semantics |
| PH-415 | signage | cosmetic ×amp | 0.56 | 0.0843 | 0.0843 | S | getEventColor docstring says untagged events fall back to blue; the fallback is neutral gray |
| PH-310 | swerve | major ×amp | 0.32 | 0.3332 | 0.0417 | L | Timezone rollback handled by noon-shift and string-slice helpers patched one call site at a time |

Files this zone opens:
- commit 4965aab Fix delete-toast Undo reverting the wrong edit and decade dates east of UTC
- commit ac45f30 Cleanup: dead code, leak guards, and minor UX correctness
- commit b91c01f Fix date timezone bugs, add validation/DatePicker, clean up toolbar
- commit cce41b9 Fix year-grouping bug for events with year-only dates
- commit d988672 Medium fixes: relative dates, dedup race, photo fetch churn, edit modal, API robustness
- src/store/selectors.js:91
- src/store/selectors.js:92
- src/utils/constants.js:451
- src/utils/constants.js:455
- src/utils/dateUtils.js:135
- src/utils/dateUtils.js:17
- src/utils/dateUtils.js:197
- src/utils/dateUtils.js:200
- src/utils/dateUtils.js:28
- src/utils/dateUtils.js:328

### Zone 6: . — priority 0.1927, cost M

Why together: same module.

| id | category | severity | traffic | interest | priority | cost | title |
|---|---|---|---:|---:|---:|---|---|
| PH-410 | signage | major | 0.83 | 0.578 | 0.1927 | M | CLAUDE.md names useCardClick as the card-click helper, but EventCard no longer uses it and click now opens the detail view instead of editing |

Files this zone opens:
- CLAUDE.md:208
- CLAUDE.md:218
- src/components/timeline/EventCard.jsx:116
- src/components/timeline/EventCard.jsx:155
- src/hooks/useCardClick.js:21

### Zone 7: . — priority 0.1894, cost S

Why together: same module.

| id | category | severity | traffic | interest | priority | cost | title |
|---|---|---|---:|---:|---:|---|---|
| PH-412 | signage | major | 0.27 | 0.1894 | 0.1894 | S | README tells you to put ANTHROPIC_API_KEY in .env and run npm run dev, but the Vite dev server never serves api/, so AI parsing cannot work that way |

Files this zone opens:
- .env.example:1
- README.md:149
- README.md:54
- README.md:56
- README.md:59
- README.md:65
- src/components/timeline/InlineImportPanel.jsx:394

### Zone 8: src/components — priority 0.1034, cost M

Why together: same module.

| id | category | severity | traffic | interest | priority | cost | title |
|---|---|---|---:|---:|---:|---|---|
| PH-709 | architecture | major | 0.21 | 0.1474 | 0.0491 | M | Shared-link page keeps its own view dispatcher that never received the per-view error boundary or skeleton fixes |
| PH-817 | test | minor | 0.27 | 0.0812 | 0.0271 | M | Import review-before-commit invariant in InlineImportPanel is untested |
| PH-816 | test | minor | 0.19 | 0.0577 | 0.0192 | M | Six lazy view variants and both render caps are never exercised by any test |
| PH-815 | test | minor | 0.03 | 0.008 | 0.008 | S | View smoke tests named for specific behaviour only assert that something rendered |

Files this zone opens:
- 98d208a
- src/components/__tests__/views.smoke.test.jsx:100-104
- src/components/__tests__/views.smoke.test.jsx:144-148
- src/components/__tests__/views.smoke.test.jsx:204-208
- src/components/__tests__/views.smoke.test.jsx:78-82
- src/components/shared/SharedViewPage.jsx:221
- src/components/timeline/GraphView.jsx:63-67
- src/components/timeline/HorizontalFilmStrip.jsx:180-181
- src/components/timeline/InlineImportPanel.jsx:425-460
- src/components/timeline/TimelineViewRenderer.jsx:163
- src/components/timeline/TimelineViewRenderer.jsx:18

### Zone 9: . — priority 0.1, cost S

Why together: same module.

| id | category | severity | traffic | interest | priority | cost | title |
|---|---|---|---:|---:|---:|---|---|
| PH-611 | dependency | cosmetic | 1.00 | 0.1 | 0.1 | S | @radix-ui/react-dialog is declared but never imported |

Files this zone opens:
- package.json:28
- src/components/shared/AnimatedModal.jsx:4

### Zone 10: . — priority 0.1, cost S

Why together: same module.

| id | category | severity | traffic | interest | priority | cost | title |
|---|---|---|---:|---:|---:|---|---|
| PH-612 | dependency | cosmetic | 1.00 | 0.1 | 0.1 | S | @testing-library/dom sits in production dependencies though only tests use it |

Files this zone opens:
- package.json:38
- package.json:73
- src/components/__tests__/Badge.test.jsx:2

### Zone 11: src/workers — priority 0.0741, cost M

Why together: same module.

| id | category | severity | traffic | interest | priority | cost | title |
|---|---|---|---:|---:|---:|---|---|
| PH-209 | code | major | 0.32 | 0.2222 | 0.0741 | M | Import web worker is a stale copy of importHelpers that missed the date-validation and ICS fixes |

Files this zone opens:
- commit 3f3f102 Fix import/print reliability: ICS line unfolding, all-day DTEND shift, markdown global date strip (importHelpers only)
- commit e6985f8 worker created as a copy of the import parsers (its only commit)
- src/hooks/useFileImport.jsx:83
- src/utils/dateUtils.js:55
- src/utils/importHelpers.js:108
- src/utils/importHelpers.js:136
- src/utils/importHelpers.js:238
- src/workers/importWorker.js:150
- src/workers/importWorker.js:177
- src/workers/importWorker.js:222
- src/workers/importWorker.js:25
- src/workers/importWorker.js:29

### Zone 12: . — priority 0.0313, cost S

Why together: same module.

| id | category | severity | traffic | interest | priority | cost | title |
|---|---|---|---:|---:|---:|---|---|
| PH-513 | security | minor | 0.10 | 0.0313 | 0.0313 | S | CSP keeps script-src unsafe-inline for a single static prerender script |

Files this zone opens:
- scripts/prerender.mjs:47
- vercel.json:51

### Zone 13: . — priority 0.0268, cost S

Why together: same module.

| id | category | severity | traffic | interest | priority | cost | title |
|---|---|---|---:|---:|---:|---|---|
| PH-510 | security | minor | 0.09 | 0.0268 | 0.0268 | S | Reference schema cannot produce a working sync DB: events.location column missing |

Files this zone opens:
- 9b70984
- src/lib/db.js:24
- src/lib/db.js:43
- supabase-migration.sql:18

### Zone 14: . — priority 0.0111, cost S

Why together: same module.

| id | category | severity | traffic | interest | priority | cost | title |
|---|---|---|---:|---:|---:|---|---|
| PH-413 | signage | cosmetic | 0.11 | 0.0111 | 0.0111 | S | README project map puts Button in shared/ and lists html2canvas as an export dependency; Button lives in ui/ and html2canvas is not a dependency |

Files this zone opens:
- README.md:119
- README.md:40
- src/components/ui/Button.jsx:1

## Not scored

- **8 refuted** — judged false positives; kept in the register with their reasons so the same false positive does not return.
- **0 unverified** — never judged. Not absent, not confirmed. Re-run `/pothole:verify` for those categories before reading any number above as complete.
