// ─── Supabase Storage sync for photos ────────────────────
// Uploads, downloads, deletes, and lists photos in the
// 'timeliner_photos_private' bucket, scoped by device ID.
// All operations are fire-and-forget safe — failures are logged
// but never break local-first functionality.

import { supabase, getDeviceId } from './supabase'
import { PHOTO_CACHE_TTL } from '@/utils/constants'

const BUCKET = 'timeliner_photos_private'

function isOnline() {
  return supabase !== null
}

/** Build the storage path for a photo: {deviceId}/{filename} */
function storagePath(filename) {
  return `${getDeviceId()}/${filename}`
}

// ─── Upload ──────────────────────────────────────────────

/**
 * Upload a single photo Blob to Supabase Storage.
 * Upserts (overwrites if exists).
 * Returns { ok: true } on success, { ok: false, error: string } on failure.
 */
export async function uploadPhoto(filename, blob) {
  if (!isOnline()) return { ok: false, error: 'offline' }
  try {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath(filename), blob, {
        cacheControl: PHOTO_CACHE_TTL,
        upsert: true,
        contentType: blob.type || 'image/jpeg',
      })
    if (error) {
      console.error('[photoSync] upload error:', filename, error.message)
      return { ok: false, error: error.message }
    }
    if (import.meta.env.DEV) console.log('[photoSync] uploaded:', filename)
    return { ok: true }
  } catch (err) {
    console.error('[photoSync] upload exception:', filename, err.message)
    return { ok: false, error: err.message }
  }
}

/**
 * Upload multiple photos in parallel.
 * entries: { filename: Blob, ... }
 * Returns { succeeded: string[], failed: string[] }
 */
export async function uploadPhotos(entries) {
  if (!isOnline()) return { succeeded: [], failed: Object.keys(entries) }

  const results = await Promise.allSettled(
    Object.entries(entries).map(async ([filename, blob]) => {
      const result = await uploadPhoto(filename, blob)
      return { filename, ...result }
    })
  )

  const succeeded = []
  const failed = []
  for (const r of results) {
    if (r.status === 'fulfilled' && r.value.ok) {
      succeeded.push(r.value.filename)
    } else {
      const name = r.status === 'fulfilled' ? r.value.filename : 'unknown'
      failed.push(name)
    }
  }
  return { succeeded, failed }
}

// ─── Download ────────────────────────────────────────────

/**
 * Download a single photo from Supabase Storage as a Blob.
 * Returns the Blob or null if not found / error.
 */
export async function downloadPhoto(filename) {
  if (!isOnline()) return null
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .download(storagePath(filename))
    if (error) {
      // 'Object not found' is expected when the photo doesn't exist remotely
      if (!error.message?.includes('not found')) {
        console.error('[photoSync] download error:', filename, error.message)
      }
      return null
    }
    return data // Blob
  } catch (err) {
    console.error('[photoSync] download exception:', filename, err.message)
    return null
  }
}

// ─── Display URLs for remote-only photos ─────────────────

// filename → Promise<string | null> of a blob: URL. The storage path is
// "{deviceId}/{filename}" and the device ID is the only sync credential, so
// remote photos are never shown through signed URLs (which embed that path
// and can be copied out of the page). They are downloaded through the
// authenticated client instead and shown as local object URLs.
const remoteUrlCache = new Map()

/**
 * Get a displayable blob: URL for a photo that only exists remotely.
 * Concurrent and repeat calls share one download. Returns null when offline
 * or the photo is missing (a miss is not cached, so it can be retried).
 */
export function getRemotePhotoUrl(filename) {
  if (!isOnline()) return Promise.resolve(null)
  const cached = remoteUrlCache.get(filename)
  if (cached) return cached

  const pending = downloadPhoto(filename).then((blob) => {
    if (!blob) {
      remoteUrlCache.delete(filename)
      return null
    }
    return URL.createObjectURL(blob)
  })
  remoteUrlCache.set(filename, pending)
  return pending
}

function revokeRemoteUrl(filename) {
  const pending = remoteUrlCache.get(filename)
  remoteUrlCache.delete(filename)
  pending?.then((url) => url && URL.revokeObjectURL(url))
}

/**
 * Drop and revoke every remote photo URL (e.g. when switching timelines).
 */
export function clearRemotePhotoUrls() {
  for (const filename of [...remoteUrlCache.keys()]) revokeRemoteUrl(filename)
}

// ─── Delete ──────────────────────────────────────────────

/**
 * Delete a single photo from Supabase Storage.
 */
export async function deleteRemotePhoto(filename) {
  if (!isOnline()) return false
  try {
    const { error } = await supabase.storage
      .from(BUCKET)
      .remove([storagePath(filename)])
    if (error) {
      console.error('[photoSync] delete error:', filename, error.message)
      return false
    }
    revokeRemoteUrl(filename)
    if (import.meta.env.DEV) console.log('[photoSync] deleted:', filename)
    return true
  } catch (err) {
    console.error('[photoSync] delete exception:', filename, err.message)
    return false
  }
}

// ─── List remote photos ──────────────────────────────────

/**
 * List all photo filenames stored remotely for the current device.
 * Returns an array of filenames (without the device ID prefix).
 */
export async function listRemotePhotos() {
  if (!isOnline()) return []
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(getDeviceId(), { limit: 10000 })
    if (error) {
      console.error('[photoSync] list error:', error.message)
      return []
    }
    // Filter out folder placeholders (name === '.emptyFolderPlaceholder')
    return (data || [])
      .filter((f) => f.name && f.name !== '.emptyFolderPlaceholder')
      .map((f) => f.name)
  } catch (err) {
    console.error('[photoSync] list exception:', err.message)
    return []
  }
}
