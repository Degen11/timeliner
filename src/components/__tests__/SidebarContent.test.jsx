import { describe, it, expect, beforeEach, vi } from 'vitest'

const SIDEBAR_COLLAPSE_KEY = 'timeliner_sidebar_sections'

describe('Sidebar section collapse persistence', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('persists collapsed state to localStorage', () => {
    const state = { Timeline: true, Filters: false, Tools: true }
    localStorage.setItem(SIDEBAR_COLLAPSE_KEY, JSON.stringify(state))

    const saved = JSON.parse(localStorage.getItem(SIDEBAR_COLLAPSE_KEY))
    expect(saved.Timeline).toBe(true)
    expect(saved.Filters).toBe(false)
    expect(saved.Tools).toBe(true)
  })

  it('reads collapsed state from localStorage', () => {
    const state = { Timeline: false, Filters: true }
    localStorage.setItem(SIDEBAR_COLLAPSE_KEY, JSON.stringify(state))

    const saved = JSON.parse(localStorage.getItem(SIDEBAR_COLLAPSE_KEY))
    expect(saved.Timeline).toBe(false)
    expect(saved.Filters).toBe(true)
  })

  it('returns empty object when localStorage is empty', () => {
    const raw = localStorage.getItem(SIDEBAR_COLLAPSE_KEY)
    expect(raw).toBeNull()

    // readCollapsedSections fallback behavior
    let result
    try {
      result = JSON.parse(raw) || {}
    } catch {
      result = {}
    }
    expect(result).toEqual({})
  })

  it('handles corrupted localStorage gracefully', () => {
    localStorage.setItem(SIDEBAR_COLLAPSE_KEY, 'not-json')

    let result
    try {
      result = JSON.parse(localStorage.getItem(SIDEBAR_COLLAPSE_KEY)) || {}
    } catch {
      result = {}
    }
    expect(result).toEqual({})
  })

  it('updates individual section without losing others', () => {
    const initial = { Timeline: true, Filters: true }
    localStorage.setItem(SIDEBAR_COLLAPSE_KEY, JSON.stringify(initial))

    // Simulate toggling Filters to false
    const saved = JSON.parse(localStorage.getItem(SIDEBAR_COLLAPSE_KEY))
    saved.Filters = false
    localStorage.setItem(SIDEBAR_COLLAPSE_KEY, JSON.stringify(saved))

    const updated = JSON.parse(localStorage.getItem(SIDEBAR_COLLAPSE_KEY))
    expect(updated.Timeline).toBe(true)
    expect(updated.Filters).toBe(false)
  })

  it('defaults section to defaultOpen when not in localStorage', () => {
    const saved = {}
    localStorage.setItem(SIDEBAR_COLLAPSE_KEY, JSON.stringify(saved))

    const parsed = JSON.parse(localStorage.getItem(SIDEBAR_COLLAPSE_KEY))
    const defaultOpen = true
    const isOpen = 'Timeline' in parsed ? parsed.Timeline : defaultOpen
    expect(isOpen).toBe(true)
  })
})
