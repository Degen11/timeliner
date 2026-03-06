import { create } from 'zustand'
import { VIEWS, setCustomTagRegistry } from '@/utils/constants'
import { findNearDuplicates } from '@/utils/dedupeHelpers'
import { safeDateCompare } from '@/utils/dateUtils'
import {
  loadLocal,
  loadLocalAsync,
  saveLocal,
  migrateToIndexedDB,
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

const persisted = loadLocal()

// Initialize custom tag color registry from persisted data
if (persisted?.customTags) setCustomTagRegistry(persisted.customTags)

// ─── Debounced localStorage save ──────────────────────────
// Batches rapid mutations (typing, drag-reorder) into a single write
// instead of blocking the main thread on every keystroke.
let localSaveTimer = null
function debouncedSaveToStorage(state) {
  clearTimeout(localSaveTimer)
  localSaveTimer = setTimeout(() => saveLocal(state), 500)
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

// Shared mutation pattern: push undo, transform events, persist, sync.
// Eliminates repeated boilerplate across all event-mutating actions.
function commitEvents(get, set, transformer) {
  pushUndo(get().events)
  const events = transformer(get().events)
  set({ events, canUndo: true, canRedo: false })
  debouncedSaveToStorage({ ...get(), events })
  debouncedSync(get)
  return events
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
      if (import.meta.env.DEV)
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

// Saves the currently active timeline's events/photos into the timelines array
// and syncs to remote. Used before switching or creating timelines.
function persistActiveTimeline(get, set) {
  const state = get()
  if (!state.activeTimelineId) return
  if (state.events.length === 0 && Object.keys(state.photoMap).length === 0) return

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

// ─── Store ────────────────────────────────────────────────

const useTimelineStore = create((set, get) => {
  // Expose getter for the visibilitychange retry listener
  _storeGetter = get

  return {
    // Core data
    events: persisted?.events ?? [],
    photos: [],
    photoMap: persisted?.photoMap ?? {},
    photoOrder: persisted?.photoOrder ?? [],

    // True while IndexedDB hydration is in progress (prevents landing page flash)
    _hydrating: !(persisted?.events?.length > 0),

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

    // Dark mode
    darkMode: persisted?.darkMode ?? false,

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

    // ─── Hydrate heavy data from IndexedDB on startup ──────
    // Loads events & timelines from IndexedDB (primary store).
    // Also migrates old localStorage data to IndexedDB on first run.
    hydrateLocalData: async () => {
      // Migrate any heavy data still in localStorage to IndexedDB
      await migrateToIndexedDB()

      // Load heavy data from IndexedDB
      const data = await loadLocalAsync()
      if (!data) {
        set({ _hydrating: false })
        return
      }

      const updates = { _hydrating: false }
      if (data.events?.length > 0 && get().events.length === 0) {
        updates.events = data.events
      }
      if (data.timelines?.length > 0 && get().timelines.length === 0) {
        updates.timelines = data.timelines
      }
      // Also restore settings from IDB if localStorage didn't have them
      if (data.activeTimelineId && !get().activeTimelineId) {
        updates.activeTimelineId = data.activeTimelineId
      }
      if (data.customTags?.length > 0 && get().customTags.length === 0) {
        updates.customTags = data.customTags
        setCustomTagRegistry(data.customTags)
      }
      set(updates)
    },

    // ─── Hydrate photos from IndexedDB on startup ────────
    hydratePhotos: async () => {
      const photos = await initPhotos()
      if (Object.keys(photos).length > 0) {
        const currentOrder = get().photoOrder
        const photoKeys = Object.keys(photos)
        const validOrder = currentOrder.filter((name) => name in photos)
        const newPhotos = photoKeys.filter((name) => !validOrder.includes(name))
        const photoOrder = [...validOrder, ...newPhotos]
        set({ photoMap: photos, photoOrder })
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
          if (import.meta.env.DEV)
            console.log('[Timeliner] No remote timelines found (empty database)')
          set({ isSyncing: false })
          return
        }
        if (import.meta.env.DEV)
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
      commitEvents(get, set, () => events)
    },

    appendEvents: (newEvents) => {
      const existing = get().events
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

      commitEvents(get, set, (events) => [...events, ...unique])
    },

    updateEvent: (id, changes) => {
      commitEvents(get, set, (events) =>
        events.map((e) => (e.id === id ? { ...e, ...changes } : e))
      )
    },

    deleteEvent: (id) => {
      const deleted = get().events.find((e) => e.id === id)
      commitEvents(get, set, (events) => events.filter((e) => e.id !== id))
      const timelineId = get().activeTimelineId
      if (timelineId) {
        removeEventRemote(timelineId, id).catch((err) => {
          console.error('[Timeliner] Remote delete failed:', err?.message)
          get()._setSaveStatus('error')
          get().showToast('Remote delete failed — will retry on next sync', { variant: 'error', duration: 5000 })
        })
      }
      get().showToast(`"${deleted?.title || 'Event'}" deleted`, {
        duration: 5000,
        actionLabel: 'Undo',
        onAction: () => get().undo(),
      })
    },

    addEvent: (event) => {
      commitEvents(get, set, (events) => [...events, event])
    },

    reorderEvents: (newEvents) => {
      commitEvents(get, set, () => newEvents)
    },

    // ─── Merge events ───────────────────────────────────────

    mergeEvents: (sourceId, targetId) => {
      const source = get().events.find((e) => e.id === sourceId)
      const target = get().events.find((e) => e.id === targetId)
      if (!source || !target) return

      // Determine the earliest start date
      const useSourceDate =
        source.dateStart && target.dateStart
          ? safeDateCompare(source.dateStart, target.dateStart) < 0
          : !!source.dateStart
      const earliestStart = useSourceDate ? source.dateStart : target.dateStart

      // Determine the latest end date, spanning the full range
      const endCandidates = [target.dateEnd, source.dateEnd].filter(Boolean)
      let dateEnd = null
      if (endCandidates.length > 0) {
        dateEnd = endCandidates.reduce((latest, d) =>
          safeDateCompare(d, latest) > 0 ? d : latest
        )
      }
      // If both have different start dates and no end date, create a range
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

      // Combine dateRaw values if they differ
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

      commitEvents(get, set, (events) =>
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

    // ─── Selection & batch actions ──────────────────────────

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
      commitEvents(get, set, (events) =>
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
      commitEvents(get, set, (events) =>
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
      commitEvents(get, set, (events) => events.filter((e) => !ids.has(e.id)))
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
      commitEvents(get, set, (events) =>
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
      const currentOrder = get().photoOrder
      const newNames = Object.keys(entries).filter((name) => !currentOrder.includes(name))
      const photoOrder = [...currentOrder, ...newNames]
      set({ photoMap, photoOrder })
      debouncedSaveToStorage({ ...get(), photoOrder })
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
      commitEvents(get, set, (events) =>
        events.map((e) => {
          if (e.id === eventId) {
            const photos = e.photos || []
            if (!photos.includes(filename)) return { ...e, photos: [...photos, filename] }
          }
          return e
        })
      )
    },

    detachPhotoFromEvent: (filename, eventId) => {
      commitEvents(get, set, (events) =>
        events.map((e) =>
          e.id === eventId ? { ...e, photos: (e.photos || []).filter((p) => p !== filename) } : e
        )
      )
    },

    deletePhoto: (filename) => {
      const { [filename]: _, ...rest } = get().photoMap
      const photoOrder = get().photoOrder.filter((n) => n !== filename)
      set({ photoMap: rest, photoOrder })
      removePhoto(filename)
      commitEvents(get, set, (events) =>
        events.map((e) =>
          e.photos?.includes(filename)
            ? { ...e, photos: e.photos.filter((p) => p !== filename) }
            : e
        )
      )
    },

    reorderPhotos: (fromName, toName) => {
      const order = [...get().photoOrder]
      const fromIdx = order.indexOf(fromName)
      const toIdx = order.indexOf(toName)
      if (fromIdx === -1 || toIdx === -1) return
      order.splice(fromIdx, 1)
      order.splice(toIdx, 0, fromName)
      set({ photoOrder: order })
      debouncedSaveToStorage({ ...get(), photoOrder: order })
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

    toggleDarkMode: () => {
      const darkMode = !get().darkMode
      set({ darkMode })
      debouncedSaveToStorage({ ...get(), darkMode })
      document.documentElement.classList.toggle('dark', darkMode)
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
        photoOrder: [],
        filters: EMPTY_FILTERS,
        canUndo: true,
        canRedo: false,
      })
      debouncedSaveToStorage({ ...get(), events: [], photoOrder: [] })
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
      persistActiveTimeline(get, set)

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
        filters: EMPTY_FILTERS,
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
      persistActiveTimeline(get, set)

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
        filters: EMPTY_FILTERS,
      })
      debouncedSaveToStorage({ ...get(), timelines, activeTimelineId: id, events: [] })

      syncTimelineRemote({ id, name, sortOrder: 'date-asc', activeView: VIEWS.VERTICAL })

      return id
    },
  } // end store object
}) // end create

export default useTimelineStore
