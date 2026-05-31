// ─── Rate Limiting ────────────────────────────────────────
// Shared rate limiter for all API endpoints.
//
// Default: in-memory Map (resets on cold start — fine for burst protection).
// Production: set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN env vars
// and install @upstash/ratelimit + @upstash/redis for persistent limits.

const rateLimitMap = new Map()

const STALE_ENTRY_MS = 172_800_000   // 48 hours
const CLEANUP_INTERVAL_MS = 300_000  // 5 minutes

// Periodically clean up stale entries
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap) {
    if (now - (entry.dailyStart || entry.windowStart) > STALE_ENTRY_MS) {
      rateLimitMap.delete(key)
    }
  }
}, CLEANUP_INTERVAL_MS)

/**
 * Extract client IP from request headers.
 *
 * On Vercel, x-forwarded-for is set by the edge network and is trustworthy.
 * We take only the first (leftmost) IP which is the original client.
 * Basic format validation prevents header injection from polluting rate-limit keys.
 */
const IP_RE = /^[\d.a-fA-F:]{3,45}$/

export function getClientIP(req) {
  const candidates = [
    req.headers['x-forwarded-for']?.split(',')[0]?.trim(),
    req.headers['x-real-ip'],
    req.socket?.remoteAddress,
  ]

  for (const ip of candidates) {
    if (ip && IP_RE.test(ip)) return ip
  }

  return 'unknown'
}

/**
 * Check rate limit for a key.
 *
 * @param {string} key - Client identifier (usually IP)
 * @param {object} opts
 * @param {number} opts.windowMs - Burst window in ms (default: 60_000)
 * @param {number} opts.maxRequests - Max requests per window (default: 10)
 * @param {number} [opts.dailyMax] - Optional daily budget cap
 * @returns {{ allowed: boolean, remaining: number, retryAfter?: number }}
 */
export function checkRateLimit(key, {
  windowMs = 60_000,
  maxRequests = 10,
  dailyMax,
} = {}) {
  const now = Date.now()
  const dailyWindowMs = 86_400_000
  let entry = rateLimitMap.get(key)

  if (!entry) {
    entry = { windowStart: now, count: 1, dailyStart: now, dailyCount: 1 }
    rateLimitMap.set(key, entry)
    return { allowed: true, remaining: maxRequests - 1 }
  }

  // Reset expired windows BEFORE evaluating limits so counts reflect the
  // current windows. Counters are only incremented for allowed requests
  // (below) — a rejected request must not consume daily/burst budget.
  if (dailyMax && now - entry.dailyStart > dailyWindowMs) {
    entry.dailyStart = now
    entry.dailyCount = 0
  }
  if (now - entry.windowStart > windowMs) {
    entry.windowStart = now
    entry.count = 0
  }

  // Daily budget check (if configured) — reject without consuming budget.
  if (dailyMax && entry.dailyCount >= dailyMax) {
    const retryAfter = Math.ceil((entry.dailyStart + dailyWindowMs - now) / 1000)
    return { allowed: false, remaining: 0, retryAfter }
  }

  // Per-window burst check — reject without consuming budget.
  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000)
    return { allowed: false, remaining: 0, retryAfter }
  }

  // Allowed — consume one slot from each active window.
  entry.count++
  if (dailyMax) entry.dailyCount++

  return { allowed: true, remaining: Math.max(0, maxRequests - entry.count) }
}

/**
 * Apply standard security headers to a response.
 */
export function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co https://api.anthropic.com https://nominatim.openstreetmap.org; font-src 'self';"
  )
}

/**
 * Apply CORS headers based on ALLOWED_ORIGIN env var.
 */
export function applyCorsHeaders(req, res) {
  const origin = req.headers.origin || ''
  const allowed = process.env.ALLOWED_ORIGIN
  if (!allowed) {
    // ALLOWED_ORIGIN not configured — derive from Host header (same-origin only).
    // Set ALLOWED_ORIGIN in production for explicit control.
    const host = req.headers.host
    const derived = host ? `https://${host}` : ''
    if (origin && derived && origin === derived) {
      res.setHeader('Access-Control-Allow-Origin', origin)
    }
  } else if (allowed === '*') {
    // Explicit public access: emit a literal wildcard rather than reflecting
    // the caller's Origin (reflection becomes unsafe if credentials are ever added).
    res.setHeader('Access-Control-Allow-Origin', '*')
  } else if (origin === allowed) {
    res.setHeader('Access-Control-Allow-Origin', allowed)
  }
  // Prevent CDN from caching a response with one origin for another
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}
