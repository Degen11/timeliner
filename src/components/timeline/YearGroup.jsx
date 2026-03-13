import { memo } from 'react'
import EventCard from './EventCard'
import { getTagPalette } from '@/utils/constants'

// Uses CSS variable so dark mode overrides work
const stickyHeaderStyle = { backgroundColor: 'var(--color-canvas)' }

const YearGroup = memo(function YearGroup({
  year,
  events,
  editable = false,
  compact = false,
  selectedEventIds,
  onToggleSelect,
  onEditEvent,
}) {
  return (
    <div className="relative pb-2">
      {/* top-14 = header height (3.5rem); -mx/px trick ensures full bleed coverage for smooth replacement */}
      <div
        className={`sticky top-14 z-10 -mx-4 px-4 ${compact ? 'py-1.5' : 'py-2.5'}`}
        style={stickyHeaderStyle}
      >
        <div className="flex items-center gap-3">
          <h2
            className={`font-display font-bold text-text-strong ${compact ? 'text-sm' : 'text-lg'}`}
          >
            {year}
          </h2>
          <span className="text-[11px] font-medium text-text-muted tabular-nums shrink-0">
            {events.length} {events.length === 1 ? 'event' : 'events'}
          </span>
          <div className="flex-1 h-px bg-gradient-to-r from-gray-200 via-gray-200/50 to-transparent" />
        </div>
      </div>
      <div
        className={`flex flex-col pl-5 border-l-2 border-gray-200/50 ml-3 overflow-visible ${compact ? 'gap-2 pt-1' : 'gap-5 pt-2'}`}
      >
        {events.map((event, i) => {
          const isSelected = selectedEventIds?.includes(event.id)

          return (
            <div
              key={event.id}
              className="relative timeline-card-enter transition-all duration-200"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {/* Dot marker on the timeline */}
              <div
                className="absolute -left-[27px] top-4 w-2.5 h-2.5 rounded-full ring-2 ring-canvas timeline-dot-enter"
                aria-hidden="true"
                style={{
                  backgroundColor: event.tags?.[0] ? getTagPalette(event.tags[0]).activeBg : 'var(--color-secondary)',
                  animationDelay: `${i * 40 + 60}ms`,
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
                <EventCard
                  event={event}
                  editable={editable}
                  compact={compact}
                  isSelected={isSelected}
                  onEdit={onEditEvent}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
})

export default YearGroup
