import { createClient } from '@supabase/supabase-js'
import { getClientIP, checkRateLimit, applySecurityHeaders, applyCorsHeaders } from './rateLimit.js'

// ─── Supabase client for server-side share storage ───────
// Prefer service role key for server-side operations — it bypasses RLS,
// which lets you lock down the shared_timelines insert policy to
// service_role only (preventing direct client-side inserts that bypass
// API rate limiting). Falls back to anon key for backward compatibility.
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

// Social-media / search-engine crawlers that need OG meta tags
const CRAWLER_UA_RE =
  /facebookexternalhit|Facebot|Twitterbot|LinkedInBot|Slackbot|WhatsApp|TelegramBot|Discordbot|Googlebot|bingbot|Embedly|Quora Link Preview|Showyoubot|outbrain|pinterest|vkShare|W3C_Validator/i

const RATE_LIMIT_MAX_REQUESTS = 20
const RATE_LIMIT_DAILY_MAX = 500
const MAX_SHARE_SIZE = 500_000
const MAX_SHARE_ID_LENGTH = 20
const MAX_META_TITLE_LENGTH = 200
const MAX_META_DESCRIPTION_LENGTH = 500
const ALLOWED_EXPIRY_DAYS = [30, 90, 365]
const DEFAULT_EXPIRY_DAYS = 90
const MS_PER_DAY = 86_400_000

// ─── Helpers ─────────────────────────────────────────────

function generateShareId() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let id = ''
  const bytes = new Uint8Array(10)
  crypto.getRandomValues(bytes)
  for (const b of bytes) id += chars[b % chars.length]
  return id
}

/**
 * Resolve the public origin for canonical/OG/redirect URLs.
 *
 * The request Host header is attacker-controllable and must not be reflected
 * into OG previews or redirect targets (link-preview poisoning / open redirect).
 * Prefer an explicitly configured origin; only fall back to the Host header for
 * self-hosted/dev setups that haven't configured one.
 */
function getTrustedOrigin(req) {
  const configured = process.env.PUBLIC_BASE_URL || process.env.ALLOWED_ORIGIN
  if (configured && configured !== '*') return configured.replace(/\/+$/, '')
  const host = req.headers.host
  return host ? `https://${host}` : ''
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function buildOGHtml(meta, shareId, origin) {
  const title = escapeHtml(meta?.title || 'Shared Timeline')
  const description = escapeHtml(
    meta?.description || `A timeline with ${meta?.eventCount || 0} events — created with Timeliner`
  )
  const canonicalUrl = `${origin}/share/${shareId}`
  const spaUrl = `${origin}/s?id=${shareId}`
  // ?v=2 busts crawler caches keyed on the old image at this URL
  const ogImage = `${origin}/og-image.png?v=2`

  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: meta?.title || 'Shared Timeline',
    description: meta?.description || `A timeline with ${meta?.eventCount || 0} events`,
    url: canonicalUrl,
    image: ogImage,
    isPartOf: { '@id': `${origin}/#website` },
    creator: { '@id': `${origin}/#organization` },
  })
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} — Timeliner</title>
  <meta name="description" content="${description}">
  <meta name="robots" content="noindex, follow">
  <link rel="canonical" href="${canonicalUrl}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${canonicalUrl}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:width" content="2400">
  <meta property="og:image:height" content="1260">
  <meta property="og:image:alt" content="${title}">
  <meta property="og:site_name" content="Timeliner">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${ogImage}">
  <meta name="twitter:image:alt" content="${title}">
  <script type="application/ld+json">${jsonLd}</script>
  <meta http-equiv="refresh" content="0;url=${spaUrl}">
</head>
<body>
  <p>Redirecting to <a href="${spaUrl}">${title}</a>...</p>
</body>
</html>`
}

// ─── Route handlers ──────────────────────────────────────

async function handleGet(req, res) {
  const { id, og, _r } = req.query
  if (!id || typeof id !== 'string' || id.length > MAX_SHARE_ID_LENGTH) {
    return res.status(400).json({ error: 'Invalid share ID' })
  }

  // Detect crawlers for automatic OG HTML serving
  const ua = req.headers['user-agent'] || ''
  const isCrawler = CRAWLER_UA_RE.test(ua)
  const wantsOg = og === '1' || isCrawler

  // Request arrived via /share/:id rewrite (_r=1) from a normal browser — redirect to SPA
  if (_r === '1' && !wantsOg) {
    res.setHeader('Location', `/s?id=${encodeURIComponent(id)}`)
    return res.status(302).end()
  }

  const { data, error } = await supabase
    .from('shared_timelines')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) {
    return res.status(404).json({ error: 'Share not found' })
  }

  if (data.expires_at && new Date(data.expires_at) < new Date()) {
    return res.status(410).json({ error: 'This share link has expired' })
  }

  if (wantsOg) {
    const origin = getTrustedOrigin(req)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.status(200).send(buildOGHtml(data.meta, id, origin))
  }

  return res.status(200).json({
    events: data.data?.events || [],
    meta: data.meta || {},
  })
}

async function handlePost(req, res) {
  const { events, meta, expiresInDays } = req.body || {}

  if (!events || !Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: 'Events array is required' })
  }

  const payload = JSON.stringify({ events })
  if (payload.length > MAX_SHARE_SIZE) {
    return res.status(413).json({
      error: `Timeline too large for sharing (${Math.round(payload.length / 1024)}KB). Maximum is ${Math.round(MAX_SHARE_SIZE / 1024)}KB.`,
    })
  }

  // Bound caller-supplied meta so it can't be used as an unbounded-storage vector.
  const metaTitle = String(meta?.title || 'Shared Timeline').slice(0, MAX_META_TITLE_LENGTH)
  const metaDescription = String(meta?.description || '').slice(0, MAX_META_DESCRIPTION_LENGTH)

  const id = generateShareId()
  const days = ALLOWED_EXPIRY_DAYS.includes(expiresInDays) ? expiresInDays : DEFAULT_EXPIRY_DAYS
  const expiresAt = new Date(Date.now() + days * MS_PER_DAY).toISOString()

  const { error } = await supabase.from('shared_timelines').insert({
    id,
    data: { events },
    meta: {
      title: metaTitle,
      description: metaDescription,
      eventCount: events.length,
    },
    expires_at: expiresAt,
    created_at: new Date().toISOString(),
  })

  if (error) {
    console.error('Share insert error:', error)
    return res.status(500).json({ error: 'Failed to create share' })
  }

  const origin = getTrustedOrigin(req)
  return res.status(201).json({ id, url: `${origin}/share/${id}`, expiresAt })
}

// ─── Main handler ────────────────────────────────────────

export default async function handler(req, res) {
  applySecurityHeaders(res)
  applyCorsHeaders(req, res)

  if (req.method === 'OPTIONS') return res.status(204).end()

  if (!supabase) {
    return res.status(503).json({ error: 'Share service not configured' })
  }

  const clientKey = getClientIP(req)
  const rl = checkRateLimit(clientKey, { maxRequests: RATE_LIMIT_MAX_REQUESTS, dailyMax: RATE_LIMIT_DAILY_MAX })
  if (!rl.allowed) {
    res.setHeader('Retry-After', rl.retryAfter)
    return res.status(429).json({ error: 'Rate limit exceeded' })
  }

  if (req.method === 'GET') return handleGet(req, res)
  if (req.method === 'POST') return handlePost(req, res)

  return res.status(405).json({ error: 'Method not allowed' })
}
