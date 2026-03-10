// ─── Modal z-index stacking manager ─────────────────────
// Tracks open modals and assigns incrementing z-indexes so that
// modals opened from within other modals always render on top.

const BASE_Z = 50
const STEP = 10

let stack = []
let counter = 0

export function pushModal() {
  const id = ++counter
  const zIndex = BASE_Z + stack.length * STEP
  stack.push(id)
  return { id, zIndex }
}

export function popModal(id) {
  stack = stack.filter((s) => s !== id)
}

export function getModalZIndex(id) {
  const idx = stack.indexOf(id)
  if (idx === -1) return BASE_Z
  return BASE_Z + idx * STEP
}
