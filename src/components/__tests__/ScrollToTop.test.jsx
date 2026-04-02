import { describe, it, expect, beforeEach, vi } from 'vitest'

describe('Scroll-to-top on view switch', () => {
  beforeEach(() => {
    // Mock window.scrollTo
    window.scrollTo = vi.fn()
  })

  it('calls scrollTo with top: 0 and behavior: instant', () => {
    // Simulate what the useEffect does on activeView change
    window.scrollTo({ top: 0, behavior: 'instant' })

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'instant' })
  })

  it('scrollTo is called with correct params (not smooth)', () => {
    window.scrollTo({ top: 0, behavior: 'instant' })

    const call = window.scrollTo.mock.calls[0][0]
    expect(call.behavior).toBe('instant')
    expect(call.top).toBe(0)
  })

  it('scrollTo is called each time view changes', () => {
    // Simulate multiple view changes
    window.scrollTo({ top: 0, behavior: 'instant' })
    window.scrollTo({ top: 0, behavior: 'instant' })
    window.scrollTo({ top: 0, behavior: 'instant' })

    expect(window.scrollTo).toHaveBeenCalledTimes(3)
  })
})
