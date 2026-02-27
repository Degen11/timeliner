import { create } from 'zustand'
import { VIEWS, STORAGE_KEY } from '@/utils/constants'

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

// Undo/redo history
const MAX_HISTORY = 50
let undoStack = []
let redoStack = []

function pushUndo(events) {
  undoStack.push(JSON.parse(JSON.stringify(events)))
  if (undoStack.length > MAX_HISTORY) undoStack.shift()
  redoStack = []
}

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

  // Undo/redo state (just counters to trigger re-renders)
  canUndo: false,
  canRedo: false,

  // Actions
  setEvents: (events) => {
    pushUndo(get().events)
    set({ events, canUndo: true, canRedo: false })
    saveToStorage({ ...get(), events })
  },

  appendEvents: (newEvents) => {
    const existing = get().events
    pushUndo(existing)
    const existingIds = new Set(existing.map((e) => e.id))
    const unique = newEvents.filter((e) => !existingIds.has(e.id))
    const events = [...existing, ...unique]
    set({ events, canUndo: true, canRedo: false })
    saveToStorage({ ...get(), events })
  },

  updateEvent: (id, changes) => {
    pushUndo(get().events)
    const events = get().events.map((e) =>
      e.id === id ? { ...e, ...changes } : e
    )
    set({ events, canUndo: true, canRedo: false })
    saveToStorage({ ...get(), events })
  },

  deleteEvent: (id) => {
    pushUndo(get().events)
    const events = get().events.filter((e) => e.id !== id)
    set({ events, canUndo: true, canRedo: false })
    saveToStorage({ ...get(), events })
  },

  addEvent: (event) => {
    pushUndo(get().events)
    const events = [...get().events, event]
    set({ events, canUndo: true, canRedo: false })
    saveToStorage({ ...get(), events })
  },

  reorderEvents: (events) => {
    pushUndo(get().events)
    set({ events, canUndo: true, canRedo: false })
    saveToStorage({ ...get(), events })
  },

  undo: () => {
    if (undoStack.length === 0) return
    const current = get().events
    redoStack.push(JSON.parse(JSON.stringify(current)))
    const previous = undoStack.pop()
    const canUndo = undoStack.length > 0
    const canRedo = true
    set({ events: previous, canUndo, canRedo })
    saveToStorage({ ...get(), events: previous })
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
    get().showToast('Redone')
  },

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
  },

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
  },

  // Multiple timelines management
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
    return id
  },

  updateTimelineName: (id, name) => {
    const timelines = get().timelines.map((t) =>
      t.id === id ? { ...t, name, updatedAt: new Date().toISOString() } : t
    )
    set({ timelines })
    saveToStorage({ ...get(), timelines })
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
    return id
  },
}))

export default useTimelineStore
