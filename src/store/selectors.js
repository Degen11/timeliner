import { SORT_OPTIONS } from '@/utils/constants'
import { safeDateCompare, safeGetUTCYear, safeGetUTCMonth } from '@/utils/dateUtils'

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
