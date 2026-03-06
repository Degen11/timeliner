import { memo, useState, useCallback, useRef } from 'react'
import EventCard from './EventCard'
import MergeConfirmModal from './MergeConfirmModal'
import useTimelineStore from '@/store/useTimelineStore'
import { getTagPalette } from '@/utils/constants'

// Uses CSS variable so dark mode overrides work
const stickyHeaderStyle = { backgroundColor: 'color-mix(in srgb, var(--color-canvas) 85%, transparent)' }

const YearGroup = memo(function YearGroup({
  year,
  events,
  editable = false,
  compact = false,
  selectedEventIds,
  onToggleSelect,
  onEditEvent,
}) {
  const [dragOverId, setDragOverId] = useState(null)
  const [draggedId, setDraggedId] = useState(null)
  const [pendingMerge, setPendingMerge] = useState(null)
  const dragCounterRef = useRef({})
  const mergeEvents = useTimelineStore((s) => s.mergeEvents)
  const allEvents = useTimelineStore((s) => s.events)

  const handleDragStart = useCallback((e, eventId) => {
    setDraggedId(eventId)
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('text/plain', eventId)

    // Create a styled drag image that looks like a card
    const el = e.currentTarget
    const rect = el.getBoundingClientRect()
    const ghost = el.cloneNode(true)
    ghost.style.width = `${rect.width}px`
    ghost.style.position = 'absolute'
    ghost.style.top = '-9999px'
    ghost.style.left = '-9999px'
    ghost.style.transform = 'rotate(1.5deg) scale(1.02)'
    ghost.style.boxShadow = '0 20px 40px -8px rgba(0,0,0,0.18), 0 8px 16px -4px rgba(0,0,0,0.1)'
    ghost.style.borderRadius = '12px'
    ghost.style.overflow = 'hidden'
    ghost.style.opacity = '0.95'
    ghost.style.pointerEvents = 'none'
    ghost.style.zIndex = '9999'
    document.body.appendChild(ghost)
    e.dataTransfer.setDragImage(ghost, rect.width / 2, 30)
    // Clean up the ghost element after the drag image is captured
    requestAnimationFrame(() => document.body.removeChild(ghost))
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

  const handleDragEnter = useCallback(
    (e, eventId) => {
      e.preventDefault()
      if (eventId === draggedId) return
      // Track enter/leave pairs per event to avoid clearing on child transitions
      dragCounterRef.current[eventId] = (dragCounterRef.current[eventId] || 0) + 1
      setDragOverId(eventId)
    },
    [draggedId]
  )

  const handleDragLeave = useCallback((e, eventId) => {
    dragCounterRef.current[eventId] = (dragCounterRef.current[eventId] || 0) - 1
    if (dragCounterRef.current[eventId] <= 0) {
      dragCounterRef.current[eventId] = 0
      setDragOverId((prev) => (prev === eventId ? null : prev))
    }
  }, [])

  const handleDrop = useCallback(
    (e, targetId) => {
      e.preventDefault()
      const sourceId = e.dataTransfer.getData('text/plain')
      setDragOverId(null)
      setDraggedId(null)
      dragCounterRef.current = {}

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
    dragCounterRef.current = {}
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
              className={`relative timeline-card-enter transition-all duration-200 ${isDragOver ? 'z-20' : ''} ${isBeingDragged ? 'opacity-30 scale-[0.97]' : ''} ${editable ? 'cursor-grab active:cursor-grabbing' : ''}`}
              style={{ animationDelay: `${i * 40}ms` }}
              draggable={editable}
              onDragStart={(e) => handleDragStart(e, event.id)}
              onDragOver={(e) => handleDragOver(e, event.id)}
              onDragEnter={(e) => handleDragEnter(e, event.id)}
              onDragLeave={(e) => handleDragLeave(e, event.id)}
              onDrop={(e) => handleDrop(e, event.id)}
              onDragEnd={handleDragEnd}
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
                  onEdit={onEditEvent}
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
