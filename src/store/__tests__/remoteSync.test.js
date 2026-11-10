import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@/lib/dataService', () => ({
  syncTimelineRemote: vi.fn(() => Promise.resolve()),
  syncEventsRemote: vi.fn(() => Promise.resolve()),
}))

import { syncWithRetry, debouncedSync, RETRY_DELAYS } from '../remoteSync'
import { syncEventsRemote, syncTimelineRemote } from '@/lib/dataService'
import { hasUnsyncedChanges, markUnsynced } from '@/lib/syncState'
import { REMOTE_SYNC_DEBOUNCE_MS } from '@/utils/constants'

function makeState() {
  const statuses = []
  const state = {
    activeTimelineId: 'tl_1',
    events: [{ id: 'e1', title: 'One' }],
    sortOrder: 'date-asc',
    activeView: 'vertical',
    timelines: [{ id: 'tl_1', name: 'Mine' }],
    _setSaveStatus: vi.fn((s) => statuses.push(s)),
    showToast: vi.fn(),
  }
  return { get: () => state, state, statuses }
}

beforeEach(() => {
  vi.useFakeTimers()
  localStorage.removeItem('timeliner_unsynced')
  syncEventsRemote.mockReset().mockResolvedValue()
  syncTimelineRemote.mockReset().mockResolvedValue()
  vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  vi.useRealTimers()
  console.error.mockRestore()
})

describe('syncWithRetry', () => {
  it('pushes the active timeline and its events, then clears the unsynced flag', async () => {
    const { get, statuses } = makeState()
    markUnsynced('tl_1')
    await syncWithRetry(get)
    expect(syncTimelineRemote).toHaveBeenCalledWith({ id: 'tl_1', name: 'Mine', sortOrder: 'date-asc', activeView: 'vertical' })
    expect(syncEventsRemote).toHaveBeenCalledWith('tl_1', [{ id: 'e1', title: 'One' }])
    expect(statuses).toEqual(['syncing', 'saved'])
    expect(hasUnsyncedChanges('tl_1')).toBe(false)
  })

  it('retries with 2/4/8s backoff and succeeds on a later attempt', async () => {
    const { get, statuses } = makeState()
    syncEventsRemote
      .mockRejectedValueOnce(new Error('offline'))
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue()
    const done = syncWithRetry(get)
    await vi.advanceTimersByTimeAsync(RETRY_DELAYS[0] - 1)
    expect(syncEventsRemote).toHaveBeenCalledTimes(1)
    await vi.advanceTimersByTimeAsync(1)
    expect(syncEventsRemote).toHaveBeenCalledTimes(2)
    await vi.advanceTimersByTimeAsync(RETRY_DELAYS[1])
    await done
    expect(syncEventsRemote).toHaveBeenCalledTimes(3)
    expect(statuses.at(-1)).toBe('saved')
  })

  it('gives up after 3 retries with an error status, a Retry toast and the flag still set', async () => {
    const { get, state, statuses } = makeState()
    markUnsynced('tl_1')
    syncEventsRemote.mockRejectedValue(new Error('offline'))
    const done = syncWithRetry(get)
    await vi.advanceTimersByTimeAsync(RETRY_DELAYS.reduce((a, b) => a + b, 0))
    await done
    expect(syncEventsRemote).toHaveBeenCalledTimes(4)
    expect(statuses.at(-1)).toBe('error')
    expect(hasUnsyncedChanges('tl_1')).toBe(true)
    const [message, opts] = state.showToast.mock.calls[0]
    expect(message).toMatch(/Sync failed/)
    expect(opts).toMatchObject({ variant: 'error', actionLabel: 'Retry' })

    // Retry schedules a fresh debounced sync
    syncEventsRemote.mockResolvedValue()
    opts.onAction()
    expect(statuses.at(-1)).toBe('pending')
    await vi.advanceTimersByTimeAsync(REMOTE_SYNC_DEBOUNCE_MS)
    expect(statuses.at(-1)).toBe('saved')
    expect(hasUnsyncedChanges('tl_1')).toBe(false)
  })

  it('keeps the flag when an edit lands while the sync is in flight', async () => {
    const { get } = makeState()
    markUnsynced('tl_1')
    syncEventsRemote.mockImplementation(async () => { markUnsynced('tl_1') })
    await syncWithRetry(get)
    expect(hasUnsyncedChanges('tl_1')).toBe(true)
  })

  it('does nothing without an active timeline', async () => {
    const { get, state } = makeState()
    state.activeTimelineId = null
    await syncWithRetry(get)
    expect(syncEventsRemote).not.toHaveBeenCalled()
  })
})

describe('debouncedSync', () => {
  it('flags the timeline, shows pending and collapses rapid calls into one sync', async () => {
    const { get, statuses } = makeState()
    debouncedSync(get)
    debouncedSync(get)
    expect(hasUnsyncedChanges('tl_1')).toBe(true)
    expect(statuses).toEqual(['pending', 'pending'])
    await vi.advanceTimersByTimeAsync(REMOTE_SYNC_DEBOUNCE_MS)
    expect(syncEventsRemote).toHaveBeenCalledTimes(1)
    expect(hasUnsyncedChanges('tl_1')).toBe(false)
  })
})
