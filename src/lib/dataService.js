import { STORAGE_KEY } from '@/utils/constants'
import { getAllPhotos, migrateFromLocalStorage } from './photoStore'

export function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function saveLocal(state, onError) {
  try {
    const data = {
      events: state.events,
      activeView: state.activeView,
      timelines: state.timelines,
      activeTimelineId: state.activeTimelineId,
      sortOrder: state.sortOrder,
      groupZoom: state.groupZoom,
      verticalCompact: state.verticalCompact,
      sidebarCollapsed: state.sidebarCollapsed,
      customTags: state.customTags,
      photoOrder: state.photoOrder,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (err) {
    if (import.meta.env.DEV)
      console.warn('[DataService] localStorage save failed:', err?.message || 'quota exceeded')
    onError?.(err)
  }
}

export async function initPhotos() {
  const migrated = await migrateFromLocalStorage(STORAGE_KEY)
  const stored = await getAllPhotos()
  return { ...stored, ...migrated }
}

// Re-exports — the store imports these by name from this module.
// Using re-exports instead of wrapper functions eliminates indirection.
export {
  putPhotos as savePhotos,
  clearAllPhotos as clearPhotos,
  deletePhoto as removePhoto,
} from './photoStore'
export {
  testConnection as checkRemoteConnection,
  loadInitialData as fetchRemoteData,
  upsertTimeline as syncTimelineRemote,
  syncEvents as syncEventsRemote,
  deleteTimelineRemote as removeTimelineRemote,
  renameTimelineRemote as renameTimeline,
  deleteEventRemote as removeEventRemote,
} from './db'
