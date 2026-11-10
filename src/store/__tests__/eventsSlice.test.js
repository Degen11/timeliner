import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/utils/haptics', () => ({ haptic: vi.fn() }))
vi.mock('@/lib/dataService', () => ({ removeEventRemote: vi.fn(() => Promise.resolve()) }))

import {
  commitEvents,
  switchHistory,
  resetHistory,
  historyFlags,
  createEventsSlice,
  flushPendingDeletes,
} from '../slices/eventsSlice'
import { removeEventRemote } from '@/lib/dataService'
import { UNDO_WINDOW_MS } from '@/utils/constants'

// ─── Store factory ────────────────────────────────────────
// Creates a minimal fake Zustand-style store wired to createEventsSlice.
// All slice methods are attached to `state` so that get().methodName works.
//
// IMPORTANT: createEventsSlice returns `{ events: [], canUndo: false, ... }` as
// initial state alongside the action methods. We must NOT let those initial-state
// keys overwrite the caller's initialEvents, so we destructure them out before
// merging with Object.assign.

function makeStore(initialEvents = []) {
  const state = {
    events: [...initialEvents],
    activeTimelineId: 'tl_test',
    canUndo: false,
    canRedo: false,
    showToast: vi.fn(),
    _setSaveStatus: vi.fn(),
    selectedEventIds: [],
  }

  const persist = vi.fn()
  const sync = vi.fn()
  const get = () => state
  const set = (updates) => {
    if (typeof updates === 'function') Object.assign(state, updates(state))
    else Object.assign(state, updates)
  }

  const slice = createEventsSlice(set, get, { persist, sync })
  // Attach only the action methods — skip the initial state values so we don't
  // overwrite our initialEvents / canUndo / canRedo / selectedEventIds.
  const {
    events: _e,
    canUndo: _cu,
    canRedo: _cr,
    selectedEventIds: _si,
    ...methods
  } = slice
  Object.assign(state, methods)

  return { state, get, persist, sync }
}

const makeEvent = (overrides = {}) => ({
  id: `evt_${Math.random().toString(36).slice(2, 8)}`,
  title: 'Test Event',
  description: null,
  dateStart: '2020-01-01',
  dateEnd: null,
  dateRaw: null,
  datePrecision: 'day',
  flagged: false,
  flagReason: null,
  people: [],
  tags: [],
  photos: [],
  ...overrides,
})

// ─── commitEvents ─────────────────────────────────────────

describe('commitEvents', () => {
  beforeEach(() => {
    resetHistory('tl_test')
    resetHistory('tl_other')
    resetHistory()
  })

  it('applies the transformer and updates state synchronously', () => {
    const { state, persist, sync } = makeStore([makeEvent({ id: 'e1', title: 'Original' })])

    commitEvents(
      () => state,
      (u) => Object.assign(state, u),
      (events) => [...events, makeEvent({ id: 'e2', title: 'Added' })],
      { persist, sync },
    )

    expect(state.events).toHaveLength(2)
    expect(state.events[1].title).toBe('Added')
    expect(persist).toHaveBeenCalled()
    expect(sync).toHaveBeenCalled()
  })

  it('sets canUndo to true after first commit', () => {
    const { state, persist, sync } = makeStore([makeEvent()])

    commitEvents(() => state, (u) => Object.assign(state, u), (e) => e, { persist, sync })

    expect(state.canUndo).toBe(true)
  })

  it('processes two sequential commits and drains each independently', () => {
    const { state, persist, sync } = makeStore([makeEvent({ id: 'e1' })])
    const get = () => state
    const set = (u) => Object.assign(state, u)

    commitEvents(get, set, (e) => [...e, makeEvent({ id: 'e2' })], { persist, sync })
    commitEvents(get, set, (e) => [...e, makeEvent({ id: 'e3' })], { persist, sync })

    expect(state.events).toHaveLength(3)
    expect(persist).toHaveBeenCalledTimes(2)
  })
})

// ─── addEvent / deleteEvent ───────────────────────────────

describe('addEvent', () => {
  beforeEach(() => {
    resetHistory('tl_test')
    resetHistory('tl_other')
    resetHistory()
  })

  it('appends the event to the events array', () => {
    const { state } = makeStore([])
    state.addEvent(makeEvent({ id: 'new1', title: 'New Event' }))
    expect(state.events).toHaveLength(1)
    expect(state.events[0].title).toBe('New Event')
  })
})

describe('updateEvent', () => {
  beforeEach(() => {
    resetHistory('tl_test')
    resetHistory('tl_other')
    resetHistory()
  })

  it('merges changes into the matching event', () => {
    const { state } = makeStore([makeEvent({ id: 'u1', title: 'Before' })])
    state.updateEvent('u1', { title: 'After', description: 'Updated' })
    expect(state.events[0].title).toBe('After')
    expect(state.events[0].description).toBe('Updated')
  })

  it('does not affect other events', () => {
    const { state } = makeStore([makeEvent({ id: 'a' }), makeEvent({ id: 'b', title: 'B' })])
    state.updateEvent('a', { title: 'A updated' })
    expect(state.events.find((e) => e.id === 'b').title).toBe('B')
  })
})

describe('deleteEvent', () => {
  beforeEach(() => {
    resetHistory('tl_test')
    resetHistory('tl_other')
    resetHistory()
  })

  it('removes the event from the array', () => {
    const { state } = makeStore([makeEvent({ id: 'd1' }), makeEvent({ id: 'd2' })])
    state.deleteEvent('d1')
    expect(state.events).toHaveLength(1)
    expect(state.events[0].id).toBe('d2')
  })

  it('defers the remote delete until the undo window elapses, then fires it once', () => {
    vi.useFakeTimers()
    removeEventRemote.mockClear()
    const { state } = makeStore([makeEvent({ id: 'd1' })])

    state.deleteEvent('d1')
    // The remote call is deferred — nothing sent during the undo window
    expect(removeEventRemote).not.toHaveBeenCalled()

    vi.advanceTimersByTime(UNDO_WINDOW_MS)
    expect(removeEventRemote).toHaveBeenCalledTimes(1)
    expect(removeEventRemote).toHaveBeenCalledWith('tl_test', 'd1')

    vi.useRealTimers()
  })

  it('cancels the remote delete and restores the event when undone within the window', () => {
    vi.useFakeTimers()
    removeEventRemote.mockClear()
    const { state } = makeStore([makeEvent({ id: 'd1' }), makeEvent({ id: 'd2' })])

    state.deleteEvent('d1')
    // Invoke the undo toast's action before the window elapses
    const toastOptions = state.showToast.mock.calls.at(-1)[1]
    toastOptions.onAction()

    vi.advanceTimersByTime(UNDO_WINDOW_MS)
    expect(removeEventRemote).not.toHaveBeenCalled()
    expect(state.events.map((e) => e.id)).toContain('d1')

    vi.useRealTimers()
  })

  it('toast Undo restores the deleted event without reverting later edits', () => {
    vi.useFakeTimers()
    removeEventRemote.mockClear()
    const { state } = makeStore([
      makeEvent({ id: 'd1' }),
      makeEvent({ id: 'd2' }),
      makeEvent({ id: 'd3', title: 'Old' }),
    ])

    state.deleteEvent('d2')
    const toastOptions = state.showToast.mock.calls.at(-1)[1]
    state.updateEvent('d3', { title: 'New' })

    toastOptions.onAction()

    expect(state.events.map((e) => e.id)).toEqual(['d1', 'd2', 'd3'])
    expect(state.events.find((e) => e.id === 'd3').title).toBe('New')
    vi.advanceTimersByTime(UNDO_WINDOW_MS)
    expect(removeEventRemote).not.toHaveBeenCalled()

    vi.useRealTimers()
  })

  it('toast Undo on another timeline leaves the delete in place', () => {
    vi.useFakeTimers()
    removeEventRemote.mockClear()
    const { state } = makeStore([makeEvent({ id: 'd1' })])

    state.deleteEvent('d1')
    const toastOptions = state.showToast.mock.calls.at(-1)[1]
    state.activeTimelineId = 'tl_other'
    toastOptions.onAction()

    vi.advanceTimersByTime(UNDO_WINDOW_MS)
    expect(removeEventRemote).toHaveBeenCalledWith('tl_test', 'd1')

    vi.useRealTimers()
  })
})

// ─── Undo / Redo ─────────────────────────────────────────

describe('undo / redo', () => {
  beforeEach(() => {
    resetHistory('tl_test')
    resetHistory('tl_other')
    resetHistory()
  })

  it('undo reverts to the pre-commit state', () => {
    const { state } = makeStore([makeEvent({ id: 'orig', title: 'Original' })])
    state.addEvent(makeEvent({ id: 'added', title: 'Added' }))

    expect(state.events).toHaveLength(2)
    state.undo()
    expect(state.events).toHaveLength(1)
    expect(state.events[0].title).toBe('Original')
  })

  it('redo re-applies the reverted commit', () => {
    const { state } = makeStore([makeEvent({ id: 'base' })])
    state.addEvent(makeEvent({ id: 'second', title: 'Second' }))
    state.undo()
    expect(state.events).toHaveLength(1)

    state.redo()
    expect(state.events).toHaveLength(2)
    expect(state.events[1].title).toBe('Second')
  })

  it('canUndo is false before any commit', () => {
    const { state } = makeStore([makeEvent()])
    expect(state.canUndo).toBe(false)
  })

  it('canUndo becomes true after a commit', () => {
    const { state } = makeStore([makeEvent()])
    state.addEvent(makeEvent())
    expect(state.canUndo).toBe(true)
  })

  it('canRedo becomes true after undo and false after redo', () => {
    const { state } = makeStore([makeEvent()])
    state.addEvent(makeEvent())
    state.undo()
    expect(state.canRedo).toBe(true)
    state.redo()
    expect(state.canRedo).toBe(false)
  })

  it('redo stack is cleared on new commit after undo', () => {
    const { state } = makeStore([makeEvent({ id: 'a' })])
    state.addEvent(makeEvent({ id: 'b' }))
    state.undo()
    // New commit clears the redo stack
    state.addEvent(makeEvent({ id: 'c', title: 'New Branch' }))
    expect(state.canRedo).toBe(false)
  })

  it('undo is a no-op when stack is empty', () => {
    const { state } = makeStore([makeEvent()])
    expect(() => state.undo()).not.toThrow()
    expect(state.events).toHaveLength(1)
  })

  it('redo is a no-op when stack is empty', () => {
    const { state } = makeStore([makeEvent()])
    expect(() => state.redo()).not.toThrow()
  })

  it('undo calls persist with the reverted events', () => {
    const { state, persist } = makeStore([makeEvent({ id: 'p1' })])
    state.addEvent(makeEvent({ id: 'p2' }))
    persist.mockClear()
    state.undo()
    expect(persist).toHaveBeenCalledOnce()
    const persistedState = persist.mock.calls[0][0]
    expect(persistedState.events).toHaveLength(1)
  })

  it('multiple undos walk back through history', () => {
    const { state } = makeStore([])
    state.addEvent(makeEvent({ id: 'a', title: 'A' }))
    state.addEvent(makeEvent({ id: 'b', title: 'B' }))
    state.addEvent(makeEvent({ id: 'c', title: 'C' }))

    state.undo()
    expect(state.events).toHaveLength(2)
    state.undo()
    expect(state.events).toHaveLength(1)
    state.undo()
    expect(state.events).toHaveLength(0)
  })
})

// ─── switchHistory / resetHistory ────────────────────────

describe('switchHistory', () => {
  beforeEach(() => {
    resetHistory('tl_test')
    resetHistory('tl_other')
    resetHistory('tl_brand_new')
    resetHistory()
  })

  it('saves and restores undo stack when switching timelines', () => {
    const { state } = makeStore([makeEvent({ id: 'x' })])

    // Activate this timeline in the history module so its stacks are tracked
    switchHistory('tl_test')

    // Build some history on tl_test
    state.addEvent(makeEvent({ id: 'y' }))
    expect(state.canUndo).toBe(true)

    // Switch to a different timeline — tl_test stacks are now saved in historyByTimeline
    switchHistory('tl_other')

    // Switch back — the tl_test stacks are restored
    switchHistory('tl_test')
    state.undo()
    expect(state.events).toHaveLength(1)
  })

  it('starts with empty stacks for a brand-new timeline', () => {
    // Switch to a timeline that has never been used → fresh stacks
    switchHistory('tl_brand_new')
    const { state } = makeStore([makeEvent()])
    // No history exists for tl_brand_new — undo is a no-op
    state.undo()
    expect(state.events).toHaveLength(1)
  })

  it('historyFlags reflects the restored stack after switching back', () => {
    const { state } = makeStore([makeEvent({ id: 'x' })])
    switchHistory('tl_test')
    state.addEvent(makeEvent({ id: 'y' }))

    // Away to another timeline: its (empty) stacks mean no undo available.
    switchHistory('tl_other')
    expect(historyFlags()).toEqual({ canUndo: false, canRedo: false })

    // Back to tl_test: the restored stack should re-enable undo.
    switchHistory('tl_test')
    expect(historyFlags().canUndo).toBe(true)
  })
})

describe('resetHistory', () => {
  beforeEach(() => {
    resetHistory('tl_test')
    resetHistory('tl_other')
    resetHistory()
  })

  it('clears active undo/redo stacks so undo becomes a no-op', () => {
    const { state } = makeStore([makeEvent()])
    state.addEvent(makeEvent())
    expect(state.canUndo).toBe(true)

    // resetHistory() with no args always clears the active stacks
    resetHistory()
    state.undo() // no-op — stacks are empty
    expect(state.events).toHaveLength(2) // events unchanged, only history cleared
  })
})

// ─── appendEvents (deduplication) ────────────────────────

describe('appendEvents', () => {
  beforeEach(() => {
    resetHistory('tl_test')
    resetHistory('tl_other')
    resetHistory()
  })

  it('adds unique events', () => {
    const { state } = makeStore([])
    const result = state.appendEvents([makeEvent({ id: 'n1', title: 'New' })])
    expect(state.events).toHaveLength(1)
    expect(result.added).toBe(1)
    expect(result.duplicatesSkipped).toBe(0)
  })

  it('skips events with an id already in the store', () => {
    const existing = makeEvent({ id: 'dup' })
    const { state } = makeStore([existing])
    const result = state.appendEvents([makeEvent({ id: 'dup' })])
    expect(state.events).toHaveLength(1)
    expect(result.added).toBe(0)
  })
})

// ─── batchAddTag / batchRemoveTag ─────────────────────────

describe('batch tag operations', () => {
  beforeEach(() => {
    resetHistory('tl_test')
    resetHistory('tl_other')
    resetHistory()
  })

  it('batchAddTag adds a tag to all selected events', () => {
    const e1 = makeEvent({ id: 's1', tags: [] })
    const e2 = makeEvent({ id: 's2', tags: [] })
    const { state } = makeStore([e1, e2])
    state.selectedEventIds = ['s1', 's2']
    state.batchAddTag('career')
    expect(state.events.every((e) => e.tags.includes('career'))).toBe(true)
  })

  it('batchRemoveTag removes a tag from selected events', () => {
    const e1 = makeEvent({ id: 'r1', tags: ['career', 'family'] })
    const { state } = makeStore([e1])
    state.selectedEventIds = ['r1']
    state.batchRemoveTag('career')
    expect(state.events[0].tags).toEqual(['family'])
  })

  it('batchAddTag deduplicates tags', () => {
    const e1 = makeEvent({ id: 't1', tags: ['career'] })
    const { state } = makeStore([e1])
    state.selectedEventIds = ['t1']
    state.batchAddTag('career')
    expect(state.events[0].tags).toEqual(['career'])
  })

  it('batchAddTag is a no-op when selection is empty', () => {
    const { state, persist } = makeStore([makeEvent()])
    state.selectedEventIds = []
    persist.mockClear()
    state.batchAddTag('career')
    expect(persist).not.toHaveBeenCalled()
  })
})

// ─── mergeEvents ──────────────────────────────────────────

describe('mergeEvents', () => {
  beforeEach(() => {
    resetHistory('tl_test')
    resetHistory('tl_other')
    resetHistory()
  })

  it('unions people, tags, and photos and deletes the source', () => {
    const { state } = makeStore([
      makeEvent({ id: 'a', title: 'Keep', people: ['Ann'], tags: ['family'], photos: ['p1.jpg'] }),
      makeEvent({ id: 'b', title: 'Dup', people: ['Bob'], tags: ['family', 'travel'], photos: ['p2.jpg'] }),
    ])
    state.mergeEvents('b', 'a')
    expect(state.events).toHaveLength(1)
    const merged = state.events[0]
    expect(merged.id).toBe('a')
    expect(merged.title).toBe('Keep')
    expect(merged.people.sort()).toEqual(['Ann', 'Bob'])
    expect(merged.tags.sort()).toEqual(['family', 'travel'])
    expect(merged.photos.sort()).toEqual(['p1.jpg', 'p2.jpg'])
  })

  it('does not double an identical description', () => {
    const { state } = makeStore([
      makeEvent({ id: 'a', description: 'Same text' }),
      makeEvent({ id: 'b', description: 'Same text' }),
    ])
    state.mergeEvents('b', 'a')
    expect(state.events[0].description).toBe('Same text')
  })

  it('joins two distinct descriptions', () => {
    const { state } = makeStore([
      makeEvent({ id: 'a', description: 'First' }),
      makeEvent({ id: 'b', description: 'Second' }),
    ])
    state.mergeEvents('b', 'a')
    expect(state.events[0].description).toBe('First\n\nSecond')
  })

  it('keeps the earliest start and spans to the later date', () => {
    const { state } = makeStore([
      makeEvent({ id: 'a', dateStart: '1990-01-01' }),
      makeEvent({ id: 'b', dateStart: '1995-06-01' }),
    ])
    state.mergeEvents('b', 'a')
    expect(state.events[0].dateStart).toBe('1990-01-01')
    expect(state.events[0].dateEnd).toBe('1995-06-01')
  })

  it('is a no-op when source and target are the same', () => {
    const { state, persist } = makeStore([makeEvent({ id: 'a' })])
    persist.mockClear()
    state.mergeEvents('a', 'a')
    expect(state.events).toHaveLength(1)
    expect(persist).not.toHaveBeenCalled()
  })

  it('is a no-op when an id does not exist', () => {
    const { state } = makeStore([makeEvent({ id: 'a' })])
    state.mergeEvents('missing', 'a')
    expect(state.events).toHaveLength(1)
  })
})

// ─── commitEvents queue under contention ─────────────────

describe('commitEvents queue', () => {
  beforeEach(() => {
    resetHistory('tl_test')
    resetHistory('tl_other')
    resetHistory()
  })

  it('queues a commit made while another is in progress and drains it on a microtask', async () => {
    const { state, get, persist, sync } = makeStore([makeEvent({ id: 'e1' })])
    const set = (u) => Object.assign(state, u)
    const order = []

    commitEvents(get, set, (events) => {
      order.push('outer')
      // Re-entrant commit: the lock is held, so this must queue, not run inline
      commitEvents(get, set, (inner) => {
        order.push('inner')
        return [...inner, makeEvent({ id: 'e3' })]
      }, { persist, sync })
      expect(order).toEqual(['outer'])
      return [...events, makeEvent({ id: 'e2' })]
    }, { persist, sync })

    // Outer committed synchronously, inner still queued
    expect(state.events.map((e) => e.id)).toEqual(['e1', 'e2'])
    await Promise.resolve()
    // Inner ran after outer and saw its result
    expect(order).toEqual(['outer', 'inner'])
    expect(state.events.map((e) => e.id)).toEqual(['e1', 'e2', 'e3'])
    expect(persist).toHaveBeenCalledTimes(2)

    // Each drained commit pushed its own undo snapshot
    state.undo()
    expect(state.events.map((e) => e.id)).toEqual(['e1', 'e2'])
    state.undo()
    expect(state.events.map((e) => e.id)).toEqual(['e1'])
  })

  it('skips a queued commit when the active timeline changed before it drained', async () => {
    const { state, get, persist, sync } = makeStore([makeEvent({ id: 'e1' })])
    const set = (u) => Object.assign(state, u)
    const stale = vi.fn((events) => [...events, makeEvent({ id: 'stale' })])

    commitEvents(get, set, (events) => {
      commitEvents(get, set, stale, { persist, sync })
      // Switch timelines while the inner commit waits in the queue
      state.activeTimelineId = 'tl_other'
      return [...events, makeEvent({ id: 'e2' })]
    }, { persist, sync })

    await Promise.resolve()
    expect(stale).not.toHaveBeenCalled()
    expect(state.events.map((e) => e.id)).toEqual(['e1', 'e2'])
    expect(persist).toHaveBeenCalledTimes(1)
  })
})

// ─── Toast undo targets its own action ───────────────────

describe('toast Undo reverts its own action', () => {
  beforeEach(() => {
    resetHistory('tl_test')
    resetHistory('tl_other')
    resetHistory()
  })

  const lastToastUndo = (state) => state.showToast.mock.calls.findLast(([, o]) => o?.actionLabel === 'Undo')[1].onAction

  it('batch tag Undo removes only that tag after a later unrelated edit', () => {
    const { state } = makeStore([
      makeEvent({ id: 'a', tags: ['family'] }),
      makeEvent({ id: 'b', title: 'Before' }),
    ])
    state.selectEvents(['a'])
    state.batchAddTag('travel')
    const undo = lastToastUndo(state)
    state.updateEvent('b', { title: 'After' })

    undo()
    expect(state.events.find((e) => e.id === 'a').tags).toEqual(['family'])
    // The later edit survives; a bare undo() would have reverted it instead
    expect(state.events.find((e) => e.id === 'b').title).toBe('After')
  })

  it('duplicate Undo removes the copy without touching later edits', () => {
    const { state } = makeStore([makeEvent({ id: 'a', title: 'Trip' }), makeEvent({ id: 'b', title: 'x' })])
    const clone = state.duplicateEvent('a')
    const undo = lastToastUndo(state)
    state.updateEvent('b', { title: 'y' })

    undo()
    expect(state.events.map((e) => e.id)).toEqual(['a', 'b'])
    expect(state.events.find((e) => e.id === clone.id)).toBeUndefined()
    expect(state.events.find((e) => e.id === 'b').title).toBe('y')
  })

  it('merge Undo brings the source back at its position and restores the target', () => {
    const { state } = makeStore([
      makeEvent({ id: 's', title: 'Source', people: ['Ana'] }),
      makeEvent({ id: 't', title: 'Target' }),
      makeEvent({ id: 'o', title: 'Other' }),
    ])
    state.mergeEvents('s', 't')
    const undo = lastToastUndo(state)
    state.updateEvent('o', { title: 'Other edited' })

    undo()
    expect(state.events.map((e) => e.id)).toEqual(['s', 't', 'o'])
    expect(state.events.find((e) => e.id === 't').people).toEqual([])
    expect(state.events.find((e) => e.id === 'o').title).toBe('Other edited')
  })

  it('shift-dates Undo reverts a shifted event that was edited since, keeping the edit', () => {
    const { state } = makeStore([
      makeEvent({ id: 'a', dateStart: '2000-01-01' }),
      makeEvent({ id: 'b', dateStart: '2001-01-01' }),
    ])
    state.selectEvents(['a', 'b'])
    state.batchShiftDates(1, 'year')
    const undo = lastToastUndo(state)
    state.updateEvent('b', { title: 'Edited after shift' })

    undo()
    expect(state.events.find((e) => e.id === 'a').dateStart).toBe('2000-01-01')
    // b's title changed after the shift: the date still reverts, the title stays
    const b = state.events.find((e) => e.id === 'b')
    expect(b.title).toBe('Edited after shift')
    expect(b.dateStart).toBe('2001-01-01')
  })

  it('keeps a field the user changed again after the action', () => {
    const { state } = makeStore([makeEvent({ id: 'a', tags: [] })])
    state.selectEvents(['a'])
    state.batchAddTag('travel')
    const undo = lastToastUndo(state)
    // A later edit (as the edit form does) rewrites tags with a new array
    state.updateEvent('a', { tags: ['travel', 'family'], title: 'Renamed' })
    undo()
    expect(state.events[0].tags).toEqual(['travel', 'family'])
    expect(state.events[0].title).toBe('Renamed')
  })

  it('keeps a duplicated copy that was edited after the duplicate', () => {
    const { state } = makeStore([makeEvent({ id: 'a', title: 'Trip' })])
    const clone = state.duplicateEvent('a')
    const undo = lastToastUndo(state)
    state.updateEvent(clone.id, { title: 'Second trip' })
    undo()
    expect(state.events.map((e) => e.title)).toEqual(['Trip', 'Second trip'])
  })

  it('uses a plain undo (so redo works) when nothing changed since the action', () => {
    const { state } = makeStore([makeEvent({ id: 'a' })])
    state.selectEvents(['a'])
    state.batchAddPerson('Ana')
    lastToastUndo(state)()
    expect(state.events[0].people).toEqual([])
    expect(state.canRedo).toBe(true)
    state.redo()
    expect(state.events[0].people).toEqual(['Ana'])
  })

  it('does nothing after switching to another timeline', () => {
    const { state } = makeStore([makeEvent({ id: 'a' })])
    state.selectEvents(['a'])
    state.batchAddTag('travel')
    const undo = lastToastUndo(state)
    state.activeTimelineId = 'tl_other'
    const eventsBefore = state.events
    undo()
    expect(state.events).toBe(eventsBefore)
  })
})

// ─── Crash-surviving pending deletes ─────────────────────

describe('pending delete queue', () => {
  const KEY = 'timeliner_pending_deletes'
  const readQueue = () => JSON.parse(localStorage.getItem(KEY) || '[]')

  beforeEach(() => {
    localStorage.removeItem(KEY)
    resetHistory('tl_test')
    resetHistory()
  })

  it('records a delete in localStorage until the undo window ends, then clears it', () => {
    vi.useFakeTimers()
    const { state } = makeStore([makeEvent({ id: 'd1' }), makeEvent({ id: 'd2' })])
    state.selectEvents(['d1', 'd2'])
    state.batchDelete()
    expect(readQueue().map((d) => d.eventId).sort()).toEqual(['d1', 'd2'])
    expect(readQueue()[0].timelineId).toBe('tl_test')

    vi.advanceTimersByTime(UNDO_WINDOW_MS)
    expect(localStorage.getItem(KEY)).toBeNull()
    vi.useRealTimers()
  })

  it('drops the queued entries when the delete is undone', () => {
    vi.useFakeTimers()
    const { state } = makeStore([makeEvent({ id: 'd1' })])
    state.deleteEvent('d1')
    expect(readQueue()).toHaveLength(1)
    state.showToast.mock.calls.at(-1)[1].onAction()
    expect(localStorage.getItem(KEY)).toBeNull()
    vi.useRealTimers()
  })

  it('flushPendingDeletes retries every queued delete and empties the queue', () => {
    localStorage.setItem(KEY, JSON.stringify([
      { timelineId: 'tl_a', eventId: 'e1', ts: 1 },
      { timelineId: 'tl_b', eventId: 'e2', ts: 2 },
    ]))
    const remove = vi.fn(() => Promise.resolve())
    flushPendingDeletes(remove)
    expect(remove.mock.calls).toEqual([['tl_a', 'e1'], ['tl_b', 'e2']])
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('a failed retry is logged, not thrown, and the others still fire', async () => {
    localStorage.setItem(KEY, JSON.stringify([
      { timelineId: 'tl_a', eventId: 'bad', ts: 1 },
      { timelineId: 'tl_a', eventId: 'ok', ts: 2 },
    ]))
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    const remove = vi.fn((_t, id) => (id === 'bad' ? Promise.reject(new Error('offline')) : Promise.resolve()))
    expect(() => flushPendingDeletes(remove)).not.toThrow()
    expect(remove).toHaveBeenCalledTimes(2)
    await Promise.resolve(); await Promise.resolve()
    expect(errorSpy).toHaveBeenCalledWith('[Timeliner] Deferred delete retry failed:', 'offline')
    errorSpy.mockRestore()
  })

  it('ignores an empty or corrupt queue', () => {
    const remove = vi.fn(() => Promise.resolve())
    flushPendingDeletes(remove)
    localStorage.setItem(KEY, '{not json')
    expect(() => flushPendingDeletes(remove)).not.toThrow()
    localStorage.setItem(KEY, '[]')
    flushPendingDeletes(remove)
    expect(remove).not.toHaveBeenCalled()
  })
})
