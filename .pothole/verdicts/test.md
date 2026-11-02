# Verdicts: test

Inspector: inspect-test. Coverage: every finding judged; all evidence refs opened. No test run (Pothole never executes the suite); untested-behaviour claims verified by grepping all 26 test files for the named symbols and their vi.mock targets.

## PH-809 confirmed

```yaml
id: PH-809
verdict: confirmed
reason: "Checked: hydrateFromRemote (timelinesSlice.js:103-177) does the
  updatedAt last-write-wins merge and the live-events replace; no test file
  references hydrateFromRemote (timelinesSlice.test.js covers loadTimeline,
  _hydrating guard, deleteTimeline only). 0701b57 fixed a data-loss bug in
  loadInitialData whose empty lists flowed through exactly this merge, so a bug
  has shipped through this path; major/L stands. No trap, no documented
  exemption, reached on every startup from App.jsx."
fingerprint: test:src/store/slices/timelinesSlice.js:untested-remote-hydration-merge
```

## PH-810 confirmed

```yaml
id: PH-810
verdict: confirmed
reason: "Checked: syncEvents delete sweep (db.js:108-156) and the
  loadInitialData events-error null return (db.js:194-215) are as described; the
  only test touching ../db (dataService.test.js) mocks it wholesale, so db.js is
  never executed by a test. git show --stat 0701b57 confirms the guard landed
  with only eventsSlice.test.js changed. Shipped data-loss bug justifies major."
fingerprint: test:src/lib/db.js:untested-remote-sync-reconciliation
```

## PH-811 confirmed

```yaml
id: PH-811
verdict: confirmed
reason: "Checked: eventsSlice.test.js:108-119 makes two synchronous commitEvents
  calls; each finds isCommitting false and drains inline, so the queueMicrotask
  re-drain and the activeTimelineId skip (eventsSlice.js:97,107-110) never run,
  and no other test reaches them. The FIFO queue was introduced as a race fix in
  0dda7c7 with no test change, so a bug has shipped from this code. Note: the
  test name says 'sequential' and is not itself false; the debt is the
  unexercised queue/skip branches."
fingerprint: test:src/store/__tests__/eventsSlice.test.js:commit-queue-test-never-contends
```

## PH-812 confirmed

```yaml
id: PH-812
verdict: confirmed
reason: "Checked: updatePendingDeletes/add/remove/flushPendingDeletes
  (eventsSlice.js:23-64) exist as described; flushPendingDeletes runs at store
  init (useTimelineStore.js:148); no test references flushPendingDeletes, the
  pending-deletes key or localStorage in eventsSlice/timelinesSlice tests.
  minor/S appropriate."
fingerprint: test:src/store/slices/eventsSlice.js:untested-pending-delete-flush
```

## PH-813 confirmed

```yaml
id: PH-813
verdict: confirmed
reason: "Checked: syncWithRetry (useTimelineStore.js:37-73) is module-private
  with 3 retries, 2/4/8s backoff, saveStatus flips and the Retry toast; all
  three test files that touch the store vi.mock @/store/useTimelineStore
  wholesale, so the function never executes under test. Real, minor."
fingerprint: test:src/store/useTimelineStore.js:untested-sync-retry
```

## PH-814 refuted

```yaml
id: PH-814
verdict: refuted
reason: "evidence: the pattern exists (eventsSlice.test.js:174-242 call
  useRealTimers last, not in afterEach/finally), but the claimed cost does not:
  each of the four tests calls vi.useFakeTimers itself, and every later test in
  the file (undo/redo, switchHistory, resetHistory, appendEvents, batch tags,
  mergeEvents, lines 248-547) is synchronous with no setTimeout/Date/await
  dependence, while Vitest isolates fake-timer state per file. A leaked fake
  clock changes no later test's outcome here, so no follow-on reds can bury a
  first failure. If a timer-dependent test is later added below the deleteEvent
  block, refile then."
fingerprint: test:src/store/__tests__/eventsSlice.test.js:fake-timers-not-restored-on-failure
```

## PH-815 confirmed

```yaml
id: PH-815
verdict: confirmed
reason: "Checked: views.smoke.test.jsx:100-104 ('renders in compact mode') and
  :144-148 ('renders grouped by month') assert only container.firstChild truthy,
  which passes if the prop is ignored. The third ref (:204-208, GraphView empty
  array) matches the 'Not this' trap of an explicit no-throw contract: it is
  named 'renders without crashing' with a comment saying no-crash is the
  intended assertion, so only two of three refs stand; minor still fits."
fingerprint: test:src/components/__tests__/views.smoke.test.jsx:behaviour-named-smoke-tests-assert-nothing
```

## PH-816 confirmed

```yaml
id: PH-816
verdict: confirmed
reason: "Checked: no test file imports VerticalCinematic/Magazine/Narrative or
  HorizontalPanoramic/FilmStrip/Wave; the smoke fixture is three events
  (views.smoke.test.jsx:77-81) with two people, far below
  HORIZONTAL_RENDER_CAP=200 and GRAPH_MAX_PEOPLE=60 (constants.js:86-87), so the
  caps at GraphView.jsx:63-67 and HorizontalFilmStrip.jsx:180-181 (and
  HorizontalView/Panoramic/Wave) never trigger in tests. Evidence ref 78-82 is
  off by one (array is 77-81) but resolves to the fixture. minor/M stands."
fingerprint: test:src/components/timeline:untested-view-variants-and-caps
```

## PH-817 confirmed

```yaml
id: PH-817
verdict: confirmed
reason: "Checked: InlineImportPanel.jsx:425-438 routes parsed events into review
  state ('instead of auto-committing') and handleReviewConfirm (:452-460) calls
  appendEvents or setEvents; no test file imports InlineImportPanel or
  ReviewOverlay. The CLAUDE.md never-auto-commit invariant and append-vs-replace
  choice are unguarded. minor/M stands."
fingerprint: test:src/components/timeline/InlineImportPanel.jsx:untested-import-review-gate
```
