# Timeliner — Implementation Plan

## 1. Project Setup & Tooling

### 1.1 Scaffold with Vite + React (JavaScript)
```
npm create vite@latest . -- --template react
```
- Remove all boilerplate CSS and demo components
- Configure `vite.config.js` with path aliases (`@/` → `src/`)

### 1.2 Dependencies
| Package | Purpose |
|---------|---------|
| `react-router-dom` | Client-side routing (input → timeline → shared view) |
| `zustand` | Lightweight state management (no Redux boilerplate) |
| `date-fns` | Date parsing, formatting, and range logic |
| `tailwindcss` + `@tailwindcss/vite` | Utility-first styling matching the design direction |
| `lucide-react` | Minimal icon set |
| `lz-string` | Compress timeline data for shareable URL encoding |
| `papaparse` | CSV export |
| `file-saver` | Trigger browser downloads (HTML, JSON, CSV) |
| `framer-motion` | Subtle, restrained view transitions only |

**No database. No auth. No external persistence.**

### 1.3 Project Structure
```
timeliner/
├── api/                        # Vercel Serverless Functions
│   └── parse.js                # AI parsing endpoint
├── public/
├── src/
│   ├── main.jsx                # App entry
│   ├── App.jsx                 # Router + layout shell
│   ├── index.css               # Tailwind base + design tokens
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.jsx      # App header + nav
│   │   │   ├── Shell.jsx       # Page wrapper with consistent spacing
│   │   │   └── Footer.jsx      # Minimal footer
│   │   │
│   │   ├── input/
│   │   │   ├── TextInput.jsx   # Main textarea for pasting text
│   │   │   ├── PhotoUpload.jsx # Drag-and-drop photo upload
│   │   │   └── InputPage.jsx   # Combines text + photos + submit
│   │   │
│   │   ├── timeline/
│   │   │   ├── TimelinePage.jsx    # Main timeline container + view switcher
│   │   │   ├── VerticalView.jsx    # Default, grouped-by-year list
│   │   │   ├── HorizontalView.jsx  # SVG-based horizontal scroll
│   │   │   ├── GridView.jsx        # Card-based grid layout
│   │   │   ├── EventCard.jsx       # Single event display (shared across views)
│   │   │   ├── YearGroup.jsx       # Year heading + events (vertical view)
│   │   │   └── PhotoThumbnail.jsx  # Linked photo preview
│   │   │
│   │   ├── review/
│   │   │   ├── ReviewPanel.jsx     # Side panel for flagged items
│   │   │   ├── FlaggedDate.jsx     # Single ambiguous-date review card
│   │   │   └── InlineEditor.jsx    # Inline edit for date/title/description
│   │   │
│   │   ├── filters/
│   │   │   ├── FilterBar.jsx       # Search + filter controls
│   │   │   ├── SearchInput.jsx     # Full-text search
│   │   │   ├── PeopleFilter.jsx    # Filter by extracted names
│   │   │   └── TagFilter.jsx       # Filter by category tags
│   │   │
│   │   ├── export/
│   │   │   ├── ExportMenu.jsx      # Export dropdown/modal
│   │   │   ├── ShareLink.jsx       # Generate shareable URL
│   │   │   └── DownloadOptions.jsx # HTML / JSON / CSV downloads
│   │   │
│   │   └── shared/
│   │       ├── SharedViewPage.jsx  # Read-only timeline from URL data
│   │       ├── Button.jsx          # Base button component
│   │       ├── Badge.jsx           # Tag/people badge
│   │       └── EmptyState.jsx      # Empty/loading states
│   │
│   ├── store/
│   │   ├── useTimelineStore.js # Zustand store — single source of truth
│   │   └── selectors.js        # Derived data (filtered events, stats)
│   │
│   ├── utils/
│   │   ├── dateParser.js       # Client-side date detection fallback
│   │   ├── photoMatcher.js     # Match photos to events by filename/mention
│   │   ├── exportHelpers.js    # JSON, CSV, HTML export logic
│   │   ├── shareEncoder.js     # Compress & encode data for URL sharing
│   │   └── constants.js        # App-wide constants
│   │
│   └── hooks/
│       ├── useFilters.js       # Filter logic hook
│       └── useParsing.js       # API call + loading state hook
│
├── tailwind.config.js
├── vite.config.js
├── vercel.json
├── package.json
└── PLAN.md
```

---

## 2. Design System & Tokens

### 2.1 Color Palette (Neutral + One Accent)
```
--gray-50:  #FAFAFA   (page background)
--gray-100: #F4F4F5   (card background, subtle fills)
--gray-200: #E4E4E7   (borders)
--gray-300: #D4D4D8   (disabled states)
--gray-400: #A1A1AA   (placeholder text)
--gray-500: #71717A   (secondary text)
--gray-700: #3F3F46   (primary text)
--gray-900: #18181B   (headings)

--accent:   #2563EB   (blue — links, buttons, active states)
--accent-light: #DBEAFE (accent backgrounds)

--flag-amber: #F59E0B  (flagged/ambiguous dates)
--success:    #10B981  (confirmations)
--error:      #EF4444  (errors)
```

### 2.2 Typography
- **Font**: `Inter` via Google Fonts (or system font stack fallback)
- **Scale**: 12 / 14 / 16 / 18 / 24 / 32 px — tight, readable hierarchy
- **Weights**: 400 (body), 500 (labels), 600 (headings)

### 2.3 Spacing
- Base unit: `4px`
- Consistent rhythm: 8, 12, 16, 24, 32, 48, 64

### 2.4 Components Style Rules
- Border radius: `6px` (cards), `4px` (buttons/inputs)
- Borders: `1px solid var(--gray-200)`
- Shadows: **none** (or 1 very subtle `0 1px 2px rgba(0,0,0,0.04)` for elevated cards only)
- No gradients
- Transitions: `150ms ease` for hover/focus states only

---

## 3. Core Data Model

### 3.1 Event Schema
```js
{
  id: "evt_abc123",           // Generated UUID
  title: "Moved to Portland",
  description: "Family relocated for dad's new job at Intel.",
  dateStart: "1994-06-15",    // ISO string (YYYY-MM-DD)
  dateEnd: null,              // null if single date, ISO string if range
  dateRaw: "summer of '94",   // Original text as found
  datePrecision: "month",     // "day" | "month" | "year" | "decade" | "approximate"
  flagged: true,              // Ambiguous date needing review
  flagReason: "Exact day unknown; inferred June from 'summer'",
  people: ["Dad", "Mom"],
  tags: ["relocation", "career"],
  photos: ["portland-house-1994.jpg"],  // Matched photo filenames
  source: "journal"           // Which input block this came from
}
```

### 3.2 Timeline Store Shape
```js
{
  // Core data
  events: [],                  // Array of Event objects
  photos: [],                  // Array of { file, name, objectUrl, matchedEventIds }

  // UI state
  activeView: "vertical",      // "vertical" | "horizontal" | "grid"
  filters: {
    search: "",
    people: [],
    tags: [],
  },
  reviewMode: false,           // Show flagged items panel

  // Parsing state
  isParsing: false,
  parseError: null,

  // Actions
  setEvents: (events) => ...,
  updateEvent: (id, changes) => ...,
  deleteEvent: (id) => ...,
  setPhotos: (photos) => ...,
  setActiveView: (view) => ...,
  setFilters: (filters) => ...,
  clearFilters: () => ...,
  toggleReviewMode: () => ...,
}
```

---

## 4. Feature Implementation — Step by Step

### Phase 1: Foundation (Steps 1–3)

**Step 1 — Vite scaffold + Tailwind + routing**
- `npm create vite@latest` with React template
- Install and configure Tailwind CSS v4 via `@tailwindcss/vite`
- Set up `react-router-dom` with three routes: `/` (input), `/timeline` (results), `/s/:data` (shared view)
- Create `Shell.jsx`, `Header.jsx` layout components
- Apply design tokens (colors, fonts, spacing) in `index.css`
- Verify: app runs, routes work, styling renders

**Step 2 — Input page**
- Build `TextInput.jsx`: large textarea with placeholder guidance
- Build `PhotoUpload.jsx`: drag-and-drop zone, file preview, stores as in-memory object URLs
- Build `InputPage.jsx`: combines both + "Generate Timeline" button
- Wire up Zustand store basics
- Verify: can paste text, upload photos, see previews

**Step 3 — Vercel serverless AI parsing endpoint**
- Create `api/parse.js` serverless function
- Accepts `{ text, photoFilenames }` as POST body
- Calls Anthropic Claude API with a structured prompt:
  - Extract dates (full, partial, ranged)
  - Normalize to `dateStart` / `dateEnd` / `datePrecision`
  - Extract titles, descriptions, people, tags
  - Match mentioned photos
  - Flag ambiguous dates with reasons
- Returns structured JSON array of events
- Environment variable: `ANTHROPIC_API_KEY` (set in Vercel dashboard)
- Client-side `useParsing.js` hook handles loading/error state
- Verify: paste sample text → get structured events back

### Phase 2: Timeline Views (Steps 4–6)

**Step 4 — Vertical timeline view (default)**
- Build `TimelinePage.jsx` with view switcher tabs
- Build `YearGroup.jsx`: year heading + list of events
- Build `EventCard.jsx`: title, date, description, people badges, tag badges, photo thumbnails
- Sort events chronologically
- Group by year
- Handle partial dates (year-only, decade, approximate)
- Verify: parsed events display in a clean, year-grouped vertical list

**Step 5 — Horizontal timeline view**
- Build `HorizontalView.jsx` using SVG
- Render a horizontal time axis with year markers
- Position events along the axis based on date
- Show condensed event cards on hover/click
- Horizontal scroll with grab-to-pan
- Handle date ranges as spans
- Verify: same events render on a scrollable horizontal axis

**Step 6 — Grid view**
- Build `GridView.jsx` with responsive card grid
- Reuse `EventCard.jsx` in card layout
- Sort chronologically, left-to-right, top-to-bottom
- Photo-forward: if event has photo, show it prominently
- Verify: same events render in a card grid

### Phase 3: Review & Filtering (Steps 7–8)

**Step 7 — Review system for flagged dates**
- Build `ReviewPanel.jsx`: slide-in side panel listing flagged events
- Build `FlaggedDate.jsx`: shows original text, parsed interpretation, flag reason
- Build `InlineEditor.jsx`: edit date, title, description directly
- Changes update the store immediately (no reprocessing)
- Badge count on review button shows number of flagged items
- Verify: flagged items appear in panel, inline edits persist, no re-parse

**Step 8 — Filtering & search**
- Build `FilterBar.jsx` with search input + filter dropdowns
- `SearchInput.jsx`: full-text search across title + description
- `PeopleFilter.jsx`: multi-select dropdown of extracted people
- `TagFilter.jsx`: multi-select dropdown of extracted tags
- All filters are client-side, instant, combined with AND logic
- Active filters shown as dismissible badges
- "Clear all" button
- Filters persist across view switches
- Verify: search narrows results, people/tag filters work, clear resets

### Phase 4: Sharing & Export (Steps 9–10)

**Step 9 — Export functionality**
- Build `ExportMenu.jsx` dropdown
- **JSON export**: download events array as `.json`
- **CSV export**: flatten events → CSV via `papaparse`, download as `.csv`
- **HTML export**: generate a self-contained HTML file with inline CSS + data, fully offline-viewable
- Use `file-saver` for triggering downloads
- Verify: all three formats download correctly and are valid

**Step 10 — Shareable link**
- Build `ShareLink.jsx`
- Compress event data with `lz-string`
- Encode into a URL fragment: `/s/#<compressed-data>`
- Copy-to-clipboard button
- Build `SharedViewPage.jsx`: read-only timeline from URL data
- Decodes + decompresses on load
- Shows vertical view (read-only, no editing)
- Handle "data too large for URL" gracefully (offer HTML download instead)
- Verify: generate link → open in new tab → timeline renders correctly

### Phase 5: Polish & Deploy (Steps 11–12)

**Step 11 — Empty states, loading, errors**
- Empty state for input page (guidance text)
- Loading skeleton while parsing
- Error state if parsing fails (retry button)
- Empty state for "no results" after filtering
- Responsive design pass (mobile-friendly at 375px+)
- Keyboard navigation basics (tab order, escape to close panels)

**Step 12 — Vercel deployment**
- Add `vercel.json` configuration:
  - Serverless function routing for `/api/parse`
  - SPA fallback rewrites for client routing
- Set `ANTHROPIC_API_KEY` environment variable in Vercel
- Test production build locally with `vite build && vite preview`
- Deploy
- Verify: full flow works in production (paste → parse → view → export → share)

---

## 5. AI Parsing Prompt Strategy

The `/api/parse` serverless function will send the user's text to Claude with a structured system prompt:

```
You are a timeline extraction engine. Given raw text (journal entries,
biographical notes, research notes, family history), extract every
identifiable event and return structured JSON.

For each event, extract:
- title: Short descriptive title (5-10 words)
- description: 1-2 sentence summary
- dateStart: ISO date string (YYYY-MM-DD). Use YYYY-MM-01 if day unknown,
  YYYY-01-01 if month unknown.
- dateEnd: ISO date string if this is a range, otherwise null
- dateRaw: The original date text as found in the source
- datePrecision: "day" | "month" | "year" | "decade" | "approximate"
- flagged: true if the date is ambiguous or inferred
- flagReason: Explanation of ambiguity (null if not flagged)
- people: Array of person names mentioned
- tags: Array of category tags (e.g., "career", "education", "travel")

Also accept an optional list of photo filenames. If any filename or its
components (dates, names, locations) match an event, include it in that
event's "photos" array.

Return valid JSON: { "events": [...] }
```

---

## 6. Vercel Configuration

```json
// vercel.json
{
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/((?!api/).*)", "destination": "/index.html" }
  ]
}
```

---

## 7. Key Technical Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| State management | Zustand | Minimal API, no boilerplate, works great with React |
| Styling | Tailwind CSS | Matches design direction, fast iteration, no CSS files to manage |
| Horizontal view | SVG | Full control over axis, positioning, and interactions |
| Shareable links | lz-string + URL fragment | No backend needed, data stays client-side |
| AI parsing | Vercel Serverless + Claude API | Keeps API key secure, simple deployment |
| Date handling | date-fns | Tree-shakeable, immutable, well-documented |
| CSV | papaparse | Proven library, handles edge cases |

---

## 8. What This Plan Does NOT Include (By Design)

- No database or persistence layer
- No user accounts or authentication
- No real-time collaboration
- No server-side storage of timelines
- No complex animations or transitions
- No dark mode (could be added later, not in scope)
- No i18n/localization
- No analytics or tracking

---

## Summary: Build Order

| Step | What | Builds On |
|------|------|-----------|
| 1 | Vite + Tailwind + Router + Layout | — |
| 2 | Input page (text + photos) | Step 1 |
| 3 | AI parsing serverless function | Step 2 |
| 4 | Vertical timeline view | Step 3 |
| 5 | Horizontal timeline view | Step 4 |
| 6 | Grid view | Step 4 |
| 7 | Review system (flagged dates) | Step 4 |
| 8 | Filtering & search | Step 4 |
| 9 | Export (JSON, CSV, HTML) | Step 4 |
| 10 | Shareable link | Step 4 |
| 11 | Polish (empty states, responsive, errors) | All above |
| 12 | Vercel deployment | All above |
