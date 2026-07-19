import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/utils/haptics', () => ({ haptic: vi.fn() }))
vi.mock('@/lib/dataService', () => ({ removeEventRemote: vi.fn(() => Promise.resolve()) }))

import {
  commitEvents,
  switchHistory,
  resetHistory,
  historyFlags,
  createEventsSlice,
} from '../slices/eventsSlice'

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
