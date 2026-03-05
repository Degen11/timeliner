import { STORAGE_KEY } from '@/utils/constants'
import { getAllPhotos, migrateFromLocalStorage } from './photoStore'
import { saveData, loadData } from './dataStore'

// ─── Fields split between localStorage (lightweight) and IndexedDB (heavy) ──

const SETTINGS_FIELDS = [
  'activeView', 'activeTimelineId', 'sortOrder', 'groupZoom',
  'verticalCompact', 'sidebarCollapsed', 'customTags', 'photoOrder',
]

const HEAVY_FIELDS = ['events', 'timelines']

/**
 * Load persisted state synchronously from localStorage.
 * Returns lightweight settings immediately. Heavy data (events, timelines)
 * is loaded async via loadLocalAsync().
 */
export function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * Load heavy data (events, timelines) from IndexedDB.
 * Falls back to localStorage data if IndexedDB is empty (migration case).
 */
export async function loadLocalAsync() {
  try {
    const idbData = await loadData()
    if (idbData) return idbData

    // Fallback: first run after migration, read from localStorage
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (parsed?.events?.length > 0 || parsed?.timelines?.length > 0) {
      return parsed
    }
    return null
  } catch {
    return null
  }
}

/**
 * Save state to both IndexedDB (heavy data) and localStorage (settings).
 * IndexedDB is the primary store; localStorage is a lightweight cache
 * for fast synchronous reads on startup.
 */
export function saveLocal(state, onError) {
  // 1. Save heavy data to IndexedDB (async, large quota)
  const heavyData = {}
  for (const field of HEAVY_FIELDS) {
    if (state[field] !== undefined) heavyData[field] = state[field]
  }
  // Also include settings in IDB for completeness
  for (const field of SETTINGS_FIELDS) {
    if (state[field] !== undefined) heavyData[field] = state[field]
  }
  saveData(heavyData).catch((err) => {
    if (import.meta.env.DEV)
      console.warn('[DataService] IndexedDB save failed:', err?.message)
  })

  // 2. Save lightweight settings to localStorage (sync, fast reads)
  try {
    const settings = {}
    for (const field of SETTINGS_FIELDS) {
      if (state[field] !== undefined) settings[field] = state[field]
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch (err) {
    // localStorage quota error is non-fatal now since IndexedDB is primary
    if (import.meta.env.DEV)
      console.warn('[DataService] localStorage settings save failed:', err?.message)
    // Only show error to user if it's truly a problem (shouldn't happen
    // since we're only saving small settings now, but just in case)
    onError?.(err)
  }
}

/**
 * Migrate heavy data out of localStorage into IndexedDB.
 * Call once on startup. After migration, trims localStorage
 * to settings-only to free space.
 */
export async function migrateToIndexedDB() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return

    const data = JSON.parse(raw)
    const hasHeavyData = data?.events?.length > 0 || data?.timelines?.length > 0

    if (!hasHeavyData) return

    // Check if IndexedDB already has data (already migrated)
    const existing = await loadData()
    if (existing?.events?.length > 0) {
      // Already migrated — just trim localStorage
      trimLocalStorage(data)
      return
    }

    // Save heavy data to IndexedDB
    await saveData(data)

    // Trim localStorage to settings-only
    trimLocalStorage(data)

    if (import.meta.env.DEV)
      console.log(`[DataService] Migrated ${data.events?.length || 0} events to IndexedDB`)
  } catch (err) {
    if (import.meta.env.DEV)
      console.warn('[DataService] Migration error:', err)
  }
}

function trimLocalStorage(data) {
  try {
    const settings = {}
    for (const field of SETTINGS_FIELDS) {
      if (data[field] !== undefined) settings[field] = data[field]
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // If even settings don't fit, clear entirely (IndexedDB has the data)
    try { localStorage.removeItem(STORAGE_KEY) } catch {}
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
