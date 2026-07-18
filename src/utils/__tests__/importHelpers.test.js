import { describe, it, expect } from 'vitest'
import { normalizeCSVEvent, normalizeJSONEvents, normalizeICSEvents, normalizeMarkdownEvents } from '../importHelpers'

describe('normalizeCSVEvent', () => {
  it('creates a valid event from a CSV row', () => {
    const event = normalizeCSVEvent({
      title: 'Born in Wisconsin',
      dateStart: '1928-01-01',
      description: 'Grandfather was born',
      datePrecision: 'year',
    })
    expect(event.id).toMatch(/^evt_/)
    expect(event.title).toBe('Born in Wisconsin')
    expect(event.dateStart).toBe('1928-01-01')
    expect(event.datePrecision).toBe('year')
    expect(event.flagged).toBe(false)
    expect(event.people).toEqual([])
    expect(event.tags).toEqual([])
    expect(event.photos).toEqual([])
  })

  it('falls back to "date" field when "dateStart" is missing', () => {
    const event = normalizeCSVEvent({ title: 'Test', date: '2024-06-15' })
    expect(event.dateStart).toBe('2024-06-15')
  })

  it('reads the location column', () => {
    const event = normalizeCSVEvent({ title: 'Test', dateStart: '2024-01-01', location: 'Paris, France' })
    expect(event.location).toBe('Paris, France')
  })

  it('defaults location to null when absent', () => {
    const event = normalizeCSVEvent({ title: 'Test', dateStart: '2024-01-01' })
    expect(event.location).toBeNull()
  })

  it('flags invalid dates and nulls them out', () => {
    const event = normalizeCSVEvent({
      title: 'Bad date',
      dateStart: 'not-a-date',
    })
    expect(event.dateStart).toBeNull()
    expect(event.flagged).toBe(true)
    expect(event.flagReason).toContain('Invalid start date')
  })

  it('parses semicolon-separated people and tags', () => {
    const event = normalizeCSVEvent({
      title: 'Family event',
      dateStart: '2024-01-01',
      people: 'Alice; Bob; Charlie',
      tags: 'family; travel',
    })
    expect(event.people).toEqual(['Alice', 'Bob', 'Charlie'])
    expect(event.tags).toEqual(['family', 'travel'])
  })

  it('defaults title to Untitled', () => {
    const event = normalizeCSVEvent({ dateStart: '2024-01-01' })
    expect(event.title).toBe('Untitled')
  })

  it('defaults datePrecision to day', () => {
    const event = normalizeCSVEvent({ title: 'Test', dateStart: '2024-01-01' })
    expect(event.datePrecision).toBe('day')
  })
})

describe('normalizeJSONEvents', () => {
  it('normalizes an array of events', () => {
    const events = normalizeJSONEvents([
      { title: 'Event 1', dateStart: '2024-01-01' },
      { title: 'Event 2', dateStart: '2024-06-15' },
    ])
    expect(events).toHaveLength(2)
    expect(events[0].title).toBe('Event 1')
    expect(events[1].title).toBe('Event 2')
  })

  it('handles { events: [...] } wrapper', () => {
    const events = normalizeJSONEvents({
      events: [{ title: 'Wrapped', dateStart: '2024-01-01' }],
    })
    expect(events).toHaveLength(1)
    expect(events[0].title).toBe('Wrapped')
  })

  it('returns empty array for non-array input', () => {
    expect(normalizeJSONEvents('not an array')).toEqual([])
    expect(normalizeJSONEvents(42)).toEqual([])
    expect(normalizeJSONEvents(null)).toEqual([])
  })

  it('preserves existing IDs', () => {
    const events = normalizeJSONEvents([
      { id: 'evt_custom123', title: 'Custom ID', dateStart: '2024-01-01' },
    ])
    expect(events[0].id).toBe('evt_custom123')
  })

  it('flags invalid dates in JSON events', () => {
    const events = normalizeJSONEvents([
      { title: 'Bad', dateStart: 'invalid', dateEnd: 'also-bad' },
    ])
    expect(events[0].flagged).toBe(true)
    expect(events[0].dateStart).toBeNull()
    expect(events[0].dateEnd).toBeNull()
  })
})

describe('normalizeICSEvents', () => {
  const wrap = (lines) => `BEGIN:VCALENDAR\nBEGIN:VEVENT\n${lines}\nEND:VEVENT\nEND:VCALENDAR`

  it('treats a single all-day event (exclusive DTEND) as having no range', () => {
    const ics = wrap('SUMMARY:Holiday\nDTSTART;VALUE=DATE:20240115\nDTEND;VALUE=DATE:20240116')
    const [e] = normalizeICSEvents(ics)
    expect(e.dateStart).toBe('2024-01-15')
    // 20240116 is exclusive → real end is the 15th → collapses to no range
    expect(e.dateEnd).toBeNull()
  })

  it('subtracts a day from a multi-day all-day DTEND', () => {
    const ics = wrap('SUMMARY:Trip\nDTSTART;VALUE=DATE:20240115\nDTEND;VALUE=DATE:20240120')
    const [e] = normalizeICSEvents(ics)
    expect(e.dateStart).toBe('2024-01-15')
    expect(e.dateEnd).toBe('2024-01-19')
  })

  it('does not adjust DTEND for timed (non-all-day) events', () => {
    const ics = wrap('SUMMARY:Meeting\nDTSTART:20240115T090000Z\nDTEND:20240115T100000Z')
    const [e] = normalizeICSEvents(ics)
    expect(e.dateStart).toBe('2024-01-15')
    expect(e.dateEnd).toBeNull() // same day → no range
  })

  it('unfolds folded SUMMARY lines', () => {
    const ics = wrap('SUMMARY:A very long\n  title that was folded\nDTSTART;VALUE=DATE:20240115')
    const [e] = normalizeICSEvents(ics)
    expect(e.title).toBe('A very long title that was folded')
  })
})

describe('normalizeMarkdownEvents', () => {
  it('does not leak the end of a date range into the title', () => {
    const [e] = normalizeMarkdownEvents('## 2024-01-15 to 2024-01-20: Trip')
    expect(e.dateStart).toBe('2024-01-15')
    expect(e.title).not.toMatch(/2024-01-20/)
  })

  it('extracts a year-only heading date with year precision', () => {
    const [e] = normalizeMarkdownEvents('## 2024 - Something happened')
    expect(e.dateStart).toBe('2024')
    expect(e.datePrecision).toBe('year')
    expect(e.title).toBe('Something happened')
  })
})
