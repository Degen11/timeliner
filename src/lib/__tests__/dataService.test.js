import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the data-layer modules dataService imports so we can drive them and
// assert the localStorage <-> IndexedDB migration behavior in isolation.
vi.mock('../dataStore', () => ({
  loadData: vi.fn(() => Promise.resolve(null)),
  saveData: vi.fn(() => Promise.resolve()),
}))
vi.mock('../photoStore', () => ({
  getAllPhotos: vi.fn(() => Promise.resolve({})),
  migrateFromLocalStorage: vi.fn(() => Promise.resolve({})),
  putPhoto: vi.fn(() => Promise.resolve()),
  getPhoto: vi.fn(() => Promise.resolve(null)),
  getPhotoBlob: vi.fn(() => Promise.resolve(null)),
  putPhotos: vi.fn(),
  clearAllPhotos: vi.fn(),
  deletePhoto: vi.fn(),
}))
vi.mock('../photoSync', () => ({
  listRemotePhotos: vi.fn(() => Promise.resolve([])),
  downloadPhoto: vi.fn(),
  uploadPhoto: vi.fn(),
}))
vi.mock('../supabase', () => ({ supabase: null }))
vi.mock('../db', () => ({
  testConnection: vi.fn(),
  loadInitialData: vi.fn(),
  upsertTimeline: vi.fn(),
  syncEvents: vi.fn(),
  deleteTimelineRemote: vi.fn(),
  renameTimelineRemote: vi.fn(),
  deleteEventRemote: vi.fn(),
}))

import { STORAGE_KEY } from '@/utils/constants'
import { loadData, saveData } from '../dataStore'
import { loadLocalAsync, saveLocal, migrateToIndexedDB } from '../dataService'

beforeEach(() => {
  localStorage.clear()
  loadData.mockReset().mockResolvedValue(null)
  saveData.mockReset().mockResolvedValue()
})

describe('loadLocalAsync', () => {
  it('returns IndexedDB data when present', async () => {
    loadData.mockResolvedValue({ events: [{ id: 'e1' }] })
    expect(await loadLocalAsync()).toEqual({ events: [{ id: 'e1' }] })
  })

  it('falls back to localStorage when IndexedDB is empty (migration case)', async () => {
    loadData.mockResolvedValue(null)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ events: [{ id: 'x' }] }))
    const result = await loadLocalAsync()
    expect(result.events[0].id).toBe('x')
  })

  it('returns null when neither store has heavy data', async () => {
    loadData.mockResolvedValue(null)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ darkMode: true }))
    expect(await loadLocalAsync()).toBeNull()
  })
})

describe('migrateToIndexedDB', () => {
  it('moves heavy data into IndexedDB and trims localStorage to settings', async () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        events: [{ id: 'e1' }],
        timelines: [],
        darkMode: true,
        filters: { search: '', people: [], tags: [], dateFrom: '1950', dateTo: '' },
      })
    )
    loadData.mockResolvedValue(null) // IndexedDB empty → run the migration

    await migrateToIndexedDB()

    expect(saveData).toHaveBeenCalledWith(expect.objectContaining({ events: [{ id: 'e1' }] }))
    const trimmed = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(trimmed.events).toBeUndefined() // heavy data removed from localStorage
    expect(trimmed.darkMode).toBe(true) // settings retained
    // the date-range filter is a setting, so it survives the trim
    expect(trimmed.filters.dateFrom).toBe('1950')
  })

  it('does not re-copy when IndexedDB already has data, but still trims localStorage', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ events: [{ id: 'e1' }], darkMode: false }))
    loadData.mockResolvedValue({ events: [{ id: 'e1' }] }) // already migrated

    await migrateToIndexedDB()

    expect(saveData).not.toHaveBeenCalled()
    const trimmed = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(trimmed.events).toBeUndefined()
  })

  it('is a no-op when localStorage has no heavy data', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ darkMode: true }))
    await migrateToIndexedDB()
    expect(saveData).not.toHaveBeenCalled()
    // untouched
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY))).toEqual({ darkMode: true })
  })
})

describe('saveLocal', () => {
  it('routes heavy data to IndexedDB and settings (incl. filters) to localStorage', () => {
    const state = {
      events: [{ id: 'e1' }],
      timelines: [{ id: 't1' }],
      darkMode: true,
      activeView: 'vertical',
      filters: { search: '', people: [], tags: [], dateFrom: '1950', dateTo: '1960' },
      somethingIrrelevant: 'ignored',
    }

    saveLocal(state)

    // IndexedDB gets heavy fields (plus settings, for completeness)
    expect(saveData).toHaveBeenCalledWith(
      expect.objectContaining({ events: [{ id: 'e1' }], timelines: [{ id: 't1' }] })
    )
    // localStorage holds only settings — no events/timelines
    const ls = JSON.parse(localStorage.getItem(STORAGE_KEY))
    expect(ls.events).toBeUndefined()
    expect(ls.timelines).toBeUndefined()
    expect(ls.darkMode).toBe(true)
    expect(ls.filters.dateFrom).toBe('1950')
    expect(ls.filters.dateTo).toBe('1960')
    expect(ls.somethingIrrelevant).toBeUndefined()
  })
})
