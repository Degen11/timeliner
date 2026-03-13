import { memo, useMemo, useRef, useCallback } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { getEventsByYear, getEventsByMonth } from '@/store/selectors'
import EventCard from './EventCard'

const stickyHeaderStyle = { backgroundColor: 'var(--color-canvas)' }

const HEADER_HEIGHT = 52
const ROW_HEIGHT = 220
const VIRTUALIZE_THRESHOLD = 60

const GridView = memo(function GridView({
  events,
  editable = false,
  groupZoom = 'year',
  selectedEventIds,
  onToggleSelect,
  onEditEvent,
}) {
  const parentRef = useRef(null)

  const groups = useMemo(
    () => (groupZoom === 'month' ? getEventsByMonth(events) : getEventsByYear(events)),
    [events, groupZoom]
  )

  // Flatten into rows: headers + rows of 3 events each
  const flatItems = useMemo(() => {
    const items = []
    for (const group of groups) {
      items.push({ type: 'header', year: group.year, count: group.events.length })
      // Chunk events into rows of 3
      for (let i = 0; i < group.events.length; i += 3) {
        items.push({ type: 'row', events: group.events.slice(i, i + 3) })
      }
    }
    return items
  }, [groups])

  const shouldVirtualize = events.length > VIRTUALIZE_THRESHOLD

  const estimateSize = useCallback(
    (index) => flatItems[index].type === 'header' ? HEADER_HEIGHT : ROW_HEIGHT,
    [flatItems]
  )

  const virtualizer = useVirtualizer({
    count: shouldVirtualize ? flatItems.length : 0,
    getScrollElement: () => parentRef.current,
    estimateSize,
    overscan: 3,
    enabled: shouldVirtualize,
  })

  // Non-virtualized path — original layout
  if (!shouldVirtualize) {
    return (
      <div className="space-y-0">
        {groups.map(({ year, events: groupEvents }) => (
          <div key={year} className="pb-2">
            <div
              className="sticky top-14 z-10 -mx-4 px-4 py-2.5 mb-4"
              style={stickyHeaderStyle}
            >
              <div className="flex items-center gap-3">
                <h2 className="font-display font-bold text-text-strong text-lg">{year}</h2>
                <span className="text-[11px] font-medium text-text-muted tabular-nums shrink-0">
                  {groupEvents.length} {groupEvents.length === 1 ? 'event' : 'events'}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-200 via-gray-200/50 to-transparent" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {groupEvents.map((event, i) => {
                const isSelected = selectedEventIds?.includes(event.id)
                return (
                  <div
                    key={event.id}
                    className={`timeline-card-enter transition-all duration-200 ${isSelected ? 'ring-2 ring-secondary/50 rounded-xl' : ''}`}
                    style={{ animationDelay: `${i * 40}ms` }}
                    onClick={
                      onToggleSelect
                        ? (e) => {
                            if (e.shiftKey || e.metaKey || e.ctrlKey) {
                              e.preventDefault()
                              window.getSelection()?.removeAllRanges()
                              onToggleSelect(event.id, e)
                            }
                          }
                        : undefined
                    }
                  >
                    <EventCard event={event} editable={editable} isSelected={isSelected} onEdit={onEditEvent} />
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Virtualized path
  return (
    <div
      ref={parentRef}
      style={{ height: 'calc(100vh - 8rem)', overflow: 'auto' }}
      className="app-scroll"
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => {
          const item = flatItems[virtualRow.index]

          if (item.type === 'header') {
            return (
              <div
                key={`header-${item.year}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <div className="py-2.5 mb-2">
                  <div className="flex items-center gap-3">
                    <h2 className="font-display font-bold text-text-strong text-lg">{item.year}</h2>
                    <span className="text-[11px] font-medium text-text-muted tabular-nums shrink-0">
                      {item.count} {item.count === 1 ? 'event' : 'events'}
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-gray-200 via-gray-200/50 to-transparent" />
                  </div>
                </div>
              </div>
            )
          }

          return (
            <div
              key={`row-${virtualRow.index}`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${virtualRow.start}px)`,
              }}
              ref={virtualizer.measureElement}
              data-index={virtualRow.index}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
                {item.events.map((event) => {
                  const isSelected = selectedEventIds?.includes(event.id)
                  return (
                    <div
                      key={event.id}
                      className={`transition-all duration-200 ${isSelected ? 'ring-2 ring-secondary/50 rounded-xl' : ''}`}
                      onClick={
                        onToggleSelect
                          ? (e) => {
                              if (e.shiftKey || e.metaKey || e.ctrlKey) {
                                e.preventDefault()
                                window.getSelection()?.removeAllRanges()
                                onToggleSelect(event.id, e)
                              }
                            }
                          : undefined
                      }
                    >
                      <EventCard event={event} editable={editable} isSelected={isSelected} onEdit={onEditEvent} />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

export default GridView
