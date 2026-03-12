import { create } from 'zustand'
import { setCustomTagRegistry } from '@/utils/constants'
import {
  loadLocal,
  saveLocal,
  syncTimelineRemote,
  syncEventsRemote,
} from '@/lib/dataService'
import { createEventsSlice } from './slices/eventsSlice'
import { createPhotosSlice } from './slices/photosSlice'
import { createUISlice } from './slices/uiSlice'
import { createTimelinesSlice } from './slices/timelinesSlice'

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
function handleVisibilityChange() {
  if (document.visibilityState === 'visible' && _storeGetter) {
    const status = _storeGetter().saveStatus
    if (status === 'error' || status === 'pending') {
      debouncedSync(_storeGetter)
    }
  }
}
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', handleVisibilityChange)
  // Clean up on HMR to prevent duplicate listeners
  if (import.meta.hot) {
    import.meta.hot.dispose(() => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    })
  }
}

// ─── Store ────────────────────────────────────────────────

const useTimelineStore = create((set, get) => {
  // Expose getter for the visibilitychange retry listener
  _storeGetter = get

  // Shared helpers injected into all slices — avoids circular deps
  const helpers = {
    persist: debouncedSaveToStorage,
    sync: debouncedSync,
  }

  const eventsSlice = createEventsSlice(set, get, helpers)
  const photosSlice = createPhotosSlice(set, get, helpers)
  const uiSlice = createUISlice(set, get, helpers)
  const timelinesSlice = createTimelinesSlice(set, get, helpers)

  // Apply persisted state over slice defaults
  const restored = {}
  if (persisted) {
    const fields = [
      'events', 'activeView', 'sortOrder', 'groupZoom', 'verticalCompact',
      'verticalDesign', 'horizontalDesign', 'sidebarCollapsed', 'customTags',
      'photoOrder', 'darkMode', 'timelines', 'activeTimelineId', 'photoMap',
    ]
    for (const field of fields) {
      if (persisted[field] !== undefined) restored[field] = persisted[field]
    }
    // Don't show hydrating skeleton if we already have events from localStorage
    if (persisted.events?.length > 0) restored._hydrating = false
  }

  return {
    ...eventsSlice,
    ...photosSlice,
    ...uiSlice,
    ...timelinesSlice,
    ...restored,
  }
})

export default useTimelineStore
