// ─── Rate Limiting ────────────────────────────────────────
// Shared rate limiter for all API endpoints.
//
// Default: in-memory Map (resets on cold start — fine for burst protection).
// Production: set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN env vars
// and install @upstash/ratelimit + @upstash/redis for persistent limits.

const rateLimitMap = new Map()

// Periodically clean up stale entries (every 5 min)
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap) {
    if (now - (entry.dailyStart || entry.windowStart) > 172_800_000) {
      rateLimitMap.delete(key)
    }
  }
}, 300_000)

/**
 * Extract client IP from request headers.
 */
export function getClientIP(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  )
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
  let entry = rateLimitMap.get(key)

  if (!entry) {
    entry = { windowStart: now, count: 1, dailyStart: now, dailyCount: 1 }
    rateLimitMap.set(key, entry)
    return { allowed: true, remaining: maxRequests - 1 }
  }

  // Daily budget check (if configured)
  if (dailyMax) {
    const dailyWindowMs = 86_400_000
    if (now - entry.dailyStart > dailyWindowMs) {
      entry.dailyStart = now
      entry.dailyCount = 0
    }
    entry.dailyCount++

    if (entry.dailyCount > dailyMax) {
      const retryAfter = Math.ceil((entry.dailyStart + dailyWindowMs - now) / 1000)
      return { allowed: false, remaining: 0, retryAfter }
    }
  }

  // Per-window burst check
  if (now - entry.windowStart > windowMs) {
    entry.windowStart = now
    entry.count = 1
    return { allowed: true, remaining: maxRequests - 1 }
  }

  entry.count++
  if (entry.count > maxRequests) {
    const retryAfter = Math.ceil((entry.windowStart + windowMs - now) / 1000)
    return { allowed: false, remaining: 0, retryAfter }
  }

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
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; connect-src 'self' https://*.supabase.co https://api.anthropic.com https://nominatim.openstreetmap.org; font-src 'self';"
  )
}

/**
 * Apply CORS headers based on ALLOWED_ORIGIN env var.
 */
export function applyCorsHeaders(req, res) {
  const origin = req.headers.origin || ''
  const allowed = process.env.ALLOWED_ORIGIN || '*'
  const isAllowed = allowed === '*' || origin === allowed
  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', allowed === '*' ? origin || '*' : allowed)
  }
  // Prevent CDN from caching a response with one origin for another
  res.setHeader('Vary', 'Origin')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}
