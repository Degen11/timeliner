import { z } from 'zod'
import { getClientIP, checkRateLimit, applySecurityHeaders, applyCorsHeaders } from './rateLimit.js'

const looseEventSchema = z
  .object({
    id: z.string().optional(),
    title: z.any().optional().transform((v) => (typeof v === 'string' && v.trim() ? v.trim() : null)),
    description: z.any().optional().transform((v) => (typeof v === 'string' ? v : null)),
    dateStart: z.any().optional().transform((v) => (typeof v === 'string' ? v : null)),
    dateEnd: z.any().optional().transform((v) => (typeof v === 'string' ? v : null)),
    dateRaw: z.any().optional().transform((v) => (typeof v === 'string' ? v : null)),
    datePrecision: z.any().optional().transform((v) =>
      ['day', 'month', 'year', 'decade', 'approximate'].includes(v) ? v : 'day'
    ),
    flagged: z.any().optional().transform((v) => Boolean(v)),
    flagReason: z.any().optional().transform((v) => (typeof v === 'string' ? v : null)),
    people: z.any().optional().transform((v) => (Array.isArray(v) ? v.filter((s) => typeof s === 'string') : [])),
    tags: z.any().optional().transform((v) => (Array.isArray(v) ? v.filter((s) => typeof s === 'string') : [])),
    photos: z.any().optional().transform((v) => (Array.isArray(v) ? v.filter((s) => typeof s === 'string') : [])),
  })
  .transform((e) => (e.title ? e : null))

const RATE_LIMIT_MAX_REQUESTS = 10
const DAILY_BUDGET_MAX = 100
const MAX_TEXT_LENGTH = 50_000
const MAX_PHOTO_FILENAMES = 100
const MAX_FILENAME_LENGTH = 200

const SYSTEM_PROMPT = `You are a timeline extraction engine. Given raw text (journal entries, biographical notes, research notes, family history), extract every identifiable event and return structured JSON.

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

// ─── Helpers ─────────────────────────────────────────────

function sanitizeFilename(name) {
  if (typeof name !== 'string') return ''
  return name.replace(/[^\w\s.\-()[\]]/g, '_').slice(0, MAX_FILENAME_LENGTH)
}

function validateInput(body) {
  const { text, photoFilenames = [] } = body || {}

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return { error: 'Text is required', status: 400 }
  }
  if (text.length > MAX_TEXT_LENGTH) {
    return {
      error: `Text too long. Maximum ${MAX_TEXT_LENGTH.toLocaleString()} characters allowed (you sent ${text.length.toLocaleString()}).`,
      status: 400,
    }
  }
  if (!Array.isArray(photoFilenames) || photoFilenames.length > MAX_PHOTO_FILENAMES) {
    return { error: 'Invalid photo filenames', status: 400 }
  }

  return { text, photoFilenames }
}

function buildUserMessage(text, photoFilenames) {
  let message = `Extract all events from the following text:\n\n${text}`
  if (photoFilenames.length > 0) {
    const safeNames = photoFilenames.map(sanitizeFilename).filter(Boolean)
    message += `\n\nAvailable photo filenames to match:\n${safeNames.join('\n')}`
  }
  return message
}

async function callClaude(apiKey, userMessage) {
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
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    }),
  })

  if (!response.ok) {
    const errBody = await response.text()
    console.error('Anthropic API error:', response.status, errBody)
    return { error: 'AI service error. Please try again.', status: 502 }
  }

  const result = await response.json()
  const content = result.content?.[0]?.text
  if (!content) {
    return { error: 'No response from AI', status: 502 }
  }

  return { content }
}

function extractJson(content) {
  let jsonStr = content
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) jsonStr = jsonMatch[1]
  jsonStr = jsonStr.trim()
  try {
    return JSON.parse(jsonStr)
  } catch (err) {
    // Fallback: the model emitted JSON wrapped in prose without a code fence.
    // Extract the outermost object/array span and try again.
    const start = jsonStr.search(/[{[]/)
    const end = Math.max(jsonStr.lastIndexOf('}'), jsonStr.lastIndexOf(']'))
    if (start !== -1 && end > start) {
      return JSON.parse(jsonStr.slice(start, end + 1))
    }
    throw err
  }
}

function normalizeEvents(parsed) {
  const rawEvents = Array.isArray(parsed.events) ? parsed.events : Array.isArray(parsed) ? parsed : []
  return rawEvents
    .map((e) => {
      const result = looseEventSchema.safeParse(e)
      if (!result.success || result.data === null) return null
      const evt = result.data
      if (!evt.id) evt.id = `evt_${crypto.randomUUID().slice(0, 12)}`
      return evt
    })
    .filter(Boolean)
}

// ─── Handler ─────────────────────────────────────────────

export default async function handler(req, res) {
  applySecurityHeaders(res)
  applyCorsHeaders(req, res)

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const clientKey = getClientIP(req)
  const rl = checkRateLimit(clientKey, { maxRequests: RATE_LIMIT_MAX_REQUESTS, dailyMax: DAILY_BUDGET_MAX })

  res.setHeader('X-RateLimit-Limit', RATE_LIMIT_MAX_REQUESTS)
  res.setHeader('X-RateLimit-Remaining', rl.remaining)

  if (!rl.allowed) {
    res.setHeader('Retry-After', rl.retryAfter)
    return res.status(429).json({ error: `Rate limit exceeded. Try again in ${rl.retryAfter} seconds.` })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'Service temporarily unavailable' })

  try {
    const input = validateInput(req.body)
    if (input.error) return res.status(input.status).json({ error: input.error })

    const userMessage = buildUserMessage(input.text, input.photoFilenames)
    const aiResult = await callClaude(apiKey, userMessage)
    if (aiResult.error) return res.status(aiResult.status).json({ error: aiResult.error })

    let parsed
    try {
      parsed = extractJson(aiResult.content)
    } catch (_jsonErr) {
      console.error('Parse JSON extraction failed:', _jsonErr.message)
      return res.status(502).json({ error: 'The AI returned an unreadable response. Please try again.' })
    }

    const events = normalizeEvents(parsed)

    return res.status(200).json({ events })
  } catch (err) {
    console.error('Parse handler error:', err.message, err.stack)
    return res.status(500).json({ error: 'Something went wrong on our end. Please try again shortly.' })
  }
}
