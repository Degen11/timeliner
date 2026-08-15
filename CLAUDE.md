# CLAUDE.md

## Project overview

Timeliner is a local-first, AI-powered timeline editor. Users paste unstructured text (a biography, journal, historical account) and Claude AI extracts structured events into an interactive visual timeline. Data lives in the browser (IndexedDB + localStorage) with optional Supabase cloud sync. Deployed as a Vercel SPA with serverless API endpoints.

## Tech stack

- **Core**: React 19 (pure JavaScript, no TypeScript), Vite 8 (Rolldown), Zustand 5 (single store, 4 slices), React Router 7, Tailwind CSS 4 (via `@tailwindcss/vite`, no PostCSS config)
- **UI**: Radix UI primitives, Framer Motion 12, lucide-react, sonner (toasts), vaul (mobile drawers), class-variance-authority + clsx + tailwind-merge (`cn()`), react-hotkeys-hook, nuqs (URL state)
- **Data**: Dexie 4 (IndexedDB), Supabase (optional sync), Zod 4, date-fns 4, lz-string (share URLs)
- **Views/export**: Leaflet + react-leaflet (lazy), @tanstack/react-virtual, jsPDF + PapaParse + file-saver
- **Tooling**: Vitest 4 (jsdom + @testing-library/react), ESLint 9 flat config (react-hooks, react-refresh, react-compiler), vite-plugin-pwa, @vercel/analytics

## Architecture

```
src/
├── main.jsx              # React root: StrictMode → BrowserRouter → App
├── App.jsx               # ErrorBoundary → MotionConfig → TooltipProvider → hydration → routes
├── index.css             # Tailwind v4 imports, CSS custom properties (design tokens), dark mode
├── components/
│   ├── layout/           # Shell, Header, Sidebar(+Content), Footer, BottomTabBar, ExportModal
│   ├── timeline/         # All timeline views, modals, toolbar, import/export, batch actions
│   ├── shared/           # Reusable domain UI: Badge, DatePicker, AnimatedModal, PeopleInput, ...
│   ├── ui/               # Radix wrappers: Button, Input, Select, Popover, Tooltip, DropdownMenu, ...
│   ├── input/            # PhotoUpload, TextInput
│   ├── filters/          # MultiSelect, SearchInput
│   └── review/           # FlaggedDate, InlineEditor, ReviewPanel
├── store/
│   ├── useTimelineStore.js   # Root Zustand store, persistence, sync
│   ├── selectors.js          # Pure filter/sort/group functions
│   └── slices/               # eventsSlice, photosSlice, uiSlice, timelinesSlice
├── lib/                  # Data layer: dataService (orchestrator), dataStore/dexieDb (IndexedDB),
│                         # photoStore/photoSync (photo blobs), supabase/db (remote), utils (cn)
├── hooks/                # useDragScroll, useGroupedVirtualizer, useScrollReveal, useCardClick,
│                         # useEventForm, useKeyboardShortcuts(Timeline), useConfirmAction, ...
├── utils/                # constants.js (enums, tag palette, timing/motion constants, shared utils),
│                         # dateUtils, exportHelpers (+ exportText: dep-free clipboard/print split off it),
│                         # importHelpers, dedupeHelpers, shareEncoder, haptics, modalStack
├── workers/importWorker.js  # off-main-thread file import (paired with hooks/useImportWorker)
└── schemas/event.js      # Zod event schemas (strict + loose)

api/                      # Vercel serverless functions
├── parse.js              # POST — Claude event+location extraction (claude-haiku-4-5-20251001,
│                         #        max_tokens 16384); salvages truncated JSON, returns { events, truncated }
├── analyze.js            # POST — timeline insights (same model)
├── share.js              # POST create / GET fetch + crawler OG HTML — share links via Supabase
└── rateLimit.js          # Shared IP-based rate limiting (burst/daily)
```

### Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | `TimelinePage` | Main editor |
| `/timeline` | `Navigate` | Redirect to `/` |
| `/s?id=...` | `SharedViewPage` | Read-only shared timeline |
| `*` | `NotFoundPage` | 404 |

### Hydration (on mount in App.jsx)

`hydrateLocalData()` (localStorage→IndexedDB migration, load events/timelines) → `hydratePhotos()` (blobs from IndexedDB) → then `hydrateFromRemote()` + `syncRemotePhotos()` in parallel, off the critical path.

## State management

Single Zustand store from 4 slices; slices receive `{ persist, sync }` helpers to avoid circular deps.

- **eventsSlice** — event CRUD with 50-level undo/redo per timeline via `commitEvents()`: undo snapshot → transformer → persist → sync. Concurrent commits serialize via a lock + `queueMicrotask`. Deletes have a 6s undo window before remote deletion.
- **photosSlice** — `photoMap: { filename → displayUrl }`; blobs in IndexedDB, background upload to Supabase Storage.
- **uiSlice** — view mode, sort, filters, dark mode, custom tags, parsing status, insights, toasts. Filters are `{ search, people, tags, dateFrom, dateTo }`; `getFilteredEvents` (selectors.js) does a date-range overlap test and search also matches `location`.
- **timelinesSlice** — multi-timeline CRUD/switching/hydration; tracks `_hydrating` and `saveStatus`.

### Persistence tiers

| Tier | Storage | What | Timing |
|------|---------|------|--------|
| 1 | localStorage | Settings (view, dark mode, sidebar, tags, activeTimelineId) | Debounced 500ms |
| 2 | IndexedDB (Dexie) | Events, timelines, custom tags, photo blobs | Debounced 500ms |
| 3 | Supabase | Timelines, events, shared links, photos | Debounced 1500ms, 3 retries w/ backoff |

localStorage keys: `timeliner_data` (settings), `timeliner_device_id` (Supabase device scoping), `timeliner_pending_deletes` (crash-surviving deferred deletes), `timeliner_geocode_cache`, `timeliner_search_history`, `timeliner_sidebar_sections` (sidebar collapse state).

## Data model

### Event (`src/schemas/event.js`)

```js
{
  id: string,               // "evt_" + 12 chars of crypto.randomUUID()
  title: string,            // required
  description: string | null,
  dateStart: string | null, // ISO: "YYYY", "YYYY-MM", or "YYYY-MM-DD"
  dateEnd: string | null,   // same format, for ranges
  dateRaw: string | null,   // original text from AI extraction
  datePrecision: "day" | "month" | "year" | "decade" | "approximate",
  flagged: boolean,         // AI-flagged ambiguous dates
  flagReason: string | null,
  people: string[],
  location: string | null,  // place name (city, country, venue) — geocoded by MapView
  tags: string[],           // 7 built-in + custom
  photos: string[],         // filenames referencing photoMap
  recurrence: {             // recurring-event rule, or null
    type: "yearly" | "monthly" | "weekly" | "custom",
    interval: number,       // default 1
    endDate: string | null, // ISO
  } | null,
  attachments: {            // external links / documents / audio
    type: "link" | "document" | "audio",
    url: string,
    label?: string,
  }[],
}
```

The API's `looseEventSchema` (in `api/parse.js`) mirrors the client schema but only added `location` — it does not parse `recurrence`/`attachments`.

Two Zod schemas: `eventSchema` (strict, internal) and `looseEventSchema` (coerces messy AI/import data — intentional, don't tighten).

### Timeline (timelinesSlice)

```js
{
  id: "tl_" + 12 chars, name, events: Event[],   // snapshot on save/switch
  photoMap, sortOrder: "date-asc", activeView: "vertical",
  createdAt, updatedAt,                           // ISO timestamps
}
```

## Key components & views

- **TimelinePage** — main orchestrator: filtering, pagination (50/page), selection mode. Delegates view rendering to `TimelineViewRenderer` (which wraps views in a `ViewErrorBoundary` keyed by view+variant) and modals to `TimelineModals`.
- **Shell / Sidebar / Header** — app layout, timeline list, save status.
- **EventCard** — single event across all views. **AddEventModal / EditEventModal** — forms via `useEventForm` + shared `EventFormFields`.
- **InlineImportPanel** — text input + file import + AI parse. After parsing, a `ReviewOverlay` streams events in for user review — never auto-commit parsed events.
- **TimelineToolbar / BatchActionBar** — view switching, sort, bulk tag/delete.

**11 view variants** — Vertical: classic, Cinematic, Magazine, Narrative. Horizontal: classic (SVG), Panoramic, FilmStrip, Wave. Other: Grid, Map (Leaflet, lazy), Graph (SVG, lazy). VerticalView and GridView virtualize via `useGroupedVirtualizer`; the horizontal variants cap rendering at `HORIZONTAL_RENDER_CAP` (200) and GraphView at `GRAPH_MAX_PEOPLE` (60 most-connected) with a "showing first N" notice — keep caps when touching these views.

## Commands

```sh
npm run dev          # Vite dev server (port 5173)
npm run build        # Production build → dist/
npm run lint         # ESLint
npm run test         # Vitest run (npm run test:watch for watch mode)
```

### Testing

Tests (19 files) live in `__tests__/` next to the code: schemas, selectors, eventsSlice/uiSlice, utils (constants, dateUtils, dedupeHelpers, exportHelpers, importHelpers), Badge/ErrorBoundary/ScrollToTop/SidebarContent, `views.smoke.test.jsx` (smoke-renders the 5 primary views), React Compiler integration (`src/test/reactCompiler.test.js`), and `api/__tests__/` (parse, analyze, share with mocked Claude/Supabase; rateLimit unmocked).

- API tests use `// @vitest-environment node`.
- View smoke tests mock `useTimelineStore`, leaflet/react-leaflet, and `@/lib/photoSync`, and wrap renders in `TooltipProvider` (EventCard uses Radix Tooltips).
- `src/test/setup.js` mocks `IntersectionObserver`, `ResizeObserver`, `window.matchMedia`.

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | For AI features | Claude API key (server-side) |
| `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` | For sync | Supabase project (server code in `api/share.js` also falls back to non-prefixed `SUPABASE_URL` / `SUPABASE_ANON_KEY`) |
| `SUPABASE_SERVICE_ROLE_KEY` | For sharing | Supabase admin key (server-side); `api/share.js` falls back to the anon key if unset |
| `ALLOWED_ORIGIN` | Optional | CORS. Unset = same-origin (from Host); `*` = public (literal wildcard, never reflects caller Origin); or explicit origin |
| `PUBLIC_BASE_URL` | Optional | Trusted origin for share canonical/OG/redirect URLs. Falls back to `ALLOWED_ORIGIN` (if not `*`), then request Host — set in production |

## Git

Commits to this repo — including those made by Claude Code — must be attributed to **degen11 <hill.degen@gmail.com>**. Author identity is a per-clone `git config` setting, not something stored in the repo itself, so set it once in each fresh clone/container before committing:

```sh
git config user.name "degen11"
git config user.email "hill.degen@gmail.com"
```

Claude Code sessions on the web get a fresh clone per session — check `git config user.email` and set it if it doesn't already match before making a commit.

## Conventions

### Language & structure
- Pure JavaScript — no TypeScript, no JSDoc type annotations. PascalCase `.jsx` components, camelCase `.js` utils/hooks. `@/` aliases `src/`. `_`-prefixed unused vars are allowed.
- Functional components only. The React Compiler handles memoization — never add manual `memo()`, `useCallback`, or `useMemo` (the react-compiler ESLint plugin warns on unoptimizable components).
- All magic numbers (durations, limits, thresholds) live in `constants.js` — but constants used only by `api/` stay local to `api/` (serverless can't import from `src/`, and `api/` must never import browser-side code). `escapeHtml()` likewise: import from `constants.js` in client code; API files keep a local copy.
- MapView and GraphView (and non-classic view variants) load via `React.lazy()`.

### State & data
- Individual Zustand selectors only: `useTimelineStore((s) => s.field)` — never destructure the store. Derive scalars inside the selector (`s.events.filter(e => e.flagged).length`) so value-equality prevents re-renders. For click-time reads that shouldn't subscribe (e.g. badge filter toggles), use `useTimelineStore.getState()`.
- All event mutations go through `commitEvents()` — never mutate the events array elsewhere.
- Don't modify `photoMap` directly — use `addToPhotoMap`, `deletePhoto`, etc. Photos have a parallel lifecycle in IndexedDB blobs and Supabase Storage; blob URLs are tracked in `photoStore.js` and revoked on app unmount.
- New persistent state goes through the existing `persist()` helper — don't add localStorage keys without considering the localStorage→IndexedDB migration in `dataService.js`.
- IDs: `"evt_"`/`"tl_"` + `crypto.randomUUID().slice(0, 12)`.

### UI primitives & shared helpers
- `src/components/ui/` are thin Radix wrappers (cva + `cn()` from `@/lib/utils`) — no business logic in them. Use them instead of native controls: Radix `Select` (never `<select>`), Radix `Tooltip` + `aria-label` on icon-only buttons (never `title=` for tooltips).
- Reuse, don't redefine: `getEventColor(event)` and `CARD_STYLE` from `constants.js`; `useCardClick` for card click/double-click; `PeopleInput` for people autocomplete; `useGroupedVirtualizer` for virtualized grouped views; `formatEventForClipboard` (from `utils/exportText.js`) for clipboard text.
- `AnimatedModal` handles focus (focuses first child on open, restores trigger focus on close — don't add per-modal focus logic) and takes a `label` prop for the dialog's accessible name — always pass it. Always-mounted modals must gate heavy computation on `open`: `const result = open ? compute(data) : null`.
- Toasts: `get().showToast(message, { duration, actionLabel, onAction, variant })`. `variant` (`'success' | 'error' | 'warning' | 'info'`) routes to typed sonner toasts; omit for neutral. Use `'success'` for confirmations, `'error'` for failures. For undoable actions inside `eventsSlice`, use the `showUndoableToast(message)` helper. Durations from `TOAST_DURATION`.
- `batchAddTag`/`batchRemoveTag` accept a string or array (plural aliases exist for back-compat).

### Interaction & motion
- Keyboard shortcuts via `useHotkeys` only (no manual keydown listeners). Globals: `1–5` views, `N` new event, `/` search, `I` insights, `Shift+/` help, `Mod+Z/Y` undo/redo, `Mod+P` print, `Mod+A` select all, `Esc` deselect/close. New shortcuts go in both `useKeyboardShortcutsTimeline.js` and `ShortcutsModal.jsx`.
- Horizontal views scroll via `useDragScroll`: spread `scrollProps` on the container (includes pointer drag, momentum, keyboard arrow/PageUp/PageDown/Home/End scrolling, `tabIndex`), check `wasDragged()` before handling clicks, toggle `cursor-grab(bing)` with `isDragging`.
- Motion timing from `constants.js`: `MOTION_DURATION`, `EASE_OUT`, and `SPRING.GENTLE` (modals/sidebars) / `SNAPPY` (tabs/toggles) / `BOUNCY` (celebrations) — never hardcode spring configs.
- Scroll-triggered entrances use `useScrollReveal()` + CSS classes (`scroll-reveal-card`, `scroll-reveal-dot`, `connector-revealed`, `.cinematic-spine-revealed`) — not Framer Motion variants. Used by vertical, grid, and horizontal card variants.
- Haptics: `haptic('light'|'medium'|'heavy')` from `utils/haptics.js` — light on selection taps (wired in `useCardClick`), heavy on destructive actions.
- `TimelinePage`'s load-more anchor uses a ref + `useEffect` on `paginated.length`, not `requestAnimationFrame` — `useTransition` defers the DOM update past the next rAF frame.

### Styling, a11y, theming
- Dark mode = the `dark` class on `<html>` + Tailwind `dark:` variants. Always apply it via `applyDarkMode(darkMode, { animate })` from `constants.js` — it toggles the class, syncs `<meta name="theme-color">`, and (with `animate: true`) crossfades via the View Transitions API instead of transitioning colors on every element. `App.jsx`'s darkMode effect is the single DOM owner for the main app (store actions only set state). MapView swaps to CARTO dark tiles in dark mode (TileLayer keyed by theme). Full-screen overlays need a `dark:` background variant to avoid white flashes.
- Inputs must be `text-base` (16px+) on mobile — smaller sizes trigger iOS Safari auto-zoom. Errored fields get `border-error` + `focus-visible:ring-error/20`.
- Form fields associate labels via `htmlFor`/`id` and errors via `aria-describedby`; async status UI (save indicator, parsing overlay) uses `role="status"`/`aria-live`. Submit buttons use an `isSubmitting` guard against double-submit (reset it in close/reset handlers).
- `--color-text-muted` values are tuned to pass WCAG AA — don't lower them; prefer theme tokens over raw `text-gray-*` for text.
- Tag palette: 16 colors in `constants.js`; built-in tags map to fixed indices 0–6, custom tags cycle 7–15. **Order matters** — reordering shifts every tag's color.
- Mobile: toolbar actions that don't fit go in the `MoreMenu` dropdown (`sm:hidden`) — never hide an action without a mobile path.
- Timezone-safe date display: always `safeParseForDisplay()` from `dateUtils.js` (shifts to noon UTC); never `new Date(str + 'T12:00:00')`.
- Adding an external origin (tiles, fonts, APIs)? Update the CSP in `vercel.json`.

### API endpoints
- Each endpoint is decomposed into focused helpers (validate → build prompt → call API → normalize) with a thin handler. All use shared `rateLimit.js` (limits evaluated before counters increment, so rejected requests don't consume budget).
- Distinct errors per failure mode: 400 validation, 429 rate limit (+`Retry-After`), 502 AI service/unparseable AI response, 500 unexpected — never one generic 500.

## Known issues

- `undoStack`/`redoStack` in `eventsSlice.js` are module-scoped. A per-timeline `historyByTimeline` Map isolates them on switch, and the commit lock serializes concurrency — safe in practice.

## What to avoid

- Destructuring the whole Zustand store; mutating events outside `commitEvents()`; touching `photoMap` directly.
- Changing the `@/` alias.
- Importing browser-side code into `api/` (Vercel serverless).
- Deleting `supabase-migration.sql` — it's the reference DB schema (not auto-run).
- Tightening `looseEventSchema` — coercion of messy AI/import data is intentional.
- Reordering the built-in tag palette indices.
- Setting `_hydrating` to `false` before data is loaded (causes a flash of empty state).
