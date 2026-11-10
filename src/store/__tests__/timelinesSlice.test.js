import { describe, it, expect, vi, beforeEach } from 'vitest'

// dataService (used by both slices) and the photo-lifecycle helpers are mocked;
// we exercise the real slice + real eventsSlice history module.
vi.mock('@/utils/haptics', () => ({ haptic: vi.fn() }))
vi.mock('@/lib/photoStore', () => ({ revokeAllObjectUrls: vi.fn() }))
vi.mock('@/lib/photoSync', () => ({ clearRemotePhotoUrls: vi.fn() }))
vi.mock('@/lib/dataService', () => ({
  removeEventRemote: vi.fn(() => Promise.resolve()),
  loadLocalAsync: vi.fn(() => Promise.resolve(null)),
  migrateToIndexedDB: vi.fn(() => Promise.resolve()),
  clearPhotos: vi.fn(),
  checkRemoteConnection: vi.fn(() => Promise.resolve(false)),
  fetchRemoteData: vi.fn(() => Promise.resolve([])),
  syncTimelineRemote: vi.fn(() => Promise.resolve()),
  syncEventsRemote: vi.fn(() => Promise.resolve()),
  removeTimelineRemote: vi.fn(() => Promise.resolve()),
  renameTimeline: vi.fn(() => Promise.resolve()),
}))

import { createEventsSlice, resetHistory, switchHistory } from '../slices/eventsSlice'
import { createTimelinesSlice as makeTimelines } from '../slices/timelinesSlice'
import { checkRemoteConnection, fetchRemoteData, syncEventsRemote } from '@/lib/dataService'
import { markUnsynced, hasUnsyncedChanges } from '@/lib/syncState'

const ev = (id) => ({
  id, title: id, description: null, dateStart: '2020-01-01', dateEnd: null,
  dateRaw: null, datePrecision: 'day', flagged: false, flagReason: null,
  people: [], location: null, tags: [], photos: [], recurrence: null, attachments: [],
})

const tl = (id, events = []) => ({
  id, name: id, events, photoMap: {},
  sortOrder: 'date-asc', activeView: 'vertical',
  createdAt: '2020-01-01T00:00:00.000Z', updatedAt: '2020-01-01T00:00:00.000Z',
})

function makeStore(initial = {}) {
  const state = {
    events: initial.events || [],
    timelines: initial.timelines || [],
    activeTimelineId: initial.activeTimelineId ?? null,
    _hydrating: initial._hydrating ?? false,
    photoMap: {},
    photoOrder: [],
    customTags: [],
    sortOrder: 'date-asc',
    activeView: 'vertical',
    filters: { search: '', people: [], tags: [], dateFrom: '', dateTo: '' },
    canUndo: false,
    canRedo: false,
    selectedEventIds: [],
    showToast: vi.fn(),
  }
  const persist = vi.fn()
  const sync = vi.fn()
  const get = () => state
  const set = (u) => {
    if (typeof u === 'function') Object.assign(state, u(state))
    else Object.assign(state, u)
  }

  const eventsSlice = createEventsSlice(set, get, { persist, sync })
  const timelinesSlice = makeTimelines(set, get, { persist, sync })

  // Attach only action methods — skip each slice's initial-state keys so they
  // don't clobber the harness's initial state.
  const { events: _e, canUndo: _cu, canRedo: _cr, selectedEventIds: _si, ...eMethods } = eventsSlice
  const {
    timelines: _t, activeTimelineId: _a, _hydrating: _h,
    isSyncing: _is, syncError: _se, saveStatus: _ss, ...tMethods
  } = timelinesSlice
  Object.assign(state, eMethods, tMethods)

  return { state, get, set, persist, sync }
}

beforeEach(() => {
  resetHistory('tl_A')
  resetHistory('tl_B')
  resetHistory()
})

describe('loadTimeline', () => {
  it('round-trips undo history across a switch and back', async () => {
    const { state } = makeStore({
      timelines: [tl('tl_A', [ev('a1')]), tl('tl_B', [ev('b1')])],
      activeTimelineId: 'tl_A',
      events: [ev('a1')],
    })
    switchHistory('tl_A')

    // Mutate A — builds an undo entry on A's stack
    state.addEvent(ev('a2'))
    expect(state.canUndo).toBe(true)

    await state.loadTimeline('tl_B')
    expect(state.activeTimelineId).toBe('tl_B')
    expect(state.events.map((e) => e.id)).toEqual(['b1'])
    expect(state.canUndo).toBe(false) // B has no history

    await state.loadTimeline('tl_A')
    expect(state.canUndo).toBe(true) // A's history restored on switch-back
    state.undo()
    expect(state.events.map((e) => e.id)).toEqual(['a1']) // a2 reverted
  })

  it('resets filters when switching timelines', async () => {
    const { state } = makeStore({
      timelines: [tl('tl_A', [ev('a1')]), tl('tl_B', [ev('b1')])],
      activeTimelineId: 'tl_A',
      events: [ev('a1')],
      filters: { search: 'x', people: [], tags: [], dateFrom: '1950', dateTo: '1960' },
    })
    state.filters = { search: 'x', people: [], tags: [], dateFrom: '1950', dateTo: '1960' }
    await state.loadTimeline('tl_B')
    expect(state.filters).toEqual({ search: '', people: [], tags: [], dateFrom: '', dateTo: '' })
  })
})

describe('persistActiveTimeline guard (_hydrating)', () => {
  it('does not snapshot half-loaded events over the stored timeline during hydration', async () => {
    const { state } = makeStore({
      timelines: [tl('tl_A', [ev('orig')]), tl('tl_B', [ev('b1')])],
      activeTimelineId: 'tl_A',
      events: [ev('changed')], // an in-flight/partial state
      _hydrating: true,
    })

    await state.loadTimeline('tl_B')

    // tl_A must still hold its original snapshot, not the half-loaded events
    const a = state.timelines.find((t) => t.id === 'tl_A')
    expect(a.events.map((e) => e.id)).toEqual(['orig'])
  })
})

describe('deleteTimeline', () => {
  it('clears active state and restores it via the undo toast', () => {
    const { state } = makeStore({
      timelines: [tl('tl_A', [ev('a1')]), tl('tl_B', [ev('b1')])],
      activeTimelineId: 'tl_A',
      events: [ev('a1')],
      filters: { search: '', people: [], tags: [], dateFrom: '1950', dateTo: '' },
    })
    state.filters = { search: '', people: [], tags: [], dateFrom: '1950', dateTo: '' }

    state.deleteTimeline('tl_A')

    expect(state.timelines.map((t) => t.id)).toEqual(['tl_B'])
    expect(state.activeTimelineId).toBeNull()
    expect(state.events).toEqual([])
    expect(state.filters.dateFrom).toBe('') // filters reset

    // The delete toast exposes an Undo action that restores the timeline
    const toastOptions = state.showToast.mock.calls.at(-1)[1]
    toastOptions.onAction()
    expect(state.timelines.map((t) => t.id).sort()).toEqual(['tl_A', 'tl_B'])
  })
})

// ─── hydrateFromRemote: the cross-device merge ───────────

describe('hydrateFromRemote', () => {
  const remote = (id, events, updatedAt = '2030-01-01T00:00:00.000Z') => ({
    ...tl(id, events), name: `remote ${id}`, updatedAt,
  })

  beforeEach(() => {
    localStorage.removeItem('timeliner_unsynced')
    checkRemoteConnection.mockResolvedValue(true)
  })

  it('takes the remote copy of a synced timeline even if the local clock looks newer', async () => {
    const local = { ...tl('tl_A', [ev('old')]), updatedAt: '2099-01-01T00:00:00.000Z' }
    fetchRemoteData.mockResolvedValue([remote('tl_A', [ev('r1'), ev('r2')], '2020-06-01T00:00:00.000Z')])
    const { state, persist, sync } = makeStore({ timelines: [local], activeTimelineId: 'tl_A', events: [ev('old')] })

    await state.hydrateFromRemote()
    expect(state.timelines[0].name).toBe('remote tl_A')
    expect(state.events.map((e) => e.id)).toEqual(['r1', 'r2'])
    expect(persist).toHaveBeenCalled()
    expect(sync).not.toHaveBeenCalled()
  })

  it('keeps a timeline with unsynced local edits and pushes it up', async () => {
    markUnsynced('tl_A')
    fetchRemoteData.mockResolvedValue([remote('tl_A', [ev('stale')])])
    const { state, sync } = makeStore({ timelines: [tl('tl_A', [ev('mine')])], activeTimelineId: 'tl_A', events: [ev('mine'), ev('mine2')] })

    await state.hydrateFromRemote()
    expect(state.timelines[0].name).toBe('tl_A')
    expect(state.events.map((e) => e.id)).toEqual(['mine', 'mine2'])
    expect(sync).toHaveBeenCalledTimes(1)
    expect(hasUnsyncedChanges('tl_A')).toBe(true)
  })

  it('adds remote-only timelines and keeps local-only ones', async () => {
    fetchRemoteData.mockResolvedValue([remote('tl_R', [ev('r')])])
    const { state } = makeStore({ timelines: [tl('tl_L', [ev('l')])], activeTimelineId: 'tl_L', events: [ev('l')] })

    await state.hydrateFromRemote()
    expect(state.timelines.map((t) => t.id).sort()).toEqual(['tl_L', 'tl_R'])
    // The active local-only timeline keeps its live events
    expect(state.events.map((e) => e.id)).toEqual(['l'])
  })

  it('does not replace the active events with an empty remote list', async () => {
    fetchRemoteData.mockResolvedValue([remote('tl_A', [])])
    const { state } = makeStore({ timelines: [tl('tl_A', [ev('a')])], activeTimelineId: 'tl_A', events: [ev('a')] })

    await state.hydrateFromRemote()
    expect(state.events.map((e) => e.id)).toEqual(['a'])
  })

  it('fills empty local events from remote', async () => {
    fetchRemoteData.mockResolvedValue([remote('tl_A', [ev('r')])])
    const { state } = makeStore({ timelines: [tl('tl_A', [])], activeTimelineId: 'tl_A', events: [] })

    await state.hydrateFromRemote()
    expect(state.events.map((e) => e.id)).toEqual(['r'])
  })

  it('keeps the local photoMap when taking a remote timeline', async () => {
    fetchRemoteData.mockResolvedValue([remote('tl_A', [ev('r')])])
    const local = { ...tl('tl_A', [ev('a')]), photoMap: { 'p.jpg': 'blob:1' } }
    const { state } = makeStore({ timelines: [local], activeTimelineId: 'tl_A', events: [ev('a')] })

    await state.hydrateFromRemote()
    expect(state.timelines[0].photoMap).toEqual({ 'p.jpg': 'blob:1' })
  })

  it('changes nothing when offline or when remote has no data', async () => {
    const local = tl('tl_A', [ev('a')])
    checkRemoteConnection.mockResolvedValueOnce(false)
    const { state } = makeStore({ timelines: [local], activeTimelineId: 'tl_A', events: [ev('a')] })
    await state.hydrateFromRemote()
    expect(state.timelines).toEqual([local])

    fetchRemoteData.mockResolvedValueOnce(null)
    await state.hydrateFromRemote()
    expect(state.timelines).toEqual([local])
    expect(state.isSyncing).toBe(false)
  })

  it('marks a timeline unsynced while it is pushed on switch, and clears it after', async () => {
    const { state } = makeStore({
      timelines: [tl('tl_A', [ev('a')]), tl('tl_B', [ev('b')])],
      activeTimelineId: 'tl_A',
      events: [ev('a')],
    })
    let flaggedDuringPush = null
    syncEventsRemote.mockImplementationOnce(async () => { flaggedDuringPush = hasUnsyncedChanges('tl_A') })
    await state.loadTimeline('tl_B')
    expect(flaggedDuringPush).toBe(true)
    expect(hasUnsyncedChanges('tl_A')).toBe(false)
  })
})

// ─── First run: events with no timeline record ───────────

describe('ensureActiveTimeline', () => {
  beforeEach(() => {
    localStorage.removeItem('timeliner_unsynced')
    resetHistory()
  })

  it('creates an Untitled timeline on the first commit so it can sync', () => {
    const { state, sync } = makeStore({ timelines: [], activeTimelineId: null, events: [] })
    state.addEvent(ev('first'))
    expect(state.activeTimelineId).toMatch(/^tl_/)
    expect(state.timelines).toHaveLength(1)
    expect(state.timelines[0].name).toBe('Untitled timeline')
    expect(state.events.map((e) => e.id)).toEqual(['first'])
    expect(sync).toHaveBeenCalled()
  })

  it('keeps the undo history built before the timeline existed', () => {
    const { state } = makeStore({ timelines: [], activeTimelineId: null, events: [] })
    state.addEvent(ev('a'))
    state.addEvent(ev('b'))
    state.undo()
    expect(state.events.map((e) => e.id)).toEqual(['a'])
    state.undo()
    expect(state.events).toEqual([])
  })

  it('waits while hydrating and leaves an existing timeline alone', () => {
    const hydrating = makeStore({ activeTimelineId: null, _hydrating: true })
    expect(hydrating.state.ensureActiveTimeline()).toBeNull()
    expect(hydrating.state.timelines).toEqual([])

    const existing = makeStore({ timelines: [tl('tl_A')], activeTimelineId: 'tl_A' })
    expect(existing.state.ensureActiveTimeline()).toBe('tl_A')
    expect(existing.state.timelines).toHaveLength(1)
  })

  it('gives first-run events a timeline on startup and pushes them, even with an empty remote', async () => {
    checkRemoteConnection.mockResolvedValue(true)
    fetchRemoteData.mockResolvedValue(null)
    const { state, sync } = makeStore({ timelines: [], activeTimelineId: null, events: [ev('orphan')] })
    await state.hydrateFromRemote()
    expect(state.activeTimelineId).toMatch(/^tl_/)
    expect(hasUnsyncedChanges(state.activeTimelineId)).toBe(true)
    expect(sync).toHaveBeenCalledTimes(1)
  })
})
