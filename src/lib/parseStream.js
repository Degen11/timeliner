// Client for /api/parse in streaming mode. The endpoint answers with
// newline-delimited JSON (one line per extracted event, then a "done" line),
// so events reach the review list while Claude is still writing the rest.
// A plain JSON reply (older deploys, or a proxy that buffers) is handled too.

export class ParseRequestError extends Error {
  constructor(message, { status = null, partial = false } = {}) {
    super(message)
    this.name = 'ParseRequestError'
    this.status = status
    // true when some events already came through before the failure
    this.partial = partial
  }
}

async function readErrorMessage(res) {
  try {
    const data = await res.json()
    if (data?.error) return data.error
  } catch {
    // Not JSON (e.g. an HTML error page)
  }
  return `Parsing failed (${res.status})`
}

/**
 * Parse one piece of text. Calls onEvent(event) for every event as it
 * arrives and resolves with { truncated, count }. Throws ParseRequestError.
 */
export async function streamParse({ text, photoFilenames = [], signal, onEvent }) {
  const res = await fetch('/api/parse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, photoFilenames, stream: true }),
    signal,
  })

  if (!res.ok) {
    throw new ParseRequestError(await readErrorMessage(res), { status: res.status })
  }

  let count = 0
  const deliver = (event) => {
    count++
    onEvent?.(event)
  }

  const contentType = res.headers?.get?.('content-type') || ''
  if (!contentType.includes('ndjson') || !res.body?.getReader) {
    const data = await res.json()
    for (const event of data.events || []) deliver(event)
    return { truncated: Boolean(data.truncated), count }
  }

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let pending = ''
  let finished = null

  const handleLine = (line) => {
    if (!line.trim()) return
    let msg
    try {
      msg = JSON.parse(line)
    } catch {
      return
    }
    if (msg.type === 'event' && msg.event) deliver(msg.event)
    else if (msg.type === 'done') finished = { truncated: Boolean(msg.truncated), count }
    else if (msg.type === 'error') {
      throw new ParseRequestError(msg.error || 'Parsing failed', { partial: count > 0 })
    }
  }

  for (;;) {
    const { value, done } = await reader.read()
    if (done) break
    pending += decoder.decode(value, { stream: true })
    let nl
    while ((nl = pending.indexOf('\n')) !== -1) {
      handleLine(pending.slice(0, nl))
      pending = pending.slice(nl + 1)
    }
  }
  handleLine(pending)

  if (!finished) {
    throw new ParseRequestError('The connection closed before the import finished.', { partial: count > 0 })
  }
  return finished
}

/**
 * Run fn over items with at most `limit` in flight. Results come back in
 * input order. Stops starting new items once signal aborts.
 */
export async function runWithConcurrency(items, limit, fn, signal) {
  const results = new Array(items.length)
  let next = 0
  const worker = async () => {
    while (next < items.length && !signal?.aborted) {
      const i = next++
      results[i] = await fn(items[i], i)
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}
