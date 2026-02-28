import { isValidISODate } from '@/utils/dateUtils'
import { generateId } from '@/utils/constants'

export function normalizeCSVEvent(row) {
  const rawDate = row.dateStart || row.date || null
  const dateInvalid = rawDate && !isValidISODate(rawDate)
  const rawEnd = row.dateEnd || null
  const endInvalid = rawEnd && !isValidISODate(rawEnd)
  const anyInvalid = dateInvalid || endInvalid

  const reasons = []
  if (dateInvalid) reasons.push(`Invalid start date: "${rawDate}"`)
  if (endInvalid) reasons.push(`Invalid end date: "${rawEnd}"`)

  return {
    id: generateId(),
    title: row.title || 'Untitled',
    description: row.description || null,
    dateStart: dateInvalid ? null : rawDate,
    dateEnd: endInvalid ? null : rawEnd,
    dateRaw: row.dateRaw || row.dateStart || row.date || '',
    datePrecision: row.datePrecision || 'day',
    flagged: anyInvalid || row.flagged === 'Yes' || row.flagged === 'true' || row.flagged === true,
    flagReason: anyInvalid ? reasons.join('; ') : (row.flagReason || null),
    people: typeof row.people === 'string'
      ? row.people.split(';').map((s) => s.trim()).filter(Boolean)
      : [],
    tags: typeof row.tags === 'string'
      ? row.tags.split(';').map((s) => s.trim()).filter(Boolean)
      : [],
    photos: [],
  }
}

export function normalizeJSONEvents(data) {
  const events = data.events || data
  if (!Array.isArray(events)) return []
  return events.map((e) => {
    const rawDate = e.dateStart || e.date || null
    const dateInvalid = rawDate && !isValidISODate(rawDate)
    const rawEnd = e.dateEnd || null
    const endInvalid = rawEnd && !isValidISODate(rawEnd)
    const anyInvalid = dateInvalid || endInvalid

    const reasons = []
    if (dateInvalid) reasons.push(`Invalid start date: "${rawDate}"`)
    if (endInvalid) reasons.push(`Invalid end date: "${rawEnd}"`)

    return {
      id: e.id || generateId(),
      title: e.title || 'Untitled',
      description: e.description || null,
      dateStart: dateInvalid ? null : rawDate,
      dateEnd: endInvalid ? null : rawEnd,
      dateRaw: e.dateRaw || e.dateStart || '',
      datePrecision: e.datePrecision || 'day',
      flagged: anyInvalid || e.flagged || false,
      flagReason: anyInvalid ? reasons.join('; ') : (e.flagReason || null),
      people: Array.isArray(e.people) ? e.people : [],
      tags: Array.isArray(e.tags) ? e.tags : [],
      photos: Array.isArray(e.photos) ? e.photos : [],
    }
  })
}
