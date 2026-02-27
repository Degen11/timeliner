export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    const envKeys = Object.keys(process.env).filter(k => k.includes('ANTHROPIC') || k.includes('API'))
    return res.status(500).json({
      error: 'API key not configured',
      hint: `Found env vars matching ANTHROPIC/API: [${envKeys.join(', ')}]. Check spelling and that Production is checked in Vercel.`
    })
  }

  try {
    const { text, photoFilenames = [] } = req.body || {}

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' })
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
      let detail = `API error ${response.status}`
      try {
        const errJson = JSON.parse(errBody)
        detail = errJson.error?.message || detail
      } catch {}
      return res.status(502).json({ error: detail })
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
    return res.status(500).json({ error: err.message || 'Internal server error' })
  }
}
