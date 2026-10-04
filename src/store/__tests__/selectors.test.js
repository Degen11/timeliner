import { describe, it, expect } from 'vitest'
import {
  getFilteredEvents,
  getSortedEvents,
  getAllPeople,
  getAllTags,
  getFlaggedEvents,
  getEventsByYear,
  getYearSpan,
  buildYearHistogram,
  buildPeriodHistogram,
  searchTimeline,
  getFilterRelaxations,
  getBiggestBlocker,
  summarizeSelection,
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
  const emptyFilters = { search: '', people: [], tags: [], dateFrom: '', dateTo: '' }

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
    const result = getFilteredEvents(events, { ...emptyFilters, search: 'born', tags: ['family'] })
    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Born')
  })

  it('returns empty array when no events match', () => {
    const result = getFilteredEvents(events, { ...emptyFilters, search: 'nonexistent' })
    expect(result).toHaveLength(0)
  })

  it('filters by a dateFrom lower bound (inclusive)', () => {
    const result = getFilteredEvents(events, { ...emptyFilters, dateFrom: '1950-01-01' })
    expect(result.map((e) => e.id)).toEqual(['evt_3', 'evt_4', 'evt_5'])
  })

  it('filters by a dateTo upper bound (inclusive)', () => {
    const result = getFilteredEvents(events, { ...emptyFilters, dateTo: '1950-06-01' })
    expect(result.map((e) => e.id)).toEqual(['evt_1', 'evt_2', 'evt_3'])
  })

  it('filters by a from–to window', () => {
    const result = getFilteredEvents(events, { ...emptyFilters, dateFrom: '1946', dateTo: '1950' })
    expect(result.map((e) => e.id)).toEqual(['evt_2', 'evt_3'])
  })

  it('treats a year bound as the whole year (end-of-year inclusive)', () => {
    // dateTo '1952' must include the 1952-06-14 wedding (evt_4)
    const result = getFilteredEvents(events, { ...emptyFilters, dateFrom: '1952', dateTo: '1952' })
    expect(result.map((e) => e.id)).toEqual(['evt_4'])
  })

  it('keeps range events that overlap the window even if they start before it', () => {
    const ranged = [makeEvent({ id: 'evt_r', dateStart: '1940-01-01', dateEnd: '1960-01-01' })]
    const result = getFilteredEvents(ranged, { ...emptyFilters, dateFrom: '1955', dateTo: '1956' })
    expect(result).toHaveLength(1)
  })

  it('excludes undated events when a date filter is active', () => {
    const withUndated = [...events, makeEvent({ id: 'evt_null', dateStart: null })]
    const result = getFilteredEvents(withUndated, { ...emptyFilters, dateFrom: '1900' })
    expect(result.some((e) => e.id === 'evt_null')).toBe(false)
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

describe('getYearSpan', () => {
  it('returns the earliest and latest year across starts and ends', () => {
    const span = getYearSpan([
      makeEvent({ dateStart: '1950-06-01' }),
      makeEvent({ dateStart: '1940', dateEnd: '1975-02' }),
    ])
    expect(span).toEqual({ min: 1940, max: 1975 })
  })

  it('ignores undated events and returns null when none are dated', () => {
    expect(getYearSpan([makeEvent({ dateStart: null })])).toBeNull()
    expect(getYearSpan([makeEvent({ dateStart: null }), makeEvent({ dateStart: '2001' })])).toEqual({
      min: 2001,
      max: 2001,
    })
  })
})

describe('buildYearHistogram', () => {
  it('uses one bin per year when the span fits', () => {
    const h = buildYearHistogram(
      [makeEvent({ dateStart: '2000' }), makeEvent({ dateStart: '2002-05' }), makeEvent({ dateStart: '2002-09' })],
      24
    )
    expect(h.min).toBe(2000)
    expect(h.max).toBe(2002)
    expect(h.bins.map((b) => b.count)).toEqual([1, 0, 2])
    expect(h.bins[0]).toMatchObject({ from: 2000, to: 2000 })
  })

  it('caps the bin count and keeps every event in a bin', () => {
    const h = buildYearHistogram(events, 10)
    expect(h.bins.length).toBeLessThanOrEqual(10)
    expect(h.bins.reduce((sum, b) => sum + b.count, 0)).toBe(events.length)
    expect(h.bins[0].from).toBe(1928)
    expect(h.bins[h.bins.length - 1].to).toBe(1956)
  })

  it('returns null with no dated events', () => {
    expect(buildYearHistogram([makeEvent({ dateStart: null })], 24)).toBeNull()
  })
})

describe('buildPeriodHistogram', () => {
  it('buckets by decade, keeping empty decades inside the range', () => {
    const h = buildPeriodHistogram(
      [makeEvent({ dateStart: '1879-03-14' }), makeEvent({ dateStart: '1905' }), makeEvent({ dateStart: '1908' })],
      16
    )
    expect(h.size).toBe(10)
    expect(h.bins.map((b) => [b.from, b.count])).toEqual([
      [1870, 1],
      [1880, 0],
      [1890, 0],
      [1900, 2],
    ])
    expect(h.bins[3].to).toBe(1909)
  })

  it('widens periods when decades would exceed the bin limit', () => {
    const h = buildPeriodHistogram([makeEvent({ dateStart: '1500' }), makeEvent({ dateStart: '1990' })], 16)
    expect(h.size).toBe(50)
    expect(h.bins.length).toBeLessThanOrEqual(16)
    expect(h.bins.reduce((s, b) => s + b.count, 0)).toBe(2)
  })

  it('counts undated events separately and returns null when none are dated', () => {
    expect(buildPeriodHistogram([makeEvent({ dateStart: '2001' }), makeEvent({ dateStart: null })], 16).undated).toBe(1)
    expect(buildPeriodHistogram([makeEvent({ dateStart: null })], 16)).toBeNull()
  })
})

describe('searchTimeline', () => {
  const tl = [
    makeEvent({ id: 's1', title: 'Born in Ulm', dateStart: '1879-03-14', people: ['Albert Einstein', 'Hermann Einstein'], location: 'Ulm, Germany', tags: ['personal'] }),
    makeEvent({ id: 's2', title: 'Family moves to Munich', dateStart: '1880', description: 'The family relocates so Hermann can start an electrical business.', location: 'Munich, Germany' }),
    makeEvent({ id: 's3', title: 'Hermann retires', dateStart: '1890' }),
    makeEvent({ id: 's4', title: 'Patent office clerk', dateStart: '1902', tags: ['career'], location: 'Bern, Switzerland' }),
  ]

  it('finds people and places as their own results, with counts', () => {
    const r = searchTimeline(tl, 'herm', 5)
    expect(r.people).toEqual([{ name: 'Hermann Einstein', count: 1 }])
    expect(searchTimeline(tl, 'bern', 5).places).toEqual([{ name: 'Bern, Switzerland', count: 1 }])
  })

  it('ranks title matches first and says why other events matched', () => {
    const r = searchTimeline(tl, 'herm', 5)
    expect(r.events.map((m) => [m.event.id, m.match])).toEqual([
      ['s3', 'title'],
      ['s1', 'people'],
      ['s2', 'description'],
    ])
    expect(r.events[1].detail).toBe('Albert Einstein, Hermann Einstein')
    expect(r.events[2].detail).toContain('Hermann can start')
  })

  it('matches places and tags, caps results, and ignores blank queries', () => {
    expect(searchTimeline(tl, 'switzerland', 5).events[0]).toMatchObject({ match: 'location', detail: 'Bern, Switzerland' })
    expect(searchTimeline(tl, 'career', 5).events[0]).toMatchObject({ match: 'tags', detail: 'career' })
    expect(searchTimeline(tl, 'e', 2).events).toHaveLength(2)
    expect(searchTimeline(tl, '   ', 5)).toEqual({ people: [], places: [], events: [] })
  })
})

describe('getFilterRelaxations', () => {
  const tl = [
    makeEvent({ title: 'Graduated', dateStart: '1985', datePrecision: 'year', people: ['Ana'] }),
    makeEvent({ title: 'Miguel and Ana\u2019s wedding', dateStart: '1996-05-04', people: ['Miguel', 'Ana'], tags: ['family'] }),
    makeEvent({ title: 'Opened the workshop', dateStart: '1998', datePrecision: 'year', people: ['Teresa'] }),
  ]
  const filters = { search: 'wedding', people: ['Miguel'], tags: [], dateFrom: '1980', dateTo: '1989' }

  it('lists each active filter with what removing it would show', () => {
    const r = getFilterRelaxations(tl, filters)
    expect(r.map((x) => [x.id, x.count])).toEqual([
      ['search', 0],
      ['person:Miguel', 0],
      ['dates', 1],
    ])
    expect(r[2].matches[0].title).toMatch(/wedding/)
    expect(r[2].without).toMatchObject({ dateFrom: '', dateTo: '', search: 'wedding', people: ['Miguel'] })
  })

  it('covers tags and returns nothing when no filters are active', () => {
    const r = getFilterRelaxations(tl, { search: '', people: [], tags: ['work'], dateFrom: '', dateTo: '' })
    expect(r).toHaveLength(1)
    expect(r[0]).toMatchObject({ id: 'tag:work', kind: 'tag', count: 3 })
    expect(getFilterRelaxations(tl, { search: '', people: [], tags: [], dateFrom: '', dateTo: '' })).toEqual([])
  })

  it('picks the filter that brings back the most events as the blocker', () => {
    expect(getBiggestBlocker(getFilterRelaxations(tl, filters)).id).toBe('dates')
    expect(getBiggestBlocker([{ id: 'a', count: 0 }])).toBeNull()
  })
})

describe('summarizeSelection', () => {
  it('describes the span and what the events share', () => {
    const sel = [
      makeEvent({ dateStart: '2001-03', datePrecision: 'month', tags: ['work'], people: ['Teresa'] }),
      makeEvent({ dateStart: '1994', datePrecision: 'approximate', tags: ['work', 'travel'], people: ['Teresa'] }),
      makeEvent({ dateStart: '1998-06-12', datePrecision: 'day', tags: ['work'] }),
    ]
    expect(summarizeSelection(sel)).toEqual({
      span: 'c.\u00A01994 \u2192 Mar 2001',
      details: ['Spans 7 years', 'all tagged work', '2 with Teresa'],
    })
  })

  it('handles a single event, same-year picks and undated events', () => {
    expect(summarizeSelection([makeEvent({ dateStart: '1998-06-12' })])).toEqual({ span: 'Jun 12, 1998', details: [] })
    const sameYear = summarizeSelection([
      makeEvent({ dateStart: '1998', datePrecision: 'year', people: ['Ana'] }),
      makeEvent({ dateStart: '1998', datePrecision: 'year', people: ['Ana'] }),
      makeEvent({ dateStart: null }),
    ])
    expect(sameYear).toEqual({ span: '1998', details: ['Same year', '2 with Ana', '1 undated'] })
    expect(summarizeSelection([makeEvent({ dateStart: null })])).toEqual({ span: null, details: ['1 undated'] })
  })
})
