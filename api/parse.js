import { z } from 'zod'
import { getClientIP, limitRequest, applySecurityHeaders, applyCorsHeaders } from './rateLimit.js'

// Local copy of the client's isValidISODate (api/ can't import from src/):
// "YYYY", "YYYY-MM" or "YYYY-MM-DD" naming a real calendar date, so the model
// can't slip "2024-02-30" or "1998-13" through to the review overlay.
export function isValidISODate(str) {
  if (typeof str !== 'string') return false
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2}))?)?$/.exec(str)
  if (!m) return false
  const year = Number(m[1])
  const month = m[2] === undefined ? 1 : Number(m[2])
  const day = m[3] === undefined ? 1 : Number(m[3])
  if (month < 1 || month > 12 || day < 1) return false
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate()
  return day <= daysInMonth
}

const isoDateOrNull = (v) => (typeof v === 'string' && isValidISODate(v) ? v : null)

const looseEventSchema = z
  .object({
    id: z.string().optional(),
    title: z.any().optional().transform((v) => (typeof v === 'string' && v.trim() ? v.trim() : null)),
    description: z.any().optional().transform((v) => (typeof v === 'string' ? v : null)),
    dateStart: z.any().optional().transform(isoDateOrNull),
    dateEnd: z.any().optional().transform(isoDateOrNull),
    dateRaw: z.any().optional().transform((v) => (typeof v === 'string' ? v : null)),
    datePrecision: z.any().optional().transform((v) =>
      ['day', 'month', 'year', 'decade', 'approximate'].includes(v) ? v : 'day'
    ),
    flagged: z.any().optional().transform((v) => Boolean(v)),
    flagReason: z.any().optional().transform((v) => (typeof v === 'string' ? v : null)),
    people: z.any().optional().transform((v) => (Array.isArray(v) ? v.filter((s) => typeof s === 'string') : [])),
    location: z.any().optional().transform((v) => (typeof v === 'string' && v.trim() ? v.trim() : null)),
    tags: z.any().optional().transform((v) => (Array.isArray(v) ? v.filter((s) => typeof s === 'string') : [])),
    photos: z.any().optional().transform((v) => (Array.isArray(v) ? v.filter((s) => typeof s === 'string') : [])),
  })
  .transform((e) => (e.title ? e : null))

const MODEL = 'claude-haiku-5-5'
// Streaming lifts the HTTP-timeout concern, so give long texts more room than
// the old 16k cap before the salvage path has to kick in.
const MAX_OUTPUT_TOKENS = 32000
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
- location: Place name mentioned for this event (city, country, venue, etc.), or null if none
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

function buildClaudeBody(userMessage, stream) {
  return {
    model: MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    // Extraction is a straight read of the text: thinking would only add
    // latency before the first event shows up. Haiku 5.5 accepts disabled
    // thinking at its default (medium) effort.
    thinking: { type: 'disabled' },
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userMessage }],
    ...(stream ? { stream: true } : {}),
  }
}

function claudeRequest(apiKey, userMessage, { stream = false, signal } = {}) {
  return fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify(buildClaudeBody(userMessage, stream)),
    signal,
  })
}

async function callClaude(apiKey, userMessage) {
  const response = await claudeRequest(apiKey, userMessage)

  if (!response.ok) {
    const errBody = await response.text()
    console.error('Anthropic API error:', response.status, errBody)
    return { error: 'AI service error. Please try again.', status: 502 }
  }

  const result = await response.json()
  const content = result.content?.find?.((b) => b.type === 'text')?.text ?? result.content?.[0]?.text
  if (!content) {
    return { error: 'No response from AI', status: 502 }
  }

  // stop_reason === 'max_tokens' means the JSON was cut off mid-array; the
  // caller salvages the complete events and flags the response as truncated.
  return { content, truncated: result.stop_reason === 'max_tokens' }
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

/**
 * Salvage complete event objects from a JSON array that was cut off mid-stream
 * (stop_reason: max_tokens). Walks the string tracking object depth (string- and
 * escape-aware) and keeps everything up to the last object that closed at the
 * array's top level, then closes the array so it parses cleanly.
 * Returns { events: [...] } or null if nothing complete could be recovered.
 */
export function salvageTruncatedEvents(content) {
  const arrStart = content.indexOf('[')
  if (arrStart === -1) return null

  let depth = 0
  let inString = false
  let escaped = false
  let lastComplete = -1 // index just after an object that closed at array level

  for (let i = arrStart + 1; i < content.length; i++) {
    const ch = content[i]
    if (escaped) { escaped = false; continue }
    if (ch === '\\') { escaped = true; continue }
    if (ch === '"') { inString = !inString; continue }
    if (inString) continue
    if (ch === '{') depth++
    else if (ch === '}') {
      depth--
      if (depth === 0) lastComplete = i + 1
    }
  }

  if (lastComplete === -1) return null
  const salvaged = `${content.slice(arrStart, lastComplete)}]`
  try {
    return { events: JSON.parse(salvaged) }
  } catch {
    return null
  }
}

/**
 * Incremental version of the salvage walk above, for streaming: feed it text
 * as it arrives and it returns each event object the moment its closing brace
 * lands at the top level of the events array. Same string/escape awareness.
 */
export function createEventScanner() {
  let buf = ''
  let pos = 0
  let started = false
  let done = false
  let depth = 0
  let inString = false
  let escaped = false
  let objStart = -1

  return {
    push(chunk) {
      buf += chunk
      const found = []
      if (done) return found
      if (!started) {
        const arr = buf.indexOf('[', pos)
        if (arr === -1) { pos = buf.length; return found }
        started = true
        pos = arr + 1
      }
      for (; pos < buf.length; pos++) {
        const ch = buf[pos]
        if (escaped) { escaped = false; continue }
        if (ch === '\\') { escaped = true; continue }
        if (ch === '"') { inString = !inString; continue }
        if (inString) continue
        if (ch === '{') {
          if (depth === 0) objStart = pos
          depth++
        } else if (ch === '}') {
          depth--
          if (depth === 0 && objStart !== -1) {
            try {
              found.push(JSON.parse(buf.slice(objStart, pos + 1)))
            } catch {
              // A malformed object: skip it, keep scanning
            }
            objStart = -1
          }
        } else if (ch === ']' && depth === 0) {
          done = true
          pos++
          break
        }
      }
      return found
    },
    get text() { return buf },
  }
}

function normalizeEvents(parsed, seenIds = new Set()) {
  const rawEvents = Array.isArray(parsed.events) ? parsed.events : Array.isArray(parsed) ? parsed : []
  return rawEvents
    .map((e) => {
      const result = looseEventSchema.safeParse(e)
      if (!result.success || result.data === null) return null
      const evt = result.data
      // The model invents ids, so it can repeat one; the review list keys on them
      if (!evt.id || seenIds.has(evt.id)) evt.id = `evt_${crypto.randomUUID().slice(0, 12)}`
      seenIds.add(evt.id)
      // A date the model wrote that isn't a real calendar date was dropped by
      // the schema; flag the event so the user picks the date in review
      const dropped = [
        ['start', e?.dateStart, evt.dateStart],
        ['end', e?.dateEnd, evt.dateEnd],
      ].filter(([, raw, kept]) => typeof raw === 'string' && raw.trim() && kept === null)
      if (dropped.length > 0) {
        evt.flagged = true
        const reasons = dropped.map(([which, raw]) => `Invalid ${which} date: "${raw}"`)
        evt.flagReason = [evt.flagReason, ...reasons].filter(Boolean).join('; ')
      }
      return evt
    })
    .filter(Boolean)
}

// ─── Streaming ───────────────────────────────────────────

/**
 * Read Anthropic's server-sent events and call onText for each text delta.
 * Resolves with { stopReason } or throws on an `error` event.
 */
async function readClaudeStream(body, onText) {
  const reader = body.getReader()
  const decoder = new TextDecoder()
  let pending = ''
  let stopReason = null

  const handleEvent = (raw) => {
    const dataLine = raw.split('\n').filter((l) => l.startsWith('data:')).map((l) => l.slice(5).trimStart()).join('')
    if (!dataLine) return
    let msg
    try { msg = JSON.parse(dataLine) } catch { return }
    if (msg.type === 'content_block_delta' && msg.delta?.type === 'text_delta') onText(msg.delta.text)
    else if (msg.type === 'message_delta' && msg.delta?.stop_reason) stopReason = msg.delta.stop_reason
    else if (msg.type === 'error') throw new Error(msg.error?.message || 'AI stream error')
  }

  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    pending += decoder.decode(value, { stream: true }).replace(/\r\n/g, '\n')
    let sep
    while ((sep = pending.indexOf('\n\n')) !== -1) {
      handleEvent(pending.slice(0, sep))
      pending = pending.slice(sep + 2)
    }
  }
  if (pending.trim()) handleEvent(pending)
  return { stopReason }
}

/**
 * Stream events to the client as newline-delimited JSON:
 *   {"type":"event","event":{...}}  one per extracted event, as Claude writes it
 *   {"type":"done","truncated":bool,"count":n}
 *   {"type":"error","error":"..."}  if the stream fails after it started
 * Errors before the first byte still use the normal JSON status codes.
 */
async function streamParse(req, res, apiKey, userMessage) {
  const controller = new AbortController()
  // Stop paying for tokens nobody will read once the browser goes away
  req.on?.('close', () => { if (!res.writableEnded) controller.abort() })

  let upstream
  try {
    upstream = await claudeRequest(apiKey, userMessage, { stream: true, signal: controller.signal })
  } catch (err) {
    console.error('Anthropic stream request failed:', err.message)
    return res.status(502).json({ error: 'AI service error. Please try again.' })
  }
  if (!upstream.ok || !upstream.body) {
    const errBody = await upstream.text?.().catch(() => '')
    console.error('Anthropic API error:', upstream.status, errBody)
    return res.status(502).json({ error: 'AI service error. Please try again.' })
  }

  res.status(200)
  res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders?.()

  const write = (obj) => res.write(`${JSON.stringify(obj)}\n`)
  const scanner = createEventScanner()
  const seenIds = new Set()
  let count = 0
  const emit = (raws) => {
    for (const evt of normalizeEvents(raws, seenIds)) {
      count++
      write({ type: 'event', event: evt })
    }
  }

  try {
    const { stopReason } = await readClaudeStream(upstream.body, (text) => emit(scanner.push(text)))
    // Nothing came through the incremental scan (unusual shape): fall back to
    // reading the whole reply the way the non-streaming path does
    if (count === 0) {
      try {
        const parsed = extractJson(scanner.text)
        emit(Array.isArray(parsed) ? parsed : parsed?.events || [])
      } catch { /* nothing usable */ }
      if (count === 0 && stopReason !== 'max_tokens') {
        write({ type: 'error', error: 'The AI returned an unreadable response. Please try again.' })
        return res.end()
      }
    }
    write({ type: 'done', truncated: stopReason === 'max_tokens', count })
  } catch (err) {
    if (controller.signal.aborted) return res.end()
    console.error('Parse stream error:', err.message)
    write({ type: 'error', error: 'The AI stopped partway through. Please try again.' })
  }
  return res.end()
}

// ─── Handler ─────────────────────────────────────────────

export default async function handler(req, res) {
  applySecurityHeaders(res)
  applyCorsHeaders(req, res)

  if (req.method === 'OPTIONS') return res.status(204).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const clientKey = `parse:${getClientIP(req)}`
  const rl = await limitRequest(clientKey, { maxRequests: RATE_LIMIT_MAX_REQUESTS, dailyMax: DAILY_BUDGET_MAX })

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
    if (req.body?.stream === true) return await streamParse(req, res, apiKey, userMessage)

    const aiResult = await callClaude(apiKey, userMessage)
    if (aiResult.error) return res.status(aiResult.status).json({ error: aiResult.error })

    let parsed
    try {
      parsed = extractJson(aiResult.content)
    } catch (_jsonErr) {
      // If the model hit the token cap, the JSON is truncated mid-array —
      // recover the complete events instead of failing the whole request.
      if (aiResult.truncated) parsed = salvageTruncatedEvents(aiResult.content)
      if (!parsed) {
        console.error('Parse JSON extraction failed:', _jsonErr.message)
        return res.status(502).json({ error: 'The AI returned an unreadable response. Please try again.' })
      }
    }

    const events = normalizeEvents(parsed)

    return res.status(200).json({ events, truncated: Boolean(aiResult.truncated) })
  } catch (err) {
    console.error('Parse handler error:', err.message, err.stack)
    return res.status(500).json({ error: 'Something went wrong on our end. Please try again shortly.' })
  }
}
