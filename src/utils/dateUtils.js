import { parseISO, format, addDays, addMonths, addYears, differenceInDays, differenceInMonths, differenceInYears } from 'date-fns'

/**
 * Safely parse an ISO date string. Returns Date or null.
 */
export function safeParse(dateString) {
  if (!dateString || typeof dateString !== 'string') return null
  try {
    const d = parseISO(dateString)
    return isNaN(d.getTime()) ? null : d
  } catch {
    return null
  }
}

/**
 * Parse for display purposes — shifts to noon UTC to avoid timezone rollback.
 * When a date-only value like "2024-01-01" is parsed, it becomes UTC midnight.
 * In UTC-negative timezones, formatting that to local time rolls back to Dec 31.
 * Adding 12 hours ensures the local date always matches the intended date.
 */
export function safeParseForDisplay(dateString) {
  const d = safeParse(dateString)
  if (!d) return null
  return new Date(d.getTime() + 12 * 60 * 60 * 1000)
}

/**
 * Extract year from an ISO date string by parsing the string directly.
 * Avoids timezone issues that occur when going through Date objects.
 */
export function safeGetUTCYear(dateString, fallback = 'Unknown') {
  if (!dateString || typeof dateString !== 'string') return fallback
  const year = parseInt(dateString.slice(0, 4), 10)
  return isNaN(year) ? fallback : year
}

/**
 * Extract month (0-indexed) from an ISO date string by parsing directly.
 * Returns -1 if no month component is present (year-only dates).
 */
export function safeGetUTCMonth(dateString) {
  if (!dateString || typeof dateString !== 'string') return -1
  // Match YYYY-MM or YYYY-MM-DD
  const match = dateString.match(/^\d{4}-(\d{2})/)
  if (!match) return -1
  const month = parseInt(match[1], 10)
  // month in string is 1-indexed, return 0-indexed
  return month >= 1 && month <= 12 ? month - 1 : -1
}

/**
 * Validate an ISO date string. Accepts YYYY-MM-DD, YYYY-MM, YYYY.
 */
export function isValidISODate(str) {
  if (!str || typeof str !== 'string') return false
  if (!/^\d{4}(-\d{2}(-\d{2})?)?$/.test(str)) return false
  return safeParse(str) !== null
}

/**
 * Validate that end date is >= start date.
 * Returns { valid: boolean, error: string | null }
 */
export function validateDateRange(startStr, endStr) {
  if (!endStr) return { valid: true, error: null }
  if (!startStr) return { valid: true, error: null }

  const start = safeParse(startStr)
  const end = safeParse(endStr)

  if (!start && startStr) return { valid: false, error: 'Invalid start date format' }
  if (!end && endStr) return { valid: false, error: 'Invalid end date format' }
  if (!start || !end) return { valid: true, error: null }

  if (end < start) {
    return { valid: false, error: 'End date must be on or after start date' }
  }
  return { valid: true, error: null }
}

/**
 * Expand a partial ISO date to the FIRST instant of its period, as YYYY-MM-DD.
 * "1960" → "1960-01-01", "1960-05" → "1960-05-01", full dates pass through.
 * Returns null for empty/invalid input.
 */
export function expandISOToStart(iso) {
  if (!iso || typeof iso !== 'string') return null
  const parts = iso.split('-')
  if (parts.length === 1) return `${parts[0]}-01-01`
  if (parts.length === 2) return `${parts[0]}-${parts[1]}-01`
  return iso
}

/**
 * Expand a partial ISO date to the LAST day of its period, as YYYY-MM-DD.
 * "1960" → "1960-12-31", "1960-02" → "1960-02-29" (leap-aware), full pass through.
 * Returns null for empty/invalid input.
 */
export function expandISOToEnd(iso) {
  if (!iso || typeof iso !== 'string') return null
  const parts = iso.split('-')
  if (parts.length === 1) return `${parts[0]}-12-31`
  if (parts.length === 2) {
    const year = Number(parts[0])
    const month = Number(parts[1])
    // Day 0 of the next month resolves to the last day of this month.
    const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate()
    return `${parts[0]}-${parts[1]}-${String(lastDay).padStart(2, '0')}`
  }
  return iso
}

/**
 * Sort comparator for date strings. Pushes null/invalid to end.
 * Returns negative if a < b, positive if a > b, 0 if equal.
 */
export function safeDateCompare(aDateStr, bDateStr) {
  const a = safeParse(aDateStr)
  const b = safeParse(bDateStr)

  if (!a && !b) return 0
  if (!a) return 1
  if (!b) return -1
  return a.getTime() - b.getTime()
}

/**
 * Normalize precision: if marked as 'decade' but the year isn't a
 * round decade (e.g. 1928 instead of 1920), treat it as 'year'.
 */
function effectivePrecision(dateString, precision) {
  if (precision !== 'decade') return precision
  // Read the year from the string: parseISO returns local midnight, so
  // getUTCFullYear() gives the previous year east of UTC (1930 → 1929).
  const year = safeGetUTCYear(dateString, null)
  if (year === null) return precision
  if (year % 10 !== 0) return 'year'
  return 'decade'
}

/**
 * Format an event's date range for display. Uses noon-shifted parsing
 * to avoid timezone rollback issues.
 */
export function formatEventDate(event) {
  if (!event.dateStart) return event.dateRaw || 'Unknown date'

  const start = safeParseForDisplay(event.dateStart)
  if (!start) return event.dateRaw || 'Unknown date'

  const p = effectivePrecision(event.dateStart, event.datePrecision)
  let formatted
  switch (p) {
    case 'day':
      formatted = format(start, 'MMMM d, yyyy')
      break
    case 'month':
      formatted = format(start, 'MMMM yyyy')
      break
    case 'year':
      formatted = format(start, 'yyyy')
      break
    case 'decade': {
      const year = start.getFullYear()
      const decadeStart = Math.floor(year / 10) * 10
      formatted = `${decadeStart}s`
      break
    }
    case 'approximate':
      formatted = `c.\u00A0${format(start, 'yyyy')}`
      break
    default:
      formatted = format(start, 'MMMM d, yyyy')
  }

  if (event.dateEnd) {
    const end = safeParseForDisplay(event.dateEnd)
    if (end) {
      let endFormatted
      if (p === 'year' || p === 'decade' || p === 'approximate') {
        endFormatted = format(end, 'yyyy')
      } else if (p === 'month') {
        endFormatted = format(end, 'MMMM yyyy')
      } else {
        endFormatted = format(end, 'MMMM d, yyyy')
      }
      formatted = `${formatted} \u2013 ${endFormatted}`
    }
  }

  return formatted
}

/**
 * Group events by year, sorted chronologically. Returns [[year, events[]]].
 * Shared by selectors and export helpers to avoid duplicate logic.
 */
export function groupByYear(events) {
  const sorted = [...events].sort((a, b) => safeDateCompare(a.dateStart, b.dateStart))
  const groups = {}
  for (const e of sorted) {
    const year = safeGetUTCYear(e.dateStart, 'Unknown')
    if (!groups[year]) groups[year] = []
    groups[year].push(e)
  }
  return Object.entries(groups).sort(([a], [b]) =>
    a === 'Unknown' ? 1 : b === 'Unknown' ? -1 : a - b
  )
}

/**
 * Compute a human-readable duration between two ISO date strings.
 * Returns e.g. "3 years, 2 months" or "45 days".
 */
export function getDateRangeDuration(startStr, endStr) {
  if (!startStr || !endStr) return null
  const start = safeParse(startStr)
  const end = safeParse(endStr)
  if (!start || !end || end <= start) return null

  const diffMs = end.getTime() - start.getTime()
  const totalDays = Math.round(diffMs / 86_400_000)

  if (totalDays < 31) return `${totalDays} day${totalDays !== 1 ? 's' : ''}`

  const totalMonths =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 +
    (end.getUTCMonth() - start.getUTCMonth())
  const years = Math.floor(totalMonths / 12)
  const months = totalMonths % 12

  const parts = []
  if (years > 0) parts.push(`${years} year${years !== 1 ? 's' : ''}`)
  if (months > 0) parts.push(`${months} month${months !== 1 ? 's' : ''}`)
  return parts.join(', ') || `${totalDays} days`
}

/**
 * Short date format for dense/compact view (omits year since year is in header).
 */
export function formatEventDateShort(event) {
  if (!event.dateStart) return event.dateRaw || '\u2014'

  const start = safeParseForDisplay(event.dateStart)
  if (!start) return event.dateRaw || '\u2014'

  const p = effectivePrecision(event.dateStart, event.datePrecision)
  switch (p) {
    case 'day':
      return format(start, 'MMM d')
    case 'month':
      return format(start, 'MMM')
    case 'year':
      return format(start, 'yyyy')
    case 'decade':
      return format(start, 'yyyy') + 's'
    case 'approximate':
      return `c.\u00A0${format(start, 'yyyy')}`
    default:
      return format(start, 'MMM d')
  }
}

/**
 * Split an event's date into the pieces the event card's date column shows:
 * a headline (`main`, usually the year), a finer `sub` line (month or day),
 * a `precisionLabel` for uncertain dates, and the range `end` + `duration`.
 * Approximate dates keep only the year — their month/day is a guess.
 */
export function getDateParts(event) {
  const empty = { main: null, sub: null, precisionLabel: null, approximate: false, end: null, duration: null }
  if (!event.dateStart) return empty
  const start = safeParseForDisplay(event.dateStart)
  if (!start) return empty

  const inferred = event.dateStart.length <= 4 ? 'year' : event.dateStart.length <= 7 ? 'month' : 'day'
  const p = effectivePrecision(event.dateStart, event.datePrecision) || inferred
  const parts = { ...empty, main: format(start, 'yyyy') }
  if (p === 'day') parts.sub = format(start, 'MMM d')
  else if (p === 'month') parts.sub = format(start, 'MMMM')
  else if (p === 'decade') {
    parts.main = `${Math.floor(start.getFullYear() / 10) * 10}s`
    parts.precisionLabel = 'Decade'
  } else if (p === 'approximate') {
    parts.precisionLabel = 'Approx.'
    parts.approximate = true
  }

  const end = event.dateEnd ? safeParseForDisplay(event.dateEnd) : null
  if (end) {
    if (p === 'day') parts.end = format(end, 'MMM d, yyyy')
    else if (p === 'month') parts.end = format(end, 'MMM yyyy')
    else parts.end = format(end, 'yyyy')
    parts.duration = getDateRangeDuration(event.dateStart, event.dateEnd)
  }
  return parts
}

/**
 * Shift an ISO date string by a given amount and unit, preserving its original
 * precision (YYYY, YYYY-MM, or YYYY-MM-DD).
 *
 * @param {string} dateStr - ISO date string
 * @param {number} amount  - Signed integer (negative = shift backwards)
 * @param {'day'|'month'|'year'} unit
 * @returns {string} Shifted ISO date string in the same precision
 */
export function shiftISODate(dateStr, amount, unit) {
  const d = safeParse(dateStr)
  if (!d) return dateStr

  const shiftFn = unit === 'day' ? addDays : unit === 'month' ? addMonths : addYears
  const shifted = shiftFn(d, amount)

  // Preserve original precision: YYYY-MM-DD, YYYY-MM, or YYYY
  const parts = dateStr.split('-').length
  if (parts >= 3) return format(shifted, 'yyyy-MM-dd')
  if (parts === 2) return format(shifted, 'yyyy-MM')
  return format(shifted, 'yyyy')
}

/**
 * Get a human-readable relative date string (e.g. "3 years ago", "in 2 months").
 * Returns null if the date can't be parsed.
 */
export function getRelativeDate(dateString) {
  // Use the noon-shifted parse so a date-only string isn't pushed into the
  // previous/next calendar day by the local timezone offset (which made events
  // dated "today" render as "yesterday"/"1 day ago").
  const d = safeParseForDisplay(dateString)
  if (!d) return null

  const now = new Date()
  const isPast = d < now

  const totalDays = Math.abs(differenceInDays(d, now))
  const totalMonths = Math.abs(differenceInMonths(d, now))
  const totalYears = Math.abs(differenceInYears(d, now))

  let label
  if (totalDays === 0) {
    label = 'today'
  } else if (totalDays === 1) {
    label = isPast ? 'yesterday' : 'tomorrow'
  } else if (totalMonths < 1) {
    // Fewer than a full calendar month away — report in days (avoids "0 months").
    label = `${totalDays} day${totalDays !== 1 ? 's' : ''}`
  } else if (totalMonths < 12) {
    label = `${totalMonths} month${totalMonths !== 1 ? 's' : ''}`
  } else {
    const remainingMonths = totalMonths % 12
    if (remainingMonths > 0 && totalYears < 10) {
      label = `${totalYears} yr${totalYears !== 1 ? 's' : ''}, ${remainingMonths} mo`
    } else {
      label = `${totalYears} year${totalYears !== 1 ? 's' : ''}`
    }
  }

  if (label === 'today' || label === 'yesterday' || label === 'tomorrow') return label
  return isPast ? `${label} ago` : `in ${label}`
}

/**
 * Rough count of date mentions in free text (four-digit years 1000–2099), used
 * as a live hint while pasting text to import. Not a parser.
 */
export function countDateMentions(text) {
  if (!text) return 0
  return (text.match(/\b(?:1\d{3}|20\d{2})s?\b/g) || []).length
}

const COARSER_HINTS = {
  month: 'Only the month is certain',
  year: 'Only the year is certain',
  decade: 'Only the decade is certain',
}

/**
 * Answers offered when checking a flagged date: keep it as imported, or fall
 * back to a coarser precision that's actually certain (day → month → year →
 * decade). Each choice is { key, dateStart, datePrecision, hint }.
 */
export function getDateChoices(dateStart, datePrecision) {
  if (!dateStart) return []
  const p = effectivePrecision(dateStart, datePrecision)
  const keep = { key: 'keep', dateStart, datePrecision: p, hint: 'Keep what the import found' }
  const coarser = {
    day: [
      { key: 'month', dateStart: dateStart.slice(0, 7), datePrecision: 'month' },
      { key: 'year', dateStart: dateStart.slice(0, 4), datePrecision: 'year' },
    ],
    month: [{ key: 'year', dateStart: dateStart.slice(0, 4), datePrecision: 'year' }],
    year: [{ key: 'decade', dateStart: dateStart.slice(0, 4), datePrecision: 'decade' }],
  }[p] || []
  return [keep, ...coarser.map((c) => ({ ...c, hint: COARSER_HINTS[c.key] }))]
}

/**
 * Plain-language gap between two dates for "before/after" labels: "same year",
 * "3 months", "1 year", "16 years". Uses months only when both dates have them.
 * Returns null if either date is missing.
 */
export function describeGap(fromDate, toDate) {
  const y1 = safeGetUTCYear(fromDate, null)
  const y2 = safeGetUTCYear(toDate, null)
  if (y1 == null || y2 == null) return null
  const m1 = safeGetUTCMonth(fromDate)
  const m2 = safeGetUTCMonth(toDate)
  if (m1 >= 0 && m2 >= 0) {
    const months = Math.abs((y2 - y1) * 12 + (m2 - m1))
    if (months === 0) return 'same month'
    if (months < 12) return `${months} month${months === 1 ? '' : 's'}`
  }
  const years = Math.abs(y2 - y1)
  if (years === 0) return 'same year'
  return `${years} year${years === 1 ? '' : 's'}`
}

// ─── Natural-language dates ──────────────────────────────────

const MONTH_LOOKUP = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
  may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
  sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11,
  dec: 12, december: 12,
}
// Northern-hemisphere meteorological seasons: [first month, last month]
const SEASONS = { spring: [3, 5], summer: [6, 8], autumn: [9, 11], fall: [9, 11], winter: [12, 2] }
const PRECISION_RANK = { day: 0, month: 1, year: 2, decade: 3, approximate: 4 }
const APPROX_PREFIX = /^(?:c\.?|ca\.?|circa|about|around|approximately|approx\.?|roughly|~)\s*/
const DECADE_PART = { early: 2, mid: 5, late: 8 }

const pad2 = (n) => String(n).padStart(2, '0')
const iso = (y, m = 1, d = 1) => `${String(y).padStart(4, '0')}-${pad2(m)}-${pad2(d)}`

function validDay(y, m, d) {
  if (m < 1 || m > 12 || d < 1) return false
  return d <= new Date(Date.UTC(y, m, 0)).getUTCDate()
}

// "'90s" / "90s" → 1990; two-digit decades later than this year's fall back a century
function expandTwoDigitDecade(dd) {
  const n = parseInt(dd, 10)
  const thisCentury = Math.floor(new Date().getFullYear() / 100) * 100
  return thisCentury + n > new Date().getFullYear() ? thisCentury - 100 + n : thisCentury + n
}

/** Parse one side of a date phrase. Returns { dateStart, dateEnd?, datePrecision, year, matched? } or null. */
function parseSinglePhrase(raw, fallbackYear) {
  let s = raw.replace(/^(?:in|on|during|from|since|the)\s+/, '').replace(/^the\s+/, '').trim()
  if (!s) return null

  // Approximate: "c. 1994", "about 1950", "~1820" — the year is all we keep
  if (APPROX_PREFIX.test(s)) {
    const rest = parseSinglePhrase(s.replace(APPROX_PREFIX, ''), fallbackYear)
    if (!rest) return null
    return { dateStart: iso(rest.year), datePrecision: 'approximate', year: rest.year, matched: 'about' }
  }

  // "early 1990s", "late '60s" → an approximate year inside the decade
  let m = s.match(/^(early|mid|late)[\s-]+(.+)$/)
  if (m) {
    const inner = parseSinglePhrase(m[2], fallbackYear)
    if (!inner) return null
    if (inner.datePrecision === 'decade') {
      const year = inner.year + DECADE_PART[m[1]]
      return { dateStart: iso(year), datePrecision: 'approximate', year, matched: m[1] }
    }
    return { dateStart: iso(inner.year), datePrecision: 'approximate', year: inner.year, matched: m[1] }
  }

  // Decades: "1990s", "1990's", "'90s", "90s"
  m = s.match(/^(\d{3})0'?s$/)
  if (m) {
    const year = parseInt(m[1], 10) * 10
    return { dateStart: iso(year), datePrecision: 'decade', year }
  }
  m = s.match(/^['’]?(\d)0'?s$/)
  if (m) {
    const year = expandTwoDigitDecade(`${m[1]}0`)
    return { dateStart: iso(year), datePrecision: 'decade', year }
  }

  // Seasons: "summer 1994", "summer of 1994", "winter" (needs a fallback year)
  m = s.match(/^(spring|summer|autumn|fall|winter)(?:\s+(?:of\s+)?(\d{3,4}))?$/)
  if (m) {
    const year = m[2] ? parseInt(m[2], 10) : fallbackYear
    if (!year) return null
    const [from, to] = SEASONS[m[1]]
    const endYear = to < from ? year + 1 : year
    return { dateStart: iso(year, from), dateEnd: iso(endYear, to), datePrecision: 'month', year, matched: m[1] }
  }

  // ISO: 1994, 1994-06, 1994-06-12
  m = s.match(/^(\d{3,4})(?:-(\d{1,2})(?:-(\d{1,2}))?)?$/)
  if (m) {
    const year = parseInt(m[1], 10)
    if (!m[2]) return { dateStart: iso(year), datePrecision: 'year', year }
    const month = parseInt(m[2], 10)
    if (!m[3]) return month >= 1 && month <= 12 ? { dateStart: iso(year, month), datePrecision: 'month', year } : null
    const day = parseInt(m[3], 10)
    return validDay(year, month, day) ? { dateStart: iso(year, month, day), datePrecision: 'day', year } : null
  }

  // "12 june 1994", "12th of june 1994", "june 12 1994", "june 1994", "june" (with a fallback year)
  const words = s.replace(/(\d+)(?:st|nd|rd|th)\b/g, '$1').replace(/\bof\b/g, ' ').split(/\s+/).filter(Boolean)
  let day = null
  let month = null
  let year = null
  for (const w of words) {
    if (MONTH_LOOKUP[w.replace(/\.$/, '')] && month == null) month = MONTH_LOOKUP[w.replace(/\.$/, '')]
    else if (/^\d{3,4}$/.test(w) && year == null) year = parseInt(w, 10)
    else if (/^\d{1,2}$/.test(w) && day == null) day = parseInt(w, 10)
    else return null
  }
  if (month == null) return null
  if (year == null) year = fallbackYear
  if (!year) return null
  if (day != null) {
    return validDay(year, month, day) ? { dateStart: iso(year, month, day), datePrecision: 'day', year } : null
  }
  return { dateStart: iso(year, month), datePrecision: 'month', year, matched: words.find((w) => MONTH_LOOKUP[w.replace(/\.$/, '')]) }
}

/**
 * Read a date the way people write it — "summer 1994", "June 1994", "the 1990s",
 * "about 1950", "12 May 1996", "3 May 1996 – 1998" — into the event date model.
 * Returns { dateStart, dateEnd, datePrecision, matched } with full ISO dates
 * (the same shape the date picker writes), or null when it can't be read.
 * `fallbackYear` fills in phrases with no year ("summer", "June 12").
 * `matched` names the word that set the date's shape (a season, month or "about").
 */
export function parseDatePhrase(text, { fallbackYear = null } = {}) {
  if (typeof text !== 'string') return null
  const s = text
    .toLowerCase()
    .replace(/[,]/g, ' ')
    .replace(/[–—]/g, ' - ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!s) return null

  // Ranges: "1994 - 1998", "june to august 1994", "between 1990 and 1995", "1994-1998"
  const between = s.match(/^between (.+) and (.+)$/)
  const parts = between
    ? [between[1], between[2]]
    : s.match(/^(\d{3,4})-(\d{3,4})$/)?.slice(1) ?? s.split(/\s+(?:-|to|until|till|through|thru)\s+/)

  if (parts.length === 2) {
    const right = parts[1].trim()
    let start
    let end
    if (/^\d{2}$/.test(right)) {
      // "1994 – 98": a two-digit end year borrows the start's century
      start = parseSinglePhrase(parts[0].trim(), fallbackYear)
      if (!start) return null
      const year = Math.floor(start.year / 100) * 100 + parseInt(right, 10)
      end = { dateStart: iso(year), datePrecision: 'year', year }
    } else {
      end = parseSinglePhrase(right, fallbackYear)
      start = end ? parseSinglePhrase(parts[0].trim(), end.year) : null
      if (!start) start = parseSinglePhrase(parts[0].trim(), fallbackYear)
    }
    if (!start || !end) return null
    const endDate = end.dateEnd || end.dateStart
    if (endDate <= start.dateStart) return null
    const datePrecision =
      PRECISION_RANK[start.datePrecision] >= PRECISION_RANK[end.datePrecision] ? start.datePrecision : end.datePrecision
    return { dateStart: start.dateStart, dateEnd: endDate, datePrecision, matched: start.matched || end.matched || null }
  }
  if (parts.length > 2) return null

  const single = parseSinglePhrase(s, fallbackYear)
  if (!single) return null
  return {
    dateStart: single.dateStart,
    dateEnd: single.dateEnd || null,
    datePrecision: single.datePrecision,
    matched: single.matched || null,
  }
}

const INPUT_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

function formatOneForInput(dateStr, precision) {
  const y = safeGetUTCYear(dateStr, null)
  if (y == null) return ''
  const [, mm, dd] = dateStr.split('-')
  if (precision === 'decade') return `${Math.floor(y / 10) * 10}s`
  if (precision === 'approximate') return `about ${y}`
  if (precision === 'year' || !mm) return String(y)
  if (precision === 'month' || !dd) return `${INPUT_MONTHS[parseInt(mm, 10) - 1]} ${y}`
  return `${parseInt(dd, 10)} ${INPUT_MONTHS[parseInt(mm, 10) - 1]} ${y}`
}

/**
 * Write an event's date as editable text that `parseDatePhrase` reads back to
 * the same value: "12 June 1994", "June 1994", "1990s", "about 1950",
 * "June 1994 – August 1994".
 */
export function formatDateForInput({ dateStart, dateEnd, datePrecision }) {
  if (!dateStart) return ''
  const precision = effectivePrecision(dateStart, datePrecision) || 'day'
  const start = formatOneForInput(dateStart, precision)
  if (!dateEnd) return start
  const endPrecision = precision === 'approximate' ? 'year' : precision
  return `${start} – ${formatOneForInput(dateEnd, endPrecision)}`
}

const PHRASE_PATTERNS = [
  /\b(?:early|mid|late)[\s-]+(?:\d{3}0'?s|['’]\d0s)\b/,
  /\b(?:spring|summer|autumn|fall|winter)(?:\s+(?:of\s+)?\d{3,4})?\b/,
  /\b(?:\d{1,2}(?:st|nd|rd|th)?\s+(?:of\s+)?)?(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\.?(?:\s+\d{1,2}(?:st|nd|rd|th)?)?(?:\s+(?:of\s+)?\d{3,4})?\b/,
  /\b\d{3}0'?s\b/,
  /\b(?:c\.?|ca\.?|circa|about|around)\s*\d{3,4}\b/,
  /\b\d{4}\b/,
]

/**
 * Find a date inside free text such as an import's `dateRaw` ("the summer
 * after I finished school"). Tries the whole text first, then the first
 * season, month, decade or year it mentions. Returns parseDatePhrase's shape
 * or null.
 */
export function findDatePhrase(text, { fallbackYear = null } = {}) {
  const whole = parseDatePhrase(text, { fallbackYear })
  if (whole) return whole
  if (typeof text !== 'string') return null
  const lower = text.toLowerCase()
  for (const re of PHRASE_PATTERNS) {
    const m = lower.match(re)
    if (!m) continue
    const found = parseDatePhrase(m[0], { fallbackYear })
    if (found) return found
  }
  return null
}

const normISO = (d) => (d ? expandISOToStart(d) : null)
const sameDate = (a, b) =>
  normISO(a.dateStart) === normISO(b.dateStart) &&
  normISO(a.dateEnd) === normISO(b.dateEnd) &&
  a.datePrecision === b.datePrecision

const capitalize = (w) => w.charAt(0).toUpperCase() + w.slice(1)

/**
 * Answers to offer when checking a flagged date: first what the source text
 * suggests ("summer" → June–August as a range, or just June), then the
 * import's own date and coarser fallbacks. A choice with a `dateEnd` key sets
 * the end date too (null clears it); others leave it alone. `badge` names the
 * word in the source text the choice came from.
 */
export function getReviewChoices(event) {
  const year = safeGetUTCYear(event.dateStart, null)
  const choices = []
  const phrase = event.dateRaw ? findDatePhrase(event.dateRaw, { fallbackYear: year }) : null
  if (phrase) {
    const isSeason = phrase.matched && SEASONS[phrase.matched]
    choices.push({
      key: 'phrase',
      dateStart: phrase.dateStart,
      dateEnd: phrase.dateEnd || null,
      datePrecision: phrase.datePrecision,
      hint: phrase.dateEnd ? `${isSeason ? capitalize(phrase.matched) : 'The span'} as a range` : 'Read from your text',
      badge: phrase.matched && phrase.matched !== 'about' ? phrase.matched : null,
    })
    if (phrase.dateEnd && phrase.datePrecision === 'month') {
      choices.push({
        key: 'phrase-start',
        dateStart: phrase.dateStart,
        dateEnd: null,
        datePrecision: 'month',
        hint: `Just the month ${isSeason ? `${phrase.matched} began` : 'it began'}`,
      })
    }
  }
  // The import's own date and coarser fallbacks keep the event's end date
  for (const c of getDateChoices(event.dateStart, event.datePrecision)) {
    if (!choices.some((x) => sameDate(x, { ...c, dateEnd: event.dateEnd || null }))) choices.push(c)
  }
  return choices
}
