// ─── Modal z-index stacking manager ─────────────────────
// Tracks open modals and assigns incrementing z-indexes so that
// modals opened from within other modals always render on top.

const BASE_Z = 1100  // Must exceed Leaflet's highest z-index (controls: 1000)
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
