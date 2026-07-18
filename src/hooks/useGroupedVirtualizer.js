import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { getEventsByYear, getEventsByMonth, getEventsByDecade } from '@/store/selectors'
import { VIRTUALIZE_THRESHOLD } from '@/utils/constants'

/**
 * Group events for the grouped timeline views. Pure — call it in the component
 * render body so the React Compiler memoizes it against (events, groupZoom,
 * sortOrder). Keeping it out of useGroupedVirtualizer matters: that hook is
 * compiler-skipped (useVirtualizer returns non-memoizable functions), so any
 * grouping done inside it would re-run on every scroll-driven render.
 */
export function groupEventsByZoom(events, groupZoom, sortOrder) {
  if (groupZoom === 'month') return getEventsByMonth(events, sortOrder)
  if (groupZoom === 'decade') return getEventsByDecade(events, sortOrder)
  return getEventsByYear(events, sortOrder)
}

/**
 * Shared hook for virtualized grouped timeline views. Owns only the
 * virtualizer; grouping/flattening is done by the caller (see above) and the
 * flattened rows are passed in.
 *
 * @param {object} opts
 * @param {Array} opts.flatItems - Pre-flattened row items (headers + rows)
 * @param {Function} opts.estimateSize - (index, flatItems) => height
 * @param {number} [opts.overscan] - virtualizer overscan count
 */
export default function useGroupedVirtualizer({ flatItems, estimateSize, overscan = 5 }) {
  const parentRef = useRef(null)

  const shouldVirtualize = flatItems.length > VIRTUALIZE_THRESHOLD

  // Wrap estimateSize to inject flatItems
  const wrappedEstimateSize = (index) => estimateSize(index, flatItems)

  // TanStack Virtual returns non-memoizable functions, so the React Compiler
  // intentionally skips memoizing this hook — expected and safe here.
  // eslint-disable-next-line react-hooks/incompatible-library -- virtualization is intentional; compiler-skip is the desired behavior
  const virtualizer = useVirtualizer({
    count: shouldVirtualize ? flatItems.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: wrappedEstimateSize,
    overscan,
    enabled: shouldVirtualize,
  })

  return { parentRef, shouldVirtualize, virtualizer }
}
