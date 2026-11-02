# Findings: code

Detector: detect-code. Coverage: marker grep (zero TODO/FIXME/HACK/XXX in src, api, scripts), copy-admission grep, sibling twin comparison across api/ vs src/ and the import worker vs importHelpers with git history of both sides, flag/dead-branch grep (no feature flags exist), god-file check against the hotspot and coupling tables. Sonar server not configured and semgrep failed, so complexity is eslint-sonar and repowise only; repowise-health truncated at 60 of 201. Deliberately not restated: jscpd PH-096..099, PH-101/102 and PH-144..148 (the clone blocks behind both findings; these findings add the divergence and the missed fixes), and the TimelinePage/EventCard/InlineImportPanel complexity findings. TimelinePage was judged and not filed as a god file: one export, Shell coupling already broken out into useTimelineShell. Out-of-category observations: (1) bug, not debt: JSON import drops location in both copies (src/utils/importHelpers.js:57 normalizeJSONEvents and src/workers/importWorker.js:119 parseJSON never pass location), so a JSON export re-imported loses places. (2) api/analyze.js callClaude has no stop_reason=max_tokens handling at max_tokens 4096, while parse.js got truncation salvage in 5005a08; a truncated insights reply becomes a 502. Low risk at 3-15 insights, so not filed. (3) The worker csv case (src/workers/importWorker.js:246) is never sent: useFileImport routes CSV through Papa on the main thread and never calls parseInWorker for it. That is an unreachable branch with no flag, folded into the worker finding rather than filed separately. No test files were touched or judged. [coverage=full]

## PH-209 Import web worker is a stale copy of importHelpers that missed the date-validation and ICS fixes

```yaml
id: PH-209
category: code
title: Import web worker is a stale copy of importHelpers that missed the
  date-validation and ICS fixes
severity: major
traffic: 0.31737583906559763
confidence: ai-suspected
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
```

useFileImport sends any JSON, ICS or Markdown file over 50KB to the worker, which runs its own copies of the parsers. The worker was written once in e6985f8 and has never been touched since, while importHelpers kept getting fixes. Its isValidISODate still uses new Date(str), which accepts 2024-02-30 and 2023-02-29 (rolled over to March); the main-thread version was moved to semantic date-fns validation. 3f3f102 fixed ICS folded-line unfolding, the RFC 5545 exclusive all-day DTEND (off by one day), and stripping every date token from markdown headings, but only in importHelpers. The worker also skips RRULE recurrence and the eventSchema pass. So the same file imports differently depending on its size: a large calendar gets end dates one day late and truncated summaries, and a small one does not. jscpd reports the clone blocks (PH-144..148). What it cannot see is that the copies have drifted and that each import fix has to be made twice.

## PH-210 api/parse.js looseEventSchema copy missed the semantic ISO date validation added to the client schema

```yaml
id: PH-210
category: code
title: api/parse.js looseEventSchema copy missed the semantic ISO date
  validation added to the client schema
severity: major
traffic: 0.27051323455460075
confidence: ai-suspected
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
```

The two copies were born together in 8104913 and the next day 7692302 taught the client copy to drop dateStart/dateEnd values that are not real ISO dates (e.g. 2024-13-45). The api copy, which api/ is not allowed to import from src/, still accepts any string. The client takes data.events from /api/parse straight into the review overlay and then commitEvents without validating it again, so a model reply with a date like 'Spring 1946' or a bad calendar date goes into the store. Downstream code such as sorting, the year histogram and dedupe assumes those values are valid. jscpd reports the shared clone lines (PH-101/102) but not that the fix landed on one side only.
