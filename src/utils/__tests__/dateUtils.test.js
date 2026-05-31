import { describe, it, expect } from 'vitest'
import {
  safeParse,
  safeParseForDisplay,
  safeGetUTCYear,
  safeGetUTCMonth,
  isValidISODate,
  validateDateRange,
  safeDateCompare,
  formatEventDate,
  groupByYear,
  getDateRangeDuration,
  formatEventDateShort,
  getRelativeDate,
} from '../dateUtils'

describe('safeParse', () => {
  it('parses a valid YYYY-MM-DD date', () => {
    const d = safeParse('2024-03-15')
    expect(d).toBeInstanceOf(Date)
    expect(d.toISOString().startsWith('2024-03-15')).toBe(true)
  })

  it('parses YYYY-MM format', () => {
    expect(safeParse('2024-06')).toBeInstanceOf(Date)
  })

  it('parses YYYY format', () => {
    expect(safeParse('1990')).toBeInstanceOf(Date)
  })

  it('returns null for empty/invalid input', () => {
    expect(safeParse(null)).toBeNull()
    expect(safeParse('')).toBeNull()
    expect(safeParse('not-a-date')).toBeNull()
    expect(safeParse(42)).toBeNull()
  })
})

describe('safeParseForDisplay', () => {
  it('shifts to noon UTC to avoid timezone rollback', () => {
    const d = safeParseForDisplay('2024-01-01')
    expect(d).toBeInstanceOf(Date)
    // Should be 12 hours after midnight UTC
    expect(d.getUTCHours()).toBe(12)
  })

  it('returns null for invalid input', () => {
    expect(safeParseForDisplay('bad')).toBeNull()
  })
})

describe('safeGetUTCYear', () => {
  it('extracts year from ISO string', () => {
    expect(safeGetUTCYear('2024-03-15')).toBe(2024)
    expect(safeGetUTCYear('1928')).toBe(1928)
  })

  it('returns fallback for invalid input', () => {
    expect(safeGetUTCYear(null)).toBe('Unknown')
    expect(safeGetUTCYear('', 'N/A')).toBe('N/A')
  })
})

describe('safeGetUTCMonth', () => {
  it('extracts 0-indexed month', () => {
    expect(safeGetUTCMonth('2024-03-15')).toBe(2) // March = index 2
    expect(safeGetUTCMonth('2024-12')).toBe(11)
  })

  it('returns -1 for year-only dates', () => {
    expect(safeGetUTCMonth('2024')).toBe(-1)
  })

  it('returns -1 for invalid input', () => {
    expect(safeGetUTCMonth(null)).toBe(-1)
  })
})

describe('isValidISODate', () => {
  it('accepts valid formats', () => {
    expect(isValidISODate('2024-03-15')).toBe(true)
    expect(isValidISODate('2024-03')).toBe(true)
    expect(isValidISODate('2024')).toBe(true)
  })

  it('rejects invalid formats', () => {
    expect(isValidISODate('')).toBe(false)
    expect(isValidISODate('03-15-2024')).toBe(false)
    expect(isValidISODate('2024/03/15')).toBe(false)
    expect(isValidISODate(null)).toBe(false)
  })
})

describe('validateDateRange', () => {
  it('accepts valid range', () => {
    expect(validateDateRange('2024-01-01', '2024-12-31')).toEqual({
      valid: true,
      error: null,
    })
  })

  it('rejects end before start', () => {
    const result = validateDateRange('2024-12-31', '2024-01-01')
    expect(result.valid).toBe(false)
    expect(result.error).toContain('End date')
  })

  it('accepts missing end date', () => {
    expect(validateDateRange('2024-01-01', '')).toEqual({
      valid: true,
      error: null,
    })
  })

  it('accepts equal dates', () => {
    expect(validateDateRange('2024-06-15', '2024-06-15')).toEqual({
      valid: true,
      error: null,
    })
  })
})

describe('safeDateCompare', () => {
  it('sorts chronologically', () => {
    expect(safeDateCompare('2024-01-01', '2024-06-01')).toBeLessThan(0)
    expect(safeDateCompare('2024-06-01', '2024-01-01')).toBeGreaterThan(0)
  })

  it('returns 0 for equal dates', () => {
    expect(safeDateCompare('2024-01-01', '2024-01-01')).toBe(0)
  })

  it('pushes null/invalid to end', () => {
    expect(safeDateCompare(null, '2024-01-01')).toBe(1)
    expect(safeDateCompare('2024-01-01', null)).toBe(-1)
    expect(safeDateCompare(null, null)).toBe(0)
  })
})

describe('formatEventDate', () => {
  it('formats day precision', () => {
    const result = formatEventDate({
      dateStart: '2024-03-15',
      datePrecision: 'day',
    })
    expect(result).toBe('March 15, 2024')
  })

  it('formats month precision', () => {
    const result = formatEventDate({
      dateStart: '2024-03-01',
      datePrecision: 'month',
    })
    expect(result).toBe('March 2024')
  })

  it('formats year precision', () => {
    const result = formatEventDate({
      dateStart: '1990-01-01',
      datePrecision: 'year',
    })
    expect(result).toBe('1990')
  })

  it('formats decade precision', () => {
    const result = formatEventDate({
      dateStart: '1960-01-01',
      datePrecision: 'decade',
    })
    expect(result).toBe('1960s')
  })

  it('formats approximate precision', () => {
    const result = formatEventDate({
      dateStart: '1950-01-01',
      datePrecision: 'approximate',
    })
    expect(result).toContain('1950')
    expect(result).toContain('c.')
  })

  it('formats date range', () => {
    const result = formatEventDate({
      dateStart: '2020-01-15',
      dateEnd: '2020-06-20',
      datePrecision: 'day',
    })
    expect(result).toContain('–')
    expect(result).toContain('January 15, 2020')
    expect(result).toContain('June 20, 2020')
  })

  it('falls back to dateRaw when dateStart is missing', () => {
    expect(formatEventDate({ dateRaw: 'around 1950' })).toBe('around 1950')
  })

  it('returns Unknown date when nothing is available', () => {
    expect(formatEventDate({})).toBe('Unknown date')
  })
})

describe('groupByYear', () => {
  it('groups and sorts events by year', () => {
    const events = [
      { dateStart: '2024-06-01' },
      { dateStart: '2023-01-15' },
      { dateStart: '2024-01-01' },
    ]
    const groups = groupByYear(events)
    expect(groups).toHaveLength(2)
    expect(groups[0][0]).toBe('2023')
    expect(groups[0][1]).toHaveLength(1)
    expect(groups[1][0]).toBe('2024')
    expect(groups[1][1]).toHaveLength(2)
  })

  it('puts events with no date in Unknown group at end', () => {
    const events = [{ dateStart: null }, { dateStart: '2024-01-01' }]
    const groups = groupByYear(events)
    const lastGroup = groups[groups.length - 1]
    expect(lastGroup[0]).toBe('Unknown')
  })
})

describe('getDateRangeDuration', () => {
  it('returns days for short durations', () => {
    expect(getDateRangeDuration('2024-01-01', '2024-01-15')).toBe('14 days')
  })

  it('returns years and months for long durations', () => {
    const result = getDateRangeDuration('2020-01-01', '2023-06-01')
    expect(result).toContain('3 years')
    expect(result).toContain('5 months')
  })

  it('returns null for missing dates', () => {
    expect(getDateRangeDuration(null, '2024-01-01')).toBeNull()
    expect(getDateRangeDuration('2024-01-01', null)).toBeNull()
  })

  it('returns null when end <= start', () => {
    expect(getDateRangeDuration('2024-06-01', '2024-01-01')).toBeNull()
  })

  it('returns singular forms correctly', () => {
    expect(getDateRangeDuration('2024-01-01', '2024-01-02')).toBe('1 day')
  })
})

describe('formatEventDateShort', () => {
  it('formats day precision as MMM d', () => {
    expect(formatEventDateShort({ dateStart: '2024-03-15', datePrecision: 'day' })).toBe('Mar 15')
  })

  it('formats month precision as MMM', () => {
    expect(formatEventDateShort({ dateStart: '2024-03-01', datePrecision: 'month' })).toBe('Mar')
  })

  it('returns dash for missing date', () => {
    expect(formatEventDateShort({})).toBe('\u2014')
  })
})

describe('getRelativeDate', () => {
  const isoToday = () => {
    const n = new Date()
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}-${String(n.getDate()).padStart(2, '0')}`
  }

  it('labels today\'s date as "today" regardless of local timezone offset', () => {
    expect(getRelativeDate(isoToday())).toBe('today')
  })

  it('never produces a "0 months" label for a ~30-day gap', () => {
    const n = new Date()
    const future = new Date(n.getTime() + 30 * 86400000)
    const iso = `${future.getFullYear()}-${String(future.getMonth() + 1).padStart(2, '0')}-${String(future.getDate()).padStart(2, '0')}`
    const label = getRelativeDate(iso)
    expect(label).not.toMatch(/0 months/)
  })

  it('returns null for an unparseable date', () => {
    expect(getRelativeDate('not-a-date')).toBeNull()
  })
})
