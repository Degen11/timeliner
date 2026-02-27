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
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch {
    // Storage full or unavailable — silently fail
  }
}

const persisted = loadFromStorage()

const useTimelineStore = create((set, get) => ({
  // Core data
  events: persisted?.events ?? [],
  photos: [],

  // UI state
  activeView: persisted?.activeView ?? VIEWS.VERTICAL,
  filters: {
    search: '',
    people: [],
    tags: [],
  },
  reviewMode: false,

  // Draft text (survives navigation)
  draftText: '',

  // Toast notifications
  toast: null,

  // Parsing state
  isParsing: false,
  parseError: null,

  // Actions
  setEvents: (events) => {
    set({ events })
    saveToStorage({ ...get(), events })
  },

  appendEvents: (newEvents) => {
    const existing = get().events
    const existingIds = new Set(existing.map((e) => e.id))
    const unique = newEvents.filter((e) => !existingIds.has(e.id))
    const events = [...existing, ...unique]
    set({ events })
    saveToStorage({ ...get(), events })
  },

  updateEvent: (id, changes) => {
    const events = get().events.map((e) =>
      e.id === id ? { ...e, ...changes } : e
    )
    set({ events })
    saveToStorage({ ...get(), events })
  },

  deleteEvent: (id) => {
    const events = get().events.filter((e) => e.id !== id)
    set({ events })
    saveToStorage({ ...get(), events })
  },

  setPhotos: (photos) => set({ photos }),

  setActiveView: (activeView) => {
    set({ activeView })
    saveToStorage({ ...get(), activeView })
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
    set({ events: [], photos: [], filters: { search: '', people: [], tags: [] } })
    localStorage.removeItem(STORAGE_KEY)
  },
}))

export default useTimelineStore
