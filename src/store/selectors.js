import { SORT_OPTIONS } from '@/utils/constants'
import { safeDateCompare, safeGetUTCYear, safeGetUTCMonth, groupByYear } from '@/utils/dateUtils'

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
        e.dateRaw?.toLowerCase().includes(q)
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

export function getEventsByYear(events) {
  return groupByYear(events).map(([year, events]) => ({ year, events }))
}

export function getEventsByMonth(events) {
  const sorted = [...events].sort((a, b) => safeDateCompare(a.dateStart, b.dateStart))

  const groups = {}
  for (const event of sorted) {
    const year = safeGetUTCYear(event.dateStart, 'Unknown')
    const month = event.dateStart ? safeGetUTCMonth(event.dateStart) : -1
    const key = year === 'Unknown' ? 'Unknown' : month >= 0 ? `${year}-${month}` : `${year}`
    const label =
      year === 'Unknown' ? 'Unknown' : month >= 0 ? `${MONTH_NAMES[month]} ${year}` : `${year}`
    if (!groups[key]) groups[key] = { label, year, month, events: [] }
    groups[key].events.push(event)
  }

  return Object.values(groups)
    .sort((a, b) => {
      if (a.year === 'Unknown') return 1
      if (b.year === 'Unknown') return -1
      if (a.year !== b.year) return a.year - b.year
      return a.month - b.month
    })
    .map(({ label, events }) => ({ year: label, events }))
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
