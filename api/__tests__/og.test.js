// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockSupabase } = vi.hoisted(() => {
  const chain = { from: vi.fn(), select: vi.fn(), eq: vi.fn(), single: vi.fn() }
  chain.from.mockReturnValue(chain)
  chain.select.mockReturnValue(chain)
  chain.eq.mockReturnValue(chain)
  chain.single.mockResolvedValue({ data: null, error: null })
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
  checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 59 })),
  applySecurityHeaders: vi.fn(),
}))

vi.mock('@vercel/og', () => ({
  ImageResponse: vi.fn(function ImageResponse(tree, options) {
    this.tree = tree
    this.options = options
    this.arrayBuffer = async () => new Uint8Array([137, 80, 78, 71]).buffer
  }),
}))

import handler, { formatEventDate, pickCardEvents, getDateSpan, buildShareImageTree } from '../og.js'
import { checkRateLimit } from '../rateLimit.js'
import { ImageResponse } from '@vercel/og'

function makeReq(query = {}, method = 'GET') {
  return { method, query, headers: { host: 'timeliner.app' } }
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

function collectText(node) {
  if (node === null || node === undefined) return ''
  if (typeof node === 'string' || typeof node === 'number') return String(node)
  const c = node.props?.children
  return (Array.isArray(c) ? c : [c]).map(collectText).join(' ')
}

describe('og helpers', () => {
  it('formats year, month and day precision dates', () => {
    expect(formatEventDate('1962')).toBe('1962')
    expect(formatEventDate('1984-08')).toBe('August 1984')
    expect(formatEventDate('2019-09-07')).toBe('September 7, 2019')
    expect(formatEventDate(null)).toBe('')
  })

  it('picks the first, middle and last dated events', () => {
    const events = [
      { title: 'C', dateStart: '2000' },
      { title: 'A', dateStart: '1950' },
      { title: 'E', dateStart: '2020' },
      { title: 'B', dateStart: '1970' },
      { title: 'D', dateStart: '2010' },
      { title: 'Undated' },
    ]
    expect(pickCardEvents(events).map((e) => e.title)).toEqual(['A', 'C', 'E'])
  })

  it('fills with undated events when there are too few dated ones', () => {
    const events = [{ title: 'Undated' }, { title: 'Dated', dateStart: '1990' }]
    expect(pickCardEvents(events).map((e) => e.title)).toEqual(['Dated', 'Undated'])
    expect(pickCardEvents(null)).toEqual([])
  })

  it('builds a year span', () => {
    expect(getDateSpan([{ dateStart: '1962-03' }, { dateStart: '2019' }, {}])).toBe('1962 – 2019')
    expect(getDateSpan([{ dateStart: '1825' }])).toBe('1825')
    expect(getDateSpan([])).toBe('')
  })

  it('never leaves an empty children array on a node (Satori rejects it)', () => {
    const tree = buildShareImageTree({ title: 'T', eventCount: 1, span: '', cards: [{ date: '', title: 'x' }] })
    const walk = (n) => {
      if (!n || typeof n !== 'object') return
      expect(Array.isArray(n.props.children) && n.props.children.length === 0).toBe(false)
      const c = n.props.children
      ;(Array.isArray(c) ? c : [c]).forEach(walk)
    }
    walk(tree)
  })
})

describe('GET /api/og', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    checkRateLimit.mockReturnValue({ allowed: true, remaining: 59 })
    mockSupabase.from.mockReturnValue(mockSupabase)
    mockSupabase.select.mockReturnValue(mockSupabase)
    mockSupabase.eq.mockReturnValue(mockSupabase)
    mockSupabase.single.mockResolvedValue({ data: null, error: null })
  })

  it('rejects a missing or oversized id with 400', async () => {
    const res = makeRes()
    await handler(makeReq({}), res)
    expect(res.statusCode).toBe(400)

    const res2 = makeRes()
    await handler(makeReq({ id: 'x'.repeat(21) }), res2)
    expect(res2.statusCode).toBe(400)
  })

  it('rejects non-GET methods with 405', async () => {
    const res = makeRes()
    await handler(makeReq({ id: 'abc' }, 'POST'), res)
    expect(res.statusCode).toBe(405)
  })

  it('returns 429 with Retry-After when rate limited', async () => {
    checkRateLimit.mockReturnValue({ allowed: false, retryAfter: 30 })
    const res = makeRes()
    await handler(makeReq({ id: 'abc' }), res)
    expect(res.statusCode).toBe(429)
    expect(res.headers['retry-after']).toBe(30)
  })

  it('redirects to the static image when the share does not exist', async () => {
    const res = makeRes()
    await handler(makeReq({ id: 'missing' }), res)
    expect(res.statusCode).toBe(302)
    expect(res.headers.location).toMatch(/^\/og-image\.png/)
  })

  it('redirects to the static image when the share has expired', async () => {
    mockSupabase.single.mockResolvedValue({
      data: { data: { events: [] }, meta: { title: 'Old' }, expires_at: '2000-01-01T00:00:00Z' },
      error: null,
    })
    const res = makeRes()
    await handler(makeReq({ id: 'expired' }), res)
    expect(res.statusCode).toBe(302)
  })

  it('renders a cacheable PNG with the share title and events', async () => {
    mockSupabase.single.mockResolvedValue({
      data: {
        data: { events: [{ title: 'Born in Portland', dateStart: '1962' }, { title: 'Joins the paper', dateStart: '1984-08' }] },
        meta: { title: 'A Reporter’s Life', eventCount: 2 },
        expires_at: '2999-01-01T00:00:00Z',
      },
      error: null,
    })
    const res = makeRes()
    await handler(makeReq({ id: 'abc123' }), res)

    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toBe('image/png')
    expect(res.headers['cache-control']).toContain('s-maxage')
    expect(Buffer.isBuffer(res.body)).toBe(true)

    const { tree, options } = ImageResponse.mock.instances[0]
    expect(options).toMatchObject({ width: 1200, height: 630 })
    expect(options.fonts.length).toBeGreaterThan(0)
    const text = collectText(tree)
    expect(text).toContain('A Reporter’s Life')
    expect(text).toContain('2 events · 1962 – 1984')
    expect(text).toContain('August 1984')
    expect(text).toContain('Joins the paper')
  })
})
