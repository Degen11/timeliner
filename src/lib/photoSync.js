// ─── Supabase Storage sync for photos ────────────────────
// Uploads, downloads, deletes, and lists photos in the
// 'timeliner_photos_private' bucket, scoped by device ID.
// All operations are fire-and-forget safe — failures are logged
// but never break local-first functionality.

import { supabase, getDeviceId } from './supabase'

const BUCKET = 'timeliner_photos_private'

// Signed URL lifetime: 1 hour (seconds)
const SIGNED_URL_EXPIRY = 3600

// In-memory cache: filename → { url, expiresAt }
const signedUrlCache = new Map()

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
        cacheControl: '31536000', // 1 year — immutable content
        upsert: true,
        contentType: blob.type || 'image/jpeg',
      })
    if (error) {
      console.error('[photoSync] upload error:', filename, error.message)
      return { ok: false, error: error.message }
    }
    console.log('[photoSync] uploaded:', filename)
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

// ─── Signed URLs ─────────────────────────────────────────

/**
 * Get a temporary signed URL for a photo.
 * Uses an in-memory cache to avoid redundant API calls.
 * Returns the URL string or null.
 */
export async function getSignedUrl(filename) {
  if (!isOnline()) return null

  // Check cache
  const cached = signedUrlCache.get(filename)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.url
  }

  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath(filename), SIGNED_URL_EXPIRY)
    if (error) {
      if (!error.message?.includes('not found')) {
        console.error('[photoSync] signedUrl error:', filename, error.message)
      }
      return null
    }
    // Cache with 5 min buffer before actual expiry
    signedUrlCache.set(filename, {
      url: data.signedUrl,
      expiresAt: Date.now() + (SIGNED_URL_EXPIRY - 300) * 1000,
    })
    return data.signedUrl
  } catch (err) {
    console.error('[photoSync] signedUrl exception:', filename, err.message)
    return null
  }
}

/**
 * Clear the signed URL cache (e.g. when switching timelines).
 */
export function clearSignedUrlCache() {
  signedUrlCache.clear()
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
    // Remove from signed URL cache
    signedUrlCache.delete(filename)
    if (import.meta.env.DEV) console.log('[photoSync] deleted:', filename)
    return true
  } catch (err) {
    console.error('[photoSync] delete exception:', filename, err.message)
    return false
  }
}

/**
 * Delete multiple photos from Supabase Storage.
 */
export async function deleteRemotePhotos(filenames) {
  if (!isOnline() || filenames.length === 0) return
  try {
    const paths = filenames.map(storagePath)
    const { error } = await supabase.storage.from(BUCKET).remove(paths)
    if (error) {
      console.error('[photoSync] bulk delete error:', error.message)
    }
    for (const f of filenames) signedUrlCache.delete(f)
  } catch (err) {
    console.error('[photoSync] bulk delete exception:', err.message)
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
