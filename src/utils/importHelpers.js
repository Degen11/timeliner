import { isValidISODate } from '@/utils/dateUtils'

export function generateId() {
  return 'evt_' + Math.random().toString(36).slice(2, 9)
}

export function normalizeCSVEvent(row) {
  const rawDate = row.dateStart || row.date || null
  const dateInvalid = rawDate && !isValidISODate(rawDate)
  return {
    id: generateId(),
    title: row.title || 'Untitled',
    description: row.description || null,
    dateStart: dateInvalid ? null : rawDate,
    dateEnd: row.dateEnd || null,
    dateRaw: row.dateRaw || row.dateStart || row.date || '',
    datePrecision: row.datePrecision || 'day',
    flagged: dateInvalid || row.flagged === 'Yes' || row.flagged === 'true' || row.flagged === true,
    flagReason: dateInvalid ? `Invalid date format: "${rawDate}"` : (row.flagReason || null),
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
    return {
      id: e.id || generateId(),
      title: e.title || 'Untitled',
      description: e.description || null,
      dateStart: dateInvalid ? null : rawDate,
      dateEnd: e.dateEnd || null,
      dateRaw: e.dateRaw || e.dateStart || '',
      datePrecision: e.datePrecision || 'day',
      flagged: dateInvalid || e.flagged || false,
      flagReason: dateInvalid ? `Invalid date format: "${rawDate}"` : (e.flagReason || null),
      people: Array.isArray(e.people) ? e.people : [],
      tags: Array.isArray(e.tags) ? e.tags : [],
      photos: Array.isArray(e.photos) ? e.photos : [],
    }
  })
}
