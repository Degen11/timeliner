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
    recurrence: null,
    attachments: [],
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
      recurrence: e.recurrence || null,
      attachments: Array.isArray(e.attachments) ? e.attachments : [],
    })
  })
}

// ─── ICS (Google Calendar / iCal) Import ─────────────────────

/**
 * Parse an ICS date string (e.g. "20240115T120000Z" or "20240115")
 * into an ISO date string (YYYY-MM-DD).
 */
function parseICSDate(icsDate) {
  if (!icsDate) return null
  // Strip VALUE=DATE: prefix if present
  const clean = icsDate.replace(/^[A-Z;=]+:/, '')
  // YYYYMMDD or YYYYMMDDTHHmmssZ
  const match = clean.match(/^(\d{4})(\d{2})(\d{2})/)
  if (!match) return null
  const iso = `${match[1]}-${match[2]}-${match[3]}`
  return isValidISODate(iso) ? iso : null
}

/**
 * Parse ICS file content into timeline events.
 */
export function normalizeICSEvents(text) {
  const events = []
  const blocks = text.split('BEGIN:VEVENT')

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split('END:VEVENT')[0]
    if (!block) continue

    const getField = (name) => {
      // Handle both folded and unfolded lines
      const regex = new RegExp(`^${name}[;:](.*)$`, 'im')
      const match = block.match(regex)
      return match ? match[1].replace(/\\n/g, '\n').replace(/\\,/g, ',').trim() : null
    }

    const title = getField('SUMMARY') || 'Untitled'
    const description = getField('DESCRIPTION') || null
    const location = getField('LOCATION') || null
    const dtStart = getField('DTSTART')
    const dtEnd = getField('DTEND')

    const dateStart = parseICSDate(dtStart)
    const dateEnd = parseICSDate(dtEnd)

    // Detect recurrence
    const rrule = getField('RRULE')
    let recurrence = null
    if (rrule) {
      const freqMatch = rrule.match(/FREQ=(\w+)/)
      const freq = freqMatch?.[1]?.toLowerCase()
      if (freq === 'yearly') recurrence = { type: 'yearly', interval: 1, endDate: null }
      else if (freq === 'monthly') recurrence = { type: 'monthly', interval: 1, endDate: null }
      else if (freq === 'weekly') recurrence = { type: 'weekly', interval: 1, endDate: null }

      if (recurrence) {
        const intervalMatch = rrule.match(/INTERVAL=(\d+)/)
        if (intervalMatch) recurrence.interval = parseInt(intervalMatch[1], 10)
        const untilMatch = rrule.match(/UNTIL=(\d{8})/)
        if (untilMatch) {
          const u = untilMatch[1]
          const untilIso = `${u.slice(0, 4)}-${u.slice(4, 6)}-${u.slice(6, 8)}`
          if (isValidISODate(untilIso)) recurrence.endDate = untilIso
        }
      }
    }

    if (dateStart) {
      events.push(buildEvent({
        id: generateId(),
        title,
        description,
        dateStart,
        dateEnd: dateEnd && dateEnd !== dateStart ? dateEnd : null,
        dateRaw: dtStart || '',
        datePrecision: 'day',
        flagged: false,
        flagReason: null,
        people: [],
        location,
        tags: [],
        photos: [],
        recurrence,
        attachments: [],
      }))
    }
  }

  return events
}

// ─── Markdown Import ─────────────────────────────────────────

/**
 * Parse markdown with timeline-like structure into events.
 * Supports patterns like:
 * - "## 2024-01-15 - Event Title" (heading with date)
 * - "- **2024-01-15**: Event Title" (list with date)
 * - "- 2024 - Event Title" (list with year)
 */
export function normalizeMarkdownEvents(text) {
  const events = []
  const lines = text.split('\n')
  const dateRegex = /(\d{4}(?:-\d{2}(?:-\d{2})?)?)/

  let currentEvent = null

  const flush = () => {
    if (currentEvent && currentEvent.title) {
      const dateMatch = currentEvent.dateRaw?.match(dateRegex)
      const dateStart = dateMatch?.[1] && isValidISODate(dateMatch[1]) ? dateMatch[1] : null
      events.push(buildEvent({
        id: generateId(),
        title: currentEvent.title,
        description: currentEvent.description?.trim() || null,
        dateStart,
        dateEnd: null,
        dateRaw: currentEvent.dateRaw || '',
        datePrecision: dateStart?.length === 4 ? 'year' : dateStart?.length === 7 ? 'month' : 'day',
        flagged: !dateStart,
        flagReason: !dateStart ? 'Could not extract date' : null,
        people: [],
        location: null,
        tags: [],
        photos: [],
        recurrence: null,
        attachments: [],
      }))
    }
    currentEvent = null
  }

  for (const line of lines) {
    const trimmed = line.trim()

    // Heading pattern: ## 2024-01-15 - Title or ## Title (2024)
    const headingMatch = trimmed.match(/^#{1,6}\s+(.+)$/)
    if (headingMatch) {
      flush()
      const content = headingMatch[1]
      const dateMatch = content.match(dateRegex)
      const title = content
        .replace(dateRegex, '')
        .replace(/^[\s\-–—:]+|[\s\-–—:]+$/g, '')
        .replace(/\*\*/g, '')
        .trim()
      currentEvent = {
        title: title || content,
        dateRaw: dateMatch?.[0] || '',
        description: '',
      }
      continue
    }

    // List item with date: - **2024-01-15**: Title or - 2024 - Title
    const listMatch = trimmed.match(/^[-*]\s+(?:\*\*)?(\d{4}(?:-\d{2}(?:-\d{2})?)?)(?:\*\*)?[\s:–—-]+(.+)$/)
    if (listMatch) {
      flush()
      currentEvent = {
        title: listMatch[2].replace(/\*\*/g, '').trim(),
        dateRaw: listMatch[1],
        description: '',
      }
      continue
    }

    // Description lines (non-empty, non-heading, non-list-with-date)
    if (currentEvent && trimmed && !trimmed.startsWith('#')) {
      // Strip leading "- " or "* " for sub-items
      const descLine = trimmed.replace(/^[-*]\s+/, '')
      currentEvent.description += (currentEvent.description ? '\n' : '') + descLine
    }
  }

  flush()
  return events
}
