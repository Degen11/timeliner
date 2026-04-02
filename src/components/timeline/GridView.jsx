import clsx from 'clsx'
import useGroupedVirtualizer from '@/hooks/useGroupedVirtualizer'
import useIsMobile from '@/hooks/useIsMobile'
import useScrollReveal from '@/hooks/useScrollReveal'
import EventCard from './EventCard'

function ScrollRevealGridCard({ children, index }) {
  const { ref, revealed } = useScrollReveal()
  return (
    <div
      ref={ref}
      className={`scroll-reveal-card ${revealed ? 'revealed' : ''}`}
      style={{ transitionDelay: `${index * 40}ms` }}
    >
      {children}
    </div>
  )
}

const stickyHeaderStyle = {
  backgroundColor: 'color-mix(in srgb, var(--color-canvas) 85%, transparent)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
}

const HEADER_HEIGHT = 52
const ROW_HEIGHT_MOBILE = 200
const ROW_HEIGHT_DESKTOP = 220

function makeFlattenGridGroups(cols) {
  return (groups) => {
    const items = []
    for (const group of groups) {
      items.push({ type: 'header', year: group.year, count: group.events.length })
      for (let i = 0; i < group.events.length; i += cols) {
        items.push({ type: 'row', events: group.events.slice(i, i + cols) })
      }
    }
    return items
  }
}

function GridView({
  events,
  editable = false,
  groupZoom = 'year',
  selectedEventIds,
  onToggleSelect,
  onEditEvent,
  searchQuery = '',
}) {
  const isMobile = useIsMobile()
  const cols = isMobile ? 1 : 3
  const rowHeight = isMobile ? ROW_HEIGHT_MOBILE : ROW_HEIGHT_DESKTOP

  const flattenGroups = makeFlattenGridGroups(cols)

  const { parentRef, groups, flatItems, shouldVirtualize, virtualizer } = useGroupedVirtualizer({
    events,
    groupZoom,
    flattenGroups,
    estimateSize: (index, items) => items[index].type === 'header' ? HEADER_HEIGHT : rowHeight,
    overscan: isMobile ? 5 : 3,
  })

  const renderSelectHandler = (eventId) =>
    onToggleSelect
      ? (e) => {
          if (e.shiftKey || e.metaKey || e.ctrlKey) {
            e.preventDefault()
            window.getSelection()?.removeAllRanges()
            onToggleSelect(eventId, e)
          }
        }
      : undefined

  if (!shouldVirtualize) {
    return (
      <div className="space-y-0">
        {groups.map(({ year, events: groupEvents }) => (
          <div key={year} className="pb-2">
            <div
              className="sticky top-14 z-10 -mx-3 px-3 sm:-mx-4 sm:px-4 py-2 sm:py-2.5 mb-3 sm:mb-4"
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {groupEvents.map((event, i) => {
                const isSelected = selectedEventIds?.includes(event.id)
                return (
                  <ScrollRevealGridCard key={event.id} index={i}>
                    <div
                      className={clsx(
                        'transition-all duration-200',
                        isSelected && 'ring-2 ring-secondary/50 rounded-xl'
                      )}
                      onClick={renderSelectHandler(event.id)}
                    >
                      <EventCard event={event} editable={editable} isSelected={isSelected} onEdit={onEditEvent} searchQuery={searchQuery} />
                    </div>
                  </ScrollRevealGridCard>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    )
  }

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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pb-4">
                {item.events.map((event) => {
                  const isSelected = selectedEventIds?.includes(event.id)
                  return (
                    <div
                      key={event.id}
                      className={clsx(
                        'transition-all duration-200',
                        isSelected && 'ring-2 ring-secondary/50 rounded-xl'
                      )}
                      onClick={renderSelectHandler(event.id)}
                    >
                      <EventCard event={event} editable={editable} isSelected={isSelected} onEdit={onEditEvent} searchQuery={searchQuery} />
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
}

export default GridView
