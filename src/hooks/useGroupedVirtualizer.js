import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { getEventsByYear, getEventsByMonth } from '@/store/selectors'
import { VIRTUALIZE_THRESHOLD } from '@/utils/constants'

/**
 * Shared hook for virtualized grouped timeline views.
 *
 * @param {object} opts
 * @param {Array} opts.events - Event array
 * @param {string} opts.groupZoom - 'year' | 'month'
 * @param {Function} opts.flattenGroups - (groups) => flatItems[]
 * @param {Function} opts.estimateSize - (index, flatItems) => height
 * @param {number} [opts.overscan] - virtualizer overscan count
 */
export default function useGroupedVirtualizer({
  events,
  groupZoom,
  flattenGroups,
  estimateSize,
  overscan = 5,
}) {
  const parentRef = useRef(null)

  const groups = groupZoom === 'month' ? getEventsByMonth(events) : getEventsByYear(events)

  const flatItems = flattenGroups(groups)

  const shouldVirtualize = flatItems.length > VIRTUALIZE_THRESHOLD

  // Wrap estimateSize to inject flatItems
  const wrappedEstimateSize = (index) => estimateSize(index, flatItems)

  const virtualizer = useVirtualizer({
    count: shouldVirtualize ? flatItems.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: wrappedEstimateSize,
    overscan,
    enabled: shouldVirtualize,
  })

  return { parentRef, groups, flatItems, shouldVirtualize, virtualizer }
}
