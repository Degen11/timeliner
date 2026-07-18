import { describe, it, expect, vi, beforeEach } from 'vitest'

// Capture the blob passed to saveAs instead of touching the DOM/filesystem.
let savedBlob = null
let savedName = null
vi.mock('file-saver', () => ({
  saveAs: (blob, name) => {
    savedBlob = blob
    savedName = name
  },
}))
// papaparse is imported at module top; the stub captures unparse's arguments
// so we can assert the CSV shape without a real serializer.
let unparseArgs = null
vi.mock('papaparse', () => ({
  default: {
    unparse: (rows, opts) => {
      unparseArgs = { rows, opts }
      return 'csv'
    },
  },
}))

import { exportICS, exportCSV } from '../exportHelpers'

async function blobText(blob) {
  // jsdom Blob doesn't implement .text() reliably across versions.
  return typeof blob.text === 'function' ? blob.text() : Promise.resolve(String(blob))
}

describe('exportICS', () => {
  beforeEach(() => {
    savedBlob = null
    savedName = null
  })

  it('emits a VCALENDAR with one VEVENT per dated event', async () => {
    exportICS([
      { id: 'evt_1', title: 'Founded', dateStart: '2001-05-10', description: 'The start', location: 'Berlin' },
    ])
    const text = await blobText(savedBlob)
    expect(savedName).toBe('timeliner-export.ics')
    expect(text).toContain('BEGIN:VCALENDAR')
    expect(text).toContain('END:VCALENDAR')
    expect(text).toContain('BEGIN:VEVENT')
    expect(text).toContain('SUMMARY:Founded')
    expect(text).toContain('DESCRIPTION:The start')
    expect(text).toContain('LOCATION:Berlin')
    expect(text).toContain('DTSTART;VALUE=DATE:20010510')
    // DTEND is exclusive → the day after the (single-day) start
    expect(text).toContain('DTEND;VALUE=DATE:20010511')
  })

  it('coerces partial dates and skips undated events', async () => {
    exportICS([
      { id: 'evt_y', title: 'Year only', dateStart: '1999' },
      { id: 'evt_none', title: 'No date', dateStart: null },
    ])
    const text = await blobText(savedBlob)
    expect(text).toContain('DTSTART;VALUE=DATE:19990101')
    expect(text).toContain('DTEND;VALUE=DATE:19990102')
    expect(text).not.toContain('No date')
  })

  it('rolls the end date across a month boundary correctly', async () => {
    exportICS([{ id: 'evt_end', title: 'Range', dateStart: '2020-01-01', dateEnd: '2020-01-31' }])
    const text = await blobText(savedBlob)
    expect(text).toContain('DTEND;VALUE=DATE:20200201')
  })

  it('escapes commas and semicolons in text fields', async () => {
    exportICS([{ id: 'evt_esc', title: 'A, B; C', dateStart: '2020-01-01' }])
    const text = await blobText(savedBlob)
    expect(text).toContain('SUMMARY:A\\, B\\; C')
  })
})

describe('exportCSV', () => {
  it('includes Location as a column and populates it', () => {
    exportICSNoop()
    exportCSV([{ title: 'X', dateStart: '2020-01-01', location: 'Rome' }])
    expect(unparseArgs.opts.columns).toContain('Location')
    expect(unparseArgs.rows[0].Location).toBe('Rome')
  })
})

// exportICS mutates savedBlob; reset it so the CSV test's state is clean.
function exportICSNoop() {
  unparseArgs = null
}
