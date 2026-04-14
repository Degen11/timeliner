import { getClientIP, checkRateLimit, applySecurityHeaders, applyCorsHeaders } from './rateLimit.js'

const RATE_LIMIT_MAX_REQUESTS = 5
const DAILY_BUDGET_MAX = 50
const MAX_EVENTS = 500
const MAX_TITLE_LENGTH = 200
const MAX_DESCRIPTION_LENGTH = 300
const MAX_LOCATION_LENGTH = 100
const MAX_ARRAY_ITEMS = 10

// ─── System prompt (static — benefits from Anthropic prompt caching) ───

const SYSTEM_PROMPT = `You are a timeline analysis engine. Given a set of chronological events, you identify gaps, missing context, inconsistencies, and patterns. You act as a "timeline linter" — finding what's missing or off.

You will receive a JSON array of events, each with: title, description, dateStart, dateEnd, tags, people, location.

Analyze the events and return a JSON object with an "insights" array. Each insight is one of these types:

## 1. GAP — Chronological gaps where no events exist
Identify periods where there's a significant time gap between consecutive events. What counts as "significant" depends on the timeline's density — a 5-year gap in a timeline spanning 50 years is notable, but a 2-month gap in a timeline spanning 6 months is also notable.

{
  "type": "gap",
  "severity": "high" | "medium" | "low",
  "title": "Short label, e.g. 'Gap: 1985–1990'",
  "description": "There are no events between [last event before gap] and [first event after gap]. This is a N-year gap.",
  "dateStart": "YYYY-MM-DD",
  "dateEnd": "YYYY-MM-DD",
  "suggestedEvent": {
    "title": "Suggested event title to fill the gap",
    "description": "Brief suggested description based on surrounding context",
    "dateStart": "YYYY-MM-DD",
    "dateEnd": "YYYY-MM-DD or null",
    "datePrecision": "year",
    "tags": ["relevant-tag"],
    "location": "Inferred location if known from context, or null"
  }
}

## 2. MISSING_CONTEXT — Logical holes based on event content
Look for events that imply a preceding or following event is missing. Examples:
- A "Graduation" without an "Enrollment" or "Started school"
- A "Retired" without a career start
- A "Moved to X" without a "Left Y"
- A "Married" without a "Met" or "Dating" event
- A "Promotion" without an initial hiring event
- A "Sold house" without a "Bought house"

{
  "type": "missing_context",
  "severity": "high" | "medium" | "low",
  "title": "Short label, e.g. 'No enrollment before graduation'",
  "description": "You have a graduation event in 1985 but no enrollment or school start event. Consider adding when schooling began.",
  "relatedEventTitle": "Title of the event that triggered this insight",
  "suggestedEvent": {
    "title": "Suggested event title",
    "description": "Brief suggested description",
    "dateStart": "YYYY-MM-DD",
    "dateEnd": "YYYY-MM-DD or null",
    "datePrecision": "year" | "approximate",
    "tags": ["relevant-tag"],
    "people": ["relevant people from related event, if any"],
    "location": "Inferred location if known from context, or null"
  }
}

## 3. INCONSISTENCY — Overlapping dates, out-of-order events, or contradictions
Look for events that conflict with each other. Examples:
- Events in two different locations on the same date
- A person appearing in events after a death event
- Date ranges that overlap in contradictory ways
- An event dated before a person's birth event

{
  "type": "inconsistency",
  "severity": "high" | "medium",
  "title": "Short label, e.g. 'Overlapping events on June 5'",
  "description": "Clear explanation of the inconsistency",
  "relatedEventTitles": ["Event A", "Event B"],
  "suggestedFixes": [
    {
      "eventTitle": "Exact title of the event to fix (must match an event in the data)",
      "field": "dateStart" | "dateEnd" | "location",
      "oldValue": "current incorrect value",
      "newValue": "corrected value (YYYY-MM-DD for dates, location string for location)",
      "datePrecision": "day" | "month" | "year" (only for date fields, omit for location)
    }
  ]
}

## Rules
- Return 3–15 insights maximum. Prioritize the most important ones.
- Sort by severity (high first), then by date.
- Be specific — reference actual event titles and dates from the data.
- For suggestedEvent dates: make reasonable inferences from context. Use "approximate" precision when guessing.
- For suggestedEvent descriptions: keep them factual and brief (1 sentence). Base them on what surrounding events imply.
- For gap detection: calculate density. A timeline with 100 events across 50 years should flag 3+ year gaps. A timeline with 10 events across 2 years should flag 3+ month gaps.
- Only flag real issues — don't generate filler insights. If the timeline looks complete, return fewer insights.
- For people arrays in suggestions, only include people who appear in related events.
- DO NOT suggest events that already exist in the timeline.
- For locations: infer locations from context when possible. If an event mentions "enlisted in the Army" in 1946 USA, the location is likely a US city, not Bangkok. If a suggestedFixes entry corrects a location, use "location" as the field.
- An inconsistency insight can have MULTIPLE suggestedFixes — e.g., one to fix the date AND one to fix the location. Each fix is independently actionable.
- IMPORTANT: When an existing event is missing a location (or has a wrong location), do NOT use suggestedEvent to propose a duplicate event. Instead, use type "missing_context" with suggestedFixes to update the existing event's location field. The suggestedFixes approach patches the existing event; suggestedEvent creates a brand new event. Only use suggestedEvent when a genuinely new event is needed (timeline gaps, missing milestones like enrollment before graduation, etc.).

Return ONLY valid JSON (no markdown fences): { "insights": [...] }`

// ─── Helpers ─────────────────────────────────────────────

function validateEvents(body) {
  const { events } = body || {}

  if (!Array.isArray(events) || events.length === 0) {
    return { error: 'Events array is required and must not be empty', status: 400 }
  }
  if (events.length > MAX_EVENTS) {
    return {
      error: `Too many events. Maximum ${MAX_EVENTS} allowed (you sent ${events.length}).`,
      status: 400,
    }
  }

  return { events }
}

function stripEventsForAnalysis(events) {
  const stripped = events.map((e) => ({
    title: (e.title || '').slice(0, MAX_TITLE_LENGTH),
    description: (e.description || '').slice(0, MAX_DESCRIPTION_LENGTH),
    dateStart: e.dateStart || null,
    dateEnd: e.dateEnd || null,
    tags: Array.isArray(e.tags) ? e.tags.slice(0, MAX_ARRAY_ITEMS) : [],
    people: Array.isArray(e.people) ? e.people.slice(0, MAX_ARRAY_ITEMS) : [],
    location: (e.location || '').slice(0, MAX_LOCATION_LENGTH),
  }))

  stripped.sort((a, b) => {
    if (!a.dateStart) return 1
    if (!b.dateStart) return -1
    return a.dateStart.localeCompare(b.dateStart)
  })

  return stripped
}

async function callClaude(apiKey, stripped) {
  const userMessage = `Analyze this timeline of ${stripped.length} events:\n\n${JSON.stringify(stripped)}`

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
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
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

  return { content, usage: result.usage }
}

function extractJson(content) {
  let jsonStr = content
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
  if (jsonMatch) jsonStr = jsonMatch[1]
  return JSON.parse(jsonStr.trim())
}

function normalizeInsights(parsed) {
  return (parsed.insights || []).map((insight, i) => ({
    ...insight,
    id: `ins_${Date.now()}_${i}`,
  }))
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
    const input = validateEvents(req.body)
    if (input.error) return res.status(input.status).json({ error: input.error })

    const stripped = stripEventsForAnalysis(input.events)
    const aiResult = await callClaude(apiKey, stripped)
    if (aiResult.error) return res.status(aiResult.status).json({ error: aiResult.error })

    let parsed
    try {
      parsed = extractJson(aiResult.content)
    } catch (_jsonErr) {
      console.error('Analyze JSON extraction failed:', _jsonErr.message)
      return res.status(502).json({ error: 'The AI returned an unreadable response. Please try again.' })
    }

    const insights = normalizeInsights(parsed)

    const cacheInfo = {
      inputTokens: aiResult.usage?.input_tokens,
      outputTokens: aiResult.usage?.output_tokens,
      cacheRead: aiResult.usage?.cache_read_input_tokens || 0,
      cacheCreation: aiResult.usage?.cache_creation_input_tokens || 0,
    }

    return res.status(200).json({ insights, usage: cacheInfo })
  } catch (err) {
    console.error('Analyze handler error:', err.message, err.stack)
    return res.status(500).json({ error: 'Something went wrong on our end. Please try again shortly.' })
  }
}
