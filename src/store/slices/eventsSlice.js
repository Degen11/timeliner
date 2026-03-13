import { safeDateCompare, shiftISODate } from '@/utils/dateUtils'
import { findNearDuplicates } from '@/utils/dedupeHelpers'
import { generateId } from '@/utils/constants'
import {
  syncEventsRemote,
  removeEventRemote,
} from '@/lib/dataService'

// ─── Constants ───────────────────────────────────────────

const MAX_HISTORY = 50
const UNDO_WINDOW_MS = 6000

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

      // Defer remote delete until after the undo window expires.
      // If the user undoes, the timer is cancelled by the undo toast's
      // onAction firing before the timeout, and the next sync will re-upsert.
      let undone = false
      const deleteTimer = timelineId
        ? setTimeout(() => {
            // Deferred remote delete: waits for the undo window to expire
            if (!undone) {
              removeEventRemote(timelineId, id).catch((err) => {
                console.error('[Timeliner] Remote delete failed:', err?.message)
                get()._setSaveStatus('error')
                get().showToast('Remote delete failed — will retry on next sync', { variant: 'error', duration: 5000 })
              })
            }
          }, UNDO_WINDOW_MS)
        : null

      get().showToast(`"${deleted?.title || 'Event'}" deleted`, {
        duration: 5000,
        actionLabel: 'Undo',
        onAction: () => {
          undone = true
          if (deleteTimer) clearTimeout(deleteTimer)
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
      get().showToast(`Duplicated "${source.title}"`, {
        duration: 5000,
        actionLabel: 'Undo',
        onAction: () => get().undo(),
      })
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

      get().showToast(`Merged "${source.title}" into "${target.title}"`, {
        duration: 5000,
        actionLabel: 'Undo',
        onAction: () => get().undo(),
      })
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

    batchAddTag: (tag) => {
      const ids = new Set(get().selectedEventIds)
      if (ids.size === 0) return
      commit((events) =>
        events.map((e) =>
          ids.has(e.id) ? { ...e, tags: [...new Set([...(e.tags || []), tag])] } : e
        )
      )
      get().showToast(`Added "${tag}" to ${ids.size} event${ids.size > 1 ? 's' : ''}`, {
        duration: 5000,
        actionLabel: 'Undo',
        onAction: () => get().undo(),
      })
      set({ selectedEventIds: [] })
    },

    batchRemoveTag: (tag) => {
      const ids = new Set(get().selectedEventIds)
      if (ids.size === 0) return
      commit((events) =>
        events.map((e) =>
          ids.has(e.id) ? { ...e, tags: (e.tags || []).filter((t) => t !== tag) } : e
        )
      )
      get().showToast(`Removed "${tag}" from ${ids.size} event${ids.size > 1 ? 's' : ''}`, {
        duration: 5000,
        actionLabel: 'Undo',
        onAction: () => get().undo(),
      })
      set({ selectedEventIds: [] })
    },

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
          get().showToast('Some remote deletes failed — will retry on next sync', { variant: 'error', duration: 5000 })
        })
      }
      get().showToast(`Deleted ${count} event${count > 1 ? 's' : ''}`, {
        duration: 5000,
        actionLabel: 'Undo',
        onAction: () => get().undo(),
      })
      set({ selectedEventIds: [] })
    },

    batchAddPerson: (person) => {
      const ids = new Set(get().selectedEventIds)
      if (ids.size === 0) return
      commit((events) =>
        events.map((e) =>
          ids.has(e.id) ? { ...e, people: [...new Set([...(e.people || []), person])] } : e
        )
      )
      get().showToast(`Added "${person}" to ${ids.size} event${ids.size > 1 ? 's' : ''}`, {
        duration: 5000,
        actionLabel: 'Undo',
        onAction: () => get().undo(),
      })
      set({ selectedEventIds: [] })
    },

    batchShiftDates: (amount, unit) => {
      const ids = new Set(get().selectedEventIds)
      if (ids.size === 0) return
      commit((events) =>
        events.map((e) => {
          if (!ids.has(e.id)) return e
          const shifted = { ...e }
          if (shifted.dateStart) shifted.dateStart = shiftISODate(shifted.dateStart, amount, unit)
          if (shifted.dateEnd) shifted.dateEnd = shiftISODate(shifted.dateEnd, amount, unit)
          return shifted
        })
      )
      const dir = amount > 0 ? 'forward' : 'back'
      const abs = Math.abs(amount)
      get().showToast(`Shifted ${ids.size} event${ids.size > 1 ? 's' : ''} ${dir} ${abs} ${unit}${abs !== 1 ? 's' : ''}`, {
        duration: 5000,
        actionLabel: 'Undo',
        onAction: () => get().undo(),
      })
      set({ selectedEventIds: [] })
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
