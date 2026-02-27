import { create } from 'zustand'
import { VIEWS, STORAGE_KEY } from '@/utils/constants'
import {
  syncEvents,
  upsertTimeline,
  deleteTimelineRemote,
  renameTimelineRemote,
  loadInitialData,
  deleteEventRemote,
} from '@/lib/db'

// ─── Local persistence (cache) ────────────────────────────

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveToStorage(state) {
  try {
    const data = {
      events: state.events,
      activeView: state.activeView,
      photoMap: state.photoMap,
      timelines: state.timelines,
      activeTimelineId: state.activeTimelineId,
      sortOrder: state.sortOrder,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage full or unavailable — silently fail
  }
}

const persisted = loadFromStorage()

// ─── Undo/redo history ────────────────────────────────────

const MAX_HISTORY = 50
let undoStack = []
let redoStack = []

function pushUndo(events) {
  undoStack.push(JSON.parse(JSON.stringify(events)))
  if (undoStack.length > MAX_HISTORY) undoStack.shift()
  redoStack = []
}

// ─── Debounced remote sync ────────────────────────────────

let syncTimer = null
function debouncedSync(get) {
  clearTimeout(syncTimer)
  syncTimer = setTimeout(() => {
    const { activeTimelineId, events, sortOrder, activeView } = get()
    if (activeTimelineId) {
      const tl = get().timelines.find((t) => t.id === activeTimelineId)
      upsertTimeline({
        id: activeTimelineId,
        name: tl?.name || 'Untitled',
        sortOrder,
        activeView,
      })
      syncEvents(activeTimelineId, events)
    }
  }, 1500)
}

// ─── Store ────────────────────────────────────────────────

const useTimelineStore = create((set, get) => ({
  // Core data
  events: persisted?.events ?? [],
  photos: [],
  photoMap: persisted?.photoMap ?? {},

  // UI state
  activeView: persisted?.activeView ?? VIEWS.VERTICAL,
  filters: {
    search: '',
    people: [],
    tags: [],
  },
  reviewMode: false,
  sortOrder: persisted?.sortOrder ?? 'date-asc',

  // Draft text (survives navigation)
  draftText: '',

  // Toast notifications
  toast: null,

  // Parsing state
  isParsing: false,
  parseError: null,

  // Multiple timelines
  timelines: persisted?.timelines ?? [],
  activeTimelineId: persisted?.activeTimelineId ?? null,

  // Undo/redo state
  canUndo: false,
  canRedo: false,

  // Remote sync status
  isSyncing: false,
  syncError: null,

  // ─── Hydrate from Supabase on startup ──────────────────

  hydrateFromRemote: async () => {
    try {
      set({ isSyncing: true })
      const remoteTimelines = await loadInitialData()
      if (!remoteTimelines || remoteTimelines.length === 0) {
        set({ isSyncing: false })
        return
      }

      // Merge remote timelines into local (remote wins for matching IDs)
      const localTimelines = get().timelines
      const localMap = new Map(localTimelines.map((t) => [t.id, t]))
      const merged = []
      const remoteIds = new Set()

      for (const rt of remoteTimelines) {
        remoteIds.add(rt.id)
        merged.push({
          id: rt.id,
          name: rt.name,
          events: rt.events,
          photoMap: localMap.get(rt.id)?.photoMap || {},
          createdAt: rt.createdAt,
          updatedAt: rt.updatedAt,
        })
      }

      // Keep local-only timelines that aren't on remote
      for (const lt of localTimelines) {
        if (!remoteIds.has(lt.id)) {
          merged.push(lt)
        }
      }

      const updates = { timelines: merged, isSyncing: false }

      // If the active timeline exists in remote data, load its events
      const activeId = get().activeTimelineId
      if (activeId) {
        const active = merged.find((t) => t.id === activeId)
        if (active && active.events.length > 0) {
          updates.events = active.events
        }
      }

      set(updates)
      saveToStorage({ ...get(), ...updates })
    } catch (err) {
      console.error('hydrateFromRemote error:', err)
      set({ isSyncing: false, syncError: err.message })
    }
  },

  // ─── Event actions ─────────────────────────────────────

  setEvents: (events) => {
    pushUndo(get().events)
    set({ events, canUndo: true, canRedo: false })
    saveToStorage({ ...get(), events })
    debouncedSync(get)
  },

  appendEvents: (newEvents) => {
    const existing = get().events
    pushUndo(existing)
    const existingIds = new Set(existing.map((e) => e.id))
    const unique = newEvents.filter((e) => !existingIds.has(e.id))
    const events = [...existing, ...unique]
    set({ events, canUndo: true, canRedo: false })
    saveToStorage({ ...get(), events })
    debouncedSync(get)
  },

  updateEvent: (id, changes) => {
    pushUndo(get().events)
    const events = get().events.map((e) =>
      e.id === id ? { ...e, ...changes } : e
    )
    set({ events, canUndo: true, canRedo: false })
    saveToStorage({ ...get(), events })
    debouncedSync(get)
  },

  deleteEvent: (id) => {
    pushUndo(get().events)
    const events = get().events.filter((e) => e.id !== id)
    set({ events, canUndo: true, canRedo: false })
    saveToStorage({ ...get(), events })
    const timelineId = get().activeTimelineId
    if (timelineId) deleteEventRemote(timelineId, id)
    debouncedSync(get)
  },

  addEvent: (event) => {
    pushUndo(get().events)
    const events = [...get().events, event]
    set({ events, canUndo: true, canRedo: false })
    saveToStorage({ ...get(), events })
    debouncedSync(get)
  },

  reorderEvents: (events) => {
    pushUndo(get().events)
    set({ events, canUndo: true, canRedo: false })
    saveToStorage({ ...get(), events })
    debouncedSync(get)
  },

  // ─── Undo / Redo ──────────────────────────────────────

  undo: () => {
    if (undoStack.length === 0) return
    const current = get().events
    redoStack.push(JSON.parse(JSON.stringify(current)))
    const previous = undoStack.pop()
    const canUndo = undoStack.length > 0
    const canRedo = true
    set({ events: previous, canUndo, canRedo })
    saveToStorage({ ...get(), events: previous })
    debouncedSync(get)
    get().showToast('Undone')
  },

  redo: () => {
    if (redoStack.length === 0) return
    const current = get().events
    undoStack.push(JSON.parse(JSON.stringify(current)))
    const next = redoStack.pop()
    const canUndo = true
    const canRedo = redoStack.length > 0
    set({ events: next, canUndo, canRedo })
    saveToStorage({ ...get(), events: next })
    debouncedSync(get)
    get().showToast('Redone')
  },

  // ─── Photo actions ─────────────────────────────────────

  setPhotos: (photos) => set({ photos }),

  addToPhotoMap: (entries) => {
    const photoMap = { ...get().photoMap, ...entries }
    set({ photoMap })
    saveToStorage({ ...get(), photoMap })
  },

  getPhotoUrl: (filename) => {
    return get().photoMap[filename] || null
  },

  attachPhotoToEvent: (filename, eventId) => {
    pushUndo(get().events)
    const events = get().events.map((e) => {
      if (e.id === eventId) {
        const photos = e.photos || []
        if (!photos.includes(filename)) {
          return { ...e, photos: [...photos, filename] }
        }
      }
      return e
    })
    set({ events, canUndo: true, canRedo: false })
    saveToStorage({ ...get(), events })
    debouncedSync(get)
  },

  detachPhotoFromEvent: (filename, eventId) => {
    pushUndo(get().events)
    const events = get().events.map((e) => {
      if (e.id === eventId) {
        return { ...e, photos: (e.photos || []).filter((p) => p !== filename) }
      }
      return e
    })
    set({ events, canUndo: true, canRedo: false })
    saveToStorage({ ...get(), events })
    debouncedSync(get)
  },

  // ─── UI state ──────────────────────────────────────────

  setActiveView: (activeView) => {
    set({ activeView })
    saveToStorage({ ...get(), activeView })
  },

  setSortOrder: (sortOrder) => {
    set({ sortOrder })
    saveToStorage({ ...get(), sortOrder })
  },

  setFilters: (filters) => set({ filters }),

  clearFilters: () =>
    set({ filters: { search: '', people: [], tags: [] } }),

  toggleReviewMode: () => set({ reviewMode: !get().reviewMode }),

  setDraftText: (draftText) => set({ draftText }),

  showToast: (message, duration = 3000) => {
    set({ toast: message })
    setTimeout(() => {
      if (get().toast === message) set({ toast: null })
    }, duration)
  },
  clearToast: () => set({ toast: null }),

  setIsParsing: (isParsing) => set({ isParsing }),
  setParseError: (parseError) => set({ parseError }),

  clearTimeline: () => {
    pushUndo(get().events)
    set({ events: [], photos: [], photoMap: {}, filters: { search: '', people: [], tags: [] }, canUndo: true, canRedo: false })
    saveToStorage({ ...get(), events: [], photoMap: {} })
    debouncedSync(get)
  },

  // ─── Multiple timelines management ─────────────────────

  saveCurrentAsTimeline: (name) => {
    const state = get()
    const id = 'tl_' + Math.random().toString(36).slice(2, 9)
    const timeline = {
      id,
      name,
      events: JSON.parse(JSON.stringify(state.events)),
      photoMap: { ...state.photoMap },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const timelines = [...state.timelines, timeline]
    set({ timelines, activeTimelineId: id })
    saveToStorage({ ...get(), timelines, activeTimelineId: id })

    // Push to Supabase
    upsertTimeline({ id, name, sortOrder: state.sortOrder, activeView: state.activeView })
    syncEvents(id, state.events)

    return id
  },

  updateTimelineName: (id, name) => {
    const timelines = get().timelines.map((t) =>
      t.id === id ? { ...t, name, updatedAt: new Date().toISOString() } : t
    )
    set({ timelines })
    saveToStorage({ ...get(), timelines })
    renameTimelineRemote(id, name)
  },

  loadTimeline: (id) => {
    const state = get()
    // Save current timeline first
    if (state.activeTimelineId) {
      const timelines = state.timelines.map((t) =>
        t.id === state.activeTimelineId
          ? { ...t, events: JSON.parse(JSON.stringify(state.events)), photoMap: { ...state.photoMap }, updatedAt: new Date().toISOString() }
          : t
      )
      set({ timelines })

      // Sync the old timeline to remote
      upsertTimeline({
        id: state.activeTimelineId,
        name: timelines.find((t) => t.id === state.activeTimelineId)?.name,
        sortOrder: state.sortOrder,
        activeView: state.activeView,
      })
      syncEvents(state.activeTimelineId, state.events)
    }

    const timeline = get().timelines.find((t) => t.id === id)
    if (!timeline) return
    undoStack = []
    redoStack = []
    const events = JSON.parse(JSON.stringify(timeline.events))
    const photoMap = { ...timeline.photoMap }
    set({
      events,
      photoMap,
      activeTimelineId: id,
      canUndo: false,
      canRedo: false,
      filters: { search: '', people: [], tags: [] },
    })
    saveToStorage({ ...get(), events, photoMap, activeTimelineId: id })
  },

  deleteTimeline: (id) => {
    const state = get()
    const timelines = state.timelines.filter((t) => t.id !== id)
    const updates = { timelines }
    if (state.activeTimelineId === id) {
      updates.activeTimelineId = null
    }
    set(updates)
    saveToStorage({ ...get(), ...updates })
    deleteTimelineRemote(id)
  },

  createNewTimeline: (name) => {
    const state = get()
    // Save current timeline first
    if (state.activeTimelineId && state.events.length > 0) {
      const timelines = state.timelines.map((t) =>
        t.id === state.activeTimelineId
          ? { ...t, events: JSON.parse(JSON.stringify(state.events)), photoMap: { ...state.photoMap }, updatedAt: new Date().toISOString() }
          : t
      )
      set({ timelines })
      upsertTimeline({
        id: state.activeTimelineId,
        name: timelines.find((t) => t.id === state.activeTimelineId)?.name,
        sortOrder: state.sortOrder,
        activeView: state.activeView,
      })
      syncEvents(state.activeTimelineId, state.events)
    }

    undoStack = []
    redoStack = []
    const id = 'tl_' + Math.random().toString(36).slice(2, 9)
    const timeline = {
      id,
      name,
      events: [],
      photoMap: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const timelines = [...get().timelines, timeline]
    set({
      timelines,
      activeTimelineId: id,
      events: [],
      photoMap: {},
      photos: [],
      canUndo: false,
      canRedo: false,
      filters: { search: '', people: [], tags: [] },
    })
    saveToStorage({ ...get(), timelines, activeTimelineId: id, events: [], photoMap: {} })

    // Push to Supabase
    upsertTimeline({ id, name, sortOrder: 'date-asc', activeView: VIEWS.VERTICAL })

    return id
  },
}))

export default useTimelineStore
