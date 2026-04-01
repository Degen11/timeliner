/**
 * Web Worker for parsing large CSV/JSON/ICS/Markdown import files.
 * Offloads heavy parsing from the main thread to prevent UI freezes.
 *
 * Messages:
 *   { type: 'csv', data: string }
 *   { type: 'json', data: string }
 *   { type: 'ics', data: string }
 *   { type: 'markdown', data: string }
 *
 * Response:
 *   { events: Array, error?: string }
 */

// Simple ID generator (can't use crypto.randomUUID in older workers)
function generateId() {
  const chars = 'abcdef0123456789'
  let id = 'evt_'
  for (let i = 0; i < 12; i++) {
    id += chars[Math.floor(Math.random() * chars.length)]
  }
  return id
}

function isValidISODate(str) {
  if (!str || typeof str !== 'string') return false
  if (!/^\d{4}(-\d{2}(-\d{2})?)?$/.test(str)) return false
  try {
    const d = new Date(str)
    return !isNaN(d.getTime())
  } catch {
    return false
  }
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

function buildRawEvent(raw) {
  return {
    id: raw.id || generateId(),
    title: raw.title || 'Untitled',
    description: raw.description || null,
    dateStart: raw.dateStart || null,
    dateEnd: raw.dateEnd || null,
    dateRaw: raw.dateRaw || '',
    datePrecision: raw.datePrecision || 'day',
    flagged: raw.flagged || false,
    flagReason: raw.flagReason || null,
    people: raw.people || [],
    location: raw.location || null,
    tags: raw.tags || [],
    photos: raw.photos || [],
    recurrence: raw.recurrence || null,
    attachments: raw.attachments || [],
  }
}

// Minimal CSV parser for worker context (no Papa dependency)
function parseCSV(text) {
  const lines = text.split('\n')
  if (lines.length < 2) return []

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
  const events = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Simple CSV field splitting (handles quoted fields)
    const fields = []
    let current = ''
    let inQuotes = false
    for (let j = 0; j < line.length; j++) {
      const ch = line[j]
      if (ch === '"') {
        inQuotes = !inQuotes
      } else if (ch === ',' && !inQuotes) {
        fields.push(current.trim())
        current = ''
      } else {
        current += ch
      }
    }
    fields.push(current.trim())

    const row = {}
    headers.forEach((h, idx) => { row[h] = fields[idx] || '' })

    const rawDate = row.dateStart || row.date || null
    const rawEnd = row.dateEnd || null
    const { dateInvalid, endInvalid, anyInvalid, reasons } = validateDates(rawDate, rawEnd)

    events.push(buildRawEvent({
      title: row.title || 'Untitled',
      description: row.description || null,
      dateStart: dateInvalid ? null : rawDate,
      dateEnd: endInvalid ? null : rawEnd,
      dateRaw: row.dateRaw || row.dateStart || row.date || '',
      datePrecision: row.datePrecision || 'day',
      flagged: anyInvalid || row.flagged === 'Yes' || row.flagged === 'true',
      flagReason: anyInvalid ? reasons.join('; ') : row.flagReason || null,
      people: typeof row.people === 'string' ? row.people.split(';').map((s) => s.trim()).filter(Boolean) : [],
      tags: typeof row.tags === 'string' ? row.tags.split(';').map((s) => s.trim()).filter(Boolean) : [],
    }))
  }

  return events
}

function parseJSON(text) {
  const data = JSON.parse(text)
  const raw = data?.events || data
  if (!Array.isArray(raw)) return []

  return raw.map((e) => {
    const rawDate = e.dateStart || e.date || null
    const rawEnd = e.dateEnd || null
    const { dateInvalid, endInvalid, anyInvalid, reasons } = validateDates(rawDate, rawEnd)

    return buildRawEvent({
      id: e.id,
      title: e.title,
      description: e.description,
      dateStart: dateInvalid ? null : rawDate,
      dateEnd: endInvalid ? null : rawEnd,
      dateRaw: e.dateRaw || e.dateStart || '',
      datePrecision: e.datePrecision,
      flagged: anyInvalid || e.flagged,
      flagReason: anyInvalid ? reasons.join('; ') : e.flagReason,
      people: Array.isArray(e.people) ? e.people : [],
      tags: Array.isArray(e.tags) ? e.tags : [],
      photos: Array.isArray(e.photos) ? e.photos : [],
      recurrence: e.recurrence,
      attachments: Array.isArray(e.attachments) ? e.attachments : [],
    })
  })
}

function parseICS(text) {
  const events = []
  const blocks = text.split('BEGIN:VEVENT')

  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i].split('END:VEVENT')[0]
    if (!block) continue

    const getField = (name) => {
      const regex = new RegExp(`^${name}[;:](.*)$`, 'im')
      const match = block.match(regex)
      return match ? match[1].replace(/\\n/g, '\n').replace(/\\,/g, ',').trim() : null
    }

    const dtStart = getField('DTSTART')
    const dtEnd = getField('DTEND')
    const clean = (s) => s ? s.replace(/^[A-Z;=]+:/, '') : null
    const parseD = (s) => {
      const c = clean(s)
      if (!c) return null
      const m = c.match(/^(\d{4})(\d{2})(\d{2})/)
      if (!m) return null
      const iso = `${m[1]}-${m[2]}-${m[3]}`
      return isValidISODate(iso) ? iso : null
    }

    const dateStart = parseD(dtStart)
    if (!dateStart) continue

    const dateEnd = parseD(dtEnd)

    events.push(buildRawEvent({
      title: getField('SUMMARY') || 'Untitled',
      description: getField('DESCRIPTION'),
      dateStart,
      dateEnd: dateEnd && dateEnd !== dateStart ? dateEnd : null,
      dateRaw: dtStart || '',
      location: getField('LOCATION'),
    }))
  }

  return events
}

function parseMarkdown(text) {
  const events = []
  const lines = text.split('\n')
  const dateRegex = /(\d{4}(?:-\d{2}(?:-\d{2})?)?)/
  let current = null

  const flush = () => {
    if (current && current.title) {
      const dateMatch = current.dateRaw?.match(dateRegex)
      const dateStart = dateMatch?.[1] && isValidISODate(dateMatch[1]) ? dateMatch[1] : null
      events.push(buildRawEvent({
        title: current.title,
        description: current.description?.trim() || null,
        dateStart,
        dateRaw: current.dateRaw || '',
        datePrecision: dateStart?.length === 4 ? 'year' : dateStart?.length === 7 ? 'month' : 'day',
        flagged: !dateStart,
        flagReason: !dateStart ? 'Could not extract date' : null,
      }))
    }
    current = null
  }

  for (const line of lines) {
    const trimmed = line.trim()
    const headingMatch = trimmed.match(/^#{1,6}\s+(.+)$/)
    if (headingMatch) {
      flush()
      const content = headingMatch[1]
      const dateMatch = content.match(dateRegex)
      const title = content.replace(dateRegex, '').replace(/^[\s\-–—:]+|[\s\-–—:]+$/g, '').replace(/\*\*/g, '').trim()
      current = { title: title || content, dateRaw: dateMatch?.[0] || '', description: '' }
      continue
    }
    const listMatch = trimmed.match(/^[-*]\s+(?:\*\*)?(\d{4}(?:-\d{2}(?:-\d{2})?)?)(?:\*\*)?[\s:–—-]+(.+)$/)
    if (listMatch) {
      flush()
      current = { title: listMatch[2].replace(/\*\*/g, '').trim(), dateRaw: listMatch[1], description: '' }
      continue
    }
    if (current && trimmed && !trimmed.startsWith('#')) {
      const descLine = trimmed.replace(/^[-*]\s+/, '')
      current.description += (current.description ? '\n' : '') + descLine
    }
  }
  flush()
  return events
}

self.onmessage = (e) => {
  const { type, data } = e.data
  try {
    let events
    switch (type) {
      case 'csv': events = parseCSV(data); break
      case 'json': events = parseJSON(data); break
      case 'ics': events = parseICS(data); break
      case 'markdown': events = parseMarkdown(data); break
      default: throw new Error(`Unknown import type: ${type}`)
    }
    self.postMessage({ events })
  } catch (err) {
    self.postMessage({ events: [], error: err.message })
  }
}
