import { isValidISODate } from '@/utils/dateUtils'
import { generateId } from '@/utils/constants'
import { eventSchema } from '@/schemas/event'

/** Run the assembled event through Zod for type safety; fall back to raw if it fails. */
function buildEvent(raw) {
  const result = eventSchema.safeParse(raw)
  return result.success ? result.data : raw
}

function validateDates(dateStart, dateEnd) {
  const dateInvalid = dateStart && !isValidISODate(dateStart)
  const endInvalid = dateEnd && !isValidISODate(dateEnd)
  const anyInvalid = dateInvalid || endInvalid
  const reasons = []
  if (dateInvalid) reasons.push(`Invalid start date: "${dateStart}"`)
  if (endInvalid) reasons.push(`Invalid end date: "${dateEnd}"`)
  return { dateInvalid, endInvalid, anyInvalid, reasons }
}

export function normalizeCSVEvent(row) {
  const rawDate = row.dateStart || row.date || null
  const rawEnd = row.dateEnd || null
  const { dateInvalid, endInvalid, anyInvalid, reasons } = validateDates(rawDate, rawEnd)

  return buildEvent({
    id: generateId(),
    title: row.title || 'Untitled',
    description: row.description || null,
    dateStart: dateInvalid ? null : rawDate,
    dateEnd: endInvalid ? null : rawEnd,
    dateRaw: row.dateRaw || row.dateStart || row.date || '',
    datePrecision: row.datePrecision || 'day',
    flagged: anyInvalid || row.flagged === 'Yes' || row.flagged === 'true' || row.flagged === true,
    flagReason: anyInvalid ? reasons.join('; ') : row.flagReason || null,
    people:
      typeof row.people === 'string'
        ? row.people
            .split(';')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    tags:
      typeof row.tags === 'string'
        ? row.tags
            .split(';')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    photos: [],
  })
}

export function normalizeJSONEvents(data) {
  const events = data?.events || data
  if (!Array.isArray(events)) return []
  return events.map((e) => {
    const rawDate = e.dateStart || e.date || null
    const rawEnd = e.dateEnd || null
    const { dateInvalid, endInvalid, anyInvalid, reasons } = validateDates(rawDate, rawEnd)

    return buildEvent({
      id: e.id || generateId(),
      title: e.title || 'Untitled',
      description: e.description || null,
      dateStart: dateInvalid ? null : rawDate,
      dateEnd: endInvalid ? null : rawEnd,
      dateRaw: e.dateRaw || e.dateStart || '',
      datePrecision: e.datePrecision || 'day',
      flagged: anyInvalid || e.flagged || false,
      flagReason: anyInvalid ? reasons.join('; ') : e.flagReason || null,
      people: Array.isArray(e.people) ? e.people : [],
      tags: Array.isArray(e.tags) ? e.tags : [],
      photos: Array.isArray(e.photos) ? e.photos : [],
    })
  })
}
