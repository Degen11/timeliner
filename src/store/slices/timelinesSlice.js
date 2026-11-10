import { VIEWS, SORT_OPTIONS, TOAST_DURATION, setCustomTagRegistry } from '@/utils/constants'
import {
  loadLocalAsync,
  migrateToIndexedDB,
  clearPhotos,
  checkRemoteConnection,
  fetchRemoteData,
  syncTimelineRemote,
  syncEventsRemote,
  removeTimelineRemote,
  renameTimeline,
} from '@/lib/dataService'
import { resetHistory, switchHistory, historyFlags, adoptHistory } from './eventsSlice'
import { revokeAllObjectUrls } from '@/lib/photoStore'
import { clearSignedUrlCache } from '@/lib/photoSync'
import { markUnsynced, clearUnsynced, hasUnsyncedChanges, forgetUnsynced } from '@/lib/syncState'

function generateTimelineId() {
  return 'tl_' + crypto.randomUUID().slice(0, 12)
}

const EMPTY_FILTERS = { search: '', people: [], tags: [], dateFrom: '', dateTo: '' }

/**
 * Saves the currently active timeline's events/photos into the timelines array
 * and syncs to remote. Used before switching or creating timelines.
 */
async function persistActiveTimeline(get, set) {
  const state = get()
  if (!state.activeTimelineId) return
  // Don't snapshot a half-loaded state over good data during initial hydration.
  if (state._hydrating) return
  // Only persist if the active timeline actually exists in the array.
  // (Previously this also skipped when events were empty, which caused deleted
  //  events to resurface after switching away from and back to a timeline.)
  if (!state.timelines.some((t) => t.id === state.activeTimelineId)) return

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

  // Flag first so a failed push still leaves this copy winning on next start
  const mark = markUnsynced(state.activeTimelineId)
  await Promise.all([
    syncTimelineRemote({
      id: state.activeTimelineId,
      name: timelines.find((t) => t.id === state.activeTimelineId)?.name,
      sortOrder: state.sortOrder,
      activeView: state.activeView,
    }),
    syncEventsRemote(state.activeTimelineId, state.events),
  ])
  clearUnsynced(state.activeTimelineId, mark)
}

export function createTimelinesSlice(set, get, { persist, sync }) {
  return {
    timelines: [],
    activeTimelineId: null,

    // True while IndexedDB hydration is in progress
    _hydrating: true,

    // Remote sync status
    isSyncing: false,
    syncError: null,
    saveStatus: 'idle',
    _setSaveStatus: (saveStatus) => set({ saveStatus }),

    // ─── Hydrate heavy data from IndexedDB on startup ──────

    hydrateLocalData: async () => {
      await migrateToIndexedDB()
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
      if (data.activeTimelineId && !get().activeTimelineId) {
        updates.activeTimelineId = data.activeTimelineId
      }
      if (data.customTags?.length > 0 && get().customTags.length === 0) {
        updates.customTags = data.customTags
        setCustomTagRegistry(data.customTags)
      }
      set(updates)
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

        // Events from a first run that never got a timeline record: give them
        // one now and flag it, so the merge below keeps it and pushes it up
        let adopted = false
        if (!get().activeTimelineId && get().events.length > 0) {
          const id = get().ensureActiveTimeline()
          if (id) {
            markUnsynced(id)
            adopted = true
          }
        }

        const remoteTimelines = await fetchRemoteData()
        if (!remoteTimelines || remoteTimelines.length === 0) {
          if (import.meta.env.DEV)
            console.log('[Timeliner] No remote timelines found (empty database)')
          set({ isSyncing: false })
          if (adopted) sync(get)
          return
        }
        if (import.meta.env.DEV)
          console.log('[Timeliner] Loaded', remoteTimelines.length, 'timeline(s) from Supabase')

        // Conflict rule (src/lib/syncState.js): a timeline with local changes
        // that never reached Supabase keeps its local copy and is pushed up;
        // every other timeline takes the remote copy. Timelines only one side
        // has are kept as they are.
        const localTimelines = get().timelines
        const localMap = new Map(localTimelines.map((t) => [t.id, t]))
        const merged = []
        const remoteIds = new Set()

        for (const rt of remoteTimelines) {
          remoteIds.add(rt.id)
          const local = localMap.get(rt.id)
          if (local && hasUnsyncedChanges(rt.id)) {
            merged.push(local)
          } else {
            merged.push({
              id: rt.id,
              name: rt.name,
              events: rt.events,
              photoMap: local?.photoMap || {},
              sortOrder: rt.sortOrder || SORT_OPTIONS.DATE_ASC,
              activeView: rt.activeView || VIEWS.VERTICAL,
              createdAt: rt.createdAt,
              updatedAt: rt.updatedAt,
            })
          }
        }

        for (const lt of localTimelines) {
          if (!remoteIds.has(lt.id)) {
            merged.push(lt)
          }
        }

        const updates = { timelines: merged, isSyncing: false }

        const activeId = get().activeTimelineId
        let pushActive = false
        if (activeId) {
          const active = merged.find((t) => t.id === activeId)
          if (hasUnsyncedChanges(activeId)) {
            // Keep the live events and finish the sync that never happened
            pushActive = true
          } else if (active && remoteIds.has(activeId) && active.events.length > 0) {
            // An empty remote list is left alone: it's more likely a remote
            // that never got the events than a deliberate clear elsewhere
            updates.events = active.events
          }
        }

        set(updates)
        persist({ ...get(), ...updates })
        if (pushActive) sync(get)
      } catch (err) {
        console.error('hydrateFromRemote error:', err)
        set({ isSyncing: false, syncError: err.message })
      }
    },

    // ─── Timeline CRUD ──────────────────────────────────────

    clearTimeline: () => {
      get().setEvents([])
      resetHistory(get().activeTimelineId)
      set({
        photoMap: {},
        photoOrder: [],
        filters: EMPTY_FILTERS,
        canUndo: false,
        canRedo: false,
      })
      persist({ ...get(), events: [], photoOrder: [] })
      clearPhotos()
      sync(get)
    },

    saveCurrentAsTimeline: async (name, eventsOverride) => {
      // When importing external events (e.g. shared timeline), persist the
      // current timeline first so its data isn't lost.
      if (eventsOverride) {
        await persistActiveTimeline(get, set)
      }

      const state = get()
      const eventsToSave = eventsOverride || state.events
      const id = generateTimelineId()
      const timeline = {
        id,
        name,
        events: structuredClone(eventsToSave),
        photoMap: eventsOverride ? {} : { ...state.photoMap },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      const timelines = [...state.timelines, timeline]
      switchHistory(id)
      set({
        timelines,
        activeTimelineId: id,
        events: structuredClone(eventsToSave),
        photoMap: eventsOverride ? {} : state.photoMap,
        canUndo: false,
        canRedo: false,
      })
      persist({ ...get(), timelines, activeTimelineId: id })

      syncTimelineRemote({ id, name, sortOrder: state.sortOrder, activeView: state.activeView })
      syncEventsRemote(id, eventsToSave)

      return id
    },

    updateTimelineName: (id, name) => {
      const timelines = get().timelines.map((t) =>
        t.id === id ? { ...t, name, updatedAt: new Date().toISOString() } : t
      )
      set({ timelines })
      persist({ ...get(), timelines })
      renameTimeline(id, name)
    },

    loadTimeline: async (id) => {
      await persistActiveTimeline(get, set)

      const timeline = get().timelines.find((t) => t.id === id)
      if (!timeline) return
      // Free blob memory and signed URL cache from the previous timeline
      revokeAllObjectUrls()
      clearSignedUrlCache()
      switchHistory(id)
      const events = structuredClone(timeline.events)
      const photoMap = { ...timeline.photoMap }
      set({
        events,
        photoMap,
        activeTimelineId: id,
        // Restore undo/redo availability for this timeline's restored stacks
        // instead of hardcoding false (which left undo unreachable after a switch).
        ...historyFlags(),
        filters: EMPTY_FILTERS,
      })
      persist({ ...get(), events, activeTimelineId: id })
    },

    deleteTimeline: (id) => {
      const state = get()
      const deleted = state.timelines.find((t) => t.id === id)
      const timelines = state.timelines.filter((t) => t.id !== id)
      const updates = { timelines }
      if (state.activeTimelineId === id) {
        updates.activeTimelineId = null
        updates.events = []
        updates.photoMap = {}
        updates.filters = EMPTY_FILTERS
        updates.canUndo = false
        updates.canRedo = false
      }
      resetHistory(id)
      forgetUnsynced(id)
      set(updates)
      persist({ ...get(), ...updates })
      removeTimelineRemote(id)
      if (deleted) {
        get().showToast(`"${deleted.name}" deleted`, {
          duration: TOAST_DURATION.MEDIUM,
          actionLabel: 'Undo',
          onAction: () => {
            const current = get().timelines
            const restored = [...current, deleted]
            set({ timelines: restored })
            persist({ ...get(), timelines: restored })
            syncTimelineRemote({
              id: deleted.id,
              name: deleted.name,
              sortOrder: deleted.sortOrder || SORT_OPTIONS.DATE_ASC,
              activeView: deleted.activeView || VIEWS.VERTICAL,
            })
            if (deleted.events?.length) syncEventsRemote(deleted.id, deleted.events)
          },
        })
      }
    },

    /**
     * Make sure the events on screen belong to a timeline record. A first run
     * starts with events but no timeline, and sync skips a store without an
     * activeTimelineId, so those events never reached Supabase. Returns the
     * active id (or null while hydrating, when the real one isn't known yet).
     */
    ensureActiveTimeline: () => {
      const state = get()
      if (state.activeTimelineId) return state.activeTimelineId
      if (state._hydrating) return null
      const id = generateTimelineId()
      const now = new Date().toISOString()
      adoptHistory(id)
      const timelines = [
        ...state.timelines,
        {
          id,
          name: 'Untitled timeline',
          events: structuredClone(state.events),
          photoMap: { ...state.photoMap },
          sortOrder: state.sortOrder,
          activeView: state.activeView,
          createdAt: now,
          updatedAt: now,
        },
      ]
      set({ timelines, activeTimelineId: id })
      persist({ ...get(), timelines, activeTimelineId: id })
      return id
    },

    createNewTimeline: async (name) => {
      await persistActiveTimeline(get, set)

      const id = generateTimelineId()
      switchHistory(id)
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
        canUndo: false,
        canRedo: false,
        filters: EMPTY_FILTERS,
      })
      persist({ ...get(), timelines, activeTimelineId: id, events: [] })

      syncTimelineRemote({ id, name, sortOrder: SORT_OPTIONS.DATE_ASC, activeView: VIEWS.VERTICAL })

      return id
    },
  }
}
