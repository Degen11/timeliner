# Verdicts: code

Inspector: inspect-code. Coverage: every finding judged. All evidence refs opened, both cited commits inspected with git show; no trap, documentation or reachability route applied.

## PH-209 confirmed

```yaml
id: PH-209
verdict: confirmed
reason: "All four routes fail. evidence: importWorker.js:25-33 validates with
  new Date(str), which in node/V8 accepts 2024-02-30 and 2023-02-29 (rolls to
  March), while dateUtils.js:55 uses safeParse. Worker parseICS (:150) has no
  line unfolding, all-day DTEND shift or RRULE, and parseMarkdown (:222) strips
  only the first date token, all fixed only in importHelpers.js (108/136/238) by
  3f3f102. The worker's only commit is e6985f8. useFileImport.jsx:83 routes
  JSON/ICS/Markdown files over 50KB to the worker, so the drift is reachable.
  Not a trap: it is one parser per format copied from a shared origin, not
  separate contexts. No comment documents the divergence."
fingerprint: code:src/workers:diverged-twin-import-worker-parsers
```

## PH-210 confirmed

```yaml
id: PH-210
verdict: confirmed
reason: "All four routes fail. evidence: api/parse.js:9-10 pass any string for
  dateStart/dateEnd. src/schemas/event.js:52-53 gate them on isValidISODate,
  added by 7692302 to the client side only. normalizeEvents (api/parse.js:184)
  adds no other check. InlineImportPanel.jsx:413 then passes data.events
  straight to the review overlay and commit with no client re-parse;
  parseLooseEvents is used only by SharedViewPage. documented does not refute
  it: CLAUDE.md requires api/ to keep a local copy and records that the copy
  skips recurrence/attachments. It says nothing about date validation, and the
  finding is about drift and its cost, not that the copy exists."
fingerprint: code:api:diverged-twin-api-loose-event-schema
```
