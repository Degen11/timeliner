// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../rateLimit.js', () => ({
  getClientIP: vi.fn(() => '127.0.0.1'),
  checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 9 })),
  applySecurityHeaders: vi.fn(),
  applyCorsHeaders: vi.fn(),
}))

import handler, { salvageTruncatedEvents } from '../parse.js'
import { checkRateLimit } from '../rateLimit.js'

// ─── Request / response helpers ──────────────────────────

function makeReq(method, body, headers = {}) {
  return { method, body, headers: { 'content-type': 'application/json', ...headers }, query: {} }
}

function makeRes() {
  const res = { statusCode: 200, headers: {}, body: null }
  res.status = vi.fn((code) => { res.statusCode = code; return res })
  res.json = vi.fn((data) => { res.body = data; return res })
  res.setHeader = vi.fn((k, v) => { res.headers[k.toLowerCase()] = v })
  res.end = vi.fn(() => res)
  return res
}

// ─── Tests ───────────────────────────────────────────────

describe('parse.js handler', () => {
  let res

  beforeEach(() => {
    res = makeRes()
    vi.stubGlobal('fetch', vi.fn())
    process.env.ANTHROPIC_API_KEY = 'test-key'
    checkRateLimit.mockReturnValue({ allowed: true, remaining: 9 })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.ANTHROPIC_API_KEY
  })

  it('returns 405 for non-POST methods', async () => {
    await handler(makeReq('GET', null), res)
    expect(res.statusCode).toBe(405)
    expect(res.body).toEqual({ error: 'Method not allowed' })
  })

  it('returns 204 for OPTIONS preflight', async () => {
    await handler(makeReq('OPTIONS', null), res)
    expect(res.statusCode).toBe(204)
  })

  it('returns 400 when text is missing', async () => {
    await handler(makeReq('POST', {}), res)
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toBe('Text is required')
  })

  it('returns 400 when text is empty string', async () => {
    await handler(makeReq('POST', { text: '   ' }), res)
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toBe('Text is required')
  })

  it('returns 400 when text exceeds 50 000 characters', async () => {
    await handler(makeReq('POST', { text: 'a'.repeat(50_001) }), res)
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/Text too long/)
  })

  it('returns 400 for non-array photoFilenames', async () => {
    await handler(makeReq('POST', { text: 'hello', photoFilenames: 'bad' }), res)
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toBe('Invalid photo filenames')
  })

  it('returns 400 when photoFilenames array exceeds limit', async () => {
    const tooMany = Array.from({ length: 101 }, (_, i) => `file${i}.jpg`)
    await handler(makeReq('POST', { text: 'hello', photoFilenames: tooMany }), res)
    expect(res.statusCode).toBe(400)
  })

  it('returns 429 when rate limited', async () => {
    checkRateLimit.mockReturnValue({ allowed: false, remaining: 0, retryAfter: 60 })
    await handler(makeReq('POST', { text: 'hello' }), res)
    expect(res.statusCode).toBe(429)
    expect(res.headers['retry-after']).toBe(60)
  })

  it('returns 500 when ANTHROPIC_API_KEY is absent', async () => {
    delete process.env.ANTHROPIC_API_KEY
    await handler(makeReq('POST', { text: 'hello' }), res)
    expect(res.statusCode).toBe(500)
  })

  it('returns 502 when Claude API returns a non-OK response', async () => {
    fetch.mockResolvedValueOnce({ ok: false, text: async () => 'upstream error' })
    await handler(makeReq('POST', { text: 'hello' }), res)
    expect(res.statusCode).toBe(502)
    expect(res.body.error).toMatch(/AI service error/)
  })

  it('returns 502 when Claude returns no content', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [] }),
    })
    await handler(makeReq('POST', { text: 'hello' }), res)
    expect(res.statusCode).toBe(502)
    expect(res.body.error).toMatch(/No response from AI/)
  })

  it('returns 502 when Claude response is not valid JSON', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ text: 'not json {{{{' }] }),
    })
    await handler(makeReq('POST', { text: 'hello' }), res)
    expect(res.statusCode).toBe(502)
    expect(res.body.error).toMatch(/unreadable response/)
  })

  it('returns 200 with normalized events on success', async () => {
    const mockEvents = [
      {
        title: 'Born in Springfield',
        description: 'A notable birth.',
        dateStart: '1990-03-15',
        dateEnd: null,
        dateRaw: 'March 1990',
        datePrecision: 'day',
        flagged: false,
        flagReason: null,
        people: ['Alice'],
        tags: ['family'],
        photos: [],
      },
    ]
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ text: JSON.stringify({ events: mockEvents }) }] }),
    })

    await handler(makeReq('POST', { text: 'Alice was born in March 1990.' }), res)

    expect(res.statusCode).toBe(200)
    expect(res.body.events).toHaveLength(1)
    expect(res.body.events[0].title).toBe('Born in Springfield')
    expect(res.body.events[0].people).toEqual(['Alice'])
  })

  it('assigns an id when the AI omits one', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ text: JSON.stringify({ events: [{ title: 'No ID Event', datePrecision: 'day' }] }) }],
      }),
    })

    await handler(makeReq('POST', { text: 'test' }), res)
    expect(res.statusCode).toBe(200)
    expect(res.body.events[0].id).toMatch(/^evt_/)
  })

  it('strips events whose title coerces to null', async () => {
    const mockEvents = [
      { title: '', description: 'no title here' },
      { title: 'Valid Event', dateStart: '2000-01-01', datePrecision: 'day' },
    ]
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ text: JSON.stringify({ events: mockEvents }) }] }),
    })

    await handler(makeReq('POST', { text: 'test' }), res)
    expect(res.body.events).toHaveLength(1)
    expect(res.body.events[0].title).toBe('Valid Event')
  })

  it('handles markdown-fenced JSON from Claude', async () => {
    const fenced = '```json\n{"events":[{"title":"Fenced Event","datePrecision":"day"}]}\n```'
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ text: fenced }] }),
    })

    await handler(makeReq('POST', { text: 'test' }), res)
    expect(res.statusCode).toBe(200)
    expect(res.body.events[0].title).toBe('Fenced Event')
  })

  it('sets X-RateLimit-Remaining header', async () => {
    checkRateLimit.mockReturnValue({ allowed: true, remaining: 7 })
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ text: '{"events":[]}' }] }),
    })

    await handler(makeReq('POST', { text: 'test' }), res)
    expect(res.headers['x-ratelimit-remaining']).toBe(7)
  })
})

describe('salvageTruncatedEvents', () => {
  it('recovers complete events from JSON cut off mid-array', () => {
    // Truncated mid-way through the third object (no closing ] or })
    const truncated =
      '{"events":[{"title":"A","dateStart":"2020-01-01"},{"title":"B","dateStart":"2021-02-02"},{"title":"C","dateSt'
    const result = salvageTruncatedEvents(truncated)
    expect(result).not.toBeNull()
    expect(result.events).toHaveLength(2)
    expect(result.events[0].title).toBe('A')
    expect(result.events[1].title).toBe('B')
  })

  it('handles nested objects (e.g. recurrence) without cutting early', () => {
    const truncated =
      '{"events":[{"title":"A","recurrence":{"type":"yearly","interval":1}},{"title":"B","recurr'
    const result = salvageTruncatedEvents(truncated)
    expect(result.events).toHaveLength(1)
    expect(result.events[0].recurrence.type).toBe('yearly')
  })

  it('ignores braces inside string values', () => {
    const truncated = '{"events":[{"title":"has } brace","dateStart":"2020"},{"title":"next'
    const result = salvageTruncatedEvents(truncated)
    expect(result.events).toHaveLength(1)
    expect(result.events[0].title).toBe('has } brace')
  })

  it('returns null when no complete event exists', () => {
    expect(salvageTruncatedEvents('{"events":[{"title":"incomplete')).toBeNull()
    expect(salvageTruncatedEvents('no array here')).toBeNull()
  })
})
