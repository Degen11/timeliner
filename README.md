# Timeliner

Transform messy family history, journal entries, research notes, or biographical text into beautiful, interactive timelines. Paste your text, optionally add photos, and AI extracts events, people, and dates into a timeline you can edit, filter, and share — no account required.

## Features

- **AI-powered parsing** — paste unstructured text and get a structured timeline with events, dates, people, and tags
- **Three view modes** — vertical (year-grouped list), horizontal (SVG scrollable timeline), and grid (responsive cards)
- **Inline editing** — double-click any event to edit titles, descriptions, and dates in place
- **Photo support** — upload and attach photos to events; photo library with drag-and-drop
- **Smart date handling** — supports partial dates, approximate dates, and decade-level precision with a multi-zoom calendar picker
- **Filtering & search** — full-text search, filter by people or tags, review flagged dates
- **Multiple timelines** — create, rename, switch between, and delete timelines
- **Export** — plain text, CSV, Markdown, JSON, and print/PDF
- **Shareable links** — compress a timeline into a URL (no backend needed) for read-only sharing
- **Undo/redo** — full undo/redo stack for all edits
- **Keyboard shortcuts** — view switching (1/2/3), new event (N), print (Cmd+P), undo/redo
- **Optional cloud sync** — Supabase integration for cross-device persistence (works fully offline without it)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + Vite 7 (JavaScript, no TypeScript) |
| Styling | Tailwind CSS v4 with design tokens in `src/index.css` |
| State | Zustand with undo/redo middleware |
| Routing | React Router v7 |
| Animations | Framer Motion |
| Icons | lucide-react |
| AI parsing | Vercel Serverless Function + Claude API |
| Date handling | date-fns |
| Database | Supabase (optional) |
| Exports | file-saver, papaparse |
| URL sharing | lz-string compression |

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Install & Run

```bash
npm install
npm run dev
```

The app runs at `http://localhost:5173` by default.

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `ANTHROPIC_API_KEY` | Yes (for AI parsing) | Claude API key, set in Vercel or `.env` |
| `VITE_SUPABASE_URL` | No | Supabase project URL for cloud sync |
| `VITE_SUPABASE_ANON_KEY` | No | Supabase anon key for cloud sync |

Without the Supabase variables, the app runs in local-only mode using `localStorage`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## Deployment

Designed for Vercel:

1. Connect your repo to Vercel
2. Set `ANTHROPIC_API_KEY` in Vercel environment variables
3. Optionally set the Supabase variables for cloud sync
4. Deploy — the `api/parse.js` serverless function handles AI parsing automatically

## Project Structure

```
src/
  main.jsx                  # Entry point
  App.jsx                   # Router + ErrorBoundary
  index.css                 # Tailwind v4 theme + design tokens
  components/
    layout/                 # Header, Sidebar, Shell, Logo, Footer
    timeline/               # TimelinePage, views, EventCard, AddEventModal
    input/                  # TextInput, PhotoUpload
    filters/                # SearchInput, MultiSelect
    review/                 # ReviewPanel, FlaggedDate, InlineEditor
    shared/                 # AnimatedModal, Button, Badge, DatePicker, etc.
  store/
    useTimelineStore.js     # Zustand store (all app state)
    selectors.js            # Derived data (filtering, sorting, grouping)
  hooks/                    # Keyboard shortcuts
  utils/
    constants.js            # App constants, tag colors, ID generation
    dateUtils.js            # Date parsing and formatting
    exportHelpers.js        # File export (text, CSV, MD, JSON, print)
    shareEncoder.js         # URL compression for sharing
    importHelpers.js        # CSV/JSON import normalization
  lib/
    supabase.js             # Supabase client setup
    db.js                   # Database CRUD operations
api/
  parse.js                  # Vercel serverless function (AI parsing)
```

## Troubleshooting

- **AI parsing fails**: Ensure `ANTHROPIC_API_KEY` is set and valid. Check the Vercel function logs.
- **Supabase not connecting**: The app works fully offline. If cloud sync is desired, verify both `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set.
- **Share link too long**: Very large timelines may exceed URL length limits. Use file export (JSON/CSV) instead.
- **Photos not showing**: Photos are stored as data URLs in localStorage. Clearing browser data will remove them.
