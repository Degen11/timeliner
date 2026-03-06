import { useState, useMemo } from 'react'
import { Image } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'

export function useResolvedPhotos(filenames) {
  const photoMap = useTimelineStore((s) => s.photoMap)
  const storePhotos = useTimelineStore((s) => s.photos)

  return useMemo(
    () =>
      filenames.map((name) => {
        const dataUrl = photoMap[name]
        if (dataUrl) return { name, url: dataUrl }
        const match = storePhotos.find((p) => p.name === name)
        if (match?.objectUrl) return { name, url: match.objectUrl }
        return { name, url: null }
      }),
    [filenames, photoMap, storePhotos]
  )
}

const MAX_VISIBLE_PHOTOS = 5

export function PhotoPreview({ filenames, onOpenLightbox, editable = false, eventId }) {
  const all = useResolvedPhotos(filenames)
  const updateEvent = useTimelineStore((s) => s.updateEvent)
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)
  const [expanded, setExpanded] = useState(false)

  const resolvedMap = useMemo(() => {
    const m = new Map()
    all.forEach(({ name, url }) => {
      if (url) m.set(name, url)
    })
    return m
  }, [all])

  const resolved = filenames.filter((name) => resolvedMap.has(name))

  if (resolved.length === 0) {
    return (
      <div className="mt-4 rounded-xl bg-gray-50 border border-gray-100 px-3 py-3 flex items-center gap-2 text-xs text-gray-400">
        <Image size={14} />
        <span>
          {filenames.length} photo{filenames.length !== 1 ? 's' : ''}
        </span>
      </div>
    )
  }

  const hasOverflow = resolved.length > MAX_VISIBLE_PHOTOS
  const showAll = expanded && hasOverflow
  const visible = showAll
    ? resolved
    : hasOverflow
      ? resolved.slice(0, MAX_VISIBLE_PHOTOS - 1)
      : resolved
  const overflowCount = resolved.length - visible.length

  const handleDragStart = (e, i) => {
    e.stopPropagation()
    setDragIdx(i)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '')
  }
  const handleDragOver = (e, i) => {
    e.preventDefault()
    e.stopPropagation()
    e.dataTransfer.dropEffect = 'move'
    if (overIdx !== i) setOverIdx(i)
  }
  const handleDragLeave = (e) => {
    e.stopPropagation()
    setOverIdx(null)
  }
  const handleDrop = (e, i) => {
    e.preventDefault()
    e.stopPropagation()
    if (dragIdx !== null && dragIdx !== i) {
      const fromName = visible[dragIdx]
      const toName = visible[i]
      const newPhotos = [...filenames]
      const fromPos = newPhotos.indexOf(fromName)
      const toPos = newPhotos.indexOf(toName)
      newPhotos.splice(fromPos, 1)
      newPhotos.splice(toPos, 0, fromName)
      updateEvent(eventId, { photos: newPhotos })
    }
    setDragIdx(null)
    setOverIdx(null)
  }
  const handleDragEnd = (e) => {
    e.stopPropagation()
    setDragIdx(null)
    setOverIdx(null)
  }

  return (
    <div className={`mt-4 flex flex-wrap gap-2`}>
      {visible.map((name, i) => {
        const url = resolvedMap.get(name)
        const isDragging = dragIdx === i
        const isOver = overIdx === i && dragIdx !== null && dragIdx !== i

        return (
          <button
            type="button"
            key={name}
            draggable={editable}
            onDragStart={editable ? (e) => handleDragStart(e, i) : undefined}
            onDragOver={editable ? (e) => handleDragOver(e, i) : undefined}
            onDragLeave={editable ? handleDragLeave : undefined}
            onDrop={editable ? (e) => handleDrop(e, i) : undefined}
            onDragEnd={editable ? handleDragEnd : undefined}
            onClick={(e) => {
              e.stopPropagation()
              onOpenLightbox(resolved.indexOf(name))
            }}
            className={`flex-shrink-0 rounded-xl overflow-hidden border transition-all duration-150 ${
              isDragging
                ? 'opacity-40 scale-95 border-gray-300'
                : isOver
                  ? 'ring-2 ring-secondary/50 border-secondary scale-105'
                  : 'border-gray-200 hover:opacity-80'
            } ${editable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'}`}
            title={editable ? 'Drag to reorder' : name}
          >
            <img
              src={url}
              alt={name}
              loading="lazy"
              decoding="async"
              className="h-16 w-16 object-cover pointer-events-none"
            />
          </button>
        )
      })}

      {hasOverflow && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            if (expanded) {
              setExpanded(false)
            } else if (!expanded && hasOverflow) {
              setExpanded(true)
            }
          }}
          className="flex-shrink-0 h-16 w-16 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 cursor-pointer transition-colors"
          title={
            showAll
              ? 'Show fewer photos'
              : `${overflowCount} more photo${overflowCount !== 1 ? 's' : ''}`
          }
        >
          {showAll ? '\u2212' : `+${overflowCount}`}
        </button>
      )}
    </div>
  )
}

export function CompactPhotoPreview({ filenames, onOpenLightbox }) {
  const all = useResolvedPhotos(filenames)
  const photos = all.filter((p) => p.url)

  if (photos.length === 0) {
    return (
      <div
        className="h-10 w-16 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400"
        title={`${filenames.length} photo${filenames.length !== 1 ? 's' : ''}`}
      >
        <Image size={12} />
      </div>
    )
  }

  const first = photos[0]
  const hasMultiple = photos.length > 1

  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onOpenLightbox(0)
      }}
      className="relative flex-shrink-0 rounded-lg overflow-hidden cursor-pointer group/compact-photo border border-gray-200 hover:opacity-80 transition-opacity"
      title={`${photos.length} photo${photos.length !== 1 ? 's' : ''} — click to view`}
    >
      <img src={first.url} alt={first.name} loading="lazy" className="h-10 w-16 object-cover" />
      {hasMultiple && (
        <span className="absolute bottom-0 right-0 rounded-tl-lg bg-black/60 px-1.5 py-px text-[11px] font-medium text-white">
          +{photos.length - 1}
        </span>
      )}
    </button>
  )
}
