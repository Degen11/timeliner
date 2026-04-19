// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Set env vars before any imports so supabase client initialises with them
const { mockSupabase } = vi.hoisted(() => {
  const chain = {
    from: vi.fn(),
    select: vi.fn(),
    eq: vi.fn(),
    single: vi.fn(),
    insert: vi.fn(),
  }
  // Make every chainable method return the chain itself by default
  chain.from.mockReturnValue(chain)
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.single.mockResolvedValue({ data: null, error: null })
  chain.insert.mockResolvedValue({ error: null })
  return { mockSupabase: chain }
})

vi.hoisted(() => {
  process.env.VITE_SUPABASE_URL = 'https://test.supabase.co'
  process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key'
})

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase),
}))

vi.mock('../rateLimit.js', () => ({
  getClientIP: vi.fn(() => '127.0.0.1'),
  checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 19 })),
  applySecurityHeaders: vi.fn(),
  applyCorsHeaders: vi.fn(),
}))

import handler from '../share.js'
import { checkRateLimit } from '../rateLimit.js'

// ─── Helpers ─────────────────────────────────────────────

function makeReq(method, { body, query, headers } = {}) {
  return {
    method,
    body: body ?? null,
    query: query ?? {},
    headers: { host: 'timeliner.app', ...headers },
  }
}

function makeRes() {
  const res = { statusCode: 200, headers: {}, body: null }
  res.status = vi.fn((code) => { res.statusCode = code; return res })
  res.json = vi.fn((data) => { res.body = data; return res })
  res.send = vi.fn((data) => { res.body = data; return res })
  res.setHeader = vi.fn((k, v) => { res.headers[k.toLowerCase()] = v })
  res.end = vi.fn(() => res)
  return res
}

const SAMPLE_EVENTS = [
  { id: 'evt_1', title: 'Born', dateStart: '1990-01-01' },
  { id: 'evt_2', title: 'Graduated', dateStart: '2012-06-01' },
]

// ─── Tests ───────────────────────────────────────────────

describe('share.js handler', () => {
  let res

  beforeEach(() => {
    res = makeRes()
    checkRateLimit.mockReturnValue({ allowed: true, remaining: 19 })
    // Reset chain mock defaults
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.single.mockResolvedValue({ data: null, error: null })
    mockSupabase.insert.mockResolvedValue({ error: null })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ── Rate limiting ──────────────────────────────────────

  it('returns 429 when rate limited', async () => {
    checkRateLimit.mockReturnValue({ allowed: false, remaining: 0, retryAfter: 30 })
    await handler(makeReq('POST', { body: { events: SAMPLE_EVENTS } }), res)
    expect(res.statusCode).toBe(429)
    expect(res.headers['retry-after']).toBe(30)
  })

  it('returns 405 for unsupported methods', async () => {
    await handler(makeReq('DELETE'), res)
    expect(res.statusCode).toBe(405)
  })

  it('returns 204 for OPTIONS preflight', async () => {
    await handler(makeReq('OPTIONS'), res)
    expect(res.statusCode).toBe(204)
  })

  // ── POST — create share ────────────────────────────────

  it('POST returns 400 when events is missing', async () => {
    await handler(makeReq('POST', { body: {} }), res)
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/Events array/)
  })

  it('POST returns 400 when events is empty', async () => {
    await handler(makeReq('POST', { body: { events: [] } }), res)
    expect(res.statusCode).toBe(400)
  })

  it('POST returns 413 when payload exceeds 500 KB', async () => {
    const hugeEvents = [{ id: 'x', title: 'X', data: 'A'.repeat(500_001) }]
    await handler(makeReq('POST', { body: { events: hugeEvents } }), res)
    expect(res.statusCode).toBe(413)
    expect(res.body.error).toMatch(/too large/)
  })

  it('POST creates a share and returns id + url', async () => {
    await handler(makeReq('POST', { body: { events: SAMPLE_EVENTS } }), res)
    expect(res.statusCode).toBe(201)
    expect(res.body.id).toBeTruthy()
    expect(res.body.url).toContain(res.body.id)
    expect(res.body.expiresAt).toBeTruthy()
  })

  it('POST uses custom expiresInDays when valid', async () => {
    await handler(makeReq('POST', { body: { events: SAMPLE_EVENTS, expiresInDays: 30 } }), res)
    expect(res.statusCode).toBe(201)
    const expiresAt = new Date(res.body.expiresAt)
    const diff = expiresAt - Date.now()
    // Should be ~30 days from now (within a 1-day tolerance)
    expect(diff).toBeGreaterThan(29 * 86_400_000)
    expect(diff).toBeLessThan(31 * 86_400_000)
  })

  it('POST falls back to 90-day expiry for invalid expiresInDays', async () => {
    await handler(makeReq('POST', { body: { events: SAMPLE_EVENTS, expiresInDays: 999 } }), res)
    expect(res.statusCode).toBe(201)
    const diff = new Date(res.body.expiresAt) - Date.now()
    expect(diff).toBeGreaterThan(89 * 86_400_000)
    expect(diff).toBeLessThan(91 * 86_400_000)
  })

  it('POST returns 500 when supabase insert fails', async () => {
    mockSupabase.insert.mockResolvedValueOnce({ error: new Error('db error') })
    await handler(makeReq('POST', { body: { events: SAMPLE_EVENTS } }), res)
    expect(res.statusCode).toBe(500)
    expect(res.body.error).toMatch(/Failed to create share/)
  })

  // ── GET — retrieve share ───────────────────────────────

  it('GET returns 400 for missing id', async () => {
    await handler(makeReq('GET', { query: {} }), res)
    expect(res.statusCode).toBe(400)
    expect(res.body.error).toMatch(/Invalid share ID/)
  })

  it('GET returns 400 for oversized id', async () => {
    await handler(makeReq('GET', { query: { id: 'x'.repeat(21) } }), res)
    expect(res.statusCode).toBe(400)
  })

  it('GET returns 404 when share is not found', async () => {
    mockSupabase.single.mockResolvedValueOnce({ data: null, error: new Error('not found') })
    await handler(makeReq('GET', { query: { id: 'abc123' } }), res)
    expect(res.statusCode).toBe(404)
  })

  it('GET returns 410 when share has expired', async () => {
    mockSupabase.single.mockResolvedValueOnce({
      data: { id: 'abc123', data: { events: [] }, meta: {}, expires_at: new Date(Date.now() - 1000).toISOString() },
      error: null,
    })
    await handler(makeReq('GET', { query: { id: 'abc123' } }), res)
    expect(res.statusCode).toBe(410)
    expect(res.body.error).toMatch(/expired/)
  })

  it('GET returns events JSON for normal browser', async () => {
    const shareData = {
      id: 'abc123',
      data: { events: SAMPLE_EVENTS },
      meta: { title: 'My Timeline', eventCount: 2 },
      expires_at: new Date(Date.now() + 86_400_000).toISOString(),
    }
    mockSupabase.single.mockResolvedValueOnce({ data: shareData, error: null })

    await handler(makeReq('GET', { query: { id: 'abc123' }, headers: { 'user-agent': 'Mozilla/5.0' } }), res)

    expect(res.statusCode).toBe(200)
    expect(res.body.events).toHaveLength(2)
    expect(res.body.meta.title).toBe('My Timeline')
  })

  it('GET returns OG HTML for crawler user-agents', async () => {
    const shareData = {
      id: 'abc123',
      data: { events: SAMPLE_EVENTS },
      meta: { title: 'My Timeline', description: 'A great timeline', eventCount: 2 },
      expires_at: new Date(Date.now() + 86_400_000).toISOString(),
    }
    mockSupabase.single.mockResolvedValueOnce({ data: shareData, error: null })

    await handler(
      makeReq('GET', { query: { id: 'abc123' }, headers: { 'user-agent': 'Twitterbot/1.0', host: 'timeliner.app' } }),
      res,
    )

    expect(res.statusCode).toBe(200)
    expect(typeof res.body).toBe('string')
    expect(res.body).toContain('<meta property="og:title"')
    expect(res.body).toContain('My Timeline')
    // og:image with dimensions should be present
    expect(res.body).toContain('<meta property="og:image"')
    expect(res.body).toContain('og:image:width')
    expect(res.body).toContain('og:image:height')
  })

  it('GET OG HTML escapes HTML in title/description', async () => {
    const shareData = {
      id: 'abc123',
      data: { events: SAMPLE_EVENTS },
      meta: { title: '<script>alert(1)</script>', description: '&evil', eventCount: 2 },
      expires_at: new Date(Date.now() + 86_400_000).toISOString(),
    }
    mockSupabase.single.mockResolvedValueOnce({ data: shareData, error: null })

    await handler(
      makeReq('GET', { query: { id: 'abc123' }, headers: { 'user-agent': 'facebookexternalhit/1.1', host: 'timeliner.app' } }),
      res,
    )

    expect(res.body).not.toContain('<script>')
    expect(res.body).toContain('&lt;script&gt;')
    expect(res.body).toContain('&amp;evil')
  })

  it('GET redirects _r=1 requests to SPA URL', async () => {
    await handler(makeReq('GET', { query: { id: 'abc123', _r: '1' }, headers: { 'user-agent': 'Mozilla/5.0' } }), res)
    expect(res.statusCode).toBe(302)
    expect(res.headers['location']).toMatch(/\/s\?id=abc123/)
  })
})
