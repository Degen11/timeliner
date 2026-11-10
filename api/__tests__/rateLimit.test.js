// @vitest-environment node
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { checkRateLimit, limitRequest, getClientIP, applyCorsHeaders } from '../rateLimit.js'

// Each test uses a unique key so the module-level Map doesn't leak state.
let keyCounter = 0
const freshKey = () => `test-key-${keyCounter++}`

describe('checkRateLimit', () => {
  it('allows the first request and reports remaining budget', () => {
    const r = checkRateLimit(freshKey(), { maxRequests: 3 })
    expect(r.allowed).toBe(true)
    expect(r.remaining).toBe(2)
  })

  it('allows up to maxRequests then rejects within the burst window', () => {
    const key = freshKey()
    expect(checkRateLimit(key, { maxRequests: 3 }).allowed).toBe(true) // 1
    expect(checkRateLimit(key, { maxRequests: 3 }).allowed).toBe(true) // 2
    expect(checkRateLimit(key, { maxRequests: 3 }).allowed).toBe(true) // 3
    const rejected = checkRateLimit(key, { maxRequests: 3 })
    expect(rejected.allowed).toBe(false)
    expect(rejected.remaining).toBe(0)
    expect(rejected.retryAfter).toBeGreaterThan(0)
  })

  it('does NOT consume daily budget for burst-rejected requests', () => {
    const key = freshKey()
    // Burst limit 2, daily limit 10. Fire 6 requests in one window:
    // 2 succeed, 4 are burst-rejected and must not touch the daily counter.
    for (let i = 0; i < 6; i++) {
      checkRateLimit(key, { maxRequests: 2, dailyMax: 10 })
    }
    // Advance past the burst window so burst resets but daily persists.
    vi.useFakeTimers()
    vi.setSystemTime(Date.now() + 61_000)
    try {
      // Daily count should be 2 (only the allowed requests), so these succeed.
      expect(checkRateLimit(key, { maxRequests: 2, dailyMax: 10 }).allowed).toBe(true) // daily 3
      expect(checkRateLimit(key, { maxRequests: 2, dailyMax: 10 }).allowed).toBe(true) // daily 4
    } finally {
      vi.useRealTimers()
    }
  })

  it('enforces the daily cap independently of the burst window', () => {
    const key = freshKey()
    let allowedCount = 0
    // maxRequests high so burst never trips; dailyMax 5 should be the limiter.
    for (let i = 0; i < 8; i++) {
      if (checkRateLimit(key, { maxRequests: 1000, dailyMax: 5 }).allowed) allowedCount++
    }
    expect(allowedCount).toBe(5)
  })

  it('resets the burst window after windowMs elapses', () => {
    const key = freshKey()
    checkRateLimit(key, { maxRequests: 1 })
    expect(checkRateLimit(key, { maxRequests: 1 }).allowed).toBe(false)
    vi.useFakeTimers()
    vi.setSystemTime(Date.now() + 61_000)
    try {
      expect(checkRateLimit(key, { maxRequests: 1 }).allowed).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })
})

describe('getClientIP', () => {
  it('takes the leftmost x-forwarded-for IP', () => {
    const req = { headers: { 'x-forwarded-for': '203.0.113.5, 70.41.3.18' } }
    expect(getClientIP(req)).toBe('203.0.113.5')
  })

  it('returns "unknown" when no valid IP is present', () => {
    expect(getClientIP({ headers: {} })).toBe('unknown')
  })
})

describe('applyCorsHeaders', () => {
  const makeRes = () => {
    const headers = {}
    return { setHeader: (k, v) => { headers[k] = v }, headers }
  }
  let origEnv
  beforeEach(() => { origEnv = process.env.ALLOWED_ORIGIN })
  afterEach(() => { process.env.ALLOWED_ORIGIN = origEnv })

  it('emits a literal wildcard (never reflects) when ALLOWED_ORIGIN is *', () => {
    process.env.ALLOWED_ORIGIN = '*'
    const res = makeRes()
    applyCorsHeaders({ headers: { origin: 'https://evil.example' } }, res)
    expect(res.headers['Access-Control-Allow-Origin']).toBe('*')
  })

  it('echoes the origin only when it matches ALLOWED_ORIGIN exactly', () => {
    process.env.ALLOWED_ORIGIN = 'https://good.example'
    const match = makeRes()
    applyCorsHeaders({ headers: { origin: 'https://good.example' } }, match)
    expect(match.headers['Access-Control-Allow-Origin']).toBe('https://good.example')

    const mismatch = makeRes()
    applyCorsHeaders({ headers: { origin: 'https://evil.example' } }, mismatch)
    expect(mismatch.headers['Access-Control-Allow-Origin']).toBeUndefined()
  })
})

// ─── limitRequest: shared Redis counters ─────────────────

describe('limitRequest', () => {
  // A tiny in-memory stand-in for the Upstash REST pipeline endpoint
  let store
  let requests
  const fakeRedis = (url, init) => {
    requests.push({ url, init })
    const commands = JSON.parse(init.body)
    const results = commands.map(([cmd, key]) => {
      if (cmd === 'GET') return { result: store.has(key) ? String(store.get(key)) : null }
      if (cmd === 'INCR') { store.set(key, (store.get(key) || 0) + 1); return { result: store.get(key) } }
      if (cmd === 'PEXPIRE') return { result: 1 }
      return { error: `unknown ${cmd}` }
    })
    return Promise.resolve({ ok: true, json: () => Promise.resolve(results) })
  }

  beforeEach(() => {
    store = new Map()
    requests = []
    process.env.UPSTASH_REDIS_REST_URL = 'https://redis.example.com/'
    process.env.UPSTASH_REDIS_REST_TOKEN = 'token-123'
    vi.stubGlobal('fetch', vi.fn(fakeRedis))
  })

  afterEach(() => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    vi.unstubAllGlobals()
  })

  it('counts in Redis, so the limit holds across instances', async () => {
    const key = freshKey()
    expect((await limitRequest(key, { maxRequests: 2 })).allowed).toBe(true)
    expect((await limitRequest(key, { maxRequests: 2 })).allowed).toBe(true)
    const rejected = await limitRequest(key, { maxRequests: 2 })
    expect(rejected.allowed).toBe(false)
    expect(rejected.retryAfter).toBeGreaterThan(0)
    expect(requests[0].url).toBe('https://redis.example.com/pipeline')
    expect(requests[0].init.headers.Authorization).toBe('Bearer token-123')
  })

  it('enforces the daily budget without spending it on rejected requests', async () => {
    const key = freshKey()
    for (let i = 0; i < 3; i++) expect((await limitRequest(key, { maxRequests: 100, dailyMax: 3 })).allowed).toBe(true)
    expect((await limitRequest(key, { maxRequests: 100, dailyMax: 3 })).allowed).toBe(false)
    const dailyKey = [...store.keys()].find((k) => k.includes(':d:'))
    expect(store.get(dailyKey)).toBe(3)
  })

  it('also reads the Vercel KV variable names', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL
    delete process.env.UPSTASH_REDIS_REST_TOKEN
    process.env.KV_REST_API_URL = 'https://kv.example.com'
    process.env.KV_REST_API_TOKEN = 'kv-token'
    await limitRequest(freshKey(), { maxRequests: 2 })
    expect(requests[0].url).toBe('https://kv.example.com/pipeline')
    delete process.env.KV_REST_API_URL
    delete process.env.KV_REST_API_TOKEN
  })

  it('falls back to the in-memory limiter when Redis fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    fetch.mockImplementation(() => Promise.resolve({ ok: false, status: 503 }))
    const key = freshKey()
    expect((await limitRequest(key, { maxRequests: 1 })).allowed).toBe(true)
    expect((await limitRequest(key, { maxRequests: 1 })).allowed).toBe(false)
    expect(errorSpy).toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('uses the in-memory limiter without Redis config', async () => {
    delete process.env.UPSTASH_REDIS_REST_URL
    const key = freshKey()
    expect((await limitRequest(key, { maxRequests: 1 })).allowed).toBe(true)
    expect((await limitRequest(key, { maxRequests: 1 })).allowed).toBe(false)
    expect(fetch).not.toHaveBeenCalled()
  })
})
