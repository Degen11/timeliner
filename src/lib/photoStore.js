// ─── Dexie-backed photo storage ──────────────────────
// Stores photos as Blobs for ~33% smaller storage
// footprint and lower memory usage. Object URLs are generated on demand.

import db from './dexieDb'

// Max allowed size for a single photo (10 MB raw bytes).
const MAX_PHOTO_BYTES = 10 * 1024 * 1024

// JPEG quality for compression (0.8 = good quality, ~40% smaller than original)
const COMPRESS_QUALITY = 0.8
const COMPRESS_MAX_DIMENSION = 2048 // max width or height after resize

// ─── Compression ──────────────────────────────────────

/**
 * Compress a data URL into a JPEG Blob using canvas.
 * Returns the original data URL as a Blob if canvas is unavailable.
 */
async function compressDataUrl(dataUrl) {
  if (typeof document === 'undefined' || typeof HTMLCanvasElement === 'undefined') {
    return dataUrlToBlob(dataUrl)
  }

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      if (width > COMPRESS_MAX_DIMENSION || height > COMPRESS_MAX_DIMENSION) {
        const scale = COMPRESS_MAX_DIMENSION / Math.max(width, height)
        width = Math.round(width * scale)
        height = Math.round(height * scale)
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            resolve(dataUrlToBlob(dataUrl))
          }
        },
        'image/jpeg',
        COMPRESS_QUALITY
      )
    }
    img.onerror = () => resolve(dataUrlToBlob(dataUrl))
    img.src = dataUrl
  })
}

/** Convert a base64 data URL string to a Blob */
function dataUrlToBlob(dataUrl) {
  const [header, b64] = dataUrl.split(',')
  // Guard against a malformed data URL (no comma → b64 is undefined), which
  // would otherwise throw inside atob and break hydration on one bad entry.
  if (!b64) return null
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
  const bytes = atob(b64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

// ─── Object URL cache ─────────────────────────────────
const objectUrlCache = new Map()

function getObjectUrl(filename, blob) {
  if (objectUrlCache.has(filename)) return objectUrlCache.get(filename)
  const url = URL.createObjectURL(blob)
  objectUrlCache.set(filename, url)
  return url
}

/**
 * Revoke all cached object URLs to free blob memory.
 */
export function revokeAllObjectUrls() {
  for (const url of objectUrlCache.values()) {
    URL.revokeObjectURL(url)
  }
  objectUrlCache.clear()
}

/**
 * Store a single photo by filename → compressed Blob.
 * Accepts either a data URL string or a Blob.
 */
export async function putPhoto(filename, dataUrl) {
  const blob = dataUrl instanceof Blob ? dataUrl : await compressDataUrl(dataUrl)

  if (!blob) {
    console.warn(`[photoStore] "${filename}" could not be decoded — skipped`)
    return { ok: false, reason: 'invalid' }
  }
  if (blob.size > MAX_PHOTO_BYTES) {
    console.warn(`[photoStore] "${filename}" exceeds ${MAX_PHOTO_BYTES / 1e6}MB limit — skipped`)
    return { ok: false, reason: 'too_large' }
  }
  try {
    await db.photos.put(blob, filename)
    return { ok: true }
  } catch (err) {
    console.error('[photoStore] putPhoto error:', err)
    return { ok: false, reason: 'error' }
  }
}

/**
 * Store multiple photos at once: { filename: dataUrl, ... }
 * Compresses each photo before storing. Returns { oversized: [...filenames] }.
 */
export async function putPhotos(entries) {
  const oversized = []
  const allowed = {}

  for (const [filename, dataUrl] of Object.entries(entries)) {
    const blob = dataUrl instanceof Blob ? dataUrl : await compressDataUrl(dataUrl)

    if (blob.size > MAX_PHOTO_BYTES) {
      console.warn(`[photoStore] "${filename}" exceeds ${MAX_PHOTO_BYTES / 1e6}MB limit — skipped`)
      oversized.push(filename)
    } else {
      allowed[filename] = blob
    }
  }

  if (Object.keys(allowed).length === 0) return { ok: true, oversized }

  try {
    await db.transaction('rw', db.photos, () => {
      for (const [filename, blob] of Object.entries(allowed)) {
        db.photos.put(blob, filename)
      }
    })
    return { ok: true, oversized }
  } catch (err) {
    console.error('[photoStore] putPhotos error:', err)
    return { ok: false, oversized }
  }
}

/**
 * Get a single photo as a raw Blob from IndexedDB.
 * Handles legacy base64 data URL strings by converting them to Blobs.
 */
export async function getPhotoBlob(filename) {
  try {
    const value = await db.photos.get(filename)
    if (value instanceof Blob) return value
    if (typeof value === 'string' && value.startsWith('data:')) {
      const blob = dataUrlToBlob(value)
      if (!blob) return null
      // Opportunistically migrate to Blob format
      try { await db.photos.put(blob, filename) } catch { /* non-critical */ }
      return blob
    }
    return null
  } catch (err) {
    console.error('[photoStore] getPhotoBlob error:', err)
    return null
  }
}

/**
 * Get a single photo as a displayable URL. Returns null if not found.
 */
export async function getPhoto(filename) {
  try {
    const value = await db.photos.get(filename)
    if (!value) return null
    if (typeof value === 'string') return value
    return getObjectUrl(filename, value)
  } catch (err) {
    console.error('[photoStore] getPhoto error:', err)
    return null
  }
}

/**
 * Load all photos as a { filename: displayUrl } map.
 */
export async function getAllPhotos() {
  try {
    const result = {}
    await db.photos.each((value, cursor) => {
      const key = cursor.key
      if (typeof value === 'string') {
        result[key] = value
      } else if (value instanceof Blob) {
        result[key] = getObjectUrl(key, value)
      }
    })
    return result
  } catch (err) {
    console.error('[photoStore] getAllPhotos error:', err)
    return {}
  }
}

/**
 * Remove a single photo by filename.
 */
export async function deletePhoto(filename) {
  if (objectUrlCache.has(filename)) {
    URL.revokeObjectURL(objectUrlCache.get(filename))
    objectUrlCache.delete(filename)
  }
  try {
    await db.photos.delete(filename)
  } catch (err) {
    console.error('[photoStore] deletePhoto error:', err)
  }
}

/**
 * Remove all photos (e.g. when clearing a timeline).
 */
export async function clearAllPhotos() {
  for (const url of objectUrlCache.values()) {
    URL.revokeObjectURL(url)
  }
  objectUrlCache.clear()

  try {
    await db.photos.clear()
  } catch (err) {
    console.error('[photoStore] clearAllPhotos error:', err)
  }
}

/**
 * Migrate photos from localStorage's photoMap into IndexedDB.
 */
export async function migrateFromLocalStorage(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return {}
    const data = JSON.parse(raw)
    const photoMap = data?.photoMap
    if (!photoMap || typeof photoMap !== 'object' || Object.keys(photoMap).length === 0) return {}

    await putPhotos(photoMap)

    data.photoMap = {}
    localStorage.setItem(storageKey, JSON.stringify(data))

    const displayMap = {}
    for (const filename of Object.keys(photoMap)) {
      const url = await getPhoto(filename)
      if (url) displayMap[filename] = url
    }

    if (import.meta.env.DEV)
      console.log(
        `[photoStore] Migrated ${Object.keys(displayMap).length} photo(s) from localStorage to IndexedDB`
      )
    return displayMap
  } catch (err) {
    console.error('[photoStore] migration error:', err)
    return {}
  }
}
