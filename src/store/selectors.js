import { SORT_OPTIONS } from '@/utils/constants'
import {
  safeDateCompare,
  safeGetUTCYear,
  safeGetUTCMonth,
  expandISOToStart,
  expandISOToEnd,
} from '@/utils/dateUtils'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export function getFilteredEvents(events, filters) {
  let filtered = events

  if (filters.search) {
    const q = filters.search.toLowerCase()
    filtered = filtered.filter(
      (e) =>
        e.title?.toLowerCase().includes(q) ||
        e.description?.toLowerCase().includes(q) ||
        e.dateRaw?.toLowerCase().includes(q) ||
        e.location?.toLowerCase().includes(q) ||
        e.people?.some((p) => p.toLowerCase().includes(q)) ||
        e.tags?.some((t) => t.toLowerCase().includes(q))
    )
  }

  if (filters.people.length > 0) {
    filtered = filtered.filter((e) => filters.people.some((p) => e.people?.includes(p)))
  }

  if (filters.tags.length > 0) {
    filtered = filtered.filter((e) => filters.tags.some((t) => e.tags?.includes(t)))
  }

  if (filters.dateFrom || filters.dateTo) {
    // Overlap test: an event (its start..end span) is kept if it intersects the
    // filter window. Bounds are expanded to full days so partial dates on either
    // side compare correctly ("1960" as a filter covers all of that year, and an
    // event dated "1960" spans the whole year too). Undated events drop out.
    const from = filters.dateFrom ? expandISOToStart(filters.dateFrom) : null
    const to = filters.dateTo ? expandISOToEnd(filters.dateTo) : null
    filtered = filtered.filter((e) => {
      if (!e.dateStart) return false
      const evStart = expandISOToStart(e.dateStart)
      const evEnd = expandISOToEnd(e.dateEnd || e.dateStart)
      if (from && safeDateCompare(evEnd, from) < 0) return false // ends before window
      if (to && safeDateCompare(evStart, to) > 0) return false // starts after window
      return true
    })
  }

  return filtered
}

export function getSortedEvents(events, sortOrder) {
  const sorted = [...events]
  switch (sortOrder) {
    case SORT_OPTIONS.DATE_ASC:
      sorted.sort((a, b) => safeDateCompare(a.dateStart, b.dateStart))
      break
    case SORT_OPTIONS.DATE_DESC:
      sorted.sort((a, b) => safeDateCompare(b.dateStart, a.dateStart))
      break
    case SORT_OPTIONS.TITLE_ASC:
      sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
      break
    case SORT_OPTIONS.TITLE_DESC:
      sorted.sort((a, b) => (b.title || '').localeCompare(a.title || ''))
      break
    default:
      sorted.sort((a, b) => safeDateCompare(a.dateStart, b.dateStart))
  }
  return sorted
}

export function getEventsByYear(events, sortOrder = SORT_OPTIONS.DATE_ASC) {
  // Group events without re-sorting — the caller (TimelinePage via getSortedEvents)
  // has already applied the correct order. Trusting input preserves sort direction.
  const groups = {}
  const groupOrder = []
  for (const e of events) {
    const year = String(safeGetUTCYear(e.dateStart, 'Unknown'))
    if (!groups[year]) {
      groups[year] = []
      groupOrder.push(year)
    }
    groups[year].push(e)
  }

  // Sort group headers to match the requested sort direction
  const isDesc = sortOrder === SORT_OPTIONS.DATE_DESC
  groupOrder.sort((a, b) =>
    a === 'Unknown' ? 1 : b === 'Unknown' ? -1 :
    isDesc ? Number(b) - Number(a) : Number(a) - Number(b)
  )

  return groupOrder.map((year) => ({ year, events: groups[year] }))
}

export function getEventsByDecade(events, sortOrder = SORT_OPTIONS.DATE_ASC) {
  // Group events without re-sorting — trust the input order from getSortedEvents.
  const groups = {}
  const groupOrder = []
  for (const e of events) {
    const year = safeGetUTCYear(e.dateStart, 'Unknown')
    const key = year === 'Unknown' ? 'Unknown' : `${Math.floor(year / 10) * 10}s`
    if (!groups[key]) {
      groups[key] = []
      groupOrder.push(key)
    }
    groups[key].push(e)
  }

  const isDesc = sortOrder === SORT_OPTIONS.DATE_DESC
  groupOrder.sort((a, b) =>
    a === 'Unknown' ? 1 : b === 'Unknown' ? -1 :
    isDesc ? parseInt(b, 10) - parseInt(a, 10) : parseInt(a, 10) - parseInt(b, 10)
  )

  return groupOrder.map((year) => ({ year, events: groups[year] }))
}

export function getEventsByMonth(events, sortOrder = SORT_OPTIONS.DATE_ASC) {
  // Group events without re-sorting — trust the input order from getSortedEvents.
  const groups = {}
  const groupOrder = []
  for (const event of events) {
    const year = safeGetUTCYear(event.dateStart, 'Unknown')
    const month = event.dateStart ? safeGetUTCMonth(event.dateStart) : -1
    const key = year === 'Unknown' ? 'Unknown' : month >= 0 ? `${year}-${month}` : `${year}`
    const label =
      year === 'Unknown' ? 'Unknown' : month >= 0 ? `${MONTH_NAMES[month]} ${year}` : `${year}`
    if (!groups[key]) {
      groups[key] = { label, year, month, events: [] }
      groupOrder.push(key)
    }
    groups[key].events.push(event)
  }

  // Sort group headers to match the requested sort direction
  const isDesc = sortOrder === SORT_OPTIONS.DATE_DESC
  groupOrder.sort((a, b) => {
    const ga = groups[a]
    const gb = groups[b]
    if (ga.year === 'Unknown') return 1
    if (gb.year === 'Unknown') return -1
    if (ga.year !== gb.year) return isDesc ? gb.year - ga.year : ga.year - gb.year
    return isDesc ? gb.month - ga.month : ga.month - gb.month
  })

  return groupOrder.map((key) => ({ year: groups[key].label, events: groups[key].events }))
}

export function getAllPeople(events) {
  const set = new Set()
  events.forEach((e) => e.people?.forEach((p) => set.add(p)))
  return [...set].sort()
}

export function getAllTags(events) {
  const set = new Set()
  events.forEach((e) => e.tags?.forEach((t) => set.add(t)))
  return [...set].sort()
}

export function getFlaggedEvents(events) {
  return events.filter((e) => e.flagged)
}

/** Earliest and latest year across dated events (start or end), or null if none are dated. */
export function getYearSpan(events) {
  let min = Infinity
  let max = -Infinity
  for (const e of events) {
    for (const d of [e.dateStart, e.dateEnd]) {
      const y = safeGetUTCYear(d, null)
      if (y == null) continue
      if (y < min) min = y
      if (y > max) max = y
    }
  }
  return min === Infinity ? null : { min, max }
}

/**
 * Bucket events by start year into at most `maxBins` equal-width bins spanning
 * the timeline's year range. Returns null when there are no dated events.
 * Each bin: { from, to, count } with inclusive year bounds.
 */
export function buildYearHistogram(events, maxBins) {
  const span = getYearSpan(events)
  if (!span) return null
  const years = span.max - span.min + 1
  const size = Math.ceil(years / Math.min(years, maxBins))
  const binCount = Math.ceil(years / size)
  const bins = Array.from({ length: binCount }, (_, i) => ({
    from: span.min + i * size,
    to: Math.min(span.min + (i + 1) * size - 1, span.max),
    count: 0,
  }))
  for (const e of events) {
    const y = safeGetUTCYear(e.dateStart, null)
    if (y == null) continue
    bins[Math.floor((y - span.min) / size)].count++
  }
  return { ...span, bins }
}

const PERIOD_SIZES = [10, 20, 25, 50, 100, 250, 500, 1000]

/**
 * Bucket events by start year into aligned periods — decades when they fit in
 * `maxBins`, otherwise the smallest of 20/25/50/100… years that does. Empty
 * periods inside the range are kept so the shape of the timeline reads true.
 * Returns null when no event is dated.
 */
export function buildPeriodHistogram(events, maxBins) {
  let min = Infinity
  let max = -Infinity
  let undated = 0
  for (const e of events) {
    const y = safeGetUTCYear(e.dateStart, null)
    if (y == null) {
      undated++
      continue
    }
    if (y < min) min = y
    if (y > max) max = y
  }
  if (min === Infinity) return null

  const size =
    PERIOD_SIZES.find((s) => Math.floor(max / s) - Math.floor(min / s) + 1 <= maxBins) ??
    PERIOD_SIZES[PERIOD_SIZES.length - 1]
  const first = Math.floor(min / size) * size
  const count = Math.floor(max / size) - Math.floor(min / size) + 1
  const bins = Array.from({ length: count }, (_, i) => ({
    from: first + i * size,
    to: first + (i + 1) * size - 1,
    count: 0,
  }))
  for (const e of events) {
    const y = safeGetUTCYear(e.dateStart, null)
    if (y != null) bins[Math.floor((y - first) / size)].count++
  }
  return { size, bins, undated }
}

const SNIPPET_RADIUS = 32

// "…so Hermann can start an electrical…" around the first match
function snippetAround(text, index, length) {
  const start = Math.max(0, index - SNIPPET_RADIUS)
  const end = Math.min(text.length, index + length + SNIPPET_RADIUS)
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`
}

/**
 * Search the timeline for the command palette. Matches people and places as
 * their own results, and events by title, people, place, tags or description,
 * saying why each event matched (`match`) so the row can show context.
 * Returns { people, places, events }, each capped at `max`.
 */
export function searchTimeline(events, query, max) {
  const q = query.trim().toLowerCase()
  if (!q) return { people: [], places: [], events: [] }

  const peopleCounts = {}
  const placeCounts = {}
  for (const e of events) {
    for (const p of e.people || []) {
      if (p.toLowerCase().includes(q)) peopleCounts[p] = (peopleCounts[p] || 0) + 1
    }
    const loc = e.location?.trim()
    if (loc && loc.toLowerCase().includes(q)) placeCounts[loc] = (placeCounts[loc] || 0) + 1
  }
  const ranked = (counts) =>
    Object.entries(counts)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, max)
      .map(([name, count]) => ({ name, count }))

  const matches = []
  for (const e of events) {
    if (e.title?.toLowerCase().includes(q)) {
      matches.push({ event: e, match: 'title', rank: 0 })
      continue
    }
    const person = (e.people || []).find((p) => p.toLowerCase().includes(q))
    if (person) {
      matches.push({ event: e, match: 'people', detail: e.people.join(', '), rank: 1 })
      continue
    }
    if (e.location?.toLowerCase().includes(q)) {
      matches.push({ event: e, match: 'location', detail: e.location, rank: 2 })
      continue
    }
    const tag = (e.tags || []).find((t) => t.toLowerCase().includes(q))
    if (tag) {
      matches.push({ event: e, match: 'tags', detail: tag, rank: 3 })
      continue
    }
    const i = e.description?.toLowerCase().indexOf(q) ?? -1
    if (i >= 0) matches.push({ event: e, match: 'description', detail: snippetAround(e.description, i, q.length), rank: 4 })
  }
  matches.sort((a, b) => a.rank - b.rank || safeDateCompare(a.event.dateStart, b.event.dateStart))

  return {
    people: ranked(peopleCounts),
    places: ranked(placeCounts),
    events: matches.slice(0, max).map(({ rank: _rank, ...m }) => m),
  }
}
