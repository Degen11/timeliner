# CLAUDE.md

## Project overview

Timeliner is a local-first, AI-powered timeline editor. Users paste unstructured text (e.g. a biography, journal, historical account) and Claude AI extracts structured events into an interactive visual timeline. Data lives in the browser (IndexedDB + localStorage) with optional Supabase cloud sync. Deployed as a Vercel SPA with two serverless API endpoints.

## Tech stack

- **React 19** — UI framework (pure JavaScript, no TypeScript)
- **Vite 7** — build tool, dev server, test runner config
- **Zustand 5** — state management (single store, 4 slices)
- **React Router 7** — client-side routing (only 2 routes)
- **Tailwind CSS 4** — styling via `@tailwindcss/vite` plugin (no PostCSS config)
- **Framer Motion 12** — animations, layout transitions
- **Dexie 4** — IndexedDB wrapper for persistent storage
- **Supabase** — optional cloud sync (PostgreSQL + Storage)
- **Zod 4** — schema validation for events
- **date-fns 4** — date manipulation
- **Leaflet + react-leaflet** — map view (lazy-loaded)
- **jsPDF + PapaParse** — PDF/CSV export
- **lz-string** — URL compression for client-side sharing
- **nuqs** — URL query state management
- **sonner** — toast notifications
- **lucide-react** — icons
- **react-hotkeys-hook** — keyboard shortcuts
- **Vitest 4** — unit testing with jsdom + @testing-library/react
- **ESLint 9** — flat config with react-hooks and react-refresh plugins
- **vite-plugin-pwa** — progressive web app support

## Architecture

```
src/
├── main.jsx              # React root: StrictMode → BrowserRouter → App
├── App.jsx               # ErrorBoundary → MotionConfig → hydration → routes
├── index.css             # Tailwind v4 imports, CSS custom properties, dark mode
├── components/
│   ├── layout/           # Shell, Header, Sidebar, Footer, BottomTabBar (mobile)
│   ├── timeline/         # All timeline views, modals, toolbar, import/export
│   ├── shared/           # Reusable UI: Button, Badge, Modal, DatePicker, etc.
│   ├── input/            # PhotoUpload, TextInput
│   ├── filters/          # MultiSelect, SearchInput
│   └── review/           # FlaggedDate, InlineEditor, ReviewPanel
├── store/
│   ├── useTimelineStore.js   # Root Zustand store, persistence, sync
│   ├── selectors.js          # Pure filter/sort/group functions
│   └── slices/
│       ├── eventsSlice.js    # Event CRUD, undo/redo (50-level), batch ops
│       ├── photosSlice.js    # Photo blob storage, attach/detach, upload
│       ├── uiSlice.js        # Views, filters, dark mode, parsing status
│       └── timelinesSlice.js # Multi-timeline management, hydration, sync
├── lib/                  # Data layer
│   ├── dataService.js    # Orchestrator (localStorage + IndexedDB + Supabase)
│   ├── dataStore.js      # IndexedDB wrapper via Dexie
│   ├── dexieDb.js        # Dexie database schema definition
│   ├── photoStore.js     # Photo blob storage in IndexedDB
│   ├── photoSync.js      # Supabase Storage photo sync
│   ├── supabase.js       # Supabase client initialization + device ID
│   └── db.js             # Supabase CRUD operations
├── hooks/                # Custom React hooks
│   ├── useDragScroll.js                # Pointer-event drag-to-scroll for horizontal views
│   ├── useKeyboardShortcuts.js         # Global undo/redo (Ctrl+Z/Y)
│   ├── useKeyboardShortcutsTimeline.js # View switching, new event shortcuts
│   ├── useEventForm.js                 # Form state for add/edit event modals
│   ├── useFilterParams.js              # URL-synced filter state via nuqs
│   ├── useClickOutside.js
│   ├── useConfirmAction.js
│   └── usePeopleAutocomplete.js
├── utils/
│   ├── constants.js      # View enums, tag palette (16 colors), ID generation
│   ├── dateUtils.js      # Date parsing, formatting, grouping, comparison
│   ├── dedupeHelpers.js  # Jaccard similarity for near-duplicate detection
│   ├── exportHelpers.js  # Export to TXT, CSV, MD, JSON, PDF, print
│   ├── importHelpers.js  # CSV/JSON normalization
│   ├── shareEncoder.js   # LZ-string URL encoding for sharing
│   ├── ui.js             # Tailwind class utility strings
│   └── modalStack.js     # Modal z-index management
└── schemas/
    └── event.js          # Zod event schema (strict + loose for AI responses)

api/                      # Vercel serverless functions
├── parse.js              # POST — Claude AI event extraction (claude-haiku-4-5-20251001)
├── analyze.js            # POST — Timeline analysis/insights
├── share.js              # POST/GET/DELETE — Share link CRUD via Supabase
└── rateLimit.js          # Shared rate limiting (10/min burst, 100/day per IP)
```

### Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | `TimelinePage` | Main editor |
| `/s?id=...` | `SharedViewPage` | Read-only shared timeline view |

### Hydration sequence (on mount in App.jsx)

1. `loadLocal()` — synchronous read from localStorage (settings only)
2. `hydrateLocalData()` — async: migrate localStorage → IndexedDB, load events
3. `hydratePhotos()` — async: load photo blobs from IndexedDB
4. `syncRemotePhotos()` — async: sync photos with Supabase Storage
5. `hydrateFromRemote()` — async: fetch timelines from Supabase (non-blocking)

## State management

Single Zustand store composed from 4 slices. All slices receive `{ persist, sync }` helpers to avoid circular dependencies.

**eventsSlice** — Event CRUD with 50-level undo/redo per timeline. Uses `commitEvents()` which: pushes undo snapshot → applies transformer → persists → syncs. Concurrent commits are queued via a lock + `queueMicrotask`. Deleted events have a 6-second undo window before remote deletion fires.

**photosSlice** — `photoMap: { filename → displayUrl }`, `photoOrder: []`. Photos are stored as blobs in IndexedDB and uploaded to Supabase Storage in the background.

**uiSlice** — View mode, sort order, filters, dark mode, custom tags, parsing status, insights panel, toast notifications via Sonner.

**timelinesSlice** — Multi-timeline CRUD, switching, hydration from IndexedDB and Supabase. Tracks `_hydrating` and `saveStatus` for loading/sync UI.

### Persistence tiers

| Tier | Storage | What | Timing |
|------|---------|------|--------|
| 1 | localStorage | Settings (view, dark mode, sidebar, tags, activeTimelineId) | Debounced 500ms |
| 2 | IndexedDB (Dexie) | Events, timelines, custom tags, photo blobs | Debounced 500ms |
| 3 | Supabase | Timelines, events, shared links, photos | Debounced 1500ms, 3 retries with exponential backoff |

### Key localStorage keys

- `timeliner_data` — main settings blob
- `timeliner_device_id` — stable UUID for Supabase device scoping
- `timeliner_pending_deletes` — deferred deletions surviving crashes
- `timeliner_geocode_cache` — location coordinate cache
- `timeliner_search_history` — search terms

## Data model

### Event shape (defined in `src/schemas/event.js`)

```js
{
  id: string,              // "evt_" + 12 chars from crypto.randomUUID()
  title: string,           // required, min 1 char
  description: string | null,
  dateStart: string | null, // ISO: "YYYY", "YYYY-MM", or "YYYY-MM-DD"
  dateEnd: string | null,   // same format, for date ranges
  dateRaw: string | null,   // original text from AI extraction
  datePrecision: "day" | "month" | "year" | "decade" | "approximate",
  flagged: boolean,         // AI-flagged ambiguous dates
  flagReason: string | null,
  people: string[],
  tags: string[],           // from 7 built-in + custom tags
  photos: string[],         // filenames referencing photoMap
}
```

Two Zod schemas exist: `eventSchema` (strict, for internal use) and `looseEventSchema` (coerces bad data, for AI responses and imports).

### Timeline shape (in timelinesSlice)

```js
{
  id: string,              // "tl_" + 12 chars from crypto.randomUUID()
  name: string,
  events: Event[],         // snapshot of events when saved/switched
  photoMap: { [filename]: displayUrl },
  sortOrder: string,       // default "date-asc"
  activeView: string,      // default "vertical"
  createdAt: string,       // ISO timestamp
  updatedAt: string,
}
```

## Key components

- **TimelinePage** (`src/components/timeline/TimelinePage.jsx`) — Main orchestrator. Manages all views, modals, filtering, pagination (50 events/page), and the import panel.
- **Shell** (`src/components/layout/Shell.jsx`) — App layout with sidebar, header, Toaster.
- **Sidebar/SidebarContent** — Timeline list, create/switch/delete timelines, photo library access.
- **EventCard** — Renders a single event across all view types.
- **AddEventModal / EditEventModal** — Event creation and editing forms.
- **InlineImportPanel** — Text input + file import + AI parsing trigger.
- **TimelineToolbar** — View switcher, sort, group zoom, design variant toggles.

### Timeline views (11 variants)

Vertical: `VerticalView` (classic), `VerticalCinematic`, `VerticalMagazine`, `VerticalNarrative`
Horizontal: `HorizontalView` (SVG), `HorizontalPanoramic`, `HorizontalFilmStrip`, `HorizontalWave`
Other: `GridView`, `MapView` (Leaflet, lazy), `GraphView` (SVG relationship graph, lazy)

## Common commands

```sh
npm run dev          # Start Vite dev server (port 5173)
npm run build        # Production build → dist/
npm run preview      # Preview production build
npm run lint         # ESLint (flat config)
npm run test         # Vitest run (unit tests)
npm run test:watch   # Vitest watch mode
```

### Environment variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | For AI features | Claude API key (server-side) |
| `VITE_SUPABASE_URL` | For sync | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | For sync | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | For sharing | Supabase admin key (server-side) |
| `ALLOWED_ORIGIN` | Optional | CORS origin (defaults to `*`) |

## Code conventions

- **Pure JavaScript** — no TypeScript anywhere. No JSDoc type annotations.
- **Path alias** — `@/` maps to `src/` (configured in vite.config.js).
- **Component pattern** — functional components, wrapped with `React.memo()` on view components for performance.
- **State access** — individual Zustand selectors: `useTimelineStore((s) => s.fieldName)`. Never destructure the whole store.
- **Mutations** — all event mutations go through `commitEvents()` which handles undo/redo/persist/sync atomically.
- **ID generation** — `"evt_" + crypto.randomUUID().slice(0, 12)` for events, `"tl_" + crypto.randomUUID().slice(0, 12)` for timelines.
- **Unused var prefix** — `_` prefix (e.g. `_unused`) is allowed by ESLint config.
- **File naming** — PascalCase for components (`.jsx`), camelCase for utilities/hooks (`.js`).
- **Lazy loading** — MapView and GraphView are loaded with `React.lazy()` to reduce initial bundle.
- **Tag colors** — 16-color palette in `constants.js`. 7 built-in tags map to fixed indices, custom tags cycle through indices 7-15.
- **Dark mode** — toggled via `document.documentElement.classList.toggle('dark', darkMode)` + Tailwind's `dark:` variant.
- **Toast pattern** — `get().showToast(message, { duration, actionLabel, onAction })` from any store action.
- **Drag-to-scroll** — horizontal timeline views use the `useDragScroll` hook (`src/hooks/useDragScroll.js`). It uses pointer events for mouse+touch support, returns `{ containerRef, scrollProps, wasDragged }`. Spread `scrollProps` on the scroll container and check `wasDragged()` before handling clicks.
- **Keyboard shortcuts** — use `useHotkeys` from `react-hotkeys-hook` for all keyboard shortcuts, including Escape to close. Don't add manual `document.addEventListener('keydown', ...)`.
- **Timezone-safe date display** — always use `safeParseForDisplay()` from `dateUtils.js` to parse dates for formatting. It shifts to noon UTC to prevent timezone rollback. Never use `new Date(str + 'T12:00:00')` directly.
- **Debounced persistence** — localStorage save debounced at 500ms, remote sync debounced at 1500ms.
- **API rate limiting** — shared `rateLimit.js` module used by all API endpoints. IP-based with configurable burst/daily limits.

## Known issues

- **SharedViewPage copy** — previously could create an empty timeline, but fixed by the `eventsOverride` parameter on `saveCurrentAsTimeline`. The fix is complete; `eventsOverride` bypasses the store snapshot entirely.
- **Undo stacks are module-level** — `undoStack`/`redoStack` in `eventsSlice.js` are module-scoped variables. A per-timeline `historyByTimeline` Map handles isolation on timeline switch, and the `isCommitting` lock + `queueMicrotask` serializes concurrent commits correctly. This is safe in practice.
- **ARCHITECTURE.md and QUICK_REFERENCE.md** — These are AI-generated reference docs from a previous session. They contain useful information but are not part of the app. Consider deleting them if they become stale.

## What to avoid

- **Never destructure the entire Zustand store** — always use individual selectors `useTimelineStore((s) => s.field)` to prevent unnecessary re-renders.
- **Never call event mutations outside commitEvents** — all event array changes must go through `commitEvents()` to maintain undo/redo integrity and trigger persist/sync.
- **Don't modify `photoMap` directly** — use `addToPhotoMap`, `deletePhoto`, etc. Photos have a parallel lifecycle in IndexedDB blobs and Supabase Storage.
- **Don't change the `@/` alias** — it's used in every import across the codebase.
- **Don't add new localStorage keys without thinking about migration** — `dataService.js` handles the localStorage→IndexedDB migration. New persistent state should go through the existing `persist()` helper.
- **API endpoints run on Vercel serverless** — they don't have access to the browser environment. Don't import browser-side code into `api/`.
- **supabase-migration.sql** — this file contains the database schema. It's a reference/setup script, not auto-run. Don't delete it.
- **The `looseEventSchema` in `schemas/event.js`** — this permissive schema is intentional. AI responses and CSV imports produce messy data that needs coercion, not rejection.
- **Tag palette order matters** — built-in tags are mapped to specific palette indices (0-6). Changing the order or removing entries will shift all tag colors.
- **The `_hydrating` flag** — controls skeleton display during IndexedDB load. Don't set it to `false` before data is actually loaded or users will see a flash of empty state.
