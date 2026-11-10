import { REMOTE_SYNC_DEBOUNCE_MS, TOAST_DURATION } from '@/utils/constants'
import { syncTimelineRemote, syncEventsRemote } from '@/lib/dataService'
import { markUnsynced, getUnsyncedMark, clearUnsynced } from '@/lib/syncState'

// ─── Debounced remote sync with retry ─────────────────────

export const MAX_SYNC_RETRIES = 3
export const RETRY_DELAYS = [2000, 4000, 8000] // exponential backoff

/**
 * Push the active timeline and its events to Supabase, retrying with
 * backoff. On success the timeline's unsynced flag is cleared (unless a newer
 * edit landed mid-sync); after the last failure the flag stays set, so the
 * local copy wins on the next start, and a Retry toast is shown.
 */
export async function syncWithRetry(get) {
  const { activeTimelineId, events, sortOrder, activeView, timelines } = get()
  if (!activeTimelineId) return

  const tl = timelines.find((t) => t.id === activeTimelineId)
  const name = tl?.name || 'Untitled'
  const mark = getUnsyncedMark(activeTimelineId) ?? undefined

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
      clearUnsynced(activeTimelineId, mark)
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
          duration: TOAST_DURATION.SYNC_ERROR,
          actionLabel: 'Retry',
          onAction: () => debouncedSync(get),
        })
      }
    }
  }
}

let syncTimer = null

/** Schedule a sync of the active timeline, marking it as having unsynced changes. */
export function debouncedSync(get) {
  markUnsynced(get().activeTimelineId)
  clearTimeout(syncTimer)
  syncTimer = setTimeout(() => syncWithRetry(get), REMOTE_SYNC_DEBOUNCE_MS)
  // Mark as pending immediately
  get()._setSaveStatus('pending')
}
