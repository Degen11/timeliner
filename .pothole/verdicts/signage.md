# Verdicts: signage

Inspector: inspect-signage. Coverage: every finding judged; all evidence refs opened and resolved. PH-414 history checked via git log -S and the pre-Dexie idbHelper.js at 43bf707^.

## PH-409 confirmed

```yaml
id: PH-409
verdict: confirmed
reason: "All refs resolve: eventsSlice.js:439/455 mark the plurals as
  back-compat aliases and CLAUDE.md:211 repeats it, yet grep over src/api shows
  BatchActionBar.jsx:94-95 (used at :158/:163) is the only app caller and it
  uses the plurals; the singulars are called only in eventsSlice.test.js. No
  trap or documented intent explains the inversion."
fingerprint: signage:src/store/slices:batch-tag-plural-alias-marked-backcompat-but-only-caller
```

## PH-410 confirmed

```yaml
id: PH-410
verdict: confirmed
reason: CLAUDE.md:208/218 send readers to useCardClick, whose click calls onEdit
  (useCardClick.js:21). EventCard.jsx:116 comment and :155 handler open the
  detail view instead and never import the hook. Only the six variant views use
  the helper, through useEventCard, and there click wires to setEditingEvent
  (TimelinePage.jsx:399). Nothing marks which behaviour is current.
fingerprint: signage:src/hooks:use-card-click-documented-canonical-but-primary-card-diverged
```

## PH-411 confirmed

```yaml
id: PH-411
verdict: confirmed
reason: dateUtils.js:197 says groupByYear is shared by selectors, but grep shows
  it is imported only by exportHelpers.js and exportText.js. selectors.js:91 has
  its own getEventsByYear, which keeps the caller's order and supports
  DATE_DESC, while groupByYear re-sorts ascending (dateUtils.js:200). A provable
  contradiction between the doc and the code.
fingerprint: signage:src/utils:group-by-year-doc-claims-shared-with-selectors
```

## PH-412 confirmed

```yaml
id: PH-412
verdict: confirmed
reason: README.md:54/56/59/65 tell readers to set ANTHROPIC_API_KEY in .env and
  run npm run dev, which is plain vite (package.json). vite.config.js has no
  proxy, middleware or server config for /api, so fetch('/api/parse') at
  InlineImportPanel.jsx:394 cannot reach api/parse.js. .env.example has no
  ANTHROPIC_API_KEY, and neither README nor CLAUDE.md mentions vercel dev. A
  reader following the steps fails at a step (Case 3).
fingerprint: signage:README.md:readme-local-ai-parsing-setup-fails
```

## PH-413 confirmed

```yaml
id: PH-413
verdict: confirmed
reason: README.md:119 puts Button in shared/, but it lives at
  src/components/ui/Button.jsx and the README map leaves out ui/ entirely.
  README.md:40 lists html2canvas, but package.json and src never reference it.
  Cosmetic as filed.
fingerprint: signage:README.md:readme-structure-map-drift
```

## PH-414 confirmed

```yaml
id: PH-414
verdict: confirmed
reason: "The contradiction is real: dexieDb.js:5 documents a Version 2, the only
  declaration is db.version(1) at :8, and git log -S shows no version(2) ever
  existed. The stated cost does not hold. Dexie multiplies declared versions by
  10, so the on-disk IDB version is 10 (above the old raw-IDB versions from
  idbHelper.js before 43bf707), and any version a misled reader declared (2 or
  3) would still open. The evidence supports only a misleading comment, not a
  migration hazard."
fingerprint: signage:src/lib:dexie-db-version-comment-contradicts-code
severity: cosmetic
severity_was: minor
```

## PH-415 confirmed

```yaml
id: PH-415
verdict: confirmed
reason: "constants.js:455 says the fallback is a default blue.
  DEFAULT_EVENT_COLOR at :451 is #525252/#F5F5F5/#D4D4D4, which is neutral gray,
  and getEventColor returns it for untagged events. CLAUDE.md names this as the
  canonical color helper. Cosmetic as filed."
fingerprint: signage:src/utils:get-event-color-fallback-doc-wrong-color
```
