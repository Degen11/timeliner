// ─── Rate Limiting ────────────────────────────────────────
// Two-tier in-memory rate limiter: per-minute burst + daily budget cap.
//
// IMPORTANT: Vercel serverless functions run in isolated instances, so this
// in-memory Map does NOT share state across concurrent invocations.
// For production-grade limiting, replace with @upstash/ratelimit + Redis.
// This still protects against burst abuse within a single warm instance and
// applies a daily cap that resets every 24h per IP.

const rateLimitMap = new Map()
const RATE_LIMIT_WINDOW_MS = 60_000 // 1 minute window
const RATE_LIMIT_MAX_REQUESTS = 10 // 10 requests per minute per IP
const DAILY_BUDGET_MAX = 100 // max 100 requests per IP per day
const DAILY_WINDOW_MS = 86_400_000 // 24 hours
const MAX_TEXT_LENGTH = 50_000 // ~50k chars max input

function getRateLimitKey(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.headers['x-real-ip'] ||
    req.socket?.remoteAddress ||
    'unknown'
  )
}

function checkRateLimit(key) {
  const now = Date.now()
  let entry = rateLimitMap.get(key)

  if (!entry) {
    entry = { windowStart: now, count: 1, dailyStart: now, dailyCount: 1 }
    rateLimitMap.set(key, entry)
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 }
  }

  // Reset daily counter if 24h has passed
  if (now - entry.dailyStart > DAILY_WINDOW_MS) {
    entry.dailyStart = now
    entry.dailyCount = 0
  }
  entry.dailyCount++

  // Check daily budget
  if (entry.dailyCount > DAILY_BUDGET_MAX) {
    const retryAfter = Math.ceil((entry.dailyStart + DAILY_WINDOW_MS - now) / 1000)
    return { allowed: false, remaining: 0, retryAfter }
  }

  // Reset per-minute window
  if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    entry.windowStart = now
    entry.count = 1
    return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - 1 }
  }

  entry.count++
  if (entry.count > RATE_LIMIT_MAX_REQUESTS) {
    const retryAfter = Math.ceil((entry.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000)
    return { allowed: false, remaining: 0, retryAfter }
  }

  return { allowed: true, remaining: RATE_LIMIT_MAX_REQUESTS - entry.count }
}

// Periodically clean up stale entries (every 5 min)
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitMap) {
    if (now - entry.dailyStart > DAILY_WINDOW_MS * 2) {
      rateLimitMap.delete(key)
    }
  }
}, 300_000)

// Security headers applied to every response from this endpoint.
function applySecurityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
}

// CORS headers for the configured origin (same-site by default; allow preview
// deployments via the ALLOWED_ORIGIN env var or fall back to same-origin '*').
function applyCorsHeaders(req, res) {
  const origin = req.headers.origin || ''
  const allowed = process.env.ALLOWED_ORIGIN || '*'
  const isAllowed = allowed === '*' || origin === allowed
  if (isAllowed) {
    res.setHeader('Access-Control-Allow-Origin', allowed === '*' ? origin || '*' : allowed)
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

export default async function handler(req, res) {
  applySecurityHeaders(res)
  applyCorsHeaders(req, res)

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Rate limiting
  const clientKey = getRateLimitKey(req)
  const rateLimit = checkRateLimit(clientKey)

  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS)
  res.setHeader('X-RateLimit-Remaining', rateLimit.remaining)

  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', rateLimit.retryAfter)
    return res.status(429).json({
      error: `Rate limit exceeded. Try again in ${rateLimit.retryAfter} seconds.`,
    })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    // Generic message — don't reveal which key is missing
    return res.status(500).json({ error: 'Service temporarily unavailable' })
  }

  try {
    const { text, photoFilenames = [] } = req.body || {}

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' })
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return res.status(400).json({
        error: `Text too long. Maximum ${MAX_TEXT_LENGTH.toLocaleString()} characters allowed (you sent ${text.length.toLocaleString()}).`,
      })
    }

    if (!Array.isArray(photoFilenames) || photoFilenames.length > 100) {
      return res.status(400).json({ error: 'Invalid photo filenames' })
    }

    let userMessage = `Extract all events from the following text:\n\n${text}`

    if (photoFilenames.length > 0) {
      userMessage += `\n\nAvailable photo filenames to match:\n${photoFilenames.join('\n')}`
    }

    const systemPrompt = `You are a timeline extraction engine. Given raw text (journal entries, biographical notes, research notes, family history), extract every identifiable event and return structured JSON.

For each event, extract:
- id: A unique identifier string (use format "evt_" followed by a short random string)
- title: Short descriptive title (5-10 words)
- description: 1-2 sentence summary
- dateStart: ISO date string (YYYY-MM-DD). Use YYYY-MM-01 if day unknown, YYYY-01-01 if month unknown.
- dateEnd: ISO date string if this is a date range, otherwise null
- dateRaw: The original date text as found in the source
- datePrecision: "day" | "month" | "year" | "decade" | "approximate"
- flagged: true if the date is ambiguous or inferred
- flagReason: Explanation of ambiguity (null if not flagged)
- people: Array of person names mentioned in this event
- tags: Array of category tags (e.g., "career", "education", "travel", "family", "health", "military", "relocation")
- photos: Array of matching photo filenames (from the provided list, if any match by date, name, or location)

Rules:
- Extract ALL events, even minor ones
- Be generous with date inference — partial dates are better than skipping events
- Flag anything where you had to guess or infer
- Normalize all dates to ISO format
- Keep titles concise and descriptive
- Keep descriptions factual and brief

Return ONLY valid JSON (no markdown fences): { "events": [...] }`

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    })

    if (!response.ok) {
      const errBody = await response.text()
      console.error('Anthropic API error:', response.status, errBody)
      // Return generic error to client — don't leak upstream API details
      return res.status(502).json({ error: 'AI service error. Please try again.' })
    }

    const result = await response.json()
    const content = result.content?.[0]?.text

    if (!content) {
      return res.status(502).json({ error: 'No response from AI' })
    }

    // Extract JSON from the response (handle markdown code blocks if present)
    let jsonStr = content
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }

    const parsed = JSON.parse(jsonStr.trim())
    return res.status(200).json(parsed)
  } catch (err) {
    console.error('Parse handler error:', err.message, err.stack)
    // Generic message — don't expose internal error details to client
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' })
  }
}
