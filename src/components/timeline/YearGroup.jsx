import { memo, useState, useCallback } from 'react'
import EventCard from './EventCard'
import MergeConfirmModal from './MergeConfirmModal'
import useTimelineStore from '@/store/useTimelineStore'
import { getTagPalette } from '@/utils/constants'

const stickyHeaderStyle = { backgroundColor: 'rgba(248, 250, 252, 0.8)' }

const YearGroup = memo(function YearGroup({
  year,
  events,
  editable = false,
  compact = false,
  selectedEventIds,
  onToggleSelect,
}) {
  const [dragOverId, setDragOverId] = useState(null)
  const [draggedId, setDraggedId] = useState(null)
  const [pendingMerge, setPendingMerge] = useState(null)
  const mergeEvents = useTimelineStore((s) => s.mergeEvents)
  const allEvents = useTimelineStore((s) => s.events)

  const handleDragStart = useCallback((e, eventId) => {
    setDraggedId(eventId)
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('text/plain', eventId)
  }, [])

  const handleDragOver = useCallback(
    (e, eventId) => {
      e.preventDefault()
      if (eventId === draggedId) return
      setDragOverId(eventId)
      e.dataTransfer.dropEffect = 'copy'
    },
    [draggedId]
  )

  const handleDragLeave = useCallback(() => {
    setDragOverId(null)
  }, [])

  const handleDrop = useCallback(
    (e, targetId) => {
      e.preventDefault()
      const sourceId = e.dataTransfer.getData('text/plain')
      setDragOverId(null)
      setDraggedId(null)

      if (!sourceId || sourceId === targetId) return

      // Find both events from the full event list
      const source = allEvents.find((ev) => ev.id === sourceId)
      const target = allEvents.find((ev) => ev.id === targetId)
      if (!source || !target) return

      // Open confirmation modal instead of merging immediately
      setPendingMerge({ source, target })
    },
    [allEvents]
  )

  const handleDragEnd = useCallback(() => {
    setDraggedId(null)
    setDragOverId(null)
  }, [])

  const handleConfirmMerge = useCallback(
    (sourceId, targetId) => {
      mergeEvents(sourceId, targetId)
      setPendingMerge(null)
    },
    [mergeEvents]
  )

  return (
    <div className="relative">
      {/* top-14 = header height (3.5rem) */}
      <div
        className={`sticky top-14 z-10 backdrop-blur-md ${compact ? 'py-1.5' : 'py-2.5'}`}
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
        className={`flex flex-col pl-5 border-l-2 border-gray-200/50 ml-3 overflow-visible ${compact ? 'gap-2' : 'gap-5'}`}
      >
        {events.map((event, i) => {
          const isDragOver = dragOverId === event.id
          const isBeingDragged = draggedId === event.id
          const isSelected = selectedEventIds?.includes(event.id)

          return (
            <div
              key={event.id}
              className={`relative timeline-card-enter transition-all duration-150 ${isBeingDragged ? 'opacity-40' : ''}`}
              style={{ animationDelay: `${i * 40}ms` }}
              draggable={editable}
              onDragStart={(e) => handleDragStart(e, event.id)}
              onDragOver={(e) => handleDragOver(e, event.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, event.id)}
              onDragEnd={handleDragEnd}
            >
              {/* Dot marker on the timeline */}
              <div
                className="absolute -left-[27px] top-4 w-2.5 h-2.5 rounded-full ring-2 ring-white timeline-dot-enter"
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
                  isDragOver={isDragOver}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Merge confirmation modal */}
      <MergeConfirmModal
        open={!!pendingMerge}
        onClose={() => setPendingMerge(null)}
        source={pendingMerge?.source}
        target={pendingMerge?.target}
        onConfirm={handleConfirmMerge}
      />
    </div>
  )
})

export default YearGroup
