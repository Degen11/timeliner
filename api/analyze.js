import { getClientIP, checkRateLimit, applySecurityHeaders, applyCorsHeaders } from './rateLimit.js'

const RATE_LIMIT_MAX_REQUESTS = 5   // 5 requests per minute per IP (stricter than parse)
const DAILY_BUDGET_MAX = 50         // max 50 analyses per IP per day
const MAX_EVENTS = 500              // max events to analyze at once

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
    "tags": ["relevant-tag"]
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
    "people": ["relevant people from related event, if any"]
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
  "suggestedFix": {
    "eventTitle": "Exact title of the event to fix (must match an event in the data)",
    "field": "dateStart" | "dateEnd",
    "oldValue": "current incorrect value",
    "newValue": "YYYY-MM-DD corrected value",
    "datePrecision": "day" | "month" | "year"
  }
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

Return ONLY valid JSON (no markdown fences): { "insights": [...] }`

export default async function handler(req, res) {
  applySecurityHeaders(res)
  applyCorsHeaders(req, res)

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
    return res.status(500).json({ error: 'Service temporarily unavailable' })
  }

  try {
    const { events } = req.body || {}

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({ error: 'Events array is required and must not be empty' })
    }

    if (events.length > MAX_EVENTS) {
      return res.status(400).json({
        error: `Too many events. Maximum ${MAX_EVENTS} allowed (you sent ${events.length}).`,
      })
    }

    // Strip down events to only the fields the AI needs (saves tokens)
    const stripped = events.map((e) => ({
      title: (e.title || '').slice(0, 200),
      description: (e.description || '').slice(0, 300),
      dateStart: e.dateStart || null,
      dateEnd: e.dateEnd || null,
      tags: Array.isArray(e.tags) ? e.tags.slice(0, 10) : [],
      people: Array.isArray(e.people) ? e.people.slice(0, 10) : [],
      location: (e.location || '').slice(0, 100),
    }))

    // Sort by date for clearer analysis
    stripped.sort((a, b) => {
      if (!a.dateStart) return 1
      if (!b.dateStart) return -1
      return a.dateStart.localeCompare(b.dateStart)
    })

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
      return res.status(502).json({ error: 'AI service error. Please try again.' })
    }

    const result = await response.json()
    const content = result.content?.[0]?.text

    if (!content) {
      return res.status(502).json({ error: 'No response from AI' })
    }

    // Extract JSON (handle markdown fences if present)
    let jsonStr = content
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
    if (jsonMatch) {
      jsonStr = jsonMatch[1]
    }

    const parsed = JSON.parse(jsonStr.trim())

    // Add unique IDs to each insight for frontend tracking
    const insights = (parsed.insights || []).map((insight, i) => ({
      ...insight,
      id: `ins_${Date.now()}_${i}`,
    }))

    // Return cache usage info for debugging
    const cacheInfo = {
      inputTokens: result.usage?.input_tokens,
      outputTokens: result.usage?.output_tokens,
      cacheRead: result.usage?.cache_read_input_tokens || 0,
      cacheCreation: result.usage?.cache_creation_input_tokens || 0,
    }

    return res.status(200).json({ insights, usage: cacheInfo })
  } catch (err) {
    console.error('Analyze handler error:', err.message, err.stack)
    return res.status(500).json({ error: 'An unexpected error occurred. Please try again.' })
  }
}
