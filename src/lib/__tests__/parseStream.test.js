import { describe, it, expect, vi, afterEach } from 'vitest'
import { streamParse, runWithConcurrency, ParseRequestError } from '../parseStream'

function ndjsonResponse(lines, { splitAt = 7 } = {}) {
  const text = lines.map((l) => JSON.stringify(l)).join('\n') + '\n'
  const bytes = new TextEncoder().encode(text)
  // Deliver in small, uneven pieces so lines straddle reads
  const pieces = []
  for (let i = 0; i < bytes.length; i += splitAt) pieces.push(bytes.slice(i, i + splitAt))
  let i = 0
  return {
    ok: true,
    status: 200,
    headers: { get: () => 'application/x-ndjson; charset=utf-8' },
    body: {
      getReader: () => ({
        read: () => Promise.resolve(i < pieces.length ? { value: pieces[i++], done: false } : { value: undefined, done: true }),
      }),
    },
  }
}

afterEach(() => vi.unstubAllGlobals())

describe('streamParse', () => {
  it('hands over each event as its line arrives and reports truncation', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(ndjsonResponse([
      { type: 'event', event: { id: 'evt_1', title: 'Born' } },
      { type: 'event', event: { id: 'evt_2', title: 'Moved to Lisbon' } },
      { type: 'done', truncated: true, count: 2 },
    ]))))
    const seen = []
    const result = await streamParse({ text: 'x', onEvent: (e) => seen.push(e.title) })
    expect(seen).toEqual(['Born', 'Moved to Lisbon'])
    expect(result).toEqual({ truncated: true, count: 2 })
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toMatchObject({ text: 'x', stream: true })
  })

  it('throws a partial error when the stream reports one after some events', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(ndjsonResponse([
      { type: 'event', event: { id: 'evt_1', title: 'Born' } },
      { type: 'error', error: 'The AI stopped partway through.' },
    ]))))
    const err = await streamParse({ text: 'x', onEvent: () => {} }).catch((e) => e)
    expect(err).toBeInstanceOf(ParseRequestError)
    expect(err.message).toBe('The AI stopped partway through.')
    expect(err.partial).toBe(true)
  })

  it('treats a stream that ends without "done" as a failure', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve(ndjsonResponse([
      { type: 'event', event: { id: 'evt_1', title: 'Born' } },
    ]))))
    await expect(streamParse({ text: 'x' })).rejects.toThrow(/closed before/)
  })

  it('reads a plain JSON reply too', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ events: [{ id: 'evt_1', title: 'Born' }], truncated: false }),
    })))
    const seen = []
    expect(await streamParse({ text: 'x', onEvent: (e) => seen.push(e.id) })).toEqual({ truncated: false, count: 1 })
    expect(seen).toEqual(['evt_1'])
  })

  it('surfaces the server error message and status', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({
      ok: false,
      status: 429,
      json: () => Promise.resolve({ error: 'Rate limit exceeded. Try again in 30 seconds.' }),
    })))
    const err = await streamParse({ text: 'x' }).catch((e) => e)
    expect(err.message).toMatch(/Rate limit/)
    expect(err.status).toBe(429)
  })
})

describe('runWithConcurrency', () => {
  it('keeps at most `limit` jobs in flight and returns results in order', async () => {
    let running = 0
    let peak = 0
    const results = await runWithConcurrency([30, 5, 20, 1, 10], 2, async (ms, i) => {
      running++
      peak = Math.max(peak, running)
      await new Promise((r) => setTimeout(r, ms))
      running--
      return i
    })
    expect(results).toEqual([0, 1, 2, 3, 4])
    expect(peak).toBe(2)
  })

  it('starts nothing new once aborted', async () => {
    const controller = new AbortController()
    const fn = vi.fn(async () => controller.abort())
    await runWithConcurrency([1, 2, 3], 1, fn, controller.signal)
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
