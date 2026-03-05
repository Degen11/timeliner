import { memo, useState, useCallback } from 'react'
import EventCard from './EventCard'
import useTimelineStore from '@/store/useTimelineStore'

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
  const [dragOverMerge, setDragOverMerge] = useState(false)
  const [draggedId, setDraggedId] = useState(null)
  const reorderEvents = useTimelineStore((s) => s.reorderEvents)
  const mergeEvents = useTimelineStore((s) => s.mergeEvents)
  const allEvents = useTimelineStore((s) => s.events)

  const handleDragStart = useCallback((e, eventId) => {
    setDraggedId(eventId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', eventId)
  }, [])

  const handleDragOver = useCallback(
    (e, eventId) => {
      e.preventDefault()
      if (eventId === draggedId) return
      const rect = e.currentTarget.getBoundingClientRect()
      const midY = rect.top + rect.height / 2
      // If hovering on the center 40% of the card, show merge indicator
      const pct = (e.clientY - rect.top) / rect.height
      const isMerge = pct > 0.3 && pct < 0.7
      setDragOverId(eventId)
      setDragOverMerge(isMerge)
      e.dataTransfer.dropEffect = isMerge ? 'copy' : 'move'
    },
    [draggedId]
  )

  const handleDragLeave = useCallback(() => {
    setDragOverId(null)
    setDragOverMerge(false)
  }, [])

  const handleDrop = useCallback(
    (e, targetId) => {
      e.preventDefault()
      const sourceId = e.dataTransfer.getData('text/plain')
      if (!sourceId || sourceId === targetId) {
        setDragOverId(null)
        setDragOverMerge(false)
        setDraggedId(null)
        return
      }

      if (dragOverMerge) {
        // Merge source into target
        mergeEvents(sourceId, targetId)
      } else {
        // Reorder: move source before/after target
        const newEvents = [...allEvents]
        const sourceIdx = newEvents.findIndex((e) => e.id === sourceId)
        const targetIdx = newEvents.findIndex((e) => e.id === targetId)
        if (sourceIdx === -1 || targetIdx === -1) return
        const [moved] = newEvents.splice(sourceIdx, 1)
        const insertIdx = sourceIdx < targetIdx ? targetIdx : targetIdx
        newEvents.splice(insertIdx, 0, moved)
        reorderEvents(newEvents)
      }

      setDragOverId(null)
      setDragOverMerge(false)
      setDraggedId(null)
    },
    [dragOverMerge, mergeEvents, reorderEvents, allEvents]
  )

  const handleDragEnd = useCallback(() => {
    setDraggedId(null)
    setDragOverId(null)
    setDragOverMerge(false)
  }, [])

  return (
    <div className="relative">
      {/* top-14 = header height (3.5rem) */}
      <div
        className={`sticky top-14 z-10 backdrop-blur-md ${compact ? 'py-1' : 'py-2'}`}
        style={stickyHeaderStyle}
      >
        <h2
          className={`font-display font-bold text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}
        >
          {year}
        </h2>
      </div>
      <div
        className={`flex flex-col pl-5 border-l-2 border-gray-200 ml-3 ${compact ? 'gap-2' : 'gap-4'}`}
      >
        {events.map((event) => {
          const isDragOver = dragOverId === event.id
          const isBeingDragged = draggedId === event.id
          const isSelected = selectedEventIds?.includes(event.id)

          return (
            <div
              key={event.id}
              className={`relative transition-all duration-150 ${isBeingDragged ? 'opacity-40' : ''} ${
                isDragOver && dragOverMerge
                  ? 'ring-2 ring-secondary rounded-xl scale-[1.01]'
                  : isDragOver
                    ? 'border-t-2 border-secondary'
                    : ''
              }`}
              draggable={editable}
              onDragStart={(e) => handleDragStart(e, event.id)}
              onDragOver={(e) => handleDragOver(e, event.id)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, event.id)}
              onDragEnd={handleDragEnd}
            >
              {/* Dot marker on the timeline */}
              <div
                className="absolute -left-[27px] top-4 w-2.5 h-2.5 rounded-full bg-secondary ring-2 ring-white"
                aria-hidden="true"
              />
              {/* Merge hint overlay */}
              {isDragOver && dragOverMerge && (
                <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-secondary/5 pointer-events-none">
                  <span className="text-xs font-medium text-secondary bg-white px-2 py-1 rounded-md shadow-sm">
                    Drop to merge
                  </span>
                </div>
              )}
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
