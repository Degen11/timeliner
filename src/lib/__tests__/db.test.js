import { describe, it, expect, vi, beforeEach } from 'vitest'

// Fake Supabase client: each from(table) call returns a chainable builder
// that records its calls and resolves to whatever the test queued for that
// table and operation.
const calls = []
let responses
const respond = (table, op) => {
  const queue = responses[`${table}.${op}`] || []
  return queue.length > 0 ? queue.shift() : { data: [], error: null }
}
function builder(table) {
  const entry = { table, op: 'select', chain: [] }
  calls.push(entry)
  const b = {
    then: (resolve, reject) => Promise.resolve(respond(table, entry.op)).then(resolve, reject),
  }
  for (const m of ['select', 'upsert', 'delete', 'update', 'insert', 'eq', 'lt', 'in', 'order', 'limit']) {
    b[m] = (...args) => {
      if (['upsert', 'delete', 'update', 'insert'].includes(m)) entry.op = m
      entry.chain.push([m, ...args])
      return b
    }
  }
  return b
}

vi.mock('../supabase', () => ({
  supabase: { from: (table) => builder(table) },
  getDeviceId: () => 'device-1',
}))

import { syncEvents, loadInitialData, mapEventToRow, mapRowToEvent } from '../db'

const ev = (id, extra = {}) => ({
  id, title: id, description: null, dateStart: '2020', dateEnd: null, dateRaw: null,
  datePrecision: 'year', flagged: false, flagReason: null, people: [], tags: [],
  photos: [], location: null, recurrence: null, attachments: [], ...extra,
})

beforeEach(() => {
  calls.length = 0
  responses = {}
})

describe('event row mapping', () => {
  it('round-trips recurrence, attachments and location', () => {
    const event = ev('e1', {
      location: 'Lisbon',
      recurrence: { type: 'yearly', interval: 1, endDate: null },
      attachments: [{ type: 'link', url: 'https://example.com', label: 'Site' }],
    })
    const row = mapEventToRow(event, 'tl_1', 3)
    expect(row.recurrence).toEqual(event.recurrence)
    expect(row.attachments).toEqual(event.attachments)
    expect(row.sort_index).toBe(3)
    expect(mapRowToEvent({ ...row, created_at: 'x' })).toEqual(event)
  })

  it('defaults rows from before the columns existed', () => {
    const event = mapRowToEvent({ id: 'e1', title: 't', people: null, tags: null, photos: null })
    expect(event.recurrence).toBeNull()
    expect(event.attachments).toEqual([])
    expect(event.location).toBeNull()
  })
})

describe('syncEvents', () => {
  it('upserts every local event, then deletes only older remote events missing locally', async () => {
    responses['events.select'] = [{
      data: [{ id: 'keep' }, { id: 'gone' }],
      error: null,
    }]
    await syncEvents('tl_1', [ev('keep'), ev('new')])

    const upsert = calls.find((c) => c.op === 'upsert')
    expect(upsert.chain[0][1].map((r) => r.id)).toEqual(['keep', 'new'])

    // The sweep only looks at rows created before this sync started, so an
    // event another device added mid-sync is never deleted
    const sweep = calls.find((c) => c.op === 'select')
    const lt = sweep.chain.find(([m]) => m === 'lt')
    expect(lt[1]).toBe('created_at')
    expect(Date.parse(lt[2])).not.toBeNaN()

    const del = calls.find((c) => c.op === 'delete')
    expect(del.chain).toContainEqual(['in', 'id', ['gone']])
    expect(del.chain).toContainEqual(['eq', 'timeline_id', 'tl_1'])
  })

  it('does not delete anything when every older remote event still exists locally', async () => {
    responses['events.select'] = [{ data: [{ id: 'a' }], error: null }]
    await syncEvents('tl_1', [ev('a')])
    expect(calls.some((c) => c.op === 'delete')).toBe(false)
  })

  it('throws (and deletes nothing) when the upsert fails', async () => {
    responses['events.upsert'] = [{ error: { message: 'boom' } }]
    await expect(syncEvents('tl_1', [ev('a')])).rejects.toThrow(/upsert: boom/)
    expect(calls.some((c) => c.op === 'delete')).toBe(false)
  })

  it('throws (and deletes nothing) when the sweep query fails', async () => {
    responses['events.select'] = [{ data: null, error: { message: 'timeout' } }]
    await expect(syncEvents('tl_1', [ev('a')])).rejects.toThrow(/fetch-for-delete: timeout/)
    expect(calls.some((c) => c.op === 'delete')).toBe(false)
  })
})

describe('loadInitialData', () => {
  const timelineRow = { id: 'tl_1', name: 'One', sort_order: 'date-asc', active_view: 'vertical', created_at: 'c', updated_at: 'u' }

  it('groups events by timeline and maps them', async () => {
    responses['timelines.select'] = [{ data: [timelineRow, { ...timelineRow, id: 'tl_2' }], error: null }]
    responses['events.select'] = [{
      data: [
        { ...mapEventToRow(ev('a'), 'tl_1', 0) },
        { ...mapEventToRow(ev('b', { attachments: [{ type: 'link', url: 'https://x.y' }] }), 'tl_2', 0) },
      ],
      error: null,
    }]
    const result = await loadInitialData()
    expect(result.map((t) => t.id)).toEqual(['tl_1', 'tl_2'])
    expect(result[0].events.map((e) => e.id)).toEqual(['a'])
    expect(result[1].events[0].attachments).toEqual([{ type: 'link', url: 'https://x.y' }])
  })

  it('returns null instead of empty timelines when the events query fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    responses['timelines.select'] = [{ data: [timelineRow], error: null }]
    responses['events.select'] = [{ data: null, error: { message: 'rls' } }]
    expect(await loadInitialData()).toBeNull()
    errorSpy.mockRestore()
  })

  it('returns null when there are no remote timelines', async () => {
    responses['timelines.select'] = [{ data: [], error: null }]
    expect(await loadInitialData()).toBeNull()
  })
})
