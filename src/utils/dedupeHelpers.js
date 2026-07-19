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

import { safeParse } from '@/utils/dateUtils'

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
  if (setA.size === 0 && setB.size === 0) return 1
  const intersection = [...setA].filter((w) => setB.has(w))
  const unionSize = setA.size + setB.size - intersection.length
  return unionSize === 0 ? 0 : intersection.length / unionSize
}

/**
 * Absolute difference in days between two ISO date strings.
 * Uses date-fns parseISO (via safeParse) for consistent cross-browser
 * handling of partial ISO dates like "2024-01" and "2024".
 * Returns Infinity when either date is missing or unparseable.
 */
function daysBetween(dateA, dateB) {
  if (!dateA || !dateB) return Infinity
  const a = safeParse(dateA)
  const b = safeParse(dateB)
  if (!a || !b) return Infinity
  return Math.abs(a.getTime() - b.getTime()) / 86_400_000
}

/**
 * Returns true if two events are likely the same real-world occurrence.
 *
 * Short titles (≤2 meaningful words) are prone to false positives with Jaccard
 * similarity alone (e.g. "Moved to New York" vs "Moved to New Jersey" = 0.6).
 * We require at least 3 overlapping content words for the "likely" path so that
 * short titles with incidental overlap don't get flagged.
 */
function areDuplicates(a, tokensA, b, tokensB) {
  const similarity = jaccardSimilarity(tokensA, tokensB)
  const diff = daysBetween(a.dateStart, b.dateStart)
  const overlap = [...tokensA].filter((w) => tokensB.has(w)).length

  // Definite: same date + moderate title match with enough shared words
  if (diff === 0 && similarity > 0.4 && overlap >= 2) return true

  // Likely: close dates + strong title match + sufficient shared content
  if (diff <= 60 && similarity > 0.6 && overlap >= 3) return true

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

  // Pre-tokenise each title once instead of re-tokenising both titles on every
  // pairwise comparison (was O(N·M) tokenisations → import jank on large timelines).
  const existingTokens = existingEvents.map((e) => tokenise(e.title || ''))

  for (const newEvent of newEvents) {
    if (seen.has(newEvent.id)) continue
    const tokensNew = tokenise(newEvent.title || '')
    for (let j = 0; j < existingEvents.length; j++) {
      if (areDuplicates(newEvent, tokensNew, existingEvents[j], existingTokens[j])) {
        pairs.push({ newEvent, existing: existingEvents[j] })
        seen.add(newEvent.id)
        break // one match per new event is enough
      }
    }
  }

  return pairs
}

/**
 * Find near-duplicate pairs WITHIN a single timeline (self-scan), for the
 * "Find duplicates" review tool. Each unordered pair is reported once; an event
 * may appear in several pairs (A~B and A~C) so the review UI can resolve them
 * one at a time. Titles are tokenised once up front (O(n) tokenisations, O(n²)
 * comparisons) — this runs on an explicit user action, not on every render.
 *
 * @param {object[]} events
 * @returns {{ a: object, b: object }[]}
 */
export function findDuplicatesWithin(events) {
  const tokens = events.map((e) => tokenise(e.title || ''))
  const pairs = []

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      if (areDuplicates(events[i], tokens[i], events[j], tokens[j])) {
        pairs.push({ a: events[i], b: events[j] })
      }
    }
  }

  return pairs
}
