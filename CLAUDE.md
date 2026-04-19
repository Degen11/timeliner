# CLAUDE.md

## Project overview

Timeliner is a local-first, AI-powered timeline editor. Users paste unstructured text (e.g. a biography, journal, historical account) and Claude AI extracts structured events into an interactive visual timeline. Data lives in the browser (IndexedDB + localStorage) with optional Supabase cloud sync. Deployed as a Vercel SPA with serverless API endpoints.

## Tech stack

- **React 19** — UI framework (pure JavaScript, no TypeScript)
- **Vite 8** — build tool (Rolldown bundler), dev server, test runner config
- **Zustand 5** — state management (single store, 4 slices)
- **React Router 7** — client-side routing (2 routes + 1 redirect)
- **Tailwind CSS 4** — styling via `@tailwindcss/vite` plugin (no PostCSS config)
- **Radix UI** — headless primitives (Dialog, DropdownMenu, Select, Popover, Tooltip, Label, Separator)
- **Framer Motion 12** — animations, layout transitions
- **Dexie 4** — IndexedDB wrapper for persistent storage
- **Supabase** — optional cloud sync (PostgreSQL + Storage)
- **Zod 4** — schema validation for events
- **date-fns 4** — date manipulation
- **Leaflet + react-leaflet** — map view (lazy-loaded)
- **@tanstack/react-virtual** — list virtualization for large timelines
- **jsPDF + PapaParse + file-saver** — PDF/CSV export
- **lz-string** — URL compression for client-side sharing
- **nuqs** — URL query state management
- **sonner** — toast notifications
- **lucide-react** — icons
- **react-hotkeys-hook** — keyboard shortcuts
- **class-variance-authority + clsx + tailwind-merge** — component variant styling (`cn()` utility)
- **vaul** — mobile drawer component
- **Vitest 4** — unit testing with jsdom + @testing-library/react
- **ESLint 9** — flat config with react-hooks, react-refresh, react-compiler plugins
- **vite-plugin-pwa** — progressive web app support
- **@vercel/analytics** — usage analytics

## Architecture

```
src/
├── main.jsx              # React root: StrictMode → BrowserRouter → App
├── App.jsx               # ErrorBoundary → MotionConfig → TooltipProvider → hydration → routes
├── index.css             # Tailwind v4 imports, CSS custom properties, dark mode
├── components/
│   ├── layout/           # Shell, Header, Sidebar, SidebarContent, Footer, BottomTabBar, Logo, ExportModal, shellContexts
│   ├── timeline/         # All timeline views, modals, toolbar, import/export, batch actions
│   ├── shared/           # Reusable domain UI: Badge, DatePicker, Modal, PeopleInput, LocationInput, TagDropdown, etc.
│   ├── ui/               # Radix UI wrappers: Button, Dialog, DropdownMenu, Input, Label, Popover, Select, Separator, Tooltip
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
│   ├── db.js             # Supabase CRUD operations
│   └── utils.js          # cn() utility (clsx + tailwind-merge)
├── hooks/
│   ├── useCardClick.js                 # Shared click/double-click handler for event cards
│   ├── useDragScroll.js                # Pointer-event drag-to-scroll for horizontal views
│   ├── useGroupedVirtualizer.js        # Shared virtualization for grouped timeline views
│   ├── useScrollReveal.js              # Intersection Observer scroll-reveal (one-shot)
│   ├── useKeyboardShortcuts.js         # Global undo/redo (Ctrl+Z/Y)
│   ├── useKeyboardShortcutsTimeline.js # View switching, new event shortcuts
│   ├── useEventForm.js                 # Form state for add/edit event modals
│   ├── useFilterParams.js              # URL-synced filter state via nuqs
│   ├── useClickOutside.js
│   ├── useConfirmAction.js
│   ├── useDocumentMeta.js              # Dynamic document title/meta tags
│   ├── useIsMobile.js                  # Mobile viewport detection
│   ├── usePeopleAutocomplete.js
│   └── useResolvedPhotos.js            # Resolve photo URLs from store
├── utils/
│   ├── constants.js      # View enums, tag palette (16 colors), ID generation, shared utilities (getEventColor, escapeHtml), timing/motion/API constants
│   ├── dateUtils.js      # Date parsing, formatting, grouping, comparison
│   ├── dedupeHelpers.js  # Jaccard similarity for near-duplicate detection
│   ├── exportHelpers.js  # Export to TXT, CSV, MD, JSON, PDF, print
│   ├── haptics.js        # Haptic feedback (navigator.vibrate) for mobile
│   ├── importHelpers.js  # CSV/JSON normalization
│   ├── shareEncoder.js   # LZ-string URL encoding for sharing
│   ├── ui.js             # Tailwind class utility strings
│   └── modalStack.js     # Modal z-index management
└── schemas/
    └── event.js          # Zod event schema (strict + loose for AI responses)

api/                      # Vercel serverless functions
├── parse.js              # POST — Claude AI event extraction (claude-haiku-4-5-20251001)
├── analyze.js            # POST — Timeline analysis/insights (claude-haiku-4-5-20251001)
├── share.js              # POST/GET/DELETE — Share link CRUD via Supabase
└── rateLimit.js          # Shared rate limiting (IP-based, configurable burst/daily limits)
```

### Routes

| Path | Component | Purpose |
|------|-----------|---------|
| `/` | `TimelinePage` | Main editor |
| `/timeline` | `Navigate` | Redirect to `/` |
| `/s?id=...` | `SharedViewPage` | Read-only shared timeline view |

### Hydration sequence (on mount in App.jsx)

1. `hydrateLocalData()` — async: migrate localStorage → IndexedDB, load events + timelines
2. `hydratePhotos()` — async: load photo blobs from IndexedDB (chained after step 1)
3. `syncRemotePhotos()` — async: sync photos with Supabase Storage (chained after step 2)
4. `hydrateFromRemote()` — async: fetch timelines from Supabase (parallel with steps 2-3)

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

- **TimelinePage** (`src/components/timeline/TimelinePage.jsx`) — Main orchestrator. Manages filtering, pagination (50 events/page), selection mode, and layout. View rendering is delegated to `TimelineViewRenderer`, modals to `TimelineModals`.
- **Shell** (`src/components/layout/Shell.jsx`) — App layout with sidebar, header, Toaster.
- **Sidebar/SidebarContent** — Timeline list, create/switch/delete timelines, photo library access.
- **EventCard** — Renders a single event across all view types.
- **AddEventModal / EditEventModal** — Event creation and editing forms.
- **InlineImportPanel** — Text input + file import + AI parsing trigger.
- **TimelineToolbar** — View switcher, sort, group zoom, design variant toggles.
- **BatchActionBar** — Bulk actions (tag, delete) when events are selected.

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

### Testing

Tests live in `__tests__/` directories alongside the code they test:
- `src/schemas/__tests__/event.test.js`
- `src/store/__tests__/selectors.test.js`
- `src/store/__tests__/eventsSlice.test.js` — commitEvents, undo/redo, switchHistory, batch operations
- `src/utils/__tests__/constants.test.js`, `dateUtils.test.js`, `importHelpers.test.js`
- `src/components/__tests__/Badge.test.jsx`, `ErrorBoundary.test.jsx`
- `src/components/__tests__/views.smoke.test.jsx` — smoke-render tests for all 5 primary views (VerticalView, HorizontalView, GridView, MapView, GraphView)
- `src/test/reactCompiler.test.js` (React Compiler integration test)
- `api/__tests__/parse.test.js` — parse API endpoint (validation, Claude mock, normalization)
- `api/__tests__/analyze.test.js` — analyze API endpoint (validation, Claude mock, insights)
- `api/__tests__/share.test.js` — share API endpoint (GET/POST/OG HTML, Supabase mock)

**Test environment notes:**
- API tests use `// @vitest-environment node` to run in Node (not jsdom)
- View smoke tests mock `useTimelineStore`, `react-leaflet`, `leaflet`, and `@/lib/photoSync` to avoid real store/network initialization
- `src/test/setup.js` provides global mocks for `IntersectionObserver`, `ResizeObserver`, and `window.matchMedia` (jsdom only)

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
- **Component pattern** — functional components. The React Compiler (`babel-plugin-react-compiler`) handles memoization automatically — do not add manual `memo()`, `useCallback`, or `useMemo`. The `eslint-plugin-react-compiler` (set to `warn`) flags any components the compiler can't optimize.
- **UI primitives** — `src/components/ui/` wraps Radix UI with Tailwind styling using `class-variance-authority`. Import `cn()` from `@/lib/utils` for conditional class merging. These are thin wrappers — don't add business logic to them.
- **State access** — individual Zustand selectors: `useTimelineStore((s) => s.fieldName)`. Never destructure the whole store. When a component only needs a derived scalar (e.g. a count), compute it inside the selector so Zustand's value-equality check prevents re-renders when the result hasn't changed: `useTimelineStore((s) => s.events.filter(e => e.flagged).length)` instead of subscribing to the full array and deriving outside.
- **Mutations** — all event mutations go through `commitEvents()` which handles undo/redo/persist/sync atomically.
- **ID generation** — `"evt_" + crypto.randomUUID().slice(0, 12)` for events, `"tl_" + crypto.randomUUID().slice(0, 12)` for timelines.
- **Unused var prefix** — `_` prefix (e.g. `_unused`) is allowed by ESLint config.
- **File naming** — PascalCase for components (`.jsx`), camelCase for utilities/hooks (`.js`).
- **Lazy loading** — MapView and GraphView are loaded with `React.lazy()` to reduce initial bundle.
- **Expensive modal computations** — always-mounted modals (e.g. `StatsModal`) must gate heavy computation on the `open` prop. Use `const result = open ? compute(data) : null` so O(n) work only runs while the modal is visible, not on every background event mutation.
- **Tag colors** — 16-color palette in `constants.js`. 7 built-in tags map to fixed indices, custom tags cycle through indices 7-15.
- **Dark mode** — toggled via `document.documentElement.classList.toggle('dark', darkMode)` + Tailwind's `dark:` variant.
- **Toast pattern** — `get().showToast(message, { duration, actionLabel, onAction })` from any store action.
- **Drag-to-scroll** — horizontal timeline views use the `useDragScroll` hook. It uses pointer events for mouse+touch support, returns `{ containerRef, scrollProps, wasDragged, isDragging }`. Spread `scrollProps` on the scroll container, check `wasDragged()` before handling clicks, and use `isDragging` to toggle `cursor-grabbing`/`cursor-grab` classes.
- **Keyboard shortcuts** — use `useHotkeys` from `react-hotkeys-hook` for all keyboard shortcuts, including Escape to close. Don't add manual `document.addEventListener('keydown', ...)`.
- **Timezone-safe date display** — always use `safeParseForDisplay()` from `dateUtils.js` to parse dates for formatting. It shifts to noon UTC to prevent timezone rollback. Never use `new Date(str + 'T12:00:00')` directly.
- **Debounced persistence** — localStorage save debounced at `LOCAL_SAVE_DEBOUNCE_MS` (500ms), remote sync at `REMOTE_SYNC_DEBOUNCE_MS` (1500ms). All timing constants live in `constants.js`.
- **Named constants** — all magic numbers (durations, limits, thresholds) are defined in `constants.js` and imported where used. Toast durations use `TOAST_DURATION.DEFAULT/MEDIUM/LONG/SYNC_ERROR`. Sort order defaults use `SORT_OPTIONS.DATE_ASC`. API endpoints use local named constants since they can't import from `src/`. Do not add constants to `constants.js` that are only used in `api/` — they can't be imported there and will become dead code.
- **API rate limiting** — shared `rateLimit.js` module used by all API endpoints. IP-based with configurable burst/daily limits.
- **API handler decomposition** — each API endpoint (`parse.js`, `analyze.js`, `share.js`) is decomposed into focused helper functions (validate, build prompt, call API, normalize response) with a thin main handler that orchestrates them.
- **API error specificity** — API endpoints return distinct error messages per failure mode: 400 for input validation, 429 for rate limits (with `Retry-After` header), 502 for AI service errors or unreadable AI responses (JSON parse failures), 500 for unexpected server errors. Don't return a generic message for all 500s — distinguish JSON extraction failures (502) from true server errors (500).
- **Shared event color** — use `getEventColor(event)` from `constants.js` to get `{ dot, light, stroke }` colors based on the event's first tag. Don't redefine locally.
- **Shared card click handling** — use `useCardClick(event, { editable, onEdit, onSelect })` hook for click/double-click behavior on event cards. Don't duplicate inline.
- **Shared people input** — use `PeopleInput` component from `components/shared/PeopleInput.jsx` for the people autocomplete input + suggestions dropdown. Used by both AddEventModal and EditEventModal.
- **Shared virtualization** — use `useGroupedVirtualizer` hook from `hooks/useGroupedVirtualizer.js` for virtualized grouped views. Provides groups, flatItems, virtualizer, and shouldVirtualize. Used by VerticalView and GridView.
- **Scroll-reveal animations** — use `useScrollReveal()` hook from `hooks/useScrollReveal.js` for one-shot viewport-entry animations. Returns `{ ref, revealed }`. Apply the CSS classes `scroll-reveal-card` (fade+slide cards), `scroll-reveal-dot` (scale-pop dots), or `connector-revealed` (connector draw) and toggle them with the `revealed` boolean. Don't use Framer Motion card variants for scroll-triggered animations in non-virtualized views.
- **Sidebar collapse animation** — `CollapsibleSection` in `SidebarContent.jsx` uses Framer Motion `AnimatePresence` with `height: auto` animation. The chevron rotates via `motion.span`. Don't use instant show/hide for collapsible sidebar sections.
- **Timeline connector draw** — vertical timeline views use CSS `clip-path` animation (`.connector-revealed::after`) to draw the connector line on scroll entry. The cinematic spine uses `.cinematic-spine-revealed`. Don't use static connectors without reveal animation in new vertical view variants.
- **HTML escaping** — use `escapeHtml()` from `constants.js` in client code. API files keep a local copy since they can't import from `src/`.
- **Undoable toasts** — use the `showUndoableToast(message)` helper inside `eventsSlice` for consistent undo toast pattern. Don't call `showToast` with undo action directly.
- **Batch operations** — `batchAddTag(tagOrTags)` and `batchRemoveTag(tagOrTags)` accept both strings and arrays. The plural aliases (`batchAddTags`, `batchRemoveTags`) exist for backward compatibility.
- **Motion constants** — use `MOTION_DURATION`, `SPRING`, and `EASE_OUT` from `constants.js` for all animation timing. Three spring presets: `GENTLE` (modals, sidebars), `SNAPPY` (tabs, toggles), `BOUNCY` (celebrations). Never hardcode spring configs inline.
- **Shared card styling** — use `CARD_STYLE` from `constants.js` (`{ base, hover, transition }`) for consistent card appearance across all view variants. Don't redefine card classes locally.
- **View error boundaries** — `TimelineViewRenderer` wraps all view components in a `ViewErrorBoundary` that catches render errors and offers retry. The boundary key includes view + design variant so it resets on switches.
- **AI extraction review** — `InlineImportPanel` shows a `ReviewOverlay` after AI parsing. Events stream in one by one (120ms delay). Users can toggle-exclude events before committing. Don't auto-commit parsed events.
- **Mobile toolbar overflow** — toolbar actions that don't fit on small screens go in a `MoreMenu` dropdown (`sm:hidden`). Don't hide actions without providing mobile access.
- **Blob URL cleanup** — `App.jsx` calls `revokeAllObjectUrls()` on unmount. Photo blob URLs are tracked in `photoStore.js` and revoked to prevent memory leaks.
- **Haptic feedback** — use `haptic(intensity)` from `utils/haptics.js` for mobile touch feedback. Accepts `'light'`, `'medium'`, or `'heavy'`. No-ops on unsupported browsers. Card selection toggles in `useCardClick` fire `haptic('light')` on every tap; heavy destructive actions (delete) fire `haptic('heavy')`.
- **Form submit guard** — `AddEventModal` and `EditEventModal` use an `isSubmitting` state to disable the submit button during submission and show a spinner. This prevents double-click duplicate creation. Reset `isSubmitting` in close/reset handlers.
- **Active filter bar** — `TimelinePage` renders an `ActiveFilterBar` component when filters narrow results below the total event count. Shows filter pills with individual remove buttons and a "Clear all" action. Uses `AnimatePresence` for smooth enter/exit. Defined inline in `TimelinePage.jsx`.
- **Timeline rename on desktop** — The inline rename UI in `TimelineToolbar` is available on all breakpoints (not just mobile). Click the timeline name to enter edit mode. Input max-width scales up on desktop (`lg:max-w-[300px]`).
- **Smooth scroll** — Global `scroll-behavior: smooth` is set on `html` in `index.css`. The `prefers-reduced-motion` media query overrides this to `auto`. View switches scroll to top with `behavior: 'smooth'`.
- **Load-more scroll anchor** — `TimelinePage` tracks a `loadMorePrevCount` ref set on button click. A `useEffect` watching `paginated.length` fires after the transition commits and calls `scrollIntoView` on the first new card (`cards[prev]`). Don't use `requestAnimationFrame` for this — `useTransition` defers the DOM update past the next rAF frame.
- **Sort-change animation** — The view `motion.div` key in `TimelinePage` includes `sortOrder`, so changing sort order triggers `AnimatePresence mode="wait"` exit + enter (0.2s fade + y slide). This gives users a clear visual signal that the list has re-ordered.
- **Save status tooltip** — `SaveStatus` in `Header.jsx` wraps the indicator in a `Tooltip` showing context-aware text per state: "Saving your changes…", "All changes saved", or "Cloud sync failed — your data is safe locally". Use the `tooltip` field in `STATUS_CONFIG` to update copy; don't add separate tooltip state.
- **Form error ring** — Errored `Input` fields pass `focus-visible:ring-error/20` via `className` in addition to `border-error`, so the focus ring also goes red. `DatePicker` uses `focus:ring-2 focus:ring-error/20` in its trigger button error state.
- **Mobile input zoom prevention** — all `<input>` elements must use `text-base` (16px) or larger on mobile to prevent iOS Safari from auto-zooming the viewport on focus. Don't use `text-sm` without a `sm:` breakpoint upgrade — use `text-base` as the default size.
- **WCAG AA muted text** — `--color-text-muted` is `#6b6b6b` in light mode (5.36:1 on white, 4.97:1 on canvas) and `#a3a3a3` in dark mode (7.5:1+ on dark surfaces). Both pass WCAG AA 4.5:1 minimum. Don't lower these values.
- **PWA icons** — the manifest declares SVG (any size), 192x192 PNG, and 512x512 PNG icons. All three are required for reliable PWA installation across platforms. PNG icons live in `public/pwa-192x192.png` and `public/pwa-512x512.png`.

## Known issues

- **Undo stacks are module-level** — `undoStack`/`redoStack` in `eventsSlice.js` are module-scoped variables. A per-timeline `historyByTimeline` Map handles isolation on timeline switch, and the `isCommitting` lock + `queueMicrotask` serializes concurrent commits correctly. This is safe in practice.

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
