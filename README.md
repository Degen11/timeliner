# Timeliner

Transform messy family history, journal entries, or biographical notes into beautiful, interactive timelines. Just paste text, add photos, and get a shareable timeline — no account required.

## Tech Stack

- React + Vite (JavaScript)
- Tailwind CSS v4
- Zustand (state management)
- Vercel Serverless Functions (AI parsing)
- Claude API (event extraction)

## Color System

Timeliner uses a structured color palette defined in `src/index.css` via Tailwind v4's `@theme` block.

### Core Palette

| Role | Value | Tailwind Class | Usage |
|---|---|---|---|
| Primary | `#2B2F3A` | `bg-primary`, `text-primary` | Navigation, primary buttons, major headings, timeline axis |
| Primary Hover | `#222632` | `hover:bg-primary-hover` | Button hover and interactive states |
| Secondary | `#4F46E5` | `bg-secondary`, `text-secondary` | Active states, chips, selected filters, focus rings |
| Highlight | `#0EA5E9` | `text-highlight` | Informational highlights only (not primary CTAs) |
| Soft Accent | `#EEF2FF` | `bg-soft-accent` | Callout sections, helper panels, onboarding surfaces |
| Canvas | `#F8FAFC` | `bg-canvas` | App background |
| Surface | `#FFFFFF` | `bg-surface` | Cards, modals, elevated containers |
| Text Strong | `#0F172A` | `text-text-strong` | Primary text, headings |
| Text Muted | `#64748B` | `text-text-muted` | Secondary text, descriptions |

### Visual Ratio

- ~70% neutral (grays, canvas, surface)
- ~20% primary charcoal (navigation, buttons, headings)
- ~7-10% indigo secondary (active states, focus, chips)
- ≤5% sky highlight (informational only)

### Status Colors

| Role | Value | Usage |
|---|---|---|
| Success | `#059669` | Success states, resolved items |
| Error | `#DC2626` | Error states, destructive actions |
| Flag | `#D97706` | Flagged/review items |

## Development

```bash
npm install
npm run dev
```

## Deployment

Hosted on Vercel. Set `ANTHROPIC_API_KEY` in your Vercel environment variables.
