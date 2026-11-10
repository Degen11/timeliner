// Which timelines have local changes that haven't reached Supabase yet.
//
// Conflict rule for cross-device sync (see hydrateFromRemote):
//   - A timeline listed here has edits this device made that never synced
//     (offline, a failed sync, a tab closed inside the debounce window), so on
//     the next start its local copy wins and is pushed up.
//   - Every other timeline takes the remote copy, which is what this device
//     last synced or something newer another device wrote.
// This replaces comparing the local updatedAt with the server's updated_at:
// the server stamps updated_at on every sync, so remote nearly always looked
// newer and a reload could replace unsynced local edits with stale data.
//
// Stored in localStorage (like timeliner_pending_deletes) so it survives a
// crash or tab close. Values are the time of the latest unsynced edit, which
// lets a finished sync tell whether another edit landed while it ran.

const UNSYNCED_KEY = 'timeliner_unsynced'

function read() {
  try {
    const parsed = JSON.parse(localStorage.getItem(UNSYNCED_KEY) || '{}')
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

function write(map) {
  try {
    if (Object.keys(map).length === 0) localStorage.removeItem(UNSYNCED_KEY)
    else localStorage.setItem(UNSYNCED_KEY, JSON.stringify(map))
  } catch { /* localStorage unavailable — non-critical */ }
}

let lastMark = 0

/** Record an unsynced local change. Returns a marker for clearUnsynced. */
export function markUnsynced(timelineId) {
  if (!timelineId) return null
  // Strictly increasing, so two edits in the same millisecond get different
  // markers and a sync that started between them can't clear the second one
  const mark = Math.max(Date.now(), lastMark + 1)
  lastMark = mark
  write({ ...read(), [timelineId]: mark })
  return mark
}

/** Current marker for a timeline, or null if it has no unsynced changes. */
export function getUnsyncedMark(timelineId) {
  return read()[timelineId] ?? null
}

export function hasUnsyncedChanges(timelineId) {
  return getUnsyncedMark(timelineId) !== null
}

/**
 * Clear the flag after a successful sync. Pass the marker read when the sync
 * started: if a newer edit was marked meanwhile, the flag stays.
 */
export function clearUnsynced(timelineId, mark) {
  const map = read()
  if (!(timelineId in map)) return
  if (mark !== undefined && map[timelineId] !== mark) return
  delete map[timelineId]
  write(map)
}

/** Forget a timeline entirely (e.g. it was deleted). */
export function forgetUnsynced(timelineId) {
  clearUnsynced(timelineId)
}
