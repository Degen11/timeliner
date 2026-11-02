# Findings: swerve

Detector: detect-swerve. Coverage: full git log for 24 months (693 commits incl. merges) grepped for workaround/hack/temporary/revert/race/guard/UTC/timezone; folklore grep (DO NOT, fragile, careful, TODO/FIXME/HACK, eslint-disable) over src/ api/ scripts/; wrapper-chain and catch-and-swallow scan of src/lib and src/utils; flag scan (none exist). No folklore comments survived: eslint-disable lines all carry reasons, exportText.js split is documented bundle-size signage, api/parse.js JSON salvage is an external model constraint. Out of category: src/lib/dexieDb.js:4 comment claims a Version 2 that the code never declares (doc rot, code/knowledge). No architecture-level cycle or layer violation observed. [coverage=full]

## PH-309 Module-scoped undo stacks patched around repeatedly instead of moved into per-timeline store state

```yaml
id: PH-309
category: swerve
title: Module-scoped undo stacks patched around repeatedly instead of moved into
  per-timeline store state
severity: major
traffic: 0.538977022897614
confidence: ai-suspected
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
```

undoStack/redoStack live in module scope, and CLAUDE.md files this under Known issues as 'safe in practice'. Rather than fix that, five commits over seven months each added a guard around it: a historyByTimeline Map swapped in on switch, an originTimeline bail-out in drainQueue, a FIFO commit queue replacing a boolean lock, live-id re-filtering inside appendEvents, and a delete-toast Undo that checks whether events still match the post-delete array and otherwise restores events by hand (restoreDeleted). The last guard covers only deletes. showUndoableToast (duplicate, merge, batch tag, add person, date shift) still calls a bare undo(), so an edit that lands inside its toast window has the same wrong-edit-reverted bug that 4965aab fixed for deletes. Each new undoable action has to choose between the two paths.

## PH-310 Timezone rollback handled by noon-shift and string-slice helpers patched one call site at a time

```yaml
id: PH-310
category: swerve
title: Timezone rollback handled by noon-shift and string-slice helpers patched
  one call site at a time
severity: major
traffic: 0.31737583906559763
confidence: ai-suspected
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
```

Date-only strings (YYYY, YYYY-MM, YYYY-MM-DD) go through parseISO into local-midnight Date objects, and that keeps producing off-by-one days and years. The repo has not replaced this with a calendar-date representation. It routes around it instead: safeParseForDisplay adds 12 hours, and safeGetUTCYear/safeGetUTCMonth slice the string (despite their UTC names), with a CLAUDE.md rule telling contributors to use these. Five commits from February to September 2026 each moved one more caller onto the detour after a bug shipped: year grouping, relative dates, WelcomeBanner span, and decade precision east of UTC. The detour's own docstring at dateUtils.js:18 says parseISO yields UTC midnight, while the fix at :135 says local midnight. The comments disagree about the bug the helpers exist to avoid, so the next caller has no reliable guidance. dateUtils.js is the top hotspot (complexity 153).
