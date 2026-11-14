// Split long import text into pieces /api/parse can take in one request.
// Cuts land on the strongest boundary available inside the window: a blank
// line (paragraph), then a single newline, then a sentence end, then a space,
// and only as a last resort mid-word. Chunks never overlap, and joining them
// gives back the original string (minus any whitespace-only tail).

const BOUNDARIES = [/\n\s*\n/g, /\n/g, /[.!?]["')\]]?\s/g, /\s/g]

function findCut(text, start, maxLen) {
  const end = start + maxLen
  if (end >= text.length) return text.length
  const window = text.slice(start, end)
  // Don't accept a cut in the first half of the window: tiny chunks waste requests
  const minCut = Math.floor(maxLen / 2)
  for (const pattern of BOUNDARIES) {
    let best = -1
    pattern.lastIndex = 0
    let m
    while ((m = pattern.exec(window)) !== null) {
      const cut = m.index + m[0].length
      if (cut >= minCut && cut <= window.length) best = cut
      if (m[0].length === 0) pattern.lastIndex++
    }
    if (best !== -1) return start + best
  }
  return end
}

export function splitTextIntoChunks(text, maxLen) {
  if (typeof text !== 'string' || text.length === 0) return []
  if (!(maxLen > 0) || text.length <= maxLen) return [text]
  const chunks = []
  let start = 0
  while (start < text.length) {
    const cut = findCut(text, start, maxLen)
    chunks.push(text.slice(start, cut))
    start = cut
  }
  // Whitespace-only tails (trailing newlines) aren't worth a request
  return chunks.filter((c, i) => i === 0 || c.trim().length > 0)
}
