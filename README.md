# Timeliner

AI-powered tool that transforms unstructured text into interactive, visual timelines.

Paste journal entries, family history, research notes, or any biographical text. Claude AI extracts events, dates, people, and locations into a timeline you can edit, visualize, filter, and share — no account required.

## Features

- **AI extraction** — paste raw text, get structured events with dates, people, tags, and locations
- **11 view modes** — 4 vertical designs, 4 horizontal designs, grid, interactive map, and relationship graph
- **Photo support** — upload, attach to events, drag-to-reorder; compressed and stored locally
- **Smart dates** — 5 precision levels (day, month, year, decade, approximate) with multi-zoom calendar picker
- **Filtering** — full-text search, filter by people or tags, review AI-flagged dates
- **Multiple timelines** — create, rename, switch, delete; each with independent events and settings
- **Export** — plain text, CSV, Markdown, JSON, print, and PDF
- **Sharing** — URL-encoded links (no server) or server-backed share links with OG previews
- **Undo/redo** — 50-level history stack for all event mutations
- **Keyboard shortcuts** — view switching (1–5), new event (N), print (Cmd+P), undo/redo
- **Offline-first** — works entirely in-browser with IndexedDB; optional Supabase cloud sync
- **Dark mode** — full dark theme with WCAG AA contrast

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite 7, JavaScript (no TypeScript) |
| Styling | Tailwind CSS v4 with design tokens |
| State | Zustand (slice-based store with undo/redo) |
| Routing | React Router v7 |
| Animations | Framer Motion |
| Icons | lucide-react |
| Maps | Leaflet + react-leaflet (lazy-loaded) |
| AI | Claude API via Vercel Serverless Functions |
| Database | Supabase PostgreSQL (optional) |
| Storage | IndexedDB (primary), localStorage (settings cache) |
| Export | file-saver, papaparse, jsPDF, html2canvas |
| Sharing | lz-string (URL compression), Supabase (server shares) |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
git clone <repo-url> && cd timeliner
cp .env.example .env        # Add your keys (optional)
npm install
npm run dev                  # http://localhost:5173
```

The app works fully offline without any environment variables. AI parsing and cloud sync require keys.

### Environment Variables

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | For AI parsing | Claude API key (set in Vercel or `.env`) |
| `VITE_SUPABASE_URL` | For cloud sync | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | For cloud sync | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | For sharing | Supabase admin key (server-side) |
| `ALLOWED_ORIGIN` | No | CORS origin for API endpoints |

### Supabase Setup

If you want cloud sync or server-backed sharing:

1. Create a Supabase project
2. Run `supabase-migration.sql` in the SQL Editor
3. Set the env vars above
4. The app auto-detects Supabase and enables sync

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

## Project Structure

```
src/
  main.jsx                  # Entry point: StrictMode + BrowserRouter
  App.jsx                   # ErrorBoundary, hydration sequence, routes
  index.css                 # Tailwind v4 theme tokens, dark mode, animations
  store/
    useTimelineStore.js     # Zustand root: composes slices, persistence, sync
    selectors.js            # Pure functions: filter, sort, group events
    slices/                 # eventsSlice, photosSlice, uiSlice, timelinesSlice
  lib/
    dataService.js          # Storage orchestrator (localStorage + IndexedDB)
    db.js                   # Supabase CRUD operations
    supabase.js             # Supabase client + device ID
    photoStore.js           # Photo Blob storage in IndexedDB
    dataStore.js            # State storage in IndexedDB
  utils/
    constants.js            # View enums, tag palette, sample text, ID generation
    dateUtils.js            # Date parsing, formatting, grouping
    exportHelpers.js        # Export to TXT, CSV, MD, JSON, PDF, print
    shareEncoder.js         # URL encoding + server share API calls
    importHelpers.js        # CSV/JSON normalization
    dedupeHelpers.js        # Near-duplicate detection (Jaccard similarity)
  hooks/                    # Keyboard shortcuts, people autocomplete
  components/
    layout/                 # Shell, Header, Sidebar, Footer, BottomTabBar
    timeline/               # TimelinePage, 11 view components, modals, cards
    shared/                 # AnimatedModal, Button, Badge, Toast, DatePicker, etc.
api/
  parse.js                  # POST /api/parse — Claude AI event extraction
  share.js                  # GET/POST /api/share — share link CRUD
  rateLimit.js              # Shared rate limiting + security headers
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed data flow, state management, and design decisions.
See [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for a codebase cheat sheet.

## Deployment

Designed for Vercel:

1. Connect repo to Vercel
2. Set `ANTHROPIC_API_KEY` in environment variables
3. Optionally set Supabase variables for cloud sync and sharing
4. Deploy — serverless functions in `api/` are auto-detected

`vercel.json` configures SPA routing (all non-API routes rewrite to `index.html`).

## Key Concepts

**Local-first:** Data lives in IndexedDB. Supabase is an optional sync layer. The app never blocks on network.

**Device-scoped isolation:** A stable UUID per browser (stored in localStorage) is sent as `x-device-id` to Supabase. RLS policies enforce per-device data access without user accounts.

**Commit pattern:** Every event mutation goes through `commitEvents()` which atomically pushes undo, applies the change, debounce-persists locally (500ms), and debounce-syncs remotely (1500ms with retry).

**Three storage tiers:** localStorage (fast sync settings) → IndexedDB (heavy data + photos) → Supabase (remote backup). Data migrates upward automatically on first load.

## Troubleshooting

- **AI parsing fails** — check `ANTHROPIC_API_KEY` is set. Check Vercel function logs for rate limit or API errors.
- **No cloud sync** — app works fully offline. Verify both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set for sync.
- **Share link too long** — large timelines exceed URL limits. Use server-backed sharing (requires Supabase) or export as JSON.
- **Photos not showing after clearing browser data** — photos are stored in IndexedDB. Clearing site data removes them. Use cloud sync for persistence.
