# Verdicts: swerve

Inspector: inspect-swerve. Coverage: every finding judged; all evidence refs and all 10 commits opened.

## PH-309 confirmed

```yaml
id: PH-309
verdict: confirmed
reason: "Survived all routes. evidence: eventsSlice.js:66-71 module-scoped
  stacks + historyByTimeline, :97 originTimeline bail-out, :182
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
fingerprint: swerve:src/store/slices:undo-history-module-scope-detours
```

## PH-310 confirmed

```yaml
id: PH-310
verdict: confirmed
reason: "Survived all routes. evidence: dateUtils.js:17-25 noon-shift with
  docstring claiming parseISO yields UTC midnight, :28-34 safeGetUTCYear
  string-slices despite its name, :135 comment says local midnight (the
  contradiction is real), :328 getRelativeDate moved onto the noon-shift.
  Commits b91c01f, cce41b9, d988672, ac45f30 (WelcomeBanner moved to
  safeGetUTCYear) and 4965aab (effectivePrecision) each move one caller onto the
  helpers after a timezone bug. documented: the CLAUDE.md:229 rule documents the
  detour and does not refute its cost. Not a trap: there is no upstream
  constraint and no exit. getDateRangeDuration (dateUtils.js:228) still uses UTC
  getters on parseISO local dates, which supports 'one call site at a time'."
fingerprint: swerve:src/utils/dateUtils.js:timezone-rollback-noon-shift-detours
```
