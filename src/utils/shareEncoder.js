import LZString from 'lz-string'

const MAX_URL_LENGTH = 8000

export function encodeTimeline(events) {
  const json = JSON.stringify({ events })
  const compressed = LZString.compressToEncodedURIComponent(json)
  const url = `${window.location.origin}/s#${compressed}`

  if (url.length > MAX_URL_LENGTH) {
    return { url: null, tooLarge: true }
  }

  return { url, tooLarge: false }
}

/**
 * Create a server-side share link via the /api/share endpoint.
 * Returns { id, url, expiresAt } on success, or throws on failure.
 */
export async function createServerShare(events, meta = {}, expiresInDays = 90) {
  const res = await fetch('/api/share', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ events, meta, expiresInDays }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Share failed' }))
    throw new Error(err.error || `Share failed (${res.status})`)
  }

  return res.json()
}

