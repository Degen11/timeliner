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
 * Extract UTC year from an ISO date string, with fallback.
 */
export function safeGetUTCYear(dateString, fallback = 'Unknown') {
  const d = safeParse(dateString)
  return d ? d.getUTCFullYear() : fallback
}

/**
 * Extract UTC month (0-indexed) from an ISO date string.
 */
export function safeGetUTCMonth(dateString) {
  const d = safeParse(dateString)
  return d ? d.getUTCMonth() : 0
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
 * Format an event's date range for display. Uses noon-shifted parsing
 * to avoid timezone rollback issues.
 */
export function formatEventDate(event) {
  if (!event.dateStart) return event.dateRaw || 'Unknown date'

  const start = safeParseForDisplay(event.dateStart)
  if (!start) return event.dateRaw || 'Unknown date'

  let formatted
  switch (event.datePrecision) {
    case 'day':
      formatted = format(start, 'MMMM d, yyyy')
      break
    case 'month':
      formatted = format(start, 'MMMM yyyy')
      break
    case 'year':
      formatted = format(start, 'yyyy')
      break
    case 'decade':
      formatted = `${format(start, 'yyyy')}s`
      break
    default:
      formatted = format(start, 'MMMM d, yyyy')
  }

  if (event.dateEnd) {
    const end = safeParseForDisplay(event.dateEnd)
    if (end) {
      const endFormatted =
        event.datePrecision === 'year'
          ? format(end, 'yyyy')
          : format(end, 'MMMM d, yyyy')
      formatted = `${formatted} – ${endFormatted}`
    }
  }

  return formatted
}

/**
 * Short date format for dense/compact view (omits year since year is in header).
 */
export function formatEventDateShort(event) {
  if (!event.dateStart) return event.dateRaw || '—'

  const start = safeParseForDisplay(event.dateStart)
  if (!start) return event.dateRaw || '—'

  switch (event.datePrecision) {
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
