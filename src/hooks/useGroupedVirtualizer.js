import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { getEventsByYear, getEventsByMonth, getEventsByDecade } from '@/store/selectors'
import { VIRTUALIZE_THRESHOLD } from '@/utils/constants'
import useTimelineStore from '@/store/useTimelineStore'

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
  const sortOrder = useTimelineStore((s) => s.sortOrder)

  const groups =
    groupZoom === 'month'
      ? getEventsByMonth(events, sortOrder)
      : groupZoom === 'decade'
        ? getEventsByDecade(events, sortOrder)
        : getEventsByYear(events, sortOrder)

  const flatItems = flattenGroups(groups)

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

  return { parentRef, groups, flatItems, shouldVirtualize, virtualizer }
}
