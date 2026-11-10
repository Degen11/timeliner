import { describe, it, expect } from 'vitest'
import { parseImport, WORKER_PARSERS } from '../importWorker'
import { normalizeJSONEvents, normalizeICSEvents, normalizeMarkdownEvents } from '@/utils/importHelpers'

// Large files go to the worker, small ones parse on the main thread. Both
// must give the same events, so the worker has to run the shared parsers.
const stripIds = (events) => events.map(({ id: _id, ...rest }) => rest)

const ICS = [
  'BEGIN:VCALENDAR',
  'BEGIN:VEVENT',
  'SUMMARY:A very long',
  '  title that was folded',
  'DTSTART;VALUE=DATE:20240115',
  'DTEND;VALUE=DATE:20240120',
  'RRULE:FREQ=YEARLY',
  'END:VEVENT',
  'END:VCALENDAR',
].join('\n')

const MARKDOWN = '## 2024-01-15 to 2024-01-20: Trip\n\nWent north.\n\n## 2020 - Moved'

const JSON_TEXT = JSON.stringify({
  events: [
    { title: 'Not a leap year', dateStart: '2023-02-29', location: 'Oslo' },
    { title: 'Fine', dateStart: '2024-02-29' },
  ],
})

describe('importWorker', () => {
  it('handles json, ics and markdown only (CSV parses on the main thread)', () => {
    expect(Object.keys(WORKER_PARSERS).sort()).toEqual(['ics', 'json', 'markdown'])
    expect(() => parseImport('csv', 'a,b')).toThrow(/Unknown import type/)
  })

  it('matches the main-thread ICS parser (unfolding, all-day DTEND, RRULE)', () => {
    const fromWorker = parseImport('ics', ICS)
    expect(stripIds(fromWorker)).toEqual(stripIds(normalizeICSEvents(ICS)))
    expect(fromWorker[0].title).toBe('A very long title that was folded')
    expect(fromWorker[0].dateEnd).toBe('2024-01-19')
  })

  it('matches the main-thread Markdown parser (no date range leaking into titles)', () => {
    const fromWorker = parseImport('markdown', MARKDOWN)
    expect(stripIds(fromWorker)).toEqual(stripIds(normalizeMarkdownEvents(MARKDOWN)))
    expect(fromWorker[0].title).not.toMatch(/2024-01-20/)
  })

  it('matches the main-thread JSON parser, including calendar date checks', () => {
    const fromWorker = parseImport('json', JSON_TEXT)
    expect(stripIds(fromWorker)).toEqual(stripIds(normalizeJSONEvents(JSON.parse(JSON_TEXT))))
    expect(fromWorker[0].dateStart).toBeNull()
    expect(fromWorker[0].flagged).toBe(true)
    expect(fromWorker[0].location).toBe('Oslo')
    expect(fromWorker[1].dateStart).toBe('2024-02-29')
  })
})
