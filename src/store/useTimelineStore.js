import { create } from 'zustand'
import { VIEWS, setCustomTagRegistry } from '@/utils/constants'
import { findNearDuplicates } from '@/utils/dedupeHelpers'
import {
  loadLocal,
  saveLocal,
  initPhotos,
  savePhotos,
  clearPhotos,
  removePhoto,
  checkRemoteConnection,
  fetchRemoteData,
  syncTimelineRemote,
  syncEventsRemote,
  removeTimelineRemote,
  renameTimeline,
  removeEventRemote,
} from '@/lib/dataService'

// ─── Local persistence (cache) ────────────────────────────

// saveToStorage is bound lazily so it can call get().showToast on quota errors.
// Defined here as a placeholder; overwritten inside create() via closure.
let saveToStorage = saveLocal
const persisted = loadLocal()

// Initialize custom tag color registry from persisted data
if (persisted?.customTags) setCustomTagRegistry(persisted.customTags)

// ─── Debounced localStorage save ──────────────────────────
// Batches rapid mutations (typing, drag-reorder) into a single write
// instead of blocking the main thread on every keystroke.
let localSaveTimer = null
function debouncedSaveToStorage(state) {
  clearTimeout(localSaveTimer)
  localSaveTimer = setTimeout(() => saveToStorage(state), 500)
}

// ─── Undo/redo history ────────────────────────────────────

const MAX_HISTORY = 50
let undoStack = []
let redoStack = []

function pushUndo(events) {
  undoStack.push(structuredClone(events))
  if (undoStack.length > MAX_HISTORY) undoStack.shift()
  redoStack = []
}

// ─── Debounced remote sync with retry ─────────────────────

const MAX_SYNC_RETRIES = 3
const RETRY_DELAYS = [2000, 4000, 8000] // exponential backoff

async function syncWithRetry(get) {
  const { activeTimelineId, events, sortOrder, activeView, timelines } = get()
  if (!activeTimelineId) return

  const tl = timelines.find((t) => t.id === activeTimelineId)
  const name = tl?.name || 'Untitled'

  for (let attempt = 0; attempt <= MAX_SYNC_RETRIES; attempt++) {
    try {
      console.log(
        `[Timeliner] Syncing to Supabase...${attempt > 0 ? ` (retry ${attempt})` : ''}`,
        activeTimelineId
      )
      get()._setSaveStatus('syncing')
      await Promise.all([
        syncTimelineRemote({ id: activeTimelineId, name, sortOrder, activeView }),
        syncEventsRemote(activeTimelineId, structuredClone(events)),
      ])
      get()._setSaveStatus('saved')
      return // success
    } catch (err) {
      console.error(`[Timeliner] Sync attempt ${attempt + 1} failed:`, err?.message)
      if (attempt < MAX_SYNC_RETRIES) {
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]))
      } else {
        get()._setSaveStatus('error')
        get().showToast('Sync failed — changes saved locally. Click to retry.', {
          variant: 'error',
          duration: 10000,
          actionLabel: 'Retry',
          onAction: () => debouncedSync(get),
        })
      }
    }
  }
}

let syncTimer = null
function debouncedSync(get) {
  clearTimeout(syncTimer)
  syncTimer = setTimeout(() => syncWithRetry(get), 1500)
  // Mark as pending immediately
  get()._setSaveStatus('pending')
}

// ─── Retry sync on tab re-focus ───────────────────────────
// If a sync previously failed, re-attempt when the user returns.
let _storeGetter = null
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && _storeGetter) {
      const status = _storeGetter().saveStatus
      if (status === 'error' || status === 'pending') {
        debouncedSync(_storeGetter)
      }
    }
  })
}

// ─── ID generation ────────────────────────────────────────

function generateTimelineId() {
  return 'tl_' + crypto.randomUUID().slice(0, 12)
}

const EMPTY_FILTERS = { search: '', people: [], tags: [] }

// ─── Store ────────────────────────────────────────────────

const useTimelineStore = create((set, get) => {
  // Expose getter for the visibilitychange retry listener
  _storeGetter = get

  // Bind saveToStorage here so the onError callback has access to get().showToast
  saveToStorage = (state) => {
    saveLocal(state, () => {
      get().showToast('Storage full — local save failed. Free up browser storage.', {
        variant: 'error',
        duration: 8000,
      })
    })
  }

  return {
    // Core data
    events: persisted?.events ?? [],
    photos: [],
    photoMap: persisted?.photoMap ?? {},

    // UI state
    activeView: persisted?.activeView ?? VIEWS.VERTICAL,
    filters: EMPTY_FILTERS,
    reviewMode: false,
    sortOrder: persisted?.sortOrder ?? 'date-asc',
    groupZoom: persisted?.groupZoom ?? 'year',
    verticalCompact: persisted?.verticalCompact ?? false,
    sidebarCollapsed: persisted?.sidebarCollapsed ?? false,

    // Custom tags created by user
    customTags: persisted?.customTags ?? [],

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

    // Save status: 'idle' | 'pending' | 'syncing' | 'saved' | 'error'
    saveStatus: 'idle',
    _setSaveStatus: (saveStatus) => set({ saveStatus }),

    // ─── Hydrate photos from IndexedDB on startup ────────
    hydratePhotos: async () => {
      const photos = await initPhotos()
      if (Object.keys(photos).length > 0) {
        set({ photoMap: photos })
      }
    },

    // ─── Hydrate from Supabase on startup ──────────────────

    hydrateFromRemote: async () => {
      try {
        set({ isSyncing: true })

        const connected = await checkRemoteConnection()
        if (!connected) {
          set({ isSyncing: false })
          return
        }

        const remoteTimelines = await fetchRemoteData()
        if (!remoteTimelines || remoteTimelines.length === 0) {
          console.log('[Timeliner] No remote timelines found (empty database)')
          set({ isSyncing: false })
          return
        }
        console.log('[Timeliner] Loaded', remoteTimelines.length, 'timeline(s) from Supabase')

        // Merge remote timelines into local — last-write-wins per timeline
        const localTimelines = get().timelines
        const localMap = new Map(localTimelines.map((t) => [t.id, t]))
        const merged = []
        const remoteIds = new Set()

        for (const rt of remoteTimelines) {
          remoteIds.add(rt.id)
          const local = localMap.get(rt.id)
          // If local version is newer (updatedAt), prefer it over remote
          if (local?.updatedAt && rt.updatedAt && local.updatedAt > rt.updatedAt) {
            merged.push(local)
          } else {
            merged.push({
              id: rt.id,
              name: rt.name,
              events: rt.events,
              photoMap: local?.photoMap || {},
              sortOrder: rt.sortOrder || 'date-asc',
              activeView: rt.activeView || VIEWS.VERTICAL,
              createdAt: rt.createdAt,
              updatedAt: rt.updatedAt,
            })
          }
        }

        // Keep local-only timelines that aren't on remote
        for (const lt of localTimelines) {
          if (!remoteIds.has(lt.id)) {
            merged.push(lt)
          }
        }

        const updates = { timelines: merged, isSyncing: false }

        // If the active timeline exists in merged data, load its events
        // but only if local events are empty or remote is newer
        const activeId = get().activeTimelineId
        if (activeId) {
          const active = merged.find((t) => t.id === activeId)
          const localActive = localMap.get(activeId)
          const localEvents = get().events
          if (active && active.events.length > 0) {
            // Only overwrite if local has no events or remote is newer
            if (
              localEvents.length === 0 ||
              !localActive?.updatedAt ||
              (active.updatedAt && active.updatedAt >= localActive.updatedAt)
            ) {
              updates.events = active.events
            }
          }
        }

        set(updates)
        debouncedSaveToStorage({ ...get(), ...updates })
      } catch (err) {
        console.error('hydrateFromRemote error:', err)
        set({ isSyncing: false, syncError: err.message })
      }
    },

    // ─── Event actions ─────────────────────────────────────

    setEvents: (events) => {
      pushUndo(get().events)
      set({ events, canUndo: true, canRedo: false })
      debouncedSaveToStorage({ ...get(), events })
      debouncedSync(get)
    },

    appendEvents: (newEvents) => {
      const existing = get().events
      pushUndo(existing)
      const existingIds = new Set(existing.map((e) => e.id))
      const unique = newEvents.filter((e) => !existingIds.has(e.id))

      // Semantic duplicate check (after ID dedup)
      const dupes = findNearDuplicates(unique, existing)
      if (dupes.length > 0) {
        const count = dupes.length
        get().showToast(
          `${count} possible duplicate event${count > 1 ? 's' : ''} detected — review your timeline`,
          { variant: 'warning', duration: 7000 }
        )
      }

      const events = [...existing, ...unique]
      set({ events, canUndo: true, canRedo: false })
      debouncedSaveToStorage({ ...get(), events })
      debouncedSync(get)
    },

    updateEvent: (id, changes) => {
      pushUndo(get().events)
      const events = get().events.map((e) => (e.id === id ? { ...e, ...changes } : e))
      set({ events, canUndo: true, canRedo: false })
      debouncedSaveToStorage({ ...get(), events })
      debouncedSync(get)
    },

    deleteEvent: (id) => {
      const deleted = get().events.find((e) => e.id === id)
      pushUndo(get().events)
      const events = get().events.filter((e) => e.id !== id)
      set({ events, canUndo: true, canRedo: false })
      debouncedSaveToStorage({ ...get(), events })
      const timelineId = get().activeTimelineId
      if (timelineId) removeEventRemote(timelineId, id)
      debouncedSync(get)
      get().showToast(`"${deleted?.title || 'Event'}" deleted`, {
        duration: 5000,
        actionLabel: 'Undo',
        onAction: () => get().undo(),
      })
    },

    addEvent: (event) => {
      pushUndo(get().events)
      const events = [...get().events, event]
      set({ events, canUndo: true, canRedo: false })
      debouncedSaveToStorage({ ...get(), events })
      debouncedSync(get)
    },

    reorderEvents: (events) => {
      pushUndo(get().events)
      set({ events, canUndo: true, canRedo: false })
      debouncedSaveToStorage({ ...get(), events })
      debouncedSync(get)
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
      debouncedSaveToStorage({ ...get(), events: previous })
      debouncedSync(get)
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
      debouncedSaveToStorage({ ...get(), events: next })
      debouncedSync(get)
      get().showToast('Redone')
    },

    // ─── Photo actions ─────────────────────────────────────

    setPhotos: (photos) => set({ photos }),

    addToPhotoMap: (entries) => {
      const photoMap = { ...get().photoMap, ...entries }
      set({ photoMap })
      // Persist to IndexedDB; warn user if any photos were rejected for size
      savePhotos(entries).then((result) => {
        if (result?.oversized?.length) {
          const names = result.oversized.join(', ')
          get().showToast(`Photo too large to save (max 10 MB): ${names}`, {
            variant: 'error',
            duration: 7000,
          })
        }
      })
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
      debouncedSaveToStorage({ ...get(), events })
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
      debouncedSaveToStorage({ ...get(), events })
      debouncedSync(get)
    },

    deletePhoto: (filename) => {
      // Remove from photoMap
      const { [filename]: _, ...rest } = get().photoMap
      set({ photoMap: rest })
      // Remove from IndexedDB
      removePhoto(filename)
      // Remove references from all events
      pushUndo(get().events)
      const events = get().events.map((e) => {
        if (e.photos?.includes(filename)) {
          return { ...e, photos: e.photos.filter((p) => p !== filename) }
        }
        return e
      })
      set({ events, canUndo: true, canRedo: false })
      debouncedSaveToStorage({ ...get(), events })
      debouncedSync(get)
    },

    // ─── UI state ──────────────────────────────────────────

    setActiveView: (activeView) => {
      set({ activeView })
      debouncedSaveToStorage({ ...get(), activeView })
    },

    setSortOrder: (sortOrder) => {
      set({ sortOrder })
      debouncedSaveToStorage({ ...get(), sortOrder })
    },

    setGroupZoom: (groupZoom) => {
      set({ groupZoom })
      debouncedSaveToStorage({ ...get(), groupZoom })
    },

    setVerticalCompact: (verticalCompact) => {
      set({ verticalCompact })
      debouncedSaveToStorage({ ...get(), verticalCompact })
    },

    toggleSidebar: () => {
      const sidebarCollapsed = !get().sidebarCollapsed
      set({ sidebarCollapsed })
      debouncedSaveToStorage({ ...get(), sidebarCollapsed })
    },

    setFilters: (filters) => set({ filters }),

    clearFilters: () => set({ filters: EMPTY_FILTERS }),

    toggleReviewMode: () => set({ reviewMode: !get().reviewMode }),

    addCustomTag: (tag) => {
      const trimmed = tag.trim().toLowerCase()
      if (!trimmed) return
      const existing = get().customTags
      if (existing.includes(trimmed)) return
      const customTags = [...existing, trimmed]
      set({ customTags })
      setCustomTagRegistry(customTags)
      debouncedSaveToStorage({ ...get(), customTags })
    },

    removeCustomTag: (tag) => {
      const customTags = get().customTags.filter((t) => t !== tag)
      set({ customTags })
      setCustomTagRegistry(customTags)
      debouncedSaveToStorage({ ...get(), customTags })
    },

    setDraftText: (draftText) => set({ draftText }),

    showToast: (message, opts) => {
      const duration = typeof opts === 'number' ? opts : (opts?.duration ?? 3000)
      const variant = typeof opts === 'object' ? (opts?.variant ?? 'success') : 'success'
      const actionLabel = typeof opts === 'object' ? opts?.actionLabel : undefined
      const onAction = typeof opts === 'object' ? opts?.onAction : undefined
      const toast = { message, variant, duration, actionLabel, onAction }
      set({ toast })
      setTimeout(() => {
        if (get().toast === toast) set({ toast: null })
      }, duration)
    },
    clearToast: () => set({ toast: null }),

    setIsParsing: (isParsing) => set({ isParsing }),
    setParseError: (parseError) => set({ parseError }),

    clearTimeline: () => {
      pushUndo(get().events)
      set({
        events: [],
        photos: [],
        photoMap: {},
        filters: { search: '', people: [], tags: [] },
        canUndo: true,
        canRedo: false,
      })
      debouncedSaveToStorage({ ...get(), events: [] })
      clearPhotos()
      debouncedSync(get)
    },

    // ─── Multiple timelines management ─────────────────────

    saveCurrentAsTimeline: (name) => {
      const state = get()
      const id = generateTimelineId()
      const timeline = {
        id,
        name,
        events: structuredClone(state.events),
        photoMap: { ...state.photoMap },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const timelines = [...state.timelines, timeline]
      set({ timelines, activeTimelineId: id })
      debouncedSaveToStorage({ ...get(), timelines, activeTimelineId: id })

      // Push to Supabase
      syncTimelineRemote({ id, name, sortOrder: state.sortOrder, activeView: state.activeView })
      syncEventsRemote(id, state.events)

      return id
    },

    updateTimelineName: (id, name) => {
      const timelines = get().timelines.map((t) =>
        t.id === id ? { ...t, name, updatedAt: new Date().toISOString() } : t
      )
      set({ timelines })
      debouncedSaveToStorage({ ...get(), timelines })
      renameTimeline(id, name)
    },

    loadTimeline: (id) => {
      const state = get()
      // Save current timeline first
      if (state.activeTimelineId) {
        const timelines = state.timelines.map((t) =>
          t.id === state.activeTimelineId
            ? {
                ...t,
                events: structuredClone(state.events),
                photoMap: { ...state.photoMap },
                updatedAt: new Date().toISOString(),
              }
            : t
        )
        set({ timelines })

        // Sync the old timeline to remote
        syncTimelineRemote({
          id: state.activeTimelineId,
          name: timelines.find((t) => t.id === state.activeTimelineId)?.name,
          sortOrder: state.sortOrder,
          activeView: state.activeView,
        })
        syncEventsRemote(state.activeTimelineId, state.events)
      }

      const timeline = get().timelines.find((t) => t.id === id)
      if (!timeline) return
      undoStack = []
      redoStack = []
      const events = structuredClone(timeline.events)
      const photoMap = { ...timeline.photoMap }
      set({
        events,
        photoMap,
        activeTimelineId: id,
        canUndo: false,
        canRedo: false,
        filters: { search: '', people: [], tags: [] },
      })
      debouncedSaveToStorage({ ...get(), events, activeTimelineId: id })
    },

    deleteTimeline: (id) => {
      const state = get()
      const deleted = state.timelines.find((t) => t.id === id)
      const timelines = state.timelines.filter((t) => t.id !== id)
      const updates = { timelines }
      if (state.activeTimelineId === id) {
        // Clear active data when deleting the active timeline
        updates.activeTimelineId = null
        updates.events = []
        updates.photoMap = {}
        updates.photos = []
        updates.filters = EMPTY_FILTERS
        updates.canUndo = false
        updates.canRedo = false
        undoStack = []
        redoStack = []
      }
      set(updates)
      debouncedSaveToStorage({ ...get(), ...updates })
      removeTimelineRemote(id)
      if (deleted) {
        get().showToast(`"${deleted.name}" deleted`, {
          duration: 5000,
          actionLabel: 'Undo',
          onAction: () => {
            const current = get().timelines
            const restored = [...current, deleted]
            set({ timelines: restored })
            debouncedSaveToStorage({ ...get(), timelines: restored })
            // Re-sync to remote
            syncTimelineRemote({
              id: deleted.id,
              name: deleted.name,
              sortOrder: deleted.sortOrder || 'date-asc',
              activeView: deleted.activeView || VIEWS.VERTICAL,
            })
            if (deleted.events?.length) syncEventsRemote(deleted.id, deleted.events)
          },
        })
      }
    },

    createNewTimeline: (name) => {
      const state = get()
      // Save current timeline first
      if (state.activeTimelineId && state.events.length > 0) {
        const timelines = state.timelines.map((t) =>
          t.id === state.activeTimelineId
            ? {
                ...t,
                events: structuredClone(state.events),
                photoMap: { ...state.photoMap },
                updatedAt: new Date().toISOString(),
              }
            : t
        )
        set({ timelines })
        syncTimelineRemote({
          id: state.activeTimelineId,
          name: timelines.find((t) => t.id === state.activeTimelineId)?.name,
          sortOrder: state.sortOrder,
          activeView: state.activeView,
        })
        syncEventsRemote(state.activeTimelineId, state.events)
      }

      undoStack = []
      redoStack = []
      const id = generateTimelineId()
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
      debouncedSaveToStorage({ ...get(), timelines, activeTimelineId: id, events: [] })

      // Push to Supabase
      syncTimelineRemote({ id, name, sortOrder: 'date-asc', activeView: VIEWS.VERTICAL })

      return id
    },
  } // end store object
}) // end create

export default useTimelineStore
