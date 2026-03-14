import { safeDateCompare, shiftISODate } from '@/utils/dateUtils'
import { findNearDuplicates } from '@/utils/dedupeHelpers'
import { generateId } from '@/utils/constants'
import {
  syncEventsRemote,
  removeEventRemote,
} from '@/lib/dataService'

import { UNDO_WINDOW_MS, TOAST_DURATION } from '@/utils/constants'
import { pluralize } from '@/utils/ui'

// ─── Constants ───────────────────────────────────────────

const MAX_HISTORY = 50
const PENDING_DELETES_KEY = 'timeliner_pending_deletes'

// ─── Pending delete persistence ─────────────────────────
// When a user deletes an event, remote deletion is deferred to allow undo.
// If the app crashes during that window, the remote delete never fires and the
// event reappears on next sync. This queue persists pending deletes to localStorage
// so they can be retried on startup.

function updatePendingDeletes(fn) {
  try {
    const raw = localStorage.getItem(PENDING_DELETES_KEY)
    const pending = fn(raw ? JSON.parse(raw) : [])
    if (pending?.length > 0) {
      localStorage.setItem(PENDING_DELETES_KEY, JSON.stringify(pending))
    } else {
      localStorage.removeItem(PENDING_DELETES_KEY)
    }
  } catch { /* localStorage unavailable — non-critical */ }
}

function addPendingDelete(timelineId, eventId) {
  updatePendingDeletes((pending) => [...pending, { timelineId, eventId, ts: Date.now() }])
}

function removePendingDelete(eventId) {
  updatePendingDeletes((pending) => pending.filter((d) => d.eventId !== eventId))
}

/**
 * Flush any pending deletes that survived a crash/tab close.
 * Called once during store initialization.
 */
export function flushPendingDeletes(removeEventRemoteFn) {
  try {
    const raw = localStorage.getItem(PENDING_DELETES_KEY)
    if (!raw) return
    const pending = JSON.parse(raw)
    if (!Array.isArray(pending) || pending.length === 0) return
    localStorage.removeItem(PENDING_DELETES_KEY)
    for (const { timelineId, eventId } of pending) {
      removeEventRemoteFn(timelineId, eventId).catch((err) => {
        console.error('[Timeliner] Deferred delete retry failed:', err?.message)
      })
    }
  } catch { /* non-critical */ }
}

// History is stored per-timeline to prevent cross-contamination when switching.
const historyByTimeline = new Map()
let activeHistoryId = null
let undoStack = []
let redoStack = []

// Prevent concurrent commits from corrupting undo state
let isCommitting = false

function pushUndo(events) {
  undoStack.push(structuredClone(events))
  if (undoStack.length > MAX_HISTORY) undoStack.shift()
  redoStack = []
}

/**
 * Shared mutation pattern: push undo, transform events, persist, sync.
 * `persist` and `sync` are injected by the store to avoid circular deps.
 * Uses a lock to prevent concurrent commits from corrupting undo/redo stacks.
 */
export function commitEvents(get, set, transformer, { persist, sync }) {
  if (isCommitting) {
    // Queue via microtask so the transformer runs against the latest state
    queueMicrotask(() => commitEvents(get, set, transformer, { persist, sync }))
    return
  }
  isCommitting = true
  try {
    pushUndo(get().events)
    const events = transformer(get().events)
    set({ events, canUndo: true, canRedo: false })
    persist({ ...get(), events })
    sync(get)
  } finally {
    isCommitting = false
  }
}

/**
 * Save current stacks and restore (or create) stacks for the given timeline.
 * Called when switching or creating timelines.
 */
export function switchHistory(timelineId) {
  // Persist current stacks
  if (activeHistoryId) {
    historyByTimeline.set(activeHistoryId, { undoStack, redoStack })
  }
  activeHistoryId = timelineId
  const saved = historyByTimeline.get(timelineId)
  if (saved) {
    undoStack = saved.undoStack
    redoStack = saved.redoStack
  } else {
    undoStack = []
    redoStack = []
  }
}

/**
 * Clear history for a specific timeline (e.g. on delete).
 * Falls back to clearing the active stacks if no ID is given.
 */
export function resetHistory(timelineId) {
  if (timelineId) {
    historyByTimeline.delete(timelineId)
    if (activeHistoryId === timelineId) {
      undoStack = []
      redoStack = []
    }
  } else {
    undoStack = []
    redoStack = []
  }
}

export function createEventsSlice(set, get, { persist, sync }) {
  const commit = (transformer) => commitEvents(get, set, transformer, { persist, sync })

  /** Show a toast with an Undo action button. */
  function showUndoableToast(message) {
    get().showToast(message, {
      duration: TOAST_DURATION.MEDIUM,
      actionLabel: 'Undo',
      onAction: () => get().undo(),
    })
  }

  /**
   * Apply a transformer to only the selected events, then clear selection.
   * Returns the count of affected events.
   */
  function commitSelected(transformer) {
    const ids = new Set(get().selectedEventIds)
    if (ids.size === 0) return 0
    commit((events) =>
      events.map((e) => (ids.has(e.id) ? transformer(e) : e))
    )
    set({ selectedEventIds: [] })
    return ids.size
  }

  return {
    events: [],
    canUndo: false,
    canRedo: false,

    setEvents: (events) => {
      commit(() => events)
    },

    appendEvents: (newEvents) => {
      const existing = get().events
      const existingIds = new Set(existing.map((e) => e.id))
      const unique = newEvents.filter((e) => !existingIds.has(e.id))

      const dupes = findNearDuplicates(unique, existing)
      const dupeIds = new Set(dupes.map((d) => d.newEvent.id))
      const toAdd = unique.filter((e) => !dupeIds.has(e.id))

      commit((events) => [...events, ...toAdd])

      if (dupes.length > 0) {
        get().showToast(
          `Added ${toAdd.length} event${toAdd.length !== 1 ? 's' : ''}, skipped ${dupes.length} duplicate${dupes.length !== 1 ? 's' : ''}`,
          { variant: 'warning', duration: 7000 }
        )
      }

      return { added: toAdd.length, duplicatesSkipped: dupes.length }
    },

    updateEvent: (id, changes) => {
      commit((events) =>
        events.map((e) => (e.id === id ? { ...e, ...changes } : e))
      )
    },

    deleteEvent: (id) => {
      const deleted = get().events.find((e) => e.id === id)
      commit((events) => events.filter((e) => e.id !== id))
      const timelineId = get().activeTimelineId

      // Persist the pending delete immediately so it survives crashes.
      // If the user undoes within the window, we remove it from the queue.
      if (timelineId) addPendingDelete(timelineId, id)

      // Defer remote delete until after the undo window expires.
      let undone = false
      const deleteTimer = timelineId
        ? setTimeout(() => {
            if (!undone) {
              removePendingDelete(id)
              removeEventRemote(timelineId, id).catch((err) => {
                console.error('[Timeliner] Remote delete failed:', err?.message)
                get()._setSaveStatus('error')
                get().showToast('Remote delete failed — will retry on next sync', { variant: 'error', duration: TOAST_DURATION.MEDIUM })
              })
            }
          }, UNDO_WINDOW_MS)
        : null

      get().showToast(`"${deleted?.title || 'Event'}" deleted`, {
        duration: TOAST_DURATION.MEDIUM,
        actionLabel: 'Undo',
        onAction: () => {
          undone = true
          if (deleteTimer) clearTimeout(deleteTimer)
          removePendingDelete(id)
          get().undo()
        },
      })
    },

    addEvent: (event) => {
      commit((events) => [...events, event])
    },

    duplicateEvent: (id) => {
      const source = get().events.find((e) => e.id === id)
      if (!source) return null
      const clone = {
        ...structuredClone(source),
        id: generateId(),
        title: `${source.title} (copy)`,
      }
      commit((events) => {
        const idx = events.findIndex((e) => e.id === id)
        const copy = [...events]
        copy.splice(idx + 1, 0, clone)
        return copy
      })
      showUndoableToast(`Duplicated "${source.title}"`)

      return clone
    },

    reorderEvents: (newEvents) => {
      commit(() => newEvents)
    },

    // ─── Merge events ─────────────────────────────────────

    mergeEvents: (sourceId, targetId) => {
      if (sourceId === targetId) return
      const source = get().events.find((e) => e.id === sourceId)
      const target = get().events.find((e) => e.id === targetId)
      if (!source || !target) return

      const useSourceDate =
        source.dateStart && target.dateStart
          ? safeDateCompare(source.dateStart, target.dateStart) < 0
          : !!source.dateStart
      const earliestStart = useSourceDate ? source.dateStart : target.dateStart

      const endCandidates = [target.dateEnd, source.dateEnd].filter(Boolean)
      let dateEnd = null
      if (endCandidates.length > 0) {
        dateEnd = endCandidates.reduce((latest, d) =>
          safeDateCompare(d, latest) > 0 ? d : latest
        )
      }
      if (
        !dateEnd &&
        source.dateStart &&
        target.dateStart &&
        source.dateStart !== target.dateStart
      ) {
        dateEnd =
          safeDateCompare(source.dateStart, target.dateStart) > 0
            ? source.dateStart
            : target.dateStart
      }

      const dateRawParts = [target.dateRaw, source.dateRaw].filter(Boolean)
      const dateRaw =
        dateRawParts.length === 2 && dateRawParts[0] !== dateRawParts[1]
          ? dateRawParts.join(' / ')
          : dateRawParts[0] || null

      const merged = {
        ...target,
        description: [target.description, source.description].filter(Boolean).join('\n\n'),
        people: [...new Set([...(target.people || []), ...(source.people || [])])],
        tags: [...new Set([...(target.tags || []), ...(source.tags || [])])],
        photos: [...new Set([...(target.photos || []), ...(source.photos || [])])],
        dateStart: earliestStart,
        dateEnd,
        dateRaw,
      }

      commit((events) =>
        events.map((e) => (e.id === targetId ? merged : e)).filter((e) => e.id !== sourceId)
      )

      const timelineId = get().activeTimelineId
      if (timelineId) {
        removeEventRemote(timelineId, sourceId).catch((err) => {
          console.error('[Timeliner] Remote delete after merge failed:', err?.message)
          get()._setSaveStatus('error')
        })
      }

      showUndoableToast(`Merged "${source.title}" into "${target.title}"`)

    },

    // ─── Selection & batch actions ────────────────────────

    selectedEventIds: [],

    toggleSelectEvent: (id) => {
      const ids = get().selectedEventIds
      const newIds = ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]
      set({ selectedEventIds: newIds })
    },

    selectEvents: (ids) => set({ selectedEventIds: ids }),
    clearSelection: () => set({ selectedEventIds: [] }),

    batchAddTag: (tagOrTags) => {
      const tags = Array.isArray(tagOrTags) ? tagOrTags : [tagOrTags]
      if (tags.length === 0) return
      const count = commitSelected((e) => ({
        ...e,
        tags: [...new Set([...(e.tags || []), ...tags])],
      }))
      if (count === 0) return
      const label = tags.length === 1 ? `"${tags[0]}"` : pluralize(tags.length, 'tag')
      showUndoableToast(`Added ${label} to ${pluralize(count, 'event')}`)
    },

    // Keep plural aliases for backward compat in case any callers exist
    batchAddTags(tags) { return get().batchAddTag(tags) },

    batchRemoveTag: (tagOrTags) => {
      const tags = Array.isArray(tagOrTags) ? tagOrTags : [tagOrTags]
      if (tags.length === 0) return
      const tagSet = new Set(tags)
      const count = commitSelected((e) => ({
        ...e,
        tags: (e.tags || []).filter((t) => !tagSet.has(t)),
      }))
      if (count === 0) return
      const label = tags.length === 1 ? `"${tags[0]}"` : pluralize(tags.length, 'tag')
      showUndoableToast(`Removed ${label} from ${pluralize(count, 'event')}`)
    },

    batchRemoveTags(tags) { return get().batchRemoveTag(tags) },

    batchDelete: () => {
      const ids = new Set(get().selectedEventIds)
      if (ids.size === 0) return
      const count = ids.size
      commit((events) => events.filter((e) => !ids.has(e.id)))
      const timelineId = get().activeTimelineId
      if (timelineId) {
        Promise.all([...ids].map((id) => removeEventRemote(timelineId, id))).catch((err) => {
          console.error('[Timeliner] Remote batch delete failed:', err?.message)
          get()._setSaveStatus('error')
          get().showToast('Some remote deletes failed — will retry on next sync', { variant: 'error', duration: TOAST_DURATION.MEDIUM })
        })
      }
      showUndoableToast(`Deleted ${pluralize(count, 'event')}`)
      set({ selectedEventIds: [] })
    },

    batchAddPerson: (person) => {
      const count = commitSelected((e) => ({
        ...e,
        people: [...new Set([...(e.people || []), person])],
      }))
      if (count === 0) return
      showUndoableToast(`Added "${person}" to ${pluralize(count, 'event')}`)
    },

    batchShiftDates: (amount, unit) => {
      const count = commitSelected((e) => {
        const shifted = { ...e }
        if (shifted.dateStart) shifted.dateStart = shiftISODate(shifted.dateStart, amount, unit)
        if (shifted.dateEnd) shifted.dateEnd = shiftISODate(shifted.dateEnd, amount, unit)
        return shifted
      })
      if (count === 0) return
      const dir = amount > 0 ? 'forward' : 'back'
      const abs = Math.abs(amount)
      showUndoableToast(`Shifted ${pluralize(count, 'event')} ${dir} ${abs} ${unit}${abs !== 1 ? 's' : ''}`)
    },

    // ─── Undo / Redo ──────────────────────────────────────

    undo: () => {
      if (undoStack.length === 0) return
      const current = get().events
      redoStack.push(structuredClone(current))
      const previous = undoStack.pop()
      const canUndo = undoStack.length > 0
      const canRedo = true
      set({ events: previous, canUndo, canRedo })
      persist({ ...get(), events: previous })
      sync(get)
      get().showToast('Undone')
    },

    redo: () => {
      if (redoStack.length === 0) return
      const current = get().events
      undoStack.push(structuredClone(current))
      const next = redoStack.pop()
      const canUndo = true
      const canRedo = redoStack.length > 0
      set({ events: next, canUndo, canRedo })
      persist({ ...get(), events: next })
      sync(get)
      get().showToast('Redone')
    },
  }
}
