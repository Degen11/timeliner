# Findings: test

Detector: detect-test. Coverage: lcov did NOT run (no committed coverage/lcov.info), so no coverage percentage is claimed anywhere here; untested-behaviour findings rest on reading which source symbols no test file references. Assertion, skip, coupling and nondeterminism review is AI-only: no mutation testing, no flake detection, no run history. No .skip/.only/xit/xdescribe exists in any of the 26 test files and vite.config.js test block sets no retry. Not covered: per-component behaviour of the ~60 untested UI components beyond the hotspots sampled (TimelinePage, EventCard, InlineImportPanel, views). Out of category for code: flushPendingDeletes (src/store/slices/eventsSlice.js:57) removes the localStorage queue before any remote delete resolves, so a failed retry is logged and dropped and the event resurrects on next sync; syncWithRetry (src/store/useTimelineStore.js:38) snapshots events once before the retry loop, so a retry after 2-8s re-sends a stale event list. [coverage=partial]

## PH-809 Remote hydration merge (last-write-wins across local and Supabase timelines) has no test

```yaml
id: PH-809
category: test
title: Remote hydration merge (last-write-wins across local and Supabase
  timelines) has no test
severity: major
traffic: 0.10694046755254454
confidence: ai-suspected
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
```

hydrateFromRemote decides, per timeline, whether the local or remote copy wins by comparing updatedAt strings, and separately decides whether to replace the active timeline's live events. That is the code that overwrites user data on startup. timelinesSlice.test.js covers loadTimeline, the _hydrating persist guard and deleteTimeline only; no test file references hydrateFromRemote. Data-loss bugs have already shipped from this sync path (0701b57 'Fix data-loss and undo/redo correctness bugs', f38dd45), and the file is bus-factor-1, so changing the merge rule today means changing it without a net.

## PH-810 syncEvents remote delete sweep and loadInitialData partial-failure guard are untested; the data-loss fix landed without a regression test

```yaml
id: PH-810
category: test
title: syncEvents remote delete sweep and loadInitialData partial-failure guard
  are untested; the data-loss fix landed without a regression test
severity: major
traffic: 0.08921192976283292
confidence: ai-suspected
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
```

syncEvents deletes every remote event created before the sync started that is absent from the local list, the most destructive statement in the app, and loadInitialData returns null on an events-query error precisely so the hydration merge cannot overwrite local snapshots with empty lists. Commit 0701b57 added that guard to fix silent data loss, but its stat touches only eventsSlice.test.js; no test imports src/lib/db.js at all. A refactor that drops the guard or widens the delete filter passes the suite.

## PH-811 commitEvents queue test never enqueues: sequential calls leave the lock and drain path unexercised

```yaml
id: PH-811
category: test
title: "commitEvents queue test never enqueues: sequential calls leave the lock
  and drain path unexercised"
severity: major
traffic: 0.2543626862864197
confidence: ai-suspected
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
```

The test named 'processes two sequential commits and drains each independently' calls commitEvents twice synchronously. Each call finds isCommitting false and drains immediately, so the queued branch (queueMicrotask re-drain at eventsSlice.js:107-110) and the switched-timeline skip (line 97) never run. The race this lock exists for was fixed in 0dda7c7 with no test change, and CLAUDE.md's Known issues declares the module-scoped undo stacks safe because of this lock. The test name tells a reader that claim is covered when it is not.

## PH-812 Crash-surviving pending-delete queue and its startup flush have no test

```yaml
id: PH-812
category: test
title: Crash-surviving pending-delete queue and its startup flush have no test
severity: minor
traffic: 0.2543626862864197
confidence: ai-suspected
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
```

addPendingDeletes, removePendingDeletes and flushPendingDeletes persist deferred remote deletes to localStorage so a closed tab does not resurrect a deleted event. The deleteEvent tests mock removeEventRemote and advance timers, but none reads localStorage or calls flushPendingDeletes (not referenced in any test file). The failure-handling half of that path is where the code-category defect noted in this run lives, and no test would have shown it.

## PH-813 Debounced Supabase sync retry and final error toast are untested

```yaml
id: PH-813
category: test
title: Debounced Supabase sync retry and final error toast are untested
severity: minor
traffic: 0.251418831310741
confidence: ai-suspected
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
```

syncWithRetry runs up to four attempts with 2/4/8s backoff, flips saveStatus, and on exhaustion shows the 'Sync failed' toast whose Retry action re-enters debouncedSync. Every test that touches the store mocks useTimelineStore wholesale, and the function is module-private, so this only ever runs in production when the network is already failing.

## PH-814 Fake timers are restored at the end of test bodies, so one failing assertion leaks fake timers into later tests

```yaml
id: PH-814
category: test
title: Fake timers are restored at the end of test bodies, so one failing
  assertion leaks fake timers into later tests
severity: minor
traffic: 0.10404379040542859
confidence: ai-suspected
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
```

Four deleteEvent tests call vi.useFakeTimers() and only call vi.useRealTimers() as their last statement. If any expect before it throws, the remaining tests in the file run under fake timers, so queueMicrotask/setTimeout-dependent tests later in the file fail for reasons unrelated to their own code and the first real failure is buried under follow-on reds. api/__tests__/rateLimit.test.js:37-43 shows the safe try/finally pattern the repo already uses.

## PH-815 View smoke tests named for specific behaviour only assert that something rendered

```yaml
id: PH-815
category: test
title: View smoke tests named for specific behaviour only assert that something
  rendered
severity: minor
traffic: 0.026506220253271366
confidence: ai-suspected
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
```

'renders in compact mode' and 'renders grouped by month when groupZoom is month' assert only container.firstChild is truthy, which holds for any render, including one that ignores the prop. The GraphView empty-array test has no assertion at all. The names tell a reader compact mode and month grouping are tested, so nobody writes those tests.

## PH-816 Six lazy view variants and both render caps are never exercised by any test

```yaml
id: PH-816
category: test
title: Six lazy view variants and both render caps are never exercised by any test
severity: minor
traffic: 0.19242993821823773
confidence: ai-suspected
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
```

The smoke suite renders only the five primary views with a three-event fixture; VerticalCinematic, VerticalMagazine, VerticalNarrative, HorizontalPanoramic, HorizontalFilmStrip and HorizontalWave are imported by no test. CLAUDE.md says to keep the HORIZONTAL_RENDER_CAP and GRAPH_MAX_PEOPLE caps when touching these views, but no fixture comes near either cap, so removing a cap stays green.

## PH-817 Import review-before-commit invariant in InlineImportPanel is untested

```yaml
id: PH-817
category: test
title: Import review-before-commit invariant in InlineImportPanel is untested
severity: minor
traffic: 0.27051323455460075
confidence: ai-suspected
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
```

CLAUDE.md makes 'never auto-commit parsed events' a rule, and the panel enforces it by routing parsed events into ReviewOverlay and only calling appendEvents or setEvents (which replaces the whole timeline) in handleReviewConfirm. No test imports InlineImportPanel, so a change that commits on parse, or confirms into setEvents when the user chose append, would ship green.
