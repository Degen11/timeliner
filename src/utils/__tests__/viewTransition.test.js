import { describe, it, expect, vi, afterEach } from 'vitest'
import { withViewTransition } from '../viewTransition'

function card(id, rect = { top: 10, bottom: 110, left: 10, right: 310, width: 300 }) {
  const el = document.createElement('div')
  el.setAttribute('data-vt-id', id)
  el.getBoundingClientRect = () => rect
  document.body.appendChild(el)
  return el
}

afterEach(() => {
  document.body.innerHTML = ''
  delete document.startViewTransition
  document.documentElement.classList.remove('vt-view-switch')
})

describe('withViewTransition', () => {
  it('just applies the update when the API is missing', () => {
    const update = vi.fn()
    withViewTransition(update)
    expect(update).toHaveBeenCalledTimes(1)
  })

  it('names visible cards before and after the update, then clears them', async () => {
    const before = card('evt_a')
    const copy = card('evt_a') // second copy of the same event: names must stay unique
    const offscreen = card('evt_b', { top: 5000, bottom: 5100, left: 0, right: 300, width: 300 })

    let namesDuringSnapshot
    let finish
    document.startViewTransition = vi.fn((cb) => {
      namesDuringSnapshot = [...document.querySelectorAll('[data-vt-id]')].map((el) => el.style.viewTransitionName)
      cb()
      return { finished: new Promise((r) => { finish = r }) }
    })

    let after
    withViewTransition(() => {
      before.remove()
      copy.remove()
      after = card('evt_a')
    })

    expect(namesDuringSnapshot).toEqual(['vt-evt_a', '', ''])
    expect(offscreen.style.viewTransitionName).toBe('')
    expect(after.style.viewTransitionName).toBe('vt-evt_a')
    expect(document.documentElement.classList.contains('vt-view-switch')).toBe(true)

    finish()
    await Promise.resolve()
    await Promise.resolve()
    expect(after.style.viewTransitionName).toBe('')
    expect(document.documentElement.classList.contains('vt-view-switch')).toBe(false)
  })
})
