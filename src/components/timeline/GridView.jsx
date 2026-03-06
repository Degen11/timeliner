import { memo, useMemo, useState, useCallback, useRef } from 'react'
import { getEventsByYear, getEventsByMonth } from '@/store/selectors'
import EventCard from './EventCard'
import MergeConfirmModal from './MergeConfirmModal'
import useTimelineStore from '@/store/useTimelineStore'

const GridView = memo(function GridView({
  events,
  editable = false,
  groupZoom = 'year',
  selectedEventIds,
  onToggleSelect,
  onEditEvent,
}) {
  const groups = useMemo(
    () => (groupZoom === 'month' ? getEventsByMonth(events) : getEventsByYear(events)),
    [events, groupZoom]
  )

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

      const source = allEvents.find((ev) => ev.id === sourceId)
      const target = allEvents.find((ev) => ev.id === targetId)
      if (!source || !target) return

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
    <div className="space-y-10">
      {groups.map(({ year, events: groupEvents }) => (
        <div key={year}>
          <div className="flex items-center gap-3 mb-4">
            <h2 className="font-display font-bold text-text-strong text-lg">{year}</h2>
            <span className="text-[11px] font-medium text-text-muted tabular-nums shrink-0">
              {groupEvents.length} {groupEvents.length === 1 ? 'event' : 'events'}
            </span>
            <div className="flex-1 h-px bg-gradient-to-r from-gray-200 via-gray-200/50 to-transparent" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupEvents.map((event, i) => {
              const isSelected = selectedEventIds?.includes(event.id)
              const isDragOver = dragOverId === event.id
              const isBeingDragged = draggedId === event.id
              return (
                <div
                  key={event.id}
                  className={`timeline-card-enter transition-all duration-200 ${isSelected ? 'ring-2 ring-secondary/50 rounded-xl' : ''} ${isBeingDragged ? 'opacity-30 scale-[0.97]' : ''} ${editable ? 'cursor-grab active:cursor-grabbing' : ''}`}
                  style={{ animationDelay: `${i * 40}ms` }}
                  draggable={editable}
                  onDragStart={(e) => handleDragStart(e, event.id)}
                  onDragOver={(e) => handleDragOver(e, event.id)}
                  onDragEnter={(e) => handleDragEnter(e, event.id)}
                  onDragLeave={(e) => handleDragLeave(e, event.id)}
                  onDrop={(e) => handleDrop(e, event.id)}
                  onDragEnd={handleDragEnd}
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
                  <EventCard event={event} editable={editable} isSelected={isSelected} isDragOver={isDragOver} onEdit={onEditEvent} />
                </div>
              )
            })}
          </div>
        </div>
      ))}

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

export default GridView
