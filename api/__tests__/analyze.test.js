// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../rateLimit.js', () => ({
  getClientIP: vi.fn(() => '127.0.0.1'),
  checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 4 })),
  applySecurityHeaders: vi.fn(),
  applyCorsHeaders: vi.fn(),
}))

import handler from '../analyze.js'
import { checkRateLimit } from '../rateLimit.js'

// ─── Helpers ─────────────────────────────────────────────

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

const SAMPLE_EVENTS = [
  { title: 'Born', description: 'Birth event', dateStart: '1950-01-01', dateEnd: null, tags: ['family'], people: ['James'], location: '' },
  { title: 'Graduated', description: null, dateStart: '1972-06-01', dateEnd: null, tags: ['education'], people: ['James'], location: 'Boston' },
]

// ─── Tests ───────────────────────────────────────────────

describe('analyze.js handler', () => {
  let res

  beforeEach(() => {
    res = makeRes()
    vi.stubGlobal('fetch', vi.fn())
    process.env.ANTHROPIC_API_KEY = 'test-key'
    checkRateLimit.mockReturnValue({ allowed: true, remaining: 4 })
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

  it('returns 400 when events is missing', async () => {
    await handler(makeReq('POST', {}), res)
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/Events array/)
  })

  it('returns 400 when events is an empty array', async () => {
    await handler(makeReq('POST', { events: [] }), res)
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/Events array/)
  })

  it('returns 400 when events exceeds the 500-item limit', async () => {
    const tooMany = Array.from({ length: 501 }, (_, i) => ({ title: `Event ${i}`, dateStart: `2000-01-0${i % 9 + 1}` }))
    await handler(makeReq('POST', { events: tooMany }), res)
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/Too many events/)
  })

  it('returns 429 when rate limited', async () => {
    checkRateLimit.mockReturnValue({ allowed: false, remaining: 0, retryAfter: 120 })
    await handler(makeReq('POST', { events: SAMPLE_EVENTS }), res)
    expect(res.statusCode).toBe(429)
    expect(res.headers['retry-after']).toBe(120)
  })

  it('returns 500 when ANTHROPIC_API_KEY is absent', async () => {
    delete process.env.ANTHROPIC_API_KEY
    await handler(makeReq('POST', { events: SAMPLE_EVENTS }), res)
    expect(res.statusCode).toBe(500)
  })

  it('returns 502 when Claude API returns a non-OK response', async () => {
    fetch.mockResolvedValueOnce({ ok: false, text: async () => 'upstream error' })
    await handler(makeReq('POST', { events: SAMPLE_EVENTS }), res)
    expect(res.statusCode).toBe(502)
    expect(res.body.error).toMatch(/AI service error/)
  })

  it('returns 502 when Claude returns no content', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [] }),
    })
    await handler(makeReq('POST', { events: SAMPLE_EVENTS }), res)
    expect(res.statusCode).toBe(502)
    expect(res.body.error).toMatch(/No response from AI/)
  })

  it('returns 502 when Claude response is not valid JSON', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ text: '<<not json>>' }] }),
    })
    await handler(makeReq('POST', { events: SAMPLE_EVENTS }), res)
    expect(res.statusCode).toBe(502)
    expect(res.body.error).toMatch(/unreadable response/)
  })

  it('returns 200 with normalized insights on success', async () => {
    const mockInsights = [
      { type: 'gap', severity: 'high', title: 'Gap: 1950–1972', description: 'No events for 22 years.' },
    ]
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ text: JSON.stringify({ insights: mockInsights }) }],
        usage: { input_tokens: 100, output_tokens: 50, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
      }),
    })

    await handler(makeReq('POST', { events: SAMPLE_EVENTS }), res)

    expect(res.statusCode).toBe(200)
    expect(res.body.insights).toHaveLength(1)
    expect(res.body.insights[0].type).toBe('gap')
    expect(res.body.insights[0].id).toMatch(/^ins_/)
  })

  it('assigns sequential ids to each insight', async () => {
    const mockInsights = [
      { type: 'gap', severity: 'low', title: 'Gap A', description: '' },
      { type: 'missing_context', severity: 'medium', title: 'Missing B', description: '' },
    ]
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ text: JSON.stringify({ insights: mockInsights }) }],
        usage: { input_tokens: 10, output_tokens: 10 },
      }),
    })

    await handler(makeReq('POST', { events: SAMPLE_EVENTS }), res)

    const ids = res.body.insights.map((i) => i.id)
    expect(ids[0]).toMatch(/^ins_\d+_0$/)
    expect(ids[1]).toMatch(/^ins_\d+_1$/)
  })

  it('returns usage stats in the response', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        content: [{ text: '{"insights":[]}' }],
        usage: { input_tokens: 200, output_tokens: 80, cache_read_input_tokens: 150, cache_creation_input_tokens: 0 },
      }),
    })

    await handler(makeReq('POST', { events: SAMPLE_EVENTS }), res)

    expect(res.body.usage).toMatchObject({
      inputTokens: 200,
      outputTokens: 80,
      cacheRead: 150,
    })
  })

  it('strips event fields beyond the defined limits before sending to Claude', async () => {
    // Verify that oversized fields are truncated by checking Claude is called with a body
    let calledBody
    fetch.mockImplementation(async (_url, opts) => {
      calledBody = JSON.parse(opts.body)
      return { ok: true, json: async () => ({ content: [{ text: '{"insights":[]}' }], usage: {} }) }
    })

    const longEvents = [{ title: 'X'.repeat(500), description: 'D'.repeat(400), dateStart: '2000-01-01', tags: [], people: [], location: 'L'.repeat(200) }]
    await handler(makeReq('POST', { events: longEvents }), res)

    const sentEvent = JSON.parse(calledBody.messages[0].content.split('\n\n')[1])[0]
    expect(sentEvent.title.length).toBeLessThanOrEqual(200)
    expect(sentEvent.description.length).toBeLessThanOrEqual(300)
    expect(sentEvent.location.length).toBeLessThanOrEqual(100)
  })

  it('handles markdown-fenced JSON from Claude', async () => {
    const fenced = '```json\n{"insights":[{"type":"gap","severity":"low","title":"No gap"}]}\n```'
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ text: fenced }], usage: {} }),
    })

    await handler(makeReq('POST', { events: SAMPLE_EVENTS }), res)
    expect(res.statusCode).toBe(200)
    expect(res.body.insights[0].type).toBe('gap')
  })
})
