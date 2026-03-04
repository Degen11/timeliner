import { parseISO, format } from 'date-fns'

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

  if (!start || !end) return { valid: true, error: null }

  if (end < start) {
    return { valid: false, error: 'End date must be on or after start date' }
  }
  return { valid: true, error: null }
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
  const d = safeParse(dateString)
  if (!d) return precision
  const year = d.getUTCFullYear()
  if (year % 10 !== 0) return 'year'
  return 'decade'
}

/**
 * Format a single date string based on precision. Used when displaying
 * start and end dates separately for inline editing.
 */
export function formatSingleDate(dateString, precision) {
  const start = safeParseForDisplay(dateString)
  if (!start) return 'Unknown date'

  const p = effectivePrecision(dateString, precision)
  switch (p) {
    case 'day':
      return format(start, 'MMMM d, yyyy')
    case 'month':
      return format(start, 'MMMM yyyy')
    case 'year':
      return format(start, 'yyyy')
    case 'decade': {
      const year = start.getFullYear()
      const decadeStart = Math.floor(year / 10) * 10
      return `${decadeStart}s`
    }
    default:
      return format(start, 'MMMM d, yyyy')
  }
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
    default:
      formatted = format(start, 'MMMM d, yyyy')
  }

  if (event.dateEnd) {
    const end = safeParseForDisplay(event.dateEnd)
    if (end) {
      let endFormatted
      if (p === 'year' || p === 'decade') {
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
    case 'decade':
      return '' // already shown in year header
    default:
      return format(start, 'MMM d')
  }
}
