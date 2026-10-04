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
  expandISOToStart,
  expandISOToEnd,
  countDateMentions,
  getDateChoices,
  describeGap,
  getDateParts,
  parseDatePhrase,
  formatDateForInput,
  findDatePhrase,
  getReviewChoices,
} from '../dateUtils'

describe('expandISOToStart', () => {
  it('pads a year to Jan 1', () => {
    expect(expandISOToStart('1960')).toBe('1960-01-01')
  })
  it('pads a year-month to the 1st', () => {
    expect(expandISOToStart('1960-05')).toBe('1960-05-01')
  })
  it('passes full dates through', () => {
    expect(expandISOToStart('1960-05-14')).toBe('1960-05-14')
  })
  it('returns null for empty input', () => {
    expect(expandISOToStart('')).toBeNull()
    expect(expandISOToStart(null)).toBeNull()
  })
})

describe('expandISOToEnd', () => {
  it('pads a year to Dec 31', () => {
    expect(expandISOToEnd('1960')).toBe('1960-12-31')
  })
  it('pads a year-month to the last day (leap-aware)', () => {
    expect(expandISOToEnd('1960-02')).toBe('1960-02-29') // 1960 is a leap year
    expect(expandISOToEnd('1961-02')).toBe('1961-02-28')
    expect(expandISOToEnd('1960-04')).toBe('1960-04-30')
  })
  it('passes full dates through', () => {
    expect(expandISOToEnd('1960-05-14')).toBe('1960-05-14')
  })
  it('returns null for empty input', () => {
    expect(expandISOToEnd('')).toBeNull()
  })
})

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

  it('formats decade precision east of UTC', () => {
    const tz = process.env.TZ
    process.env.TZ = 'Europe/Berlin'
    try {
      expect(formatEventDate({ dateStart: '1930', datePrecision: 'decade' })).toBe('1930s')
      expect(formatEventDateShort({ dateStart: '1930', datePrecision: 'decade' })).toBe('1930s')
    } finally {
      if (tz === undefined) delete process.env.TZ
      else process.env.TZ = tz
    }
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

describe('countDateMentions', () => {
  it('counts four-digit years and decades in free text', () => {
    expect(countDateMentions('Born in 1879, moved in 1880, and active through the 1920s.')).toBe(3)
  })

  it('ignores other numbers and empty input', () => {
    expect(countDateMentions('Room 42, 12 people, 3000 miles')).toBe(0)
    expect(countDateMentions('')).toBe(0)
    expect(countDateMentions(null)).toBe(0)
  })
})

describe('getDateChoices', () => {
  it('offers keep, month and year for a day-precision date', () => {
    const choices = getDateChoices('1915-11-01', 'day')
    expect(choices.map((c) => [c.key, c.dateStart, c.datePrecision])).toEqual([
      ['keep', '1915-11-01', 'day'],
      ['month', '1915-11', 'month'],
      ['year', '1915', 'year'],
    ])
    expect(choices.every((c) => c.hint)).toBe(true)
  })

  it('steps down one level from month and year', () => {
    expect(getDateChoices('1915-11', 'month').map((c) => c.key)).toEqual(['keep', 'year'])
    expect(getDateChoices('1915', 'year').map((c) => c.key)).toEqual(['keep', 'decade'])
  })

  it('only keeps for decade or approximate dates, and is empty without a date', () => {
    expect(getDateChoices('1910', 'decade').map((c) => c.key)).toEqual(['keep'])
    expect(getDateChoices(null, 'day')).toEqual([])
  })
})

describe('describeGap', () => {
  it('uses months under a year when both dates have them', () => {
    expect(describeGap('1915-03', '1915-11')).toBe('8 months')
    expect(describeGap('1915-11-01', '1915-11-20')).toBe('same month')
  })

  it('falls back to years', () => {
    expect(describeGap('1879-03-14', '1880')).toBe('1 year')
    expect(describeGap('1880', '1896-10')).toBe('16 years')
    expect(describeGap('1905', '1905')).toBe('same year')
  })

  it('returns null when a date is missing', () => {
    expect(describeGap(null, '1905')).toBeNull()
  })
})

describe('getDateParts', () => {
  it('leads with the year and adds finer detail by precision', () => {
    expect(getDateParts({ dateStart: '1994-06-12', datePrecision: 'day' })).toMatchObject({ main: '1994', sub: 'Jun 12', precisionLabel: null })
    expect(getDateParts({ dateStart: '1994-06', datePrecision: 'month' })).toMatchObject({ main: '1994', sub: 'June' })
    expect(getDateParts({ dateStart: '1994', datePrecision: 'year' })).toMatchObject({ main: '1994', sub: null })
    expect(getDateParts({ dateStart: '1990', datePrecision: 'decade' })).toMatchObject({ main: '1990s', precisionLabel: 'Decade' })
  })

  it('keeps only the year for approximate dates and flags them', () => {
    expect(getDateParts({ dateStart: '1994-06-01', datePrecision: 'approximate' })).toMatchObject({
      main: '1994', sub: null, precisionLabel: 'Approx.', approximate: true,
    })
  })

  it('infers precision from the string when it is missing', () => {
    expect(getDateParts({ dateStart: '1994' })).toMatchObject({ main: '1994', sub: null })
    expect(getDateParts({ dateStart: '1994-06' })).toMatchObject({ sub: 'June' })
  })

  it('adds the range end and duration', () => {
    expect(getDateParts({ dateStart: '1994-06', dateEnd: '1998-09', datePrecision: 'month' })).toMatchObject({
      end: 'Sep 1998', duration: '4 years, 3 months',
    })
  })

  it('returns empty parts for missing or invalid dates', () => {
    expect(getDateParts({ dateStart: null }).main).toBeNull()
    expect(getDateParts({ dateStart: 'not a date' }).main).toBeNull()
  })
})

describe('parseDatePhrase', () => {
  const p = (t, o) => {
    const r = parseDatePhrase(t, o)
    return r && [r.dateStart, r.dateEnd, r.datePrecision]
  }

  it('reads single dates at every precision', () => {
    expect(p('12 June 1994')).toEqual(['1994-06-12', null, 'day'])
    expect(p('June 12th, 1994')).toEqual(['1994-06-12', null, 'day'])
    expect(p('1994-06-12')).toEqual(['1994-06-12', null, 'day'])
    expect(p('June 1994')).toEqual(['1994-06-01', null, 'month'])
    expect(p('jun. 1994')).toEqual(['1994-06-01', null, 'month'])
    expect(p('in 1994')).toEqual(['1994-01-01', null, 'year'])
    expect(p('the 1990s')).toEqual(['1990-01-01', null, 'decade'])
    expect(p("1990's")).toEqual(['1990-01-01', null, 'decade'])
  })

  it('reads approximate dates', () => {
    expect(p('c. 1994')).toEqual(['1994-01-01', null, 'approximate'])
    expect(p('about 1950')).toEqual(['1950-01-01', null, 'approximate'])
    expect(p('~1820')).toEqual(['1820-01-01', null, 'approximate'])
    expect(p('late 1960s')).toEqual(['1968-01-01', null, 'approximate'])
  })

  it('turns seasons into month ranges, crossing the year for winter', () => {
    expect(parseDatePhrase('summer 1994')).toEqual({
      dateStart: '1994-06-01', dateEnd: '1994-08-01', datePrecision: 'month', matched: 'summer',
    })
    expect(p('winter of 1994')).toEqual(['1994-12-01', '1995-02-01', 'month'])
    expect(p('summer')).toBeNull()
    expect(p('summer', { fallbackYear: 1994 })).toEqual(['1994-06-01', '1994-08-01', 'month'])
  })

  it('reads ranges and lends the end year to the start', () => {
    expect(p('1994 – 1998')).toEqual(['1994-01-01', '1998-01-01', 'year'])
    expect(p('1994-1998')).toEqual(['1994-01-01', '1998-01-01', 'year'])
    expect(p('1994 - 98')).toEqual(['1994-01-01', '1998-01-01', 'year'])
    expect(p('June to August 1994')).toEqual(['1994-06-01', '1994-08-01', 'month'])
    expect(p('between 1990 and 1995')).toEqual(['1990-01-01', '1995-01-01', 'year'])
    expect(p('3 May 1996 – 1998')).toEqual(['1996-05-03', '1998-01-01', 'year'])
  })

  it('returns null for text it cannot read', () => {
    for (const t of ['', 'hello', '31 Feb 1994', '1998 - 1994', 'June', null]) expect(parseDatePhrase(t)).toBeNull()
  })
})

describe('formatDateForInput', () => {
  it('writes text that parses back to the same date', () => {
    const cases = [
      { dateStart: '1994-06-12', datePrecision: 'day' },
      { dateStart: '1994-06-01', datePrecision: 'month' },
      { dateStart: '1994', datePrecision: 'year' },
      { dateStart: '1990', datePrecision: 'decade' },
      { dateStart: '1994', datePrecision: 'approximate' },
      { dateStart: '1994-06-01', dateEnd: '1994-08-01', datePrecision: 'month' },
      { dateStart: '1994-06-12', dateEnd: '1995-01-03', datePrecision: 'day' },
    ]
    const norm = (d) => (d ? expandISOToStart(d) : null)
    for (const c of cases) {
      const back = parseDatePhrase(formatDateForInput(c))
      expect([back.dateStart, back.dateEnd, back.datePrecision]).toEqual([norm(c.dateStart), norm(c.dateEnd), c.datePrecision])
    }
    expect(formatDateForInput({ dateStart: '1994-06-01', datePrecision: 'month' })).toBe('June 1994')
    expect(formatDateForInput({ dateStart: '' })).toBe('')
  })
})

describe('findDatePhrase', () => {
  it('finds a date inside longer text', () => {
    expect(findDatePhrase('the summer after I finished school', { fallbackYear: 1994 })).toMatchObject({
      dateStart: '1994-06-01', dateEnd: '1994-08-01', matched: 'summer',
    })
    expect(findDatePhrase('sometime in March of 1961')).toMatchObject({ dateStart: '1961-03-01', datePrecision: 'month' })
    expect(findDatePhrase('no date here')).toBeNull()
  })
})

describe('getReviewChoices', () => {
  it('leads with what the source phrase says, then the import and coarser dates', () => {
    const choices = getReviewChoices({
      dateStart: '1994-06-01', datePrecision: 'approximate', dateRaw: 'the summer after I finished school',
    })
    expect(choices.map((c) => [c.key, c.dateStart, c.dateEnd, c.datePrecision])).toEqual([
      ['phrase', '1994-06-01', '1994-08-01', 'month'],
      ['phrase-start', '1994-06-01', null, 'month'],
      ['keep', '1994-06-01', undefined, 'approximate'],
    ])
    expect(choices[0]).toMatchObject({ badge: 'summer', hint: 'Summer as a range' })
  })

  it('skips a phrase choice that repeats the import date', () => {
    const choices = getReviewChoices({ dateStart: '1961-03', datePrecision: 'month', dateRaw: 'March 1961' })
    expect(choices.map((c) => c.key)).toEqual(['phrase', 'year'])
  })
})
