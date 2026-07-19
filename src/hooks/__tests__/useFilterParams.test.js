import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'

// Control the store selector and the nuqs URL state directly so we can assert
// the bidirectional mapping without a real router or the whole store.
let mockState
vi.mock('@/store/useTimelineStore', () => ({
  default: (selector) => selector(mockState),
}))

let urlState
const setUrlFilters = vi.fn()
vi.mock('nuqs', () => ({
  useQueryStates: () => [urlState, setUrlFilters],
  parseAsString: { withDefault: () => ({}) },
  parseAsArrayOf: () => ({ withDefault: () => ({}) }),
}))

import useFilterParams from '../useFilterParams'

const emptyStoreFilters = { search: '', people: [], tags: [], dateFrom: '', dateTo: '' }
const emptyUrl = { q: '', people: [], tags: [], from: '', to: '' }

beforeEach(() => {
  setUrlFilters.mockClear()
})

describe('useFilterParams', () => {
  it('hydrates store filters from URL params on mount (incl. from/to)', () => {
    const setFilters = vi.fn()
    mockState = { filters: { ...emptyStoreFilters }, setFilters }
    urlState = { ...emptyUrl, from: '1950', to: '1960', tags: ['family'] }

    renderHook(() => useFilterParams())

    expect(setFilters).toHaveBeenCalledWith(
      expect.objectContaining({ dateFrom: '1950', dateTo: '1960', tags: ['family'] })
    )
  })

  it('does not hydrate when the URL has no filter params', () => {
    const setFilters = vi.fn()
    mockState = { filters: { ...emptyStoreFilters }, setFilters }
    urlState = { ...emptyUrl }

    renderHook(() => useFilterParams())

    expect(setFilters).not.toHaveBeenCalled()
  })

  it('writes a store date-range filter out to the URL', () => {
    const setFilters = vi.fn()
    mockState = { filters: { ...emptyStoreFilters, dateFrom: '1950' }, setFilters }
    urlState = { ...emptyUrl }

    renderHook(() => useFilterParams())

    expect(setUrlFilters).toHaveBeenCalledWith(expect.objectContaining({ from: '1950' }))
  })

  it('nulls a URL param when its store filter is cleared', () => {
    const setFilters = vi.fn()
    // Store has no dateFrom but the URL still carries from=1950 → should be nulled out
    mockState = { filters: { ...emptyStoreFilters }, setFilters }
    urlState = { ...emptyUrl, from: '1950' }

    renderHook(() => useFilterParams())

    expect(setUrlFilters).toHaveBeenCalledWith(expect.objectContaining({ from: null }))
  })
})
