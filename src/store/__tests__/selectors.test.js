import { describe, it, expect } from 'vitest'
import {
  getFilteredEvents,
  getSortedEvents,
  getAllPeople,
  getAllTags,
  getFlaggedEvents,
  getEventsByYear,
} from '../selectors'

const makeEvent = (overrides = {}) => ({
  id: 'evt_' + Math.random().toString(36).slice(2, 8),
  title: 'Test Event',
  description: null,
  dateStart: '2020-06-15',
  dateEnd: null,
  dateRaw: null,
  datePrecision: 'day',
  flagged: false,
  flagReason: null,
  people: [],
  tags: [],
  photos: [],
  ...overrides,
})

const events = [
  makeEvent({ id: 'evt_1', title: 'Born', dateStart: '1928-01-01', people: ['James'], tags: ['family'] }),
  makeEvent({ id: 'evt_2', title: 'Enlisted', dateStart: '1946-03-01', people: ['James'], tags: ['military'] }),
  makeEvent({ id: 'evt_3', title: 'Graduated', dateStart: '1950-06-01', people: ['James', 'Eleanor'], tags: ['education'] }),
  makeEvent({ id: 'evt_4', title: 'Wedding', dateStart: '1952-06-14', people: ['James', 'Eleanor'], tags: ['family'], flagged: true, flagReason: 'Date uncertain' }),
  makeEvent({ id: 'evt_5', title: 'Moved to Chicago', dateStart: '1956-01-01', people: ['James'], tags: ['relocation'], description: 'Took a job at aerospace company' }),
]

describe('getFilteredEvents', () => {
  const emptyFilters = { search: '', people: [], tags: [] }

  it('returns all events when no filters are active', () => {
    const result = getFilteredEvents(events, emptyFilters)
    expect(result).toHaveLength(5)
  })

  it('filters by search term in title', () => {
    const result = getFilteredEvents(events, { ...emptyFilters, search: 'born' })
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Born')
  })

  it('filters by search term in description', () => {
    const result = getFilteredEvents(events, { ...emptyFilters, search: 'aerospace' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('evt_5')
  })

  it('filters by people', () => {
    const result = getFilteredEvents(events, { ...emptyFilters, people: ['Eleanor'] })
    expect(result).toHaveLength(2)
    expect(result.map((e) => e.id)).toEqual(expect.arrayContaining(['evt_3', 'evt_4']))
  })

  it('filters by tags', () => {
    const result = getFilteredEvents(events, { ...emptyFilters, tags: ['military'] })
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Enlisted')
  })

  it('combines search and tag filters', () => {
    // Search 'born' matches title, tag 'family' also matches — intersection of both
    const result = getFilteredEvents(events, { search: 'born', people: [], tags: ['family'] })
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Born')
  })

  it('returns empty array when no events match', () => {
    const result = getFilteredEvents(events, { ...emptyFilters, search: 'nonexistent' })
    expect(result).toHaveLength(0)
  })
})

describe('getSortedEvents', () => {
  it('sorts by date ascending', () => {
    const result = getSortedEvents(events, 'date-asc')
    expect(result[0].id).toBe('evt_1')
    expect(result[result.length - 1].id).toBe('evt_5')
  })

  it('sorts by date descending', () => {
    const result = getSortedEvents(events, 'date-desc')
    expect(result[0].id).toBe('evt_5')
    expect(result[result.length - 1].id).toBe('evt_1')
  })

  it('sorts by title ascending', () => {
    const result = getSortedEvents(events, 'title-asc')
    expect(result[0].title).toBe('Born')
    expect(result[result.length - 1].title).toBe('Wedding')
  })

  it('sorts by title descending', () => {
    const result = getSortedEvents(events, 'title-desc')
    expect(result[0].title).toBe('Wedding')
  })

  it('does not mutate original array', () => {
    const original = [...events]
    getSortedEvents(events, 'date-desc')
    expect(events.map((e) => e.id)).toEqual(original.map((e) => e.id))
  })
})

describe('getAllPeople', () => {
  it('returns unique people sorted alphabetically', () => {
    const result = getAllPeople(events)
    expect(result).toEqual(['Eleanor', 'James'])
  })

  it('returns empty array when no people exist', () => {
    const result = getAllPeople([makeEvent()])
    expect(result).toEqual([])
  })
})

describe('getAllTags', () => {
  it('returns unique tags sorted alphabetically', () => {
    const result = getAllTags(events)
    expect(result).toEqual(['education', 'family', 'military', 'relocation'])
  })
})

describe('getFlaggedEvents', () => {
  it('returns only flagged events', () => {
    const result = getFlaggedEvents(events)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('evt_4')
  })

  it('returns empty array when no events are flagged', () => {
    const unflagged = events.map((e) => ({ ...e, flagged: false }))
    expect(getFlaggedEvents(unflagged)).toHaveLength(0)
  })
})

describe('getEventsByYear', () => {
  it('groups events by year', () => {
    const result = getEventsByYear(events)
    expect(result.length).toBeGreaterThanOrEqual(3)
    // Years come as string keys from groupByYear
    const years = result.map((g) => String(g.year))
    expect(years).toContain('1928')
    expect(years).toContain('1952')
  })

  it('each group contains correct events', () => {
    const result = getEventsByYear(events)
    const group1952 = result.find((g) => String(g.year) === '1952')
    expect(group1952).toBeDefined()
    expect(group1952.events).toHaveLength(1)
    expect(group1952.events[0].title).toBe('Wedding')
  })
})
