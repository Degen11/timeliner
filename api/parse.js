import { getClientIP, checkRateLimit, applySecurityHeaders, applyCorsHeaders } from './rateLimit.js'

const RATE_LIMIT_MAX_REQUESTS = 10 // 10 requests per minute per IP
const DAILY_BUDGET_MAX = 100 // max 100 requests per IP per day
const MAX_TEXT_LENGTH = 50_000 // ~50k chars max input

/**
 * Sanitize a filename to prevent prompt injection.
 * Keeps alphanumeric, spaces, hyphens, underscores, dots, and common unicode letters.
 * Truncates to 200 chars.
 */
function sanitizeFilename(name) {
  if (typeof name !== 'string') return ''
  return name.replace(/[^\w\s.\-()[\]]/g, '_').slice(0, 200)
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
  const clientKey = getClientIP(req)
  const rateLimit = checkRateLimit(clientKey, {
    maxRequests: RATE_LIMIT_MAX_REQUESTS,
    dailyMax: DAILY_BUDGET_MAX,
  })

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
      const safeNames = photoFilenames.map(sanitizeFilename).filter(Boolean)
      userMessage += `\n\nAvailable photo filenames to match:\n${safeNames.join('\n')}`
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

    // Validate that the response has the expected structure
    const events = Array.isArray(parsed.events) ? parsed.events : Array.isArray(parsed) ? parsed : []
    const validated = events
      .filter((e) => e && typeof e === 'object' && typeof e.title === 'string')
      .map((e) => ({
        id: typeof e.id === 'string' ? e.id : `evt_${crypto.randomUUID().slice(0, 12)}`,
        title: e.title,
        description: e.description || null,
        dateStart: e.dateStart || null,
        dateEnd: e.dateEnd || null,
        dateRaw: e.dateRaw || null,
        datePrecision: e.datePrecision || 'day',
        flagged: Boolean(e.flagged),
        flagReason: e.flagReason || null,
        people: Array.isArray(e.people) ? e.people : [],
        tags: Array.isArray(e.tags) ? e.tags : [],
        photos: Array.isArray(e.photos) ? e.photos : [],
      }))

    return res.status(200).json({ events: validated })
  } catch (err) {
    console.error('Parse handler error:', err.message, err.stack)
    // Generic message — don't expose internal error details to client
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' })
  }
}
