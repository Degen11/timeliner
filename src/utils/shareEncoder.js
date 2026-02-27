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

export function decodeTimeline(hash) {
  const json = LZString.decompressFromEncodedURIComponent(hash)
  if (!json) return null
  return JSON.parse(json)
}
