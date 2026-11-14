// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('../rateLimit.js', () => ({
  getClientIP: vi.fn(() => '127.0.0.1'),
  limitRequest: vi.fn(() => ({ allowed: true, remaining: 9 })),
  applySecurityHeaders: vi.fn(),
  applyCorsHeaders: vi.fn(),
}))

import handler, { salvageTruncatedEvents, isValidISODate } from '../parse.js'
import { limitRequest } from '../rateLimit.js'

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
    limitRequest.mockReturnValue({ allowed: true, remaining: 9 })
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
    limitRequest.mockReturnValue({ allowed: false, remaining: 0, retryAfter: 60 })
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
        location: 'Springfield',
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
    // location is now extracted and passed through the loose schema
    expect(res.body.events[0].location).toBe('Springfield')
    // the response contract includes a truncated flag; false on a clean parse
    expect(res.body.truncated).toBe(false)
  })

  it('salvages complete events and flags truncation when stop_reason is max_tokens', async () => {
    // JSON cut off mid-way through the second object (no closing ] or })
    const truncated =
      '{"events":[{"title":"First event","dateStart":"1990-01-01","datePrecision":"day"},{"title":"Second ev'
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stop_reason: 'max_tokens', content: [{ text: truncated }] }),
    })

    await handler(makeReq('POST', { text: 'a long biography' }), res)

    expect(res.statusCode).toBe(200)
    expect(res.body.truncated).toBe(true)
    expect(res.body.events).toHaveLength(1)
    expect(res.body.events[0].title).toBe('First event')
  })

  it('still 502s on unparseable output that is not a truncation', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ stop_reason: 'end_turn', content: [{ text: 'total garbage {{{' }] }),
    })

    await handler(makeReq('POST', { text: 'hello' }), res)
    expect(res.statusCode).toBe(502)
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

  it('drops dates that are not real calendar dates and flags the event', async () => {
    const mockEvents = [
      { title: 'Leap day typo', dateStart: '2023-02-29', datePrecision: 'day' },
      { title: 'Bad month', dateStart: '1998-13', dateEnd: '1999-01-01', flagReason: 'Unclear source' },
      { title: 'Fine', dateStart: '2024-02-29', dateEnd: '2024-03', datePrecision: 'day' },
    ]
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ content: [{ text: JSON.stringify({ events: mockEvents }) }] }),
    })

    await handler(makeReq('POST', { text: 'test' }), res)
    const [leap, month, fine] = res.body.events
    expect(leap.dateStart).toBeNull()
    expect(leap.flagged).toBe(true)
    expect(leap.flagReason).toBe('Invalid start date: "2023-02-29"')
    expect(month.dateStart).toBeNull()
    expect(month.dateEnd).toBe('1999-01-01')
    expect(month.flagReason).toBe('Unclear source; Invalid start date: "1998-13"')
    expect(fine.dateStart).toBe('2024-02-29')
    expect(fine.dateEnd).toBe('2024-03')
    expect(fine.flagged).toBe(false)
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
    limitRequest.mockReturnValue({ allowed: true, remaining: 7 })
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

describe('isValidISODate (api copy)', () => {
  it('accepts year, year-month and real calendar days', () => {
    for (const d of ['1990', '1990-07', '2024-02-29', '1999-12-31', '0800']) {
      expect(isValidISODate(d), d).toBe(true)
    }
  })

  it('rejects impossible days, months and other shapes', () => {
    for (const d of ['2023-02-29', '2024-02-30', '2024-04-31', '1998-13', '1998-00', '1998-01-00', '90', '1990-7', '1990-07-01T00:00', '', null, 1990]) {
      expect(isValidISODate(d), String(d)).toBe(false)
    }
  })
})

// ─── Streaming mode ──────────────────────────────────────

import { createEventScanner } from '../parse.js'

function sseBody(events, splitAt = 11) {
  const text = events.map((e) => `event: ${e.type}\ndata: ${JSON.stringify(e)}\n\n`).join('')
  const bytes = new TextEncoder().encode(text)
  const pieces = []
  for (let i = 0; i < bytes.length; i += splitAt) pieces.push(bytes.slice(i, i + splitAt))
  let i = 0
  return {
    getReader: () => ({
      read: () => Promise.resolve(i < pieces.length ? { value: pieces[i++], done: false } : { value: undefined, done: true }),
    }),
  }
}

function textDeltas(text, size = 9) {
  const out = []
  for (let i = 0; i < text.length; i += size) {
    out.push({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: text.slice(i, i + size) } })
  }
  return out
}

function streamingRes() {
  const res = makeRes()
  res.lines = []
  res.write = vi.fn((chunk) => { res.lines.push(...chunk.split('\n').filter(Boolean).map((l) => JSON.parse(l))) })
  res.flushHeaders = vi.fn()
  return res
}

describe('createEventScanner', () => {
  it('returns each top-level event as soon as it closes', () => {
    const scanner = createEventScanner()
    expect(scanner.push('{ "events": [ {"title": "A", "people": ["x"]')).toEqual([])
    expect(scanner.push('}, {"title": "B {not a brace}"')).toEqual([{ title: 'A', people: ['x'] }])
    expect(scanner.push('} ] }')).toEqual([{ title: 'B {not a brace}' }])
    expect(scanner.push(', {"title": "after the array"}')).toEqual([])
  })

  it('handles escaped quotes and nested objects', () => {
    const scanner = createEventScanner()
    const found = scanner.push('[{"title":"Say \\"hi\\"","recurrence":{"type":"yearly"}},{"title":"C"}]')
    expect(found.map((e) => e.title)).toEqual(['Say "hi"', 'C'])
  })
})

describe('parse.js streaming handler', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    process.env.ANTHROPIC_API_KEY = 'test-key'
    limitRequest.mockReturnValue({ allowed: true, remaining: 9 })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.ANTHROPIC_API_KEY
  })

  const reply = JSON.stringify({
    events: [
      { id: 'evt_1', title: 'Moved to Lisbon', dateStart: '1990', datePrecision: 'year' },
      { id: 'evt_1', title: 'Opened a bakery', dateStart: '1995-02-30', datePrecision: 'day' },
    ],
  })

  it('streams normalized events as NDJSON, then a done line', async () => {
    fetch.mockResolvedValue({
      ok: true,
      body: sseBody([
        { type: 'message_start', message: {} },
        { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } },
        ...textDeltas(reply),
        { type: 'message_delta', delta: { stop_reason: 'end_turn' } },
        { type: 'message_stop' },
      ]),
    })
    const res = streamingRes()
    await handler(makeReq('POST', { text: 'In 1990 Ana moved to Lisbon.', stream: true }), res)

    const sent = JSON.parse(fetch.mock.calls[0][1].body)
    expect(sent).toMatchObject({ stream: true, model: 'claude-haiku-5-5', thinking: { type: 'disabled' } })
    expect(res.headers['content-type']).toMatch(/ndjson/)
    const events = res.lines.filter((l) => l.type === 'event').map((l) => l.event)
    expect(events.map((e) => e.title)).toEqual(['Moved to Lisbon', 'Opened a bakery'])
    // A repeated model id gets a fresh one; an impossible date is dropped and flagged
    expect(new Set(events.map((e) => e.id)).size).toBe(2)
    expect(events[1]).toMatchObject({ dateStart: null, flagged: true })
    expect(res.lines.at(-1)).toEqual({ type: 'done', truncated: false, count: 2 })
    expect(res.end).toHaveBeenCalled()
  })

  it('flags truncation when Claude hits max_tokens mid-array', async () => {
    const cut = reply.slice(0, reply.indexOf('Opened') + 4)
    fetch.mockResolvedValue({
      ok: true,
      body: sseBody([...textDeltas(cut), { type: 'message_delta', delta: { stop_reason: 'max_tokens' } }]),
    })
    const res = streamingRes()
    await handler(makeReq('POST', { text: 'x', stream: true }), res)
    expect(res.lines.filter((l) => l.type === 'event')).toHaveLength(1)
    expect(res.lines.at(-1)).toEqual({ type: 'done', truncated: true, count: 1 })
  })

  it('reports a mid-stream error after the events already sent', async () => {
    fetch.mockResolvedValue({
      ok: true,
      body: sseBody([...textDeltas(reply.slice(0, 90)), { type: 'error', error: { type: 'overloaded_error', message: 'Overloaded' } }]),
    })
    const res = streamingRes()
    await handler(makeReq('POST', { text: 'x', stream: true }), res)
    expect(res.lines.at(-1)).toMatchObject({ type: 'error' })
  })

  it('still answers upstream failures with a JSON 502 before streaming', async () => {
    fetch.mockResolvedValue({ ok: false, status: 529, text: () => Promise.resolve('overloaded') })
    const res = streamingRes()
    await handler(makeReq('POST', { text: 'x', stream: true }), res)
    expect(res.statusCode).toBe(502)
    expect(res.body.error).toMatch(/AI service error/)
    expect(res.write).not.toHaveBeenCalled()
  })
})
