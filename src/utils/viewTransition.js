// Morph event cards between timeline views with the View Transitions API.
// Cards carry data-vt-id={event.id}; just before and just after the switch,
// the ones on screen get a view-transition-name, so the browser animates each
// card from its old box to its new one and crossfades everything else.
// Browsers without the API (and reduced-motion users) get the plain swap.
import { flushSync } from 'react-dom'
import { prefersReducedMotion, VIEW_TRANSITION_MAX_CARDS } from '@/utils/constants'

const SWITCHING_CLASS = 'vt-view-switch'

function cssIdent(id) {
  return `vt-${String(id).replace(/[^a-zA-Z0-9_-]/g, '_')}`
}

// Name the visible cards (first one per event id; names must be unique)
function nameVisibleCards() {
  const named = []
  const seen = new Set()
  const vh = window.innerHeight
  const vw = window.innerWidth
  for (const el of document.querySelectorAll('[data-vt-id]')) {
    if (named.length >= VIEW_TRANSITION_MAX_CARDS) break
    const id = el.getAttribute('data-vt-id')
    if (seen.has(id) || el.closest('[role="dialog"]')) continue
    const r = el.getBoundingClientRect()
    if (r.width === 0 || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue
    el.style.viewTransitionName = cssIdent(id)
    seen.add(id)
    named.push(el)
  }
  return named
}

function clearNames(els) {
  for (const el of els) el.style.viewTransitionName = ''
}

/**
 * Apply a view change (a store update that re-renders the timeline) inside a
 * view transition when the browser supports it.
 */
export function withViewTransition(update) {
  if (
    typeof document === 'undefined' ||
    typeof document.startViewTransition !== 'function' ||
    prefersReducedMotion()
  ) {
    update()
    return
  }

  const root = document.documentElement
  let named = nameVisibleCards()
  let transition
  try {
    transition = document.startViewTransition(() => {
      clearNames(named)
      // Scroll-reveal cards mount hidden; show them for the new snapshot
      root.classList.add(SWITCHING_CLASS)
      flushSync(update)
      named = nameVisibleCards()
    })
  } catch {
    clearNames(named)
    update()
    return
  }
  transition.finished.finally(() => {
    clearNames(named)
    root.classList.remove(SWITCHING_CLASS)
  })
}
