# Timeliner

Timeliner transforms messy text and family photos into interactive, shareable timelines. Paste notes, upload images, parse with Claude Haiku, review ambiguous dates, then share/export your timeline.

Planned public domain: **timeliner.app**.

## Stack
- React + Vite (JavaScript)
- Lucide icons (`lucide-react`)
- Validation via `zod`
- Claude API via `@anthropic-ai/sdk` in a Vercel Serverless Function

> Yes, you still need `@anthropic-ai/sdk` for robust server-side API calls, even if you have an API key.

## Features
- Multi-input panel (paste text, people chips, drag/drop photos)
- Client-side photo filename date extraction
- Parse with Claude Haiku (`claude-3-haiku-20240307`)
- Zod validation on server model response and client share payload decode
- Three synchronized timeline views
  - Vertical timeline grouped by year (collapsible + density modes)
  - Horizontal SVG timeline with keyboard-focus points + decade ruler
  - Grid/card decade browser
- Review queue for ambiguous dates (local edit/save)
- Filter state shared across all views (search, people, tags)
- URL-shareable compressed state (`/#/t/<payload>`)
- LocalStorage backup for no-data-loss refresh
- Export JSON, CSV, and standalone HTML

## Project structure

```
timeliner/
├── api/
│   └── parse.js
├── src/
│   ├── components/
│   ├── hooks/
│   │   ├── useTimelineData.js
│   │   └── useShareLink.js
│   ├── lib/
│   │   ├── dateParse.js
│   │   ├── exportCsv.js
│   │   ├── exportHtml.js
│   │   ├── parseClient.js
│   │   ├── schema.js
│   │   └── shareCodec.js
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── public/
├── api/
├── .gitignore
├── package.json
├── vite.config.js
└── README.md
```

## Local setup

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create environment file:
   ```bash
   cp .env.example .env.local
   ```
3. Add API key:
   ```env
   ANTHROPIC_API_KEY=your_key_here
   ```
   Optional fallback key name supported by server: `VITE_ANTHROPIC_API_KEY`.
4. Run app:
   ```bash
   npm run dev
   ```

## Environment variables
- **Server-side required**:
  - `ANTHROPIC_API_KEY` (preferred)
  - `VITE_ANTHROPIC_API_KEY` (fallback only)

⚠️ Never expose key in client code. `api/parse.js` keeps key server-side.

## API route
- Endpoint: `POST /api/parse`
- Body:
  ```json
  {
    "text": "raw timeline notes",
    "photoFilenames": ["IMG_19651208_trip.jpg"]
  }
  ```
- Response: valid `TimelineData` JSON (Zod-validated)

## Vercel deploy
1. Push repo to Git provider.
2. Import project in Vercel.
3. Set env var `ANTHROPIC_API_KEY` in Project Settings.
4. Deploy.

Vercel automatically serves:
- React app from Vite build
- Serverless function from `api/parse.js`

## Share links and exports
- Copy Link: compressed deflate + base64url payload in hash
- If hash > 6000 chars, link copy disabled and warning shown
- Export JSON: full timeline data
- Export CSV: `date_display,start,end,title,description,people,tags,photo_filenames`
- Export HTML: self-contained basic multi-view renderer with optional photo embedding

## Notes
- Handles partial dates (`Aug 1965`, `1965`, `1965-1968`, `around 1965`)
- Ambiguous dates are marked for review with explanation
- Stable sort for same-day events (`start` then `title`)
