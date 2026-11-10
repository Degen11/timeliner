import { describe, it, expect, beforeEach } from 'vitest'
import { markUnsynced, getUnsyncedMark, hasUnsyncedChanges, clearUnsynced, forgetUnsynced } from '../syncState'

beforeEach(() => localStorage.removeItem('timeliner_unsynced'))

describe('syncState', () => {
  it('marks and clears a timeline', () => {
    const mark = markUnsynced('tl_1')
    expect(hasUnsyncedChanges('tl_1')).toBe(true)
    expect(hasUnsyncedChanges('tl_2')).toBe(false)
    clearUnsynced('tl_1', mark)
    expect(hasUnsyncedChanges('tl_1')).toBe(false)
    expect(localStorage.getItem('timeliner_unsynced')).toBeNull()
  })

  it('keeps the flag when a newer edit landed while the sync ran', () => {
    const atSyncStart = markUnsynced('tl_1')
    const newer = markUnsynced('tl_1')
    expect(newer).toBeGreaterThan(atSyncStart)
    clearUnsynced('tl_1', atSyncStart)
    expect(getUnsyncedMark('tl_1')).toBe(newer)
  })

  it('forgets a timeline regardless of its marker', () => {
    markUnsynced('tl_1')
    forgetUnsynced('tl_1')
    expect(hasUnsyncedChanges('tl_1')).toBe(false)
  })

  it('treats corrupt storage as nothing unsynced', () => {
    localStorage.setItem('timeliner_unsynced', '[1,2')
    expect(hasUnsyncedChanges('tl_1')).toBe(false)
    expect(markUnsynced(null)).toBeNull()
  })
})
