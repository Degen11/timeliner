import { create } from 'zustand'
import { setCustomTagRegistry, LOCAL_SAVE_DEBOUNCE_MS } from '@/utils/constants'
import { loadLocal, saveLocal, removeEventRemote } from '@/lib/dataService'
import { debouncedSync } from './remoteSync'
import { createEventsSlice, flushPendingDeletes } from './slices/eventsSlice'
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
  localSaveTimer = setTimeout(() => saveLocal(state), LOCAL_SAVE_DEBOUNCE_MS)
}

// ─── Debounced remote sync with retry ─────────────────────
// Lives in ./remoteSync so it can be tested on its own.

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
      'filters',
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

// Flush any pending remote deletes that survived a crash/tab close
flushPendingDeletes(removeEventRemote)

export default useTimelineStore
