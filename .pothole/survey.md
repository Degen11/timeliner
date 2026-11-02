# Road Survey: timeliner

**Date:** 2026-11-02 · **Commit:** a54960b · **Pothole version:** 0.2.0

## Stack

- **Languages/runtimes:** JavaScript (ES modules, JSX — no TypeScript), Node 22 for Vercel serverless functions in `api/`, CSS (Tailwind 4).
- **Package manager / build:** npm (`package-lock.json`); Vite 8 (Rolldown) + `@vitejs/plugin-react` + Babel React Compiler; `scripts/prerender.mjs` post-build prerender; vite-plugin-pwa; deployed on Vercel (`vercel.json` rewrites + CSP).
- **Test framework(s):** Vitest 4 (jsdom + @testing-library/react); API tests in `api/__tests__/` use the node environment. CI (`.github/workflows/ci.yml`) runs `npm test` and `npm run build` — not `npm run lint`.
- **Available adapters:** eslint-sonar (bundled), semgrep 1.183.0, jscpd 5.4.2, gitleaks 8, osv-scanner 2.7.0, madge 8.0.0, repowise 0.57.0, scc 3.7.0 (complexity source).
- **Tools not available (degraded slices):** lcov — no committed `coverage/lcov.info`, so the coverage half of the test slice is NOT MEASURED. SonarQube server not configured (bundled eslint-sonar covers the local case). knip / dependency-cruiser not installed (not adapters Pothole runs).

## Map (modules and responsibilities)

| Module | Responsibility | Traffic (peak file) | Notes |
|---|---|---|---|
| `src/components/timeline` | The timeline editor itself: page orchestrator, 11 view variants, event card, modals, import/insights/review UI | 0.92 (`TimelinePage.jsx`) | Hottest module. `EventCard`↔`TimelinePage` co-change 38× (0.50); `GridView`↔`VerticalView` 0.62; `EventCard`↔`HorizontalView` 0.56. Most hot files are bus-factor-1. |
| `src/components/layout` | App shell: header, sidebar (non-scrolling filter panel), footer, bottom tab bar, export modal | 0.66 (`Header.jsx`) | `Header`↔`TimelinePage` co-change 0.61. `Sidebar`, `Shell`, `Header` bus-factor-1. |
| `src/components/shared` | Reusable domain UI (date picker, form fields, people/location input, animated modal, badges) | 0.20 (`EventFormFields.jsx`) | `DatePicker.jsx` single author. |
| `src/components/ui` | Thin Radix wrappers (Button, Select, Popover, Tooltip, …) — declared to hold no business logic | low | |
| `src/components/filters`, `input`, `review` | Filter controls; photo/text input; flagged-date review panel | ≤0.19 | |
| `src/store` | Single Zustand store (4 slices), persistence/sync orchestration, pure selectors | 0.26 (`selectors.js`) | `eventsSlice` owns undo/redo + commit lock; module-scoped undo stacks are a declared known issue. |
| `src/lib` | Data layer: IndexedDB (Dexie), Supabase remote, photo blob storage/sync | 0.16 (`dataService.js`) | |
| `src/hooks` | Shared hooks (virtualizer, drag scroll, keyboard shortcuts, event form, file import) | 0.12 | |
| `src/utils` | Constants (enums, palette, motion, magic numbers), date parsing/formatting, import/export helpers, share encoding | 0.56 (`constants.js`) | `dateUtils.js` is the top hotspot by traffic×complexity (complexity 153). `importHelpers.js` worst repowise health (3.76). |
| `src/schemas`, `src/workers` | Zod event schemas; off-main-thread import worker | ≤0.08 | |
| `api` | Vercel serverless: AI parse/analyze (Claude), share links, OG images, rate limiting | 0.25 (`share.js`) | Must not import from `src/`; keeps local copies of constants/`escapeHtml`. |
| `scripts`, `public` | Prerender + OG image source; static assets, sitemap | ≤0.07 | |
| root config | `package.json`, `vite.config.js`, `vercel.json`, `eslint.config.js`, `CLAUDE.md` | 1.00 (`package.json`) | `package.json` traffic is dominated by Dependabot bumps. `CLAUDE.md` co-changes with `constants.js`/`selectors.js`/`ShortcutsModal.jsx`. |

## Intended architecture

- **Declared decisions (ADRs/docs):** No ADR directory. Declarations live in `CLAUDE.md` (Conventions / What to avoid), verbatim highlights:
  - "Pure JavaScript — no TypeScript, no JSDoc type annotations."
  - "The React Compiler handles memoization — never add manual `memo()`, `useCallback`, or `useMemo`."
  - "All magic numbers (durations, limits, thresholds) live in `constants.js` — but constants used only by `api/` stay local to `api/`."
  - "Individual Zustand selectors only … never destructure the store."
  - "All event mutations go through `commitEvents()` — never mutate the events array elsewhere."
  - "Don't modify `photoMap` directly — use `addToPhotoMap`, `deletePhoto`, etc."
  - "Use them [ui/ wrappers] instead of native controls: Radix `Select` (never `<select>`), Radix `Tooltip` + `aria-label` on icon-only buttons (never `title=` for tooltips)."
  - "Keyboard shortcuts via `useHotkeys` only (no manual keydown listeners)." New shortcuts go in both `useKeyboardShortcutsTimeline.js` and `ShortcutsModal.jsx`.
  - "Motion timing from `constants.js` … never hardcode spring configs."
  - "Timezone-safe date display: always `safeParseForDisplay()` … never `new Date(str + 'T12:00:00')`."
  - "Adding an external origin … Update the CSP in `vercel.json`."
  - API: "Distinct errors per failure mode: 400 validation, 429 rate limit (+`Retry-After`), 502 AI service/unparseable AI response, 500 unexpected."
  - "Tightening `looseEventSchema` — coercion of messy AI/import data is intentional" (do not flag as debt).
  - "The FAQPage JSON-LD in `index.html` must match `LANDING_FAQ` in `LandingContent.jsx`."
- **Layering rules:** `api/` must never import browser-side code from `src/` (CLAUDE.md "What to avoid"). `src/components/ui/` holds no business logic. Store slices receive `{ persist, sync }` helpers to avoid circular deps. Heavy views (MapView, GraphView, non-classic variants) load via `React.lazy()`.
- **Known migrations in flight:** localStorage → IndexedDB migration in `src/lib/dataService.js` (one-way, runs on hydrate; status: shipped, kept for legacy data). No other migrations declared.

## Exclusions

- `node_modules/`, `dist/`, `dev-dist/` — installed dependencies / build output.
- `.repowise/` — repowise index cache (added to `.gitignore` by this survey; never reviewed).
- `.pothole/` — Pothole's own output.
- `package-lock.json` — generated lockfile (dependency detector reads it for advisories only).
- `public/` binary assets (`og-image.png`, icons) and `api/_fonts/` — generated / vendored binaries.
- `supabase-migration.sql` — reference schema, declared not-auto-run (judge for drift only, not as code).

## Open questions for the gate

1. No ADRs exist; `CLAUDE.md` is treated as the declared architecture. Confirmed by default for this run (user asked for an unattended end-to-end run).
2. `coverage/lcov.info` is not committed, so hot-and-under-covered files cannot be measured — should the repo publish a coverage artifact? (Left open; test-coverage slice is NOT MEASURED this run.)
3. CI does not run `npm run lint`; is that deliberate? (Left for the build detector to judge.)
