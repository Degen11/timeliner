import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { applyDarkMode, THEME_COLOR } from '@/utils/constants'

describe('applyDarkMode — dark mode application', () => {
  let root

  beforeEach(() => {
    root = document.documentElement
    root.classList.remove('dark')
    document.head.insertAdjacentHTML('beforeend', '<meta name="theme-color" content="#f5f5f4" />')
  })

  afterEach(() => {
    root.classList.remove('dark')
    document.querySelector('meta[name="theme-color"]')?.remove()
    delete document.startViewTransition
    vi.restoreAllMocks()
  })

  it('toggles the dark class and syncs theme-color', () => {
    applyDarkMode(true)
    expect(root.classList.contains('dark')).toBe(true)
    expect(document.querySelector('meta[name="theme-color"]').getAttribute('content')).toBe(THEME_COLOR.DARK)

    applyDarkMode(false)
    expect(root.classList.contains('dark')).toBe(false)
    expect(document.querySelector('meta[name="theme-color"]').getAttribute('content')).toBe(THEME_COLOR.LIGHT)
  })

  it('applies instantly without animate (does not call startViewTransition)', () => {
    document.startViewTransition = vi.fn((cb) => cb())
    applyDarkMode(true)
    expect(document.startViewTransition).not.toHaveBeenCalled()
    expect(root.classList.contains('dark')).toBe(true)
  })

  it('wraps the switch in startViewTransition when animate is true and supported', () => {
    document.startViewTransition = vi.fn((cb) => cb())
    applyDarkMode(true, { animate: true })
    expect(document.startViewTransition).toHaveBeenCalledTimes(1)
    expect(root.classList.contains('dark')).toBe(true)
  })

  it('falls back to an instant switch when startViewTransition is unsupported', () => {
    // jsdom has no startViewTransition by default
    expect(typeof document.startViewTransition).toBe('undefined')
    applyDarkMode(true, { animate: true })
    expect(root.classList.contains('dark')).toBe(true)
  })

  it('skips the animation when the user prefers reduced motion', () => {
    document.startViewTransition = vi.fn((cb) => cb())
    vi.spyOn(window, 'matchMedia').mockReturnValue({ matches: true })
    applyDarkMode(true, { animate: true })
    expect(document.startViewTransition).not.toHaveBeenCalled()
    expect(root.classList.contains('dark')).toBe(true)
  })
})
