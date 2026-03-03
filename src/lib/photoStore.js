// ─── IndexedDB-backed photo storage ──────────────────────
// Stores photos as Blobs (not base64 strings) for ~33% smaller storage
// footprint and lower memory usage. Object URLs are generated on demand.

const DB_NAME = 'timeliner_photos'
const DB_VERSION = 2 // bumped for Blob migration
const STORE_NAME = 'photos'

// Max allowed size for a single photo (10 MB raw bytes).
const MAX_PHOTO_BYTES = 10 * 1024 * 1024

// JPEG quality for compression (0.8 = good quality, ~40% smaller than original)
const COMPRESS_QUALITY = 0.8
const COMPRESS_MAX_DIMENSION = 2048 // max width or height after resize

let dbPromise = null

function openDB() {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME)
      }
      // No schema change needed — the store accepts any value type (string or Blob)
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => {
      console.error('[photoStore] IndexedDB open error:', req.error)
      dbPromise = null
      reject(req.error)
    }
  })
  return dbPromise
}

// ─── Compression ──────────────────────────────────────────

/**
 * Compress a data URL into a JPEG Blob using canvas.
 * Returns the original data URL as a Blob if canvas is unavailable.
 */
async function compressDataUrl(dataUrl) {
  // If not in a browser context or no canvas support, fall back to raw Blob
  if (typeof document === 'undefined' || typeof HTMLCanvasElement === 'undefined') {
    return dataUrlToBlob(dataUrl)
  }

  return new Promise((resolve) => {
    const img = new Image()
    img.onload = () => {
      let { width, height } = img
      // Scale down if exceeds max dimension
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
            // Fallback if toBlob fails
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
  const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
  const bytes = atob(b64)
  const arr = new Uint8Array(bytes.length)
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
  return new Blob([arr], { type: mime })
}

// ─── Object URL cache ─────────────────────────────────────
// Tracks active object URLs so they can be revoked to free memory.
const objectUrlCache = new Map()

/** Create or reuse an object URL for a Blob */
function getObjectUrl(filename, blob) {
  if (objectUrlCache.has(filename)) return objectUrlCache.get(filename)
  const url = URL.createObjectURL(blob)
  objectUrlCache.set(filename, url)
  return url
}

/**
 * Store a single photo by filename → compressed Blob.
 * Accepts either a data URL string or a Blob.
 * Returns { ok: false, reason: 'too_large' } if the photo exceeds limit.
 */
export async function putPhoto(filename, dataUrl) {
  const blob = dataUrl instanceof Blob ? dataUrl : await compressDataUrl(dataUrl)

  if (blob.size > MAX_PHOTO_BYTES) {
    console.warn(`[photoStore] "${filename}" exceeds ${MAX_PHOTO_BYTES / 1e6}MB limit — skipped`)
    return { ok: false, reason: 'too_large' }
  }
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).put(blob, filename)
      tx.oncomplete = () => resolve({ ok: true })
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.error('[photoStore] putPhoto error:', err)
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
    const db = await openDB()
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      const store = tx.objectStore(STORE_NAME)
      for (const [filename, blob] of Object.entries(allowed)) {
        store.put(blob, filename)
      }
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    return { ok: true, oversized }
  } catch (err) {
    console.error('[photoStore] putPhotos error:', err)
    return { ok: false, oversized }
  }
}

/**
 * Get a single photo as a displayable URL. Returns null if not found.
 * Handles both legacy base64 strings and Blob values.
 */
export async function getPhoto(filename) {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const req = tx.objectStore(STORE_NAME).get(filename)
      req.onsuccess = () => {
        const value = req.result
        if (!value) return resolve(null)
        // Legacy: stored as base64 data URL string
        if (typeof value === 'string') return resolve(value)
        // New: stored as Blob — create object URL
        resolve(getObjectUrl(filename, value))
      }
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.error('[photoStore] getPhoto error:', err)
    return null
  }
}

/**
 * Load all photos as a { filename: displayUrl } map.
 * Handles both legacy base64 strings and Blob values transparently.
 */
export async function getAllPhotos() {
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly')
      const store = tx.objectStore(STORE_NAME)
      const req = store.openCursor()
      const result = {}
      req.onsuccess = () => {
        const cursor = req.result
        if (cursor) {
          const value = cursor.value
          if (typeof value === 'string') {
            // Legacy base64 data URL
            result[cursor.key] = value
          } else if (value instanceof Blob) {
            // New Blob — create object URL
            result[cursor.key] = getObjectUrl(cursor.key, value)
          }
          cursor.continue()
        } else {
          resolve(result)
        }
      }
      req.onerror = () => reject(req.error)
    })
  } catch (err) {
    console.error('[photoStore] getAllPhotos error:', err)
    return {}
  }
}

/**
 * Remove a single photo by filename.
 */
export async function deletePhoto(filename) {
  // Revoke any cached object URL
  if (objectUrlCache.has(filename)) {
    URL.revokeObjectURL(objectUrlCache.get(filename))
    objectUrlCache.delete(filename)
  }
  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).delete(filename)
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.error('[photoStore] deletePhoto error:', err)
  }
}

/**
 * Remove all photos (e.g. when clearing a timeline).
 */
export async function clearAllPhotos() {
  // Revoke all cached object URLs
  for (const url of objectUrlCache.values()) {
    URL.revokeObjectURL(url)
  }
  objectUrlCache.clear()

  try {
    const db = await openDB()
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite')
      tx.objectStore(STORE_NAME).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
  } catch (err) {
    console.error('[photoStore] clearAllPhotos error:', err)
  }
}

/**
 * Migrate photos from localStorage's photoMap into IndexedDB.
 * Call once on app startup. Returns the migrated map (as displayable URLs)
 * or empty object.
 */
export async function migrateFromLocalStorage(storageKey) {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) return {}
    const data = JSON.parse(raw)
    const photoMap = data?.photoMap
    if (!photoMap || typeof photoMap !== 'object' || Object.keys(photoMap).length === 0) return {}

    await putPhotos(photoMap)

    // Remove photoMap from localStorage to free space
    data.photoMap = {}
    localStorage.setItem(storageKey, JSON.stringify(data))

    // Return displayable URLs (compressed Blobs are now in IndexedDB)
    const displayMap = {}
    for (const filename of Object.keys(photoMap)) {
      const url = await getPhoto(filename)
      if (url) displayMap[filename] = url
    }

    console.log(
      `[photoStore] Migrated ${Object.keys(displayMap).length} photo(s) from localStorage to IndexedDB`
    )
    return displayMap
  } catch (err) {
    console.error('[photoStore] migration error:', err)
    return {}
  }
}
