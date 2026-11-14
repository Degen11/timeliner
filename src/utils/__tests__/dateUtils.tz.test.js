import { describe, it, expect } from 'vitest'
import { format } from 'date-fns'
import {
  parseISOParts,
  safeParse,
  safeParseForDisplay,
  getISOYear,
  getISOMonth,
  getDateRangeDuration,
  formatEventDate,
  shiftISODate,
  safeDateCompare,
} from '../dateUtils'
import { getEventsByYear, getEventsByMonth } from '@/store/selectors'

// Calendar dates must mean the same day whatever the machine's timezone.
// npm run test:tz runs this file (and the other date tests) under several
// TZ values, including ±12h+ offsets and DST zones; CI runs it too.
const TZ = process.env.TZ || Intl.DateTimeFormat().resolvedOptions().timeZone

// Boundary dates: year/month/day edges and DST transition days (US and EU 2024)
const EDGES = ['2024-01-01', '2023-12-31', '2024-03-01', '2024-02-29', '2024-03-10', '2024-03-31', '2024-11-03', '2024-10-27', '1930-01-01', '0050-06-15']

describe(`calendar dates in ${TZ}`, () => {
  it('parseISOParts reads the string, not a Date', () => {
    expect(parseISOParts('2024-03-01')).toEqual({ year: 2024, month: 3, day: 1 })
    expect(parseISOParts('1930')).toEqual({ year: 1930, month: null, day: null })
    expect(parseISOParts('bad')).toBeNull()
  })

  for (const iso of EDGES) {
    it(`${iso} displays as itself`, () => {
      const d = safeParseForDisplay(iso)
      expect(format(d, 'yyyy-MM-dd')).toBe(iso)
      expect(d.getHours()).toBe(12)
      // safeParse is the same calendar day at local midnight
      expect(format(safeParse(iso), 'yyyy-MM-dd')).toBe(iso)
    })

    it(`${iso} keeps its year and month`, () => {
      expect(getISOYear(iso)).toBe(Number(iso.slice(0, 4)))
      expect(getISOMonth(iso)).toBe(Number(iso.slice(5, 7)) - 1)
    })
  }

  it('year-only and month-only dates display on their own year/month', () => {
    expect(format(safeParseForDisplay('1930'), 'yyyy-MM-dd')).toBe('1930-01-01')
    expect(format(safeParseForDisplay('2024-03'), 'yyyy-MM-dd')).toBe('2024-03-01')
  })

  it('formats event dates without slipping a day, month or year', () => {
    expect(formatEventDate({ dateStart: '2024-01-01', datePrecision: 'day' })).toMatch(/2024/)
    expect(formatEventDate({ dateStart: '2024-01-01', datePrecision: 'day' })).not.toMatch(/2023|Dec/)
    expect(formatEventDate({ dateStart: '1930', datePrecision: 'decade' })).toMatch(/1930/)
    expect(formatEventDate({ dateStart: '2024-03', datePrecision: 'month' })).toMatch(/Mar/)
  })

  it('counts calendar months in a duration from the strings', () => {
    // Starting on the 1st is where UTC getters slipped a month east of UTC
    expect(getDateRangeDuration('2020-03-01', '2021-05-01')).toBe('1 year, 2 months')
    expect(getDateRangeDuration('2024-01-01', '2024-12-01')).toBe('11 months')
    // Start on the 1st, end mid-month: east of UTC the old UTC getters read
    // the start as February and counted 3 months
    expect(getDateRangeDuration('2020-03-01', '2020-05-15')).toBe('2 months')
    expect(getDateRangeDuration('2019-12-01', '2021-01-20')).toBe('1 year, 1 month')
    // Across the March DST change: still whole days
    expect(getDateRangeDuration('2024-03-09', '2024-03-12')).toBe('3 days')
    expect(getDateRangeDuration('2024-10-26', '2024-10-29')).toBe('3 days')
  })

  it('shifts dates by calendar units without drifting', () => {
    expect(shiftISODate('2024-01-31', 1, 'day')).toBe('2024-02-01')
    expect(shiftISODate('2024-03-09', 1, 'day')).toBe('2024-03-10')
    expect(shiftISODate('2024-03-10', 1, 'day')).toBe('2024-03-11')
    expect(shiftISODate('2024-12', 1, 'month')).toBe('2025-01')
    expect(shiftISODate('1999', 1, 'year')).toBe('2000')
  })

  it('moves dates by whole months for drag-to-redate without drifting', () => {
    expect(shiftISODate('2024-01-31', 1, 'month')).toBe('2024-02-29')
    expect(shiftISODate('2024-03-10', -2, 'month')).toBe('2024-01-10')
    expect(shiftISODate('1999-11', 3, 'month')).toBe('2000-02')
    expect(shiftISODate('1994', 24, 'month')).toBe('1996')
    expect(shiftISODate('1994', -12, 'month')).toBe('1993')
  })

  it('orders same-day and neighboring dates correctly', () => {
    expect(safeDateCompare('2024-01-01', '2023-12-31')).toBeGreaterThan(0)
    expect(safeDateCompare('2024-03-10', '2024-03-10')).toBe(0)
  })

  it('groups by year and month on the event’s own calendar', () => {
    const events = [
      { id: 'a', dateStart: '2024-01-01' },
      { id: 'b', dateStart: '2023-12-31' },
      { id: 'c', dateStart: '2024-03-01' },
    ]
    const byYear = Object.fromEntries(getEventsByYear(events).map((g) => [g.year, g.events.map((e) => e.id)]))
    expect(byYear).toEqual({ 2023: ['b'], 2024: ['a', 'c'] })
    const labels = getEventsByMonth(events).map((g) => g.year)
    expect(labels).toEqual(['December 2023', 'January 2024', 'March 2024'])
  })
})
