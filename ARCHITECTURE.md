# Architecture

Timeliner is a local-first, AI-powered timeline editor built with React 19, Zustand, and Vite 7. It runs as a single-page app on Vercel with two serverless API endpoints. Data lives primarily in the browser (IndexedDB + localStorage) with optional Supabase sync.

---

## High-Level Architecture

```
Browser (SPA)                          Vercel Serverless
+---------------------------------------+     +----------------------+
|  React 19 + Zustand                   |     |  /api/parse          |
|                                       |---->|  Claude AI extraction|
|  +---------+  +--------+  +--------+ |     +----------------------+
|  | UI Layer|  | Store  |  | Data   | |     +----------------------+
|  | (views, |->| (Zustand|->| Layer  | |---->|  /api/share          |
|  |  modals)|  |  slices)|  | (IDB,  | |     |  Supabase share CRUD |
|  +---------+  +--------+  | LS,    | |     +----------------------+
|                            | Supa)  | |
|                            +--------+ |     Supabase (PostgreSQL)
+---------------------------------------+     +----------------------+
                                               | timelines           |
                                               | events              |
                                               | shared_timelines    |
                                               +----------------------+
```

---

## Directory Structure

```
timeliner/
├── api/                          # Vercel serverless functions
│   ├── parse.js                  #   POST /api/parse — Claude AI event extraction
│   ├── share.js                  #   GET/POST /api/share — share link CRUD
│   └── rateLimit.js              #   Shared rate limiting + security headers
├── src/
│   ├── main.jsx                  # React entry: StrictMode + BrowserRouter
│   ├── App.jsx                   # Root: ErrorBoundary, hydration sequence, routes
│   ├── index.css                 # Tailwind v4 config, design tokens, dark mode
│   ├── store/
│   │   ├── useTimelineStore.js   # Zustand store: composes slices, persistence, sync
│   │   ├── selectors.js          # Pure functions: filter, sort, group events
│   │   └── slices/
│   │       ├── eventsSlice.js    #   Event CRUD, undo/redo, batch ops, merge
│   │       ├── photosSlice.js    #   Photo map, attach/detach, reorder
│   │       ├── uiSlice.js        #   Views, filters, dark mode, toasts, tags
│   │       └── timelinesSlice.js #   Multi-timeline mgmt, hydration, remote sync
│   ├── lib/
│   │   ├── dataService.js        # Orchestrator: localStorage + IndexedDB + re-exports
│   │   ├── dataStore.js          # IndexedDB wrapper for state (events, timelines)
│   │   ├── photoStore.js         # IndexedDB wrapper for photos (Blob storage)
│   │   ├── idbHelper.js          # createDBOpener — lazy IndexedDB connection cache
│   │   ├── supabase.js           # Supabase client + device ID management
│   │   └── db.js                 # Supabase CRUD: timelines, events, batch sync
│   ├── utils/
│   │   ├── constants.js          # View enums, tag palette (16 colors), sample text
│   │   ├── dateUtils.js          # Date parsing, formatting, grouping, comparison
│   │   ├── exportHelpers.js      # Export to TXT, CSV, MD, JSON, PDF, print
│   │   ├── shareEncoder.js       # LZ-string URL encoding + server share API calls
│   │   ├── importHelpers.js      # CSV/JSON normalization to event format
│   │   ├── dedupeHelpers.js      # Jaccard similarity duplicate detection
│   │   └── ui.js                 # Shared Tailwind class strings
│   ├── hooks/
│   │   ├── useKeyboardShortcuts.js         # Global undo/redo (Cmd+Z/Y)
│   │   ├── useKeyboardShortcutsTimeline.js # View switching (1-5), new event (N)
│   │   └── usePeopleAutocomplete.js        # People field autocomplete logic
│   └── components/
│       ├── layout/               # Shell, Header, Sidebar, Footer, BottomTabBar
│       ├── timeline/             # TimelinePage, all views, modals, cards
│       ├── shared/               # AnimatedModal, Button, Badge, Toast, DatePicker, etc.
│       ├── input/                # TextInput, PhotoUpload (legacy location)
│       ├── filters/              # SearchInput, MultiSelect (legacy location)
│       └── review/               # ReviewPanel, FlaggedDate, InlineEditor (legacy)
├── public/                       # Static assets
├── supabase-migration.sql        # Full DB schema + RLS policies
├── vite.config.js                # Vite 7 + React + Tailwind, @ alias, code splitting
├── vercel.json                   # SPA rewrite rule
├── eslint.config.js              # ESLint 9 flat config (react-hooks, react-refresh)
└── .env.example                  # Required/optional environment variables
```

> **Note on component locations:** Some components (TextInput, PhotoUpload, SearchInput, MultiSelect, ReviewPanel, etc.) live in `shared/` rather than their original `input/`, `filters/`, or `review/` directories. The `shared/` barrel is the canonical location. The original directories are empty or contain re-exports.

---

## Data Flow

### Startup Hydration Sequence

```
App mounts
  │
  ├─ 1. loadLocal()              Sync read from localStorage (settings only)
  │     → Zustand store initialized with persisted settings
  │     → If events found in localStorage, suppress hydration skeleton
  │
  ├─ 2. hydrateLocalData()       Async: migrate localStorage → IndexedDB, load heavy data
  │     → Events, timelines loaded from IndexedDB
  │     → Custom tag registry initialized
  │
  ├─ 3. hydratePhotos()          Async: load photo blobs from IndexedDB
  │     → photoMap populated, photoOrder reconciled
  │
  └─ 4. hydrateFromRemote()      Async: fetch from Supabase (non-blocking)
        → Merge strategy: per-timeline, newer updatedAt wins
        → Local-only timelines preserved
```

### User Edits an Event

```
User action (UI)
  │
  ├─ store.updateEvent(id, changes)
  │     │
  │     ├─ commitEvents()
  │     │     ├─ Push current events to undoStack (max 50)
  │     │     ├─ Apply transformer function
  │     │     └─ set({ events, canUndo: true, canRedo: false })
  │     │
  │     ├─ debouncedSaveToStorage() — 500ms debounce
  │     │     ├─ IndexedDB: save events + timelines + settings
  │     │     └─ localStorage: save settings only
  │     │
  │     └─ debouncedSync() — 1500ms debounce
  │           ├─ set saveStatus → 'pending'
  │           ├─ syncTimelineRemote() — upsert timeline metadata
  │           ├─ syncEventsRemote() — batch upsert events (chunks of 500)
  │           │     └─ Delete orphaned remote events
  │           ├─ On success: saveStatus → 'saved'
  │           └─ On failure: retry with backoff (2s, 4s, 8s)
  │                 └─ After 3 failures: saveStatus → 'error', show retry toast
  │
  └─ UI re-renders via Zustand selector
```

### AI Text Parsing

```
User pastes text → clicks "Create Timeline"
  │
  ├─ Frontend: POST /api/parse { text, photoFilenames }
  │
  ├─ API: rate limit check (10/min, 100/day per IP)
  │     ├─ Sanitize photo filenames
  │     ├─ Build system prompt + user message
  │     ├─ POST to Claude API (claude-haiku-4-5)
  │     ├─ Parse JSON from response (handle markdown fences)
  │     └─ Return { events: [...] }
  │
  └─ Frontend: appendEvents(parsed.events)
        ├─ Deduplicate by ID
        ├─ Near-duplicate detection (Jaccard similarity on titles + date proximity)
        ├─ commitEvents() → persist → sync
        └─ Toast: "Added N events, skipped M duplicates"
```

### Share Flow

```
URL-based (client-only, max ~8KB):
  encodeTimeline() → LZ compress → base64 → URL fragment #data=...
  decodeTimeline() → decompress → parse → render

Server-based (Supabase, up to 500KB):
  POST /api/share { events, meta, expiresInDays }
    → generateShareId() (crypto.getRandomValues)
    → INSERT into shared_timelines
    → Return { id, url, expiresAt }

  GET /api/share?id=ABC123
    → SELECT from shared_timelines
    → Check expiration
    → Return { events, meta }

  GET /api/share?id=ABC123&og=1
    → Return HTML with OG meta tags (for link previews)
    → Meta-refresh redirect to /s?id=ABC123
```

---

## State Management

### Zustand Store Architecture

The store is a single Zustand instance composed from four slices:

```
useTimelineStore = create((set, get) => ({
  ...createEventsSlice(set, get, { persist, sync }),    // Events, undo/redo, batch ops
  ...createPhotosSlice(set, get, { persist, sync }),    // Photo storage
  ...createUISlice(set, get, { persist }),              // Views, filters, toasts
  ...createTimelinesSlice(set, get, { persist, sync }), // Multi-timeline, hydration
  ...restoredFromLocalStorage,                          // Overwrite defaults with persisted
}))
```

**Dependency injection:** Each slice receives `{ persist, sync }` helpers from the store root. This avoids circular imports — slices don't know about debouncing or sync strategy.

**Selector pattern:** Components subscribe to individual fields:
```js
const events = useTimelineStore((s) => s.events)
const darkMode = useTimelineStore((s) => s.darkMode)
```
Zustand only re-renders when the selected value changes (referential equality).

### State Shape

| Slice | Key State | Persisted |
|-------|-----------|-----------|
| **events** | `events[]`, `selectedEventIds[]`, `canUndo`, `canRedo` | events to IDB |
| **photos** | `photoMap {}`, `photoOrder []` | Blobs to IDB, order to LS |
| **ui** | `activeView`, `sortOrder`, `filters`, `darkMode`, `toast`, `customTags`, `isParsing` | Settings to LS |
| **timelines** | `timelines[]`, `activeTimelineId`, `saveStatus`, `_hydrating` | timelines to IDB, activeId to LS |

**LS** = localStorage (sync, lightweight). **IDB** = IndexedDB (async, large quota).

---

## Persistence Architecture

### Three-Tier Storage

```
                    Capacity    Speed    Survives
localStorage        ~5MB        Sync     Page reload, browser close
IndexedDB           ~50MB+      Async    Page reload, browser close
Supabase            Unlimited   Network  Device loss, cross-device
```

**localStorage** holds only settings (~100 bytes): view preferences, dark mode, sidebar state, custom tags, active timeline ID, photo order. Read synchronously on store creation for instant startup.

**IndexedDB** is the primary store for events, timelines, and photo blobs. Two databases:
- `timeliner_data` (v1): single `state` store with key `'current'`
- `timeliner_photos` (v2): `photos` store, keys are filenames, values are Blobs

**Supabase** is optional remote sync. Device-scoped via `x-device-id` header + RLS policies. Conflict resolution: last-write-wins by `updatedAt` timestamp.

### Migration Path

On first load after the IndexedDB migration was added:
1. Check if localStorage has events/timelines
2. If yes and IndexedDB is empty: copy to IndexedDB
3. Trim localStorage to settings-only
4. Future loads: read settings from LS, heavy data from IDB

---

## Rendering Architecture

### View System

TimelinePage renders one of 11 view variants:

| View | Component | Lazy | Description |
|------|-----------|------|-------------|
| Vertical Classic | `VerticalView` | No | Year-grouped cards with timeline dots |
| Vertical Cinematic | `VerticalCinematic` | No | Full-width alternating cards |
| Vertical Magazine | `VerticalMagazine` | No | Featured card + grid layout |
| Vertical Narrative | `VerticalNarrative` | No | Alternating left/right prose |
| Horizontal Classic | `HorizontalView` | No | SVG timeline with dot/range rendering |
| Horizontal Panoramic | `HorizontalPanoramic` | No | Wide cards with photo backgrounds |
| Horizontal Film Strip | `HorizontalFilmStrip` | No | Tilted film-frame cards |
| Horizontal Wave | `HorizontalWave` | No | Sine-wave positioned cards |
| Grid | `GridView` | No | 3-column card grid |
| Map | `MapView` | **Yes** | Leaflet map with geocoded markers |
| Graph | `GraphView` | **Yes** | SVG relationship graph (people nodes) |

MapView and GraphView are `React.lazy()` loaded — their chunks only download when the user switches to those views.

### Event Processing Pipeline

```
events (raw from store)
  → getFilteredEvents(events, filters)    // Search, people, tags
  → getSortedEvents(filtered, sortOrder)  // Date or title sort
  → sorted.slice(0, page * PAGE_SIZE)     // Pagination (50 per page)
  → View component receives paginated[]
```

### Layout Structure

```
<Shell>                          // Provides toolbar/sidebar/footer contexts
  <Header>                       // Sticky, renders toolbar slot
    <Logo />
    <ToolbarContent />           // View switcher, design picker, actions
    <SaveStatus />               // Sync indicator
  </Header>
  <div className="flex">
    <Sidebar />                  // Desktop only, collapsible
    <main>
      <TimelinePage />           // Or <SharedViewPage />
    </main>
  </div>
  <Footer />                    // Hidden when timeline active
  <BottomTabBar />              // Mobile only, replaces footer
</Shell>
```

---

## API Endpoints

### POST /api/parse

Extracts structured events from raw text using Claude AI.

| Aspect | Detail |
|--------|--------|
| Model | `claude-haiku-4-5-20251001` |
| Max input | 50,000 chars |
| Max photos | 100 filenames |
| Rate limit | 10/min burst + 100/day per IP |
| Filename sanitization | Strips non-`[\w\s.\-()[\]]` chars, truncates to 200 |

### GET/POST /api/share

Server-side timeline sharing via Supabase.

| Aspect | Detail |
|--------|--------|
| Max payload | 500KB |
| Expiry options | 30, 90, 365 days (default 90) |
| Rate limit | 20/min per IP |
| Share ID | 10-char alphanumeric via `crypto.getRandomValues` |
| OG support | `?og=1` returns HTML with OpenGraph meta tags |

### Shared (api/rateLimit.js)

Both endpoints use a shared module for:
- IP extraction (supports x-forwarded-for, x-real-ip)
- In-memory rate limiting with burst + daily budget
- Security headers (X-Content-Type-Options, X-Frame-Options, Referrer-Policy)
- CORS (configurable via `ALLOWED_ORIGIN` env var)

**Caveat:** Rate limits are in-memory and reset on Vercel cold starts. For persistent limits, configure Upstash Redis via env vars.

---

## Database Schema (Supabase)

```sql
timelines (
  id          text PRIMARY KEY,
  device_id   text NOT NULL,          -- Scoped by device UUID
  name        text DEFAULT 'Untitled',
  sort_order  text DEFAULT 'date-asc',
  active_view text DEFAULT 'vertical',
  created_at  timestamptz,
  updated_at  timestamptz
)

events (
  id              text NOT NULL,
  timeline_id     text REFERENCES timelines ON DELETE CASCADE,
  title           text,
  description     text,
  date_start      text,                -- ISO date string
  date_end        text,
  date_raw        text,                -- Original text from source
  date_precision  text DEFAULT 'day',  -- day|month|year|decade|approximate
  flagged         boolean DEFAULT false,
  flag_reason     text,
  people          jsonb DEFAULT '[]',
  tags            jsonb DEFAULT '[]',
  photos          jsonb DEFAULT '[]',
  location        text,
  sort_index      integer DEFAULT 0,
  PRIMARY KEY (id, timeline_id)
)

shared_timelines (
  id          text PRIMARY KEY,        -- crypto.getRandomValues
  data        jsonb DEFAULT '{}',      -- { events: [...] }
  meta        jsonb DEFAULT '{}',      -- { title, description, eventCount }
  expires_at  timestamptz,
  created_at  timestamptz
)
```

**Indexes:** `device_id`, `timeline_id`, `(timeline_id, sort_index)`, `(timeline_id, date_start)`, `expires_at`

**RLS:** All timeline/event policies scoped by `x-device-id` request header. Shared timelines are publicly readable.

---

## Design Token System

Defined in `src/index.css` via Tailwind v4's `@theme` directive:

| Token | Purpose |
|-------|---------|
| `--color-primary` | CTA buttons, filled states (Deep Blue #1e40af) |
| `--color-secondary` | Links, labels, badges (Medium Blue #2563eb) |
| `--color-highlight` | Attention accents (Warm Orange #f97316) |
| `--color-canvas` | Page background (#f8fafc) |
| `--color-surface` | Card backgrounds (#ffffff) |
| `--color-text-strong/default/muted` | Text hierarchy |
| `--color-sidebar-*` | Dark sidebar palette (slate-based) |
| `--font-sans` | Inter (body text) |
| `--font-display` | Plus Jakarta Sans (headings) |

Dark mode: activated by `.dark` class on `<html>`, toggled via `@custom-variant dark`.

### Tag Color System

16 palette entries in `constants.js`. Each has: light bg/text/border, dark variants, active/hover states. All meet WCAG AA contrast.

- Tags 0–6: fixed mapping for built-in tags (career, education, travel, family, health, military, relocation)
- Tags 7–15: assigned to custom tags by insertion order via `setCustomTagRegistry()`

---

## Key Patterns

### 1. Commit Pattern (Event Mutations)
Every event mutation goes through `commitEvents(get, set, transformer, { persist, sync })`:
- Push undo snapshot (`structuredClone`)
- Apply transformer to current events
- Update store state
- Trigger debounced persistence and sync

### 2. Debounced Persistence
- **Local:** 500ms debounce → write to IndexedDB + localStorage
- **Remote:** 1500ms debounce → Supabase sync with 3 retries (exponential backoff)

### 3. Optimistic Updates
UI updates immediately. Sync happens in background. Failures shown as toasts with retry buttons. Tab-refocus retries failed syncs.

### 4. Device-Scoped Isolation
A stable UUID is generated on first visit, stored in localStorage, and sent as `x-device-id` header. Supabase RLS policies enforce per-device data isolation without authentication.

### 5. Lazy Loading
MapView (leaflet ~160KB) and GraphView (~8KB) are `React.lazy()` with `<Suspense>` fallbacks. PDF export uses dynamic `import()` for jsPDF and html2canvas.

### 6. Photo Compression Pipeline
Upload → Canvas resize (max 2048px) → JPEG compression (80% quality) → Blob → IndexedDB. Object URLs cached per filename, revoked on deletion.

---

## Environment Variables

| Variable | Required | Used By | Purpose |
|----------|----------|---------|---------|
| `VITE_SUPABASE_URL` | For sync | Frontend | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | For sync | Frontend | Supabase anonymous key |
| `ANTHROPIC_API_KEY` | For AI | /api/parse | Claude API key |
| `SUPABASE_SERVICE_ROLE_KEY` | For share | /api/share | Supabase admin key |
| `ALLOWED_ORIGIN` | No | API | CORS origin (defaults to `*`) |

The app works fully offline without any env vars. Supabase sync and AI parsing degrade gracefully when unconfigured.
