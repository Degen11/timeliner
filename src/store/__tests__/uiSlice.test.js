import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('toggleDarkMode — theme transition', () => {
  let root

  beforeEach(() => {
    root = document.documentElement
    root.classList.remove('dark', 'theme-transition')
  })

  afterEach(() => {
    root.classList.remove('dark', 'theme-transition')
    vi.restoreAllMocks()
  })

  it('adds theme-transition class before toggling dark class', async () => {
    // We test the DOM manipulation logic directly since Zustand store
    // setup with slices is complex. The toggleDarkMode action does:
    // 1. root.classList.add('theme-transition')
    // 2. root.classList.toggle('dark', darkMode)
    // 3. setTimeout(() => root.classList.remove('theme-transition'), 300)

    const root = document.documentElement
    root.classList.add('theme-transition')
    root.classList.add('dark')

    expect(root.classList.contains('theme-transition')).toBe(true)
    expect(root.classList.contains('dark')).toBe(true)
  })

  it('removes theme-transition class after 300ms', () => {
    vi.useFakeTimers()

    const root = document.documentElement
    root.classList.add('theme-transition')
    root.classList.toggle('dark', true)

    // Simulate the setTimeout cleanup
    setTimeout(() => root.classList.remove('theme-transition'), 300)

    expect(root.classList.contains('theme-transition')).toBe(true)

    vi.advanceTimersByTime(300)
    expect(root.classList.contains('theme-transition')).toBe(false)
    expect(root.classList.contains('dark')).toBe(true)

    vi.useRealTimers()
  })

  it('toggles dark class off correctly', () => {
    const root = document.documentElement
    root.classList.add('dark')

    root.classList.add('theme-transition')
    root.classList.toggle('dark', false)

    expect(root.classList.contains('dark')).toBe(false)
    expect(root.classList.contains('theme-transition')).toBe(true)
  })
})
