import { memo, useCallback } from 'react'
import { motion } from 'framer-motion'
import { getTagPalette, EASE_OUT } from '@/utils/constants'
import useGroupedVirtualizer from '@/hooks/useGroupedVirtualizer'
import EventCard from './EventCard'

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: EASE_OUT, delay: i * 0.04 },
  }),
}

const dotVariants = {
  hidden: { scale: 0 },
  visible: (i) => ({
    scale: 1,
    transition: { type: 'spring', stiffness: 500, damping: 20, delay: i * 0.04 + 0.06 },
  }),
}

const stickyHeaderStyle = { backgroundColor: 'var(--color-canvas)' }

const HEADER_HEIGHT = 48
const EVENT_HEIGHT_COMPACT = 52
const EVENT_HEIGHT_NORMAL = 160

const flattenVerticalGroups = (groups) => {
  const items = []
  for (const group of groups) {
    items.push({ type: 'header', year: group.year, count: group.events.length })
    for (const event of group.events) {
      items.push({ type: 'event', event })
    }
  }
  return items
}

const VerticalView = memo(function VerticalView({
  events,
  editable = false,
  compact = false,
  groupZoom = 'year',
  selectedEventIds,
  onToggleSelect,
  onEditEvent,
}) {
  const { parentRef, groups, flatItems, shouldVirtualize, virtualizer } = useGroupedVirtualizer({
    events,
    groupZoom,
    flattenGroups: flattenVerticalGroups,
    estimateSize: useCallback(
      (index, flatItems) => {
        if (flatItems[index].type === 'header') return HEADER_HEIGHT
        return compact ? EVENT_HEIGHT_COMPACT : EVENT_HEIGHT_NORMAL
      },
      [compact]
    ),
    overscan: 5,
  })

  // Non-virtualized path for small lists
  if (!shouldVirtualize) {
    return (
      <div className={`flex flex-col ${compact ? 'gap-0' : 'gap-0'}`}>
        {groups.map(({ year, events: yearEvents }) => (
          <div key={year} className="relative pb-2">
            <div
              className={`sticky top-14 z-10 -mx-4 px-4 ${compact ? 'py-1.5' : 'py-2.5'}`}
              style={stickyHeaderStyle}
            >
              <div className="flex items-center gap-3">
                <h2 className={`font-display font-bold text-text-strong ${compact ? 'text-sm' : 'text-base sm:text-lg'}`}>
                  {year}
                </h2>
                <span className="text-[11px] font-medium text-text-muted tabular-nums shrink-0">
                  {yearEvents.length} {yearEvents.length === 1 ? 'event' : 'events'}
                </span>
                <div className="flex-1 h-px bg-gradient-to-r from-gray-200 via-gray-200/50 to-transparent" />
              </div>
            </div>
            <div className={`flex flex-col pl-5 border-l-2 border-gray-200/50 ml-3 overflow-visible timeline-connector ${compact ? 'gap-2 pt-1' : 'gap-5 pt-2'}`}>
              {yearEvents.map((event, i) => {
                const isSelected = selectedEventIds?.includes(event.id)
                return (
                  <motion.div
                    key={event.id}
                    className="relative transition-all duration-200"
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    custom={i}
                  >
                    <motion.div
                      className="absolute -left-[27px] top-4 w-2.5 h-2.5 rounded-full ring-2 ring-canvas"
                      aria-hidden="true"
                      variants={dotVariants}
                      initial="hidden"
                      animate="visible"
                      custom={i}
                      style={{
                        backgroundColor: event.tags?.[0] ? getTagPalette(event.tags[0]).activeBg : 'var(--color-secondary)',
                      }}
                    />
                    <div
                      className={`${isSelected ? 'ring-2 ring-secondary/50 rounded-xl' : ''}`}
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
                      <EventCard event={event} editable={editable} compact={compact} isSelected={isSelected} onEdit={onEditEvent} />
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }

  // Virtualized path for large lists
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
                <div className={`${compact ? 'py-1.5' : 'py-2.5'}`}>
                  <div className="flex items-center gap-3">
                    <h2 className={`font-display font-bold text-text-strong ${compact ? 'text-sm' : 'text-base sm:text-lg'}`}>
                      {item.year}
                    </h2>
                    <span className="text-[11px] font-medium text-text-muted tabular-nums shrink-0">
                      {item.count} {item.count === 1 ? 'event' : 'events'}
                    </span>
                    <div className="flex-1 h-px bg-gradient-to-r from-gray-200 via-gray-200/50 to-transparent" />
                  </div>
                </div>
              </div>
            )
          }

          const event = item.event
          const isSelected = selectedEventIds?.includes(event.id)

          return (
            <div
              key={event.id}
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
              <div className={`pl-5 border-l-2 border-gray-200/50 ml-3 timeline-connector ${compact ? 'py-1' : 'py-2.5'}`}>
                <div className="relative transition-all duration-200">
                  <div
                    className="absolute -left-[27px] top-4 w-2.5 h-2.5 rounded-full ring-2 ring-canvas"
                    aria-hidden="true"
                    style={{
                      backgroundColor: event.tags?.[0] ? getTagPalette(event.tags[0]).activeBg : 'var(--color-secondary)',
                    }}
                  />
                  <div
                    className={`${isSelected ? 'ring-2 ring-secondary/50 rounded-xl' : ''}`}
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
                    <EventCard event={event} editable={editable} compact={compact} isSelected={isSelected} onEdit={onEditEvent} />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

export default VerticalView
