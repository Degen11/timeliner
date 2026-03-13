import {
  initPhotos,
  savePhotos,
  clearPhotos,
  removePhoto,
  syncPhotosToRemote,
} from '@/lib/dataService'
import { uploadPhotos } from '@/lib/photoSync'
import { deleteRemotePhoto } from '@/lib/photoSync'
import { getPhotoBlob } from '@/lib/photoStore'
import { commitEvents } from './eventsSlice'

export function createPhotosSlice(set, get, { persist, sync }) {
  return {
    photoMap: {},
    photoOrder: [],
    photoUploadProgress: null, // { loaded, total } or null when idle

    setPhotoUploadProgress: (progress) => set({ photoUploadProgress: progress }),

    addToPhotoMap: (entries) => {
      const photoMap = { ...get().photoMap, ...entries }
      const currentOrder = get().photoOrder
      const newNames = Object.keys(entries).filter((name) => !currentOrder.includes(name))
      const photoOrder = [...currentOrder, ...newNames]
      set({ photoMap, photoOrder })
      persist({ ...get(), photoOrder })
      savePhotos(entries).then(async (result) => {
        if (result?.oversized?.length) {
          const names = result.oversized.join(', ')
          get().showToast(`Photo too large to save (max 10 MB): ${names}`, {
            variant: 'error',
            duration: 7000,
          })
        }
        // Upload to Supabase Storage in the background
        const blobEntries = {}
        for (const filename of Object.keys(entries)) {
          if (result?.oversized?.includes(filename)) continue
          const blob = await getPhotoBlob(filename)
          if (blob) blobEntries[filename] = blob
        }
        if (Object.keys(blobEntries).length > 0) {
          uploadPhotos(blobEntries)
        }
      })
    },

    getPhotoUrl: (filename) => {
      return get().photoMap[filename] || null
    },

    attachPhotoToEvent: (filename, eventId) => {
      commitEvents(get, set, (events) =>
        events.map((e) => {
          if (e.id === eventId) {
            const photos = e.photos || []
            if (!photos.includes(filename)) return { ...e, photos: [...photos, filename] }
          }
          return e
        }),
        { persist, sync }
      )
    },

    detachPhotoFromEvent: (filename, eventId) => {
      commitEvents(get, set, (events) =>
        events.map((e) =>
          e.id === eventId ? { ...e, photos: (e.photos || []).filter((p) => p !== filename) } : e
        ),
        { persist, sync }
      )
    },

    deletePhoto: (filename) => {
      const { [filename]: _, ...rest } = get().photoMap
      const photoOrder = get().photoOrder.filter((n) => n !== filename)
      set({ photoMap: rest, photoOrder })
      removePhoto(filename)
      deleteRemotePhoto(filename) // Remove from Supabase Storage
      commitEvents(get, set, (events) =>
        events.map((e) =>
          e.photos?.includes(filename)
            ? { ...e, photos: e.photos.filter((p) => p !== filename) }
            : e
        ),
        { persist, sync }
      )
    },

    reorderPhotos: (fromName, toName) => {
      const order = [...get().photoOrder]
      const fromIdx = order.indexOf(fromName)
      const toIdx = order.indexOf(toName)
      if (fromIdx === -1 || toIdx === -1) return
      order.splice(fromIdx, 1)
      order.splice(toIdx, 0, fromName)
      set({ photoOrder: order })
      persist({ ...get(), photoOrder: order })
    },

    // ─── Hydrate photos from IndexedDB on startup ────────

    hydratePhotos: async () => {
      const photos = await initPhotos()
      if (Object.keys(photos).length > 0) {
        const currentOrder = get().photoOrder
        const photoKeys = Object.keys(photos)
        const validOrder = currentOrder.filter((name) => name in photos)
        const newPhotos = photoKeys.filter((name) => !validOrder.includes(name))
        const photoOrder = [...validOrder, ...newPhotos]
        set({ photoMap: photos, photoOrder })
      }
    },

    // ─── Sync remote photos to local on startup ──────────

    syncRemotePhotos: async () => {
      const result = await syncPhotosToRemote(get().photoMap)
      const downloaded = result?.downloaded || result // backward compat if shape changes
      if (downloaded && typeof downloaded === 'object' && Object.keys(downloaded).length > 0) {
        const photoMap = { ...get().photoMap, ...downloaded }
        const currentOrder = get().photoOrder
        const newNames = Object.keys(downloaded).filter((n) => !currentOrder.includes(n))
        const photoOrder = [...currentOrder, ...newNames]
        set({ photoMap, photoOrder })
      }
      if (result?.failedUploads > 0) {
        get().showToast(
          `${result.failedUploads} photo${result.failedUploads > 1 ? 's' : ''} failed to sync — will retry next session`,
          { variant: 'error', duration: 7000 }
        )
      }
    },
  }
}
