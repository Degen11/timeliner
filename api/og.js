import { readFile } from 'node:fs/promises'
import { createClient } from '@supabase/supabase-js'
import { ImageResponse } from '@vercel/og'
import { getClientIP, checkRateLimit, applySecurityHeaders } from './rateLimit.js'

// ─── Per-share Open Graph image ──────────────────────────
// GET /og/:id (rewritten to /api/og?id=:id in vercel.json — the public path
// keeps it outside robots.txt's `Disallow: /api/`, which Twitterbot honors).
// Renders a 1200x630 PNG in the same style as public/og-image.png, showing the
// shared timeline's title, event count, date span and a few of its events.
// Missing or expired shares redirect to the static site image.
// @vercel/og stays on 0.8.x: 1.0.x's Node build throws on import
// ("Dynamic require of fs is not supported") outside Next.js.

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

const IMAGE_WIDTH = 1200
const IMAGE_HEIGHT = 630
const FALLBACK_IMAGE = '/og-image.png?v=3'
const MAX_SHARE_ID_LENGTH = 20
const MAX_CARD_EVENTS = 3
const MAX_TITLE_LENGTH = 80
const MAX_EVENT_TITLE_LENGTH = 30
// Crawlers fetch previews in bursts from shared IPs, and the CDN absorbs repeats,
// so this is looser than the share endpoint's limit.
const RATE_LIMIT_MAX_REQUESTS = 60
const RATE_LIMIT_DAILY_MAX = 2000
const CACHE_CONTROL = 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400'
const CARD_COLORS = ['#0d9488', '#f97316', '#db2777']
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const LOGO_SVG =
  'data:image/svg+xml;base64,' +
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">' +
      '<line x1="8" y1="3" x2="8" y2="21" stroke="#171717" stroke-width="2" stroke-linecap="round"/>' +
      '<circle cx="8" cy="6" r="3" fill="#f97316"/>' +
      '<circle cx="8" cy="13" r="2.5" fill="#171717" opacity="0.7"/>' +
      '<circle cx="8" cy="20" r="2" fill="#171717" opacity="0.4"/>' +
      '<line x1="12" y1="6" x2="20" y2="6" stroke="#171717" stroke-width="2" stroke-linecap="round"/>' +
      '<line x1="12" y1="13" x2="18" y2="13" stroke="#171717" stroke-width="2" stroke-linecap="round" opacity="0.7"/>' +
      '</svg>'
  ).toString('base64')

// ─── Fonts (loaded once per warm instance) ───────────────

const FONT_FILES = [
  { name: 'Newsreader', weight: 600, files: ['newsreader-latin-600-normal.woff', 'newsreader-latin-ext-600-normal.woff'] },
  { name: 'Jakarta', weight: 700, files: ['plus-jakarta-sans-latin-700-normal.woff', 'plus-jakarta-sans-latin-ext-700-normal.woff'] },
  { name: 'Inter', weight: 500, files: ['inter-latin-500-normal.woff', 'inter-latin-ext-500-normal.woff'] },
]

let fontsPromise = null

function loadFonts() {
  fontsPromise ??= Promise.all(
    FONT_FILES.flatMap(({ name, weight, files }) =>
      files.map(async (file) => ({
        name,
        weight,
        style: 'normal',
        data: await readFile(new URL(`./_fonts/${file}`, import.meta.url)),
      }))
    )
  )
  return fontsPromise
}

// ─── Helpers ─────────────────────────────────────────────

function truncate(text, max) {
  const s = String(text || '').trim()
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s
}

/** "1962" | "August 1984" | "September 7, 2019" from the app's ISO-ish dates. */
export function formatEventDate(dateStr) {
  const m = /^(-?\d{1,4})(?:-(\d{2}))?(?:-(\d{2}))?/.exec(String(dateStr || ''))
  if (!m) return ''
  const [, year, month, day] = m
  const monthName = month ? MONTHS[Number(month) - 1] : null
  if (!monthName) return year
  return day ? `${monthName} ${Number(day)}, ${year}` : `${monthName} ${year}`
}

function yearOf(dateStr) {
  return /^(-?\d{1,4})/.exec(String(dateStr || ''))?.[1] || null
}

/**
 * Pick up to MAX_CARD_EVENTS events that show the timeline's span: the first,
 * one from the middle, and the last (by date). Undated events fill in only when
 * there aren't enough dated ones.
 */
export function pickCardEvents(events) {
  const valid = (Array.isArray(events) ? events : []).filter((e) => e && e.title)
  const dated = valid
    .filter((e) => yearOf(e.dateStart))
    .sort((a, b) => String(a.dateStart).localeCompare(String(b.dateStart)))
  const pool = dated.length >= MAX_CARD_EVENTS ? dated : [...dated, ...valid.filter((e) => !yearOf(e.dateStart))]
  if (pool.length <= MAX_CARD_EVENTS) return pool
  const last = pool.length - 1
  return [pool[0], pool[Math.floor(last / 2)], pool[last]]
}

/** "1962 – 2019" (or a single year), from the earliest and latest dated events. */
export function getDateSpan(events) {
  const years = (Array.isArray(events) ? events : [])
    .map((e) => yearOf(e?.dateStart))
    .filter(Boolean)
    .map(Number)
  if (years.length === 0) return ''
  const min = Math.min(...years)
  const max = Math.max(...years)
  return min === max ? String(min) : `${min} – ${max}`
}

function titleFontSize(title) {
  if (title.length <= 24) return 76
  if (title.length <= 48) return 62
  return 50
}

// Satori takes React-element-shaped objects; this keeps the tree readable
// without JSX (api/ is plain JS).
function h(type, style, ...children) {
  const flat = children.flat().filter((c) => c !== null && c !== undefined && c !== false)
  // Satori rejects an empty children array on a non-flex div, so leave it off.
  if (flat.length === 0) return { type, props: { style } }
  return { type, props: { style, children: flat.length === 1 ? flat[0] : flat } }
}

export function buildShareImageTree({ title, eventCount, span, cards }) {
  const subtitle = [`${eventCount} event${eventCount === 1 ? '' : 's'}`, span].filter(Boolean).join(' · ')

  const left = h(
    'div',
    { display: 'flex', flexDirection: 'column', width: 600, height: '100%', justifyContent: 'space-between' },
    h(
      'div',
      { display: 'flex', flexDirection: 'column' },
      h(
        'div',
        { display: 'flex', alignItems: 'center' },
        { type: 'img', props: { src: LOGO_SVG, width: 34, height: 34 } },
        h('div', { fontFamily: 'Jakarta', fontSize: 32, marginLeft: 12, letterSpacing: -0.5 }, 'timeliner')
      ),
      h(
        'div',
        { display: 'flex', marginTop: 64, fontFamily: 'Inter', fontSize: 18, letterSpacing: 2.5, color: '#ea580c' },
        'SHARED TIMELINE'
      ),
      h(
        'div',
        { display: 'flex', marginTop: 14, fontFamily: 'Newsreader', fontSize: titleFontSize(title), lineHeight: 1.04, letterSpacing: -1 },
        title
      ),
      h('div', { display: 'flex', marginTop: 26, fontFamily: 'Inter', fontSize: 28, color: '#404040' }, subtitle)
    ),
    h('div', { display: 'flex', fontFamily: 'Inter', fontSize: 22, color: '#6b6b6b' }, 'Made with timeliner.app')
  )

  const right = h(
    'div',
    { display: 'flex', flexDirection: 'column', justifyContent: 'center', width: 420, height: '100%', position: 'relative' },
    h('div', { position: 'absolute', left: 56, top: 30, bottom: 30, width: 3, backgroundColor: '#e5e5e5', borderRadius: 2 }),
    cards.map((card, i) =>
      h(
        'div',
        { display: 'flex', alignItems: 'center', marginTop: i === 0 ? 0 : 28 },
        h('div', {
          width: 18,
          height: 18,
          marginLeft: 48,
          borderRadius: 9,
          border: '4px solid #f7f5f1',
          backgroundColor: CARD_COLORS[i % CARD_COLORS.length],
        }),
        h(
          'div',
          {
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            marginLeft: 20,
            padding: '14px 20px',
            backgroundColor: '#ffffff',
            borderRadius: 12,
            borderLeft: `5px solid ${CARD_COLORS[i % CARD_COLORS.length]}`,
            boxShadow: '0 4px 14px rgba(23,23,23,0.06)',
          },
          card.date ? h('div', { display: 'flex', fontFamily: 'Newsreader', fontSize: 20, color: '#6b6b6b' }, card.date) : null,
          h('div', { display: 'flex', fontFamily: 'Jakarta', fontSize: 24, marginTop: card.date ? 2 : 0 }, card.title)
        )
      )
    )
  )

  return h(
    'div',
    {
      display: 'flex',
      justifyContent: 'space-between',
      width: '100%',
      height: '100%',
      padding: '72px 68px 52px 72px',
      backgroundColor: '#f7f5f1',
      backgroundImage: 'radial-gradient(circle at 92% 8%, rgba(249,115,22,0.10), rgba(249,115,22,0) 45%)',
      color: '#171717',
    },
    left,
    right
  )
}

function fallback(res) {
  res.setHeader('Location', FALLBACK_IMAGE)
  res.setHeader('Cache-Control', 'public, max-age=3600')
  return res.status(302).end()
}

// ─── Main handler ────────────────────────────────────────

export default async function handler(req, res) {
  applySecurityHeaders(res)

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { id } = req.query
  if (!id || typeof id !== 'string' || id.length > MAX_SHARE_ID_LENGTH) {
    return res.status(400).json({ error: 'Invalid share ID' })
  }

  const rl = checkRateLimit(`og:${getClientIP(req)}`, {
    maxRequests: RATE_LIMIT_MAX_REQUESTS,
    dailyMax: RATE_LIMIT_DAILY_MAX,
  })
  if (!rl.allowed) {
    res.setHeader('Retry-After', rl.retryAfter)
    return res.status(429).json({ error: 'Rate limit exceeded' })
  }

  if (!supabase) return fallback(res)

  const { data, error } = await supabase
    .from('shared_timelines')
    .select('data, meta, expires_at')
    .eq('id', id)
    .single()

  if (error || !data) return fallback(res)
  if (data.expires_at && new Date(data.expires_at) < new Date()) return fallback(res)

  const events = data.data?.events || []
  const tree = buildShareImageTree({
    title: truncate(data.meta?.title || 'Shared Timeline', MAX_TITLE_LENGTH),
    eventCount: data.meta?.eventCount ?? events.length,
    span: getDateSpan(events),
    cards: pickCardEvents(events).map((e) => ({
      date: formatEventDate(e.dateStart),
      title: truncate(e.title, MAX_EVENT_TITLE_LENGTH),
    })),
  })

  try {
    const image = new ImageResponse(tree, {
      width: IMAGE_WIDTH,
      height: IMAGE_HEIGHT,
      fonts: await loadFonts(),
    })
    const png = Buffer.from(await image.arrayBuffer())
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', CACHE_CONTROL)
    return res.status(200).send(png)
  } catch (err) {
    console.error('OG image render error:', err)
    return fallback(res)
  }
}
