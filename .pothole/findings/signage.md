# Findings: signage

Detector: detect-signage. Coverage: 4 simulated newcomer tasks (change card click behaviour across views; add a batch tag action; group events by year in a new view/export; run AI parsing locally from the README) plus a CLAUDE.md/README claim-by-claim check against code (routes, rewrites, constants, caps, shortcuts, storage keys, env vars, tests, hydration order) and a name/doc contradiction sweep of lib/, store/, utils/, hooks/. Most CLAUDE.md claims verified accurate. knip/ts-prune are not run in this phase, so dead-export coverage is AI-only. Single-leg dead export noted (not a finding): src/hooks/useClickOutside.js is documented but has zero importers and there is no hooks barrel; DatePicker, EventPhotoUploader, HorizontalView, HorizontalFilmStrip hand-roll the same mousedown-outside listener (code: diverged twins). Out of category: AnimatedModal.jsx:49, PhotoLightbox.jsx:55, EventPhotoUploader.jsx:72 use manual keydown listeners against the CLAUDE.md rule useHotkeys only (architecture: code violates a declared convention). eventsSlice mergeEvents (eventsSlice.js:404) deletes the merged source remotely at once, bypassing the 6s deferred-delete window that CLAUDE.md describes for deletes (code). semgrep failed and sonar was skipped; neither bounds this category. [coverage=full]

## PH-409 Plural batchAddTags/batchRemoveTags are labelled back-compat aliases but are the only production API; the singular names have no app callers

```yaml
id: PH-409
category: signage
title: Plural batchAddTags/batchRemoveTags are labelled back-compat aliases but
  are the only production API; the singular names have no app callers
severity: major
traffic: 0.538977022897614
confidence: ai-suspected
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
```

The slice comment says the plural methods are kept 'for backward compat in case any callers exist', and CLAUDE.md repeats that plural aliases exist for back-compat. In fact BatchActionBar, the only UI caller, uses batchAddTags/batchRemoveTags; the singular batchAddTag/batchRemoveTag are called only from tests. An agent tidying up 'back-compat aliases' would delete the methods the batch bar depends on, and the tests (which exercise the singular names) would still pass.

## PH-410 CLAUDE.md names useCardClick as the card-click helper, but EventCard no longer uses it and click now opens the detail view instead of editing

```yaml
id: PH-410
category: signage
title: CLAUDE.md names useCardClick as the card-click helper, but EventCard no
  longer uses it and click now opens the detail view instead of editing
severity: major
traffic: 0.8257399982582982
confidence: ai-suspected
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
```

CLAUDE.md says to reuse `useCardClick` for card click/double-click and that haptics are wired there. useCardClick makes a single click call onEdit, which opens the editor. EventCard, the card used by the primary views and described as the single event card across all views, does not use it. EventCard has its own handleCardClick, and its comment says a click opens the read-only detail view and editing goes through the pencil. Only the six lazy variant views (through useEventCard) still use the documented helper. A newcomer following the doc ships click-to-edit, which is the old behaviour. Nothing marks which behaviour is current.

## PH-411 groupByYear doc claims it is shared by selectors, but selectors use a separate getEventsByYear with different (sort-preserving) semantics

```yaml
id: PH-411
category: signage
title: groupByYear doc claims it is shared by selectors, but selectors use a
  separate getEventsByYear with different (sort-preserving) semantics
severity: minor
traffic: 0.31737583906559763
confidence: ai-suspected
evidence:
  - src/utils/dateUtils.js:197
  - src/utils/dateUtils.js:200
  - src/store/selectors.js:91
  - src/store/selectors.js:92
source:
  - detect-signage
repair_cost: S
fingerprint: signage:src/utils:group-by-year-doc-claims-shared-with-selectors
```

dateUtils.groupByYear is documented as 'Shared by selectors and export helpers to avoid duplicate logic'. No selector imports it. selectors.js has its own getEventsByYear, which keeps the caller's sort order and supports DATE_DESC, while groupByYear always re-sorts ascending. dateUtils is the repo's top hotspot. A reader who trusts the comment and picks groupByYear for a view will quietly lose the user's descending sort.

## PH-412 README tells you to put ANTHROPIC_API_KEY in .env and run npm run dev, but the Vite dev server never serves api/, so AI parsing cannot work that way

```yaml
id: PH-412
category: signage
title: README tells you to put ANTHROPIC_API_KEY in .env and run npm run dev,
  but the Vite dev server never serves api/, so AI parsing cannot work that way
severity: major
traffic: 0.27051323455460075
confidence: ai-suspected
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
```

Getting Started says to copy .env.example to .env, add your keys, run `npm run dev`, and that AI parsing requires keys. The env table says ANTHROPIC_API_KEY can be set 'in Vercel or `.env`'. But `npm run dev` is plain `vite`, and vite.config.js has no proxy or middleware for /api, so the client's fetch('/api/parse') never reaches api/parse.js locally. .env.example also omits ANTHROPIC_API_KEY. A newcomer who follows the steps gets a failing import, and the Troubleshooting entry ('check ANTHROPIC_API_KEY is set') points them the wrong way. Running the API locally needs `vercel dev` or deploying, and the README mentions neither.

## PH-413 README project map puts Button in shared/ and lists html2canvas as an export dependency; Button lives in ui/ and html2canvas is not a dependency

```yaml
id: PH-413
category: signage
title: README project map puts Button in shared/ and lists html2canvas as an
  export dependency; Button lives in ui/ and html2canvas is not a dependency
severity: cosmetic
traffic: 0.11103525586894254
confidence: ai-suspected
evidence:
  - README.md:119
  - README.md:40
  - src/components/ui/Button.jsx:1
source:
  - detect-signage
repair_cost: S
fingerprint: signage:README.md:readme-structure-map-drift
```

The README structure lists `shared/  # AnimatedModal, Button, ...` and leaves out the ui/ directory, where Button and the other Radix wrappers actually live (CLAUDE.md says to use them). The tech-stack table lists html2canvas for export, but package.json does not depend on it and nothing in src imports it. A reader using the README map to find primitives looks in the wrong folder.

## PH-414 dexieDb comment documents a 'Version 2' schema bump that the code never declares

```yaml
id: PH-414
category: signage
title: dexieDb comment documents a 'Version 2' schema bump that the code never
  declares
severity: minor
traffic: 0.007958059796402633
confidence: ai-suspected
evidence:
  - src/lib/dexieDb.js:5
  - src/lib/dexieDb.js:8
source:
  - detect-signage
repair_cost: S
fingerprint: signage:src/lib:dexie-db-version-comment-contradicts-code
```

The header says 'Version 2: no schema change, just bumped to match old photo DB version', but the only declaration is db.version(1). Git history has never had a version(2). Anyone adding a Dexie migration will misjudge which version existing user databases are on. That matters because Dexie refuses to open a database at a lower version than the one on disk.

## PH-415 getEventColor docstring says untagged events fall back to blue; the fallback is neutral gray

```yaml
id: PH-415
category: signage
title: getEventColor docstring says untagged events fall back to blue; the
  fallback is neutral gray
severity: cosmetic
traffic: 0.5620266767429299
confidence: ai-suspected
evidence:
  - src/utils/constants.js:455
  - src/utils/constants.js:451
source:
  - detect-signage
repair_cost: S
fingerprint: signage:src/utils:get-event-color-fallback-doc-wrong-color
```

CLAUDE.md names getEventColor as the canonical color helper. Its doc says 'Falls back to a default blue if untagged', but DEFAULT_EVENT_COLOR is #525252/#F5F5F5/#D4D4D4 (gray).
