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
  const d = safeParse(dateString)
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
  } else if (totalDays < 30) {
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
