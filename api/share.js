import { createClient } from '@supabase/supabase-js'
import { getClientIP, checkRateLimit, applySecurityHeaders, applyCorsHeaders } from './rateLimit.js'

// ─── Supabase client for server-side share storage ───────
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
// Use anon key only — service role key bypasses RLS and is not needed for shares
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY

const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null

const RATE_LIMIT_MAX_REQUESTS = 20
const RATE_LIMIT_DAILY_MAX = 500
const MAX_SHARE_SIZE = 500_000 // ~500KB max payload

// ─── ID generation ───────────────────────────────────────
function generateShareId() {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let id = ''
  const bytes = new Uint8Array(10)
  crypto.getRandomValues(bytes)
  for (const b of bytes) id += chars[b % chars.length]
  return id
}

// ─── OG HTML template ────────────────────────────────────
function buildOGHtml(meta, shareId, origin) {
  const esc = (s) =>
    String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')

  const title = esc(meta?.title || 'Shared Timeline')
  const description = esc(
    meta?.description || `A timeline with ${meta?.eventCount || 0} events — created with Timeliner`
  )
  const url = `${origin}/s?id=${shareId}`

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title} — Timeliner</title>
  <meta name="description" content="${description}">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:type" content="website">
  <meta property="og:url" content="${url}">
  <meta name="twitter:card" content="summary">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta http-equiv="refresh" content="0;url=${url}">
</head>
<body>
  <p>Redirecting to <a href="${url}">${title}</a>...</p>
</body>
</html>`
}

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

  // ─── GET: Fetch a shared timeline ────────────────────────
  if (req.method === 'GET') {
    const { id, og } = req.query
    if (!id || typeof id !== 'string' || id.length > 20) {
      return res.status(400).json({ error: 'Invalid share ID' })
    }

    const { data, error } = await supabase
      .from('shared_timelines')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) {
      return res.status(404).json({ error: 'Share not found' })
    }

    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return res.status(410).json({ error: 'This share link has expired' })
    }

    // If og=1, return HTML with OG tags for social crawlers
    if (og === '1') {
      const origin = req.headers.origin || `https://${req.headers.host}`
      res.setHeader('Content-Type', 'text/html; charset=utf-8')
      return res.status(200).send(buildOGHtml(data.meta, id, origin))
    }

    return res.status(200).json({
      events: data.data?.events || [],
      meta: data.meta || {},
    })
  }

  // ─── POST: Create a shared timeline ──────────────────────
  if (req.method === 'POST') {
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

    const id = generateShareId()
    const days = [30, 90, 365].includes(expiresInDays) ? expiresInDays : 90
    const expiresAt = new Date(Date.now() + days * 86_400_000).toISOString()

    const { error } = await supabase.from('shared_timelines').insert({
      id,
      data: { events },
      meta: {
        title: meta?.title || 'Shared Timeline',
        description: meta?.description || '',
        eventCount: events.length,
      },
      expires_at: expiresAt,
      created_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Share insert error:', error)
      return res.status(500).json({ error: 'Failed to create share' })
    }

    const origin = req.headers.origin || `https://${req.headers.host}`
    return res.status(201).json({
      id,
      url: `${origin}/s?id=${id}`,
      expiresAt,
    })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
