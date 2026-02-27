import { parseISO, getYear } from 'date-fns'
import { SORT_OPTIONS } from '@/utils/constants'

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
    filtered = filtered.filter((e) =>
      filters.people.some((p) => e.people?.includes(p))
    )
  }

  if (filters.tags.length > 0) {
    filtered = filtered.filter((e) =>
      filters.tags.some((t) => e.tags?.includes(t))
    )
  }

  return filtered
}

export function getSortedEvents(events, sortOrder) {
  if (sortOrder === SORT_OPTIONS.CUSTOM) return events

  const sorted = [...events]
  switch (sortOrder) {
    case SORT_OPTIONS.DATE_ASC:
      sorted.sort((a, b) => new Date(a.dateStart) - new Date(b.dateStart))
      break
    case SORT_OPTIONS.DATE_DESC:
      sorted.sort((a, b) => new Date(b.dateStart) - new Date(a.dateStart))
      break
    case SORT_OPTIONS.TITLE_ASC:
      sorted.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
      break
    case SORT_OPTIONS.TITLE_DESC:
      sorted.sort((a, b) => (b.title || '').localeCompare(a.title || ''))
      break
    default:
      sorted.sort((a, b) => new Date(a.dateStart) - new Date(b.dateStart))
  }
  return sorted
}

export function getEventsByYear(events) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.dateStart) - new Date(b.dateStart)
  )

  const groups = {}
  for (const event of sorted) {
    const year = event.dateStart ? getYear(parseISO(event.dateStart)) : 'Unknown'
    if (!groups[year]) groups[year] = []
    groups[year].push(event)
  }

  return Object.entries(groups)
    .sort(([a], [b]) => (a === 'Unknown' ? 1 : b === 'Unknown' ? -1 : a - b))
    .map(([year, events]) => ({ year, events }))
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
