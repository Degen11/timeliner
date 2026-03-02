// ─── Data Access Abstraction Layer ───────────────────────
//
// Central service that coordinates local (localStorage) and remote (Supabase)
// persistence. The store calls these methods instead of directly calling db.js
// and localStorage. When auth is added later, only this file needs to change.

import { STORAGE_KEY } from '@/utils/constants'
import {
  syncEvents,
  upsertTimeline,
  deleteTimelineRemote,
  renameTimelineRemote,
  loadInitialData,
  deleteEventRemote,
  testConnection,
} from './db'
import {
  putPhotos,
  getAllPhotos,
  clearAllPhotos,
  deletePhoto,
  migrateFromLocalStorage,
} from './photoStore'

// ─── Local storage ───────────────────────────────────────

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
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  } catch (err) {
    console.warn('[DataService] localStorage save failed:', err?.message || 'quota exceeded')
    onError?.(err)
  }
}

// ─── Photo storage (IndexedDB) ──────────────────────────

export async function initPhotos() {
  const migrated = await migrateFromLocalStorage(STORAGE_KEY)
  const stored = await getAllPhotos()
  return { ...stored, ...migrated }
}

export async function savePhotos(entries) {
  return putPhotos(entries)
}

export async function clearPhotos() {
  return clearAllPhotos()
}

export async function removePhoto(filename) {
  return deletePhoto(filename)
}

// ─── Remote (Supabase) ──────────────────────────────────

export async function checkRemoteConnection() {
  return testConnection()
}

export async function fetchRemoteData() {
  return loadInitialData()
}

export async function syncTimelineRemote({ id, name, sortOrder, activeView }) {
  return upsertTimeline({ id, name, sortOrder, activeView })
}

export async function syncEventsRemote(timelineId, events) {
  return syncEvents(timelineId, events)
}

export async function removeTimelineRemote(timelineId) {
  return deleteTimelineRemote(timelineId)
}

export async function renameTimeline(timelineId, name) {
  return renameTimelineRemote(timelineId, name)
}

export async function removeEventRemote(timelineId, eventId) {
  return deleteEventRemote(timelineId, eventId)
}
