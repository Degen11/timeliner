// ─── Duplicate / Near-Duplicate Detection ────────────────────────────────────
//
// Used in appendEvents() to catch events that look like the same real-world
// occurrence but arrived via separate AI parsing runs.
//
// Detection strategy:
//  - Exact ID match is already handled upstream (filtered before this runs).
//  - High title similarity (Jaccard word overlap > 0.6) within a 60-day date
//    window → likely duplicate.
//  - Exact same dateStart AND title similarity > 0.4 → definite duplicate.
//
// Jaccard similarity on word sets is fast (O(n)), avoids heavy string distance
// libs, and handles paraphrasing well enough for short timeline titles.

const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'and',
  'or',
  'but',
  'in',
  'on',
  'at',
  'to',
  'for',
  'of',
  'with',
  'by',
  'from',
  'is',
  'was',
  'are',
  'were',
  'be',
  'been',
])

/**
 * Tokenise a title into a Set of meaningful lowercase words.
 */
function tokenise(title) {
  return new Set(
    title
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter((w) => w.length > 1 && !STOP_WORDS.has(w))
  )
}

/**
 * Jaccard similarity between two word sets (0–1).
 */
function jaccardSimilarity(setA, setB) {
  if (setA.size === 0 && setB.size === 0) return 0
  const intersection = [...setA].filter((w) => setB.has(w))
  const unionSize = setA.size + setB.size - intersection.length
  return unionSize === 0 ? 0 : intersection.length / unionSize
}

/**
 * Absolute difference in days between two ISO date strings.
 * Returns Infinity when either date is missing or unparseable.
 */
function daysBetween(dateA, dateB) {
  if (!dateA || !dateB) return Infinity
  const a = Date.parse(dateA)
  const b = Date.parse(dateB)
  if (isNaN(a) || isNaN(b)) return Infinity
  return Math.abs(a - b) / 86_400_000
}

/**
 * Returns true if two events are likely the same real-world occurrence.
 */
function areDuplicates(a, b) {
  const tokensA = tokenise(a.title || '')
  const tokensB = tokenise(b.title || '')
  const similarity = jaccardSimilarity(tokensA, tokensB)
  const diff = daysBetween(a.dateStart, b.dateStart)

  // Definite: same date + moderate title match
  if (diff === 0 && similarity > 0.4) return true

  // Likely: close dates + strong title match
  if (diff <= 60 && similarity > 0.6) return true

  return false
}

/**
 * Find pairs of (newEvent, existingEvent) that look like near-duplicates.
 *
 * @param {object[]} newEvents    - Events about to be appended.
 * @param {object[]} existingEvents - Events already in the timeline.
 * @returns {{ newEvent: object, existing: object }[]}
 */
export function findNearDuplicates(newEvents, existingEvents) {
  const pairs = []
  const seen = new Set() // avoid reporting the same new event twice

  for (const newEvent of newEvents) {
    if (seen.has(newEvent.id)) continue
    for (const existing of existingEvents) {
      if (areDuplicates(newEvent, existing)) {
        pairs.push({ newEvent, existing })
        seen.add(newEvent.id)
        break // one match per new event is enough
      }
    }
  }

  return pairs
}
