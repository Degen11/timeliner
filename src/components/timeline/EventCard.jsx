import { useState, useMemo, memo, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { AlertTriangle, Trash2, Check, X, Image, ImagePlus, Plus, Pencil } from 'lucide-react'
import Badge from '@/components/shared/Badge'
import { formatEventDate, formatEventDateShort, formatSingleDate } from '@/utils/dateUtils'
import { TAG_OPTIONS, getTagButtonColor } from '@/utils/constants'
import DatePicker from '@/components/shared/DatePicker'
import PhotoLightbox from '@/components/shared/PhotoLightbox'
import useTimelineStore from '@/store/useTimelineStore'
import EventPhotoUploader from './EventPhotoUploader'

function InlineEditField({ value, onSave, multiline = false, placeholder, className: displayCls }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [saved, setSaved] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus()
      if (inputRef.current.select) inputRef.current.select()
      // Auto-resize textarea on open
      if (multiline && inputRef.current.tagName === 'TEXTAREA') {
        inputRef.current.style.height = 'auto'
        inputRef.current.style.height = inputRef.current.scrollHeight + 'px'
      }
    }
  }, [editing, multiline])

  const handleSave = () => {
    onSave(draft)
    setEditing(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 600)
  }

  const handleCancel = () => {
    setDraft(value)
    setEditing(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSave()
    }
    if (e.key === 'Escape') handleCancel()
  }

  const handleTextareaChange = (e) => {
    setDraft(e.target.value)
    // Auto-resize
    e.target.style.height = 'auto'
    e.target.style.height = e.target.scrollHeight + 'px'
  }

  if (!editing) {
    return (
      <span
        onDoubleClick={(e) => {
          e.stopPropagation()
          setEditing(true)
        }}
        className={`group/edit inline-flex items-center gap-1 ${displayCls} cursor-text hover:bg-secondary/5 hover:rounded-md transition-colors duration-300 ${saved ? 'bg-green-50 rounded-md' : ''}`}
        title="Double-click to edit"
      >
        {value || <span className="text-gray-300 italic">{placeholder || 'Empty'}</span>}
        <Pencil
          size={10}
          className="text-gray-300 opacity-0 group-hover/edit:opacity-100 transition-opacity shrink-0"
        />
      </span>
    )
  }

  const cls =
    'w-full min-w-0 rounded-lg border border-secondary bg-white px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20'

  return (
    <div className="w-full min-w-0" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-start gap-1">
        {multiline ? (
          <textarea
            ref={inputRef}
            value={draft}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            className={`${cls} resize-none overflow-hidden`}
            rows={1}
            placeholder={placeholder}
          />
        ) : (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            className={cls}
            placeholder={placeholder}
          />
        )}
        <button
          onClick={handleSave}
          className="rounded-lg p-1 text-success hover:bg-success/10 transition-colors cursor-pointer shrink-0"
          aria-label="Save"
        >
          <Check size={14} />
        </button>
        <button
          onClick={handleCancel}
          className="rounded-lg p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer shrink-0"
          aria-label="Cancel"
        >
          <X size={14} />
        </button>
      </div>
      <p className="text-[11px] text-gray-400 mt-0.5 ml-0.5">Press Enter to save, Esc to cancel</p>
    </div>
  )
}

// ─── Inline tag editor (popover with tag toggles) ────────────────
function InlineTagEditor({ eventId, currentTags }) {
  const [open, setOpen] = useState(false)
  const [newTag, setNewTag] = useState('')
  const ref = useRef(null)
  const updateEvent = useTimelineStore((s) => s.updateEvent)
  const customTags = useTimelineStore((s) => s.customTags)
  const addCustomTag = useTimelineStore((s) => s.addCustomTag)

  const allOptions = useMemo(() => {
    const set = new Set([...TAG_OPTIONS, ...customTags])
    return [...set].sort()
  }, [customTags])

  useEffect(() => {
    if (!open) return
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const toggle = (tag) => {
    const tags = currentTags?.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...(currentTags || []), tag]
    updateEvent(eventId, { tags })
  }

  const handleAddCustom = () => {
    const trimmed = newTag.trim().toLowerCase()
    if (!trimmed) return
    addCustomTag(trimmed)
    if (!currentTags?.includes(trimmed)) {
      updateEvent(eventId, { tags: [...(currentTags || []), trimmed] })
    }
    setNewTag('')
  }

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
        className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-colors cursor-pointer"
        title="Edit tags"
      >
        <Plus size={10} />
        tag
      </button>
      {open && (
        <div
          className="absolute top-full left-0 z-30 mt-1 min-w-[180px] rounded-xl border border-gray-200 bg-white p-3 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-wrap gap-1 mb-2">
            {allOptions.map((tag) => {
              const colors = getTagButtonColor(tag)
              const isActive = currentTags?.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggle(tag)}
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold border transition-colors cursor-pointer"
                  style={isActive ? colors.active : colors.inactive}
                >
                  {tag}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-1 border-t border-gray-100 pt-1.5">
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddCustom()
                }
              }}
              placeholder="New tag..."
              className="flex-1 min-w-0 rounded border border-gray-200 px-1.5 py-0.5 text-[11px] focus:outline-none focus:border-secondary"
            />
            <button
              onClick={handleAddCustom}
              className="rounded px-1.5 py-0.5 text-[11px] font-medium text-secondary hover:bg-secondary/10 transition-colors cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Inline person adder ─────────────────────────────────────────
function InlinePersonAdder({ eventId, currentPeople }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const inputRef = useRef(null)
  const updateEvent = useTimelineStore((s) => s.updateEvent)

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus()
  }, [open])

  const handleAdd = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setOpen(false)
      return
    }
    if (!currentPeople?.includes(trimmed)) {
      updateEvent(eventId, { people: [...(currentPeople || []), trimmed] })
    }
    setName('')
    setOpen(false)
  }

  if (!open) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation()
          setOpen(true)
        }}
        className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-colors cursor-pointer"
        title="Add person"
      >
        <Plus size={10} />
        person
      </button>
    )
  }

  return (
    <div className="inline-flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <input
        ref={inputRef}
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            handleAdd()
          }
          if (e.key === 'Escape') {
            setName('')
            setOpen(false)
          }
        }}
        onBlur={handleAdd}
        placeholder="Name..."
        className="w-24 rounded border border-secondary bg-white px-1.5 py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-secondary/30"
      />
    </div>
  )
}

// Resolve photo URLs from photoMap (data URLs) or store.photos (blob URLs)
function useResolvedPhotos(filenames) {
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

const EMPTY_PHOTOS = []

// ─── Expanded photo preview (square thumbnails in a row with +N overflow) ───
// When editable, thumbnails are draggable for reordering.
// For 5+ photos in edit mode, +N toggles an expanded grid showing all photos.
const MAX_VISIBLE_PHOTOS = 5

function PhotoPreview({ filenames, onOpenLightbox, editable = false, eventId }) {
  const all = useResolvedPhotos(filenames)
  const updateEvent = useTimelineStore((s) => s.updateEvent)
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)
  const [expanded, setExpanded] = useState(false)

  // Build resolved map: filename → url (preserves filenames ordering)
  const resolvedMap = useMemo(() => {
    const m = new Map()
    all.forEach(({ name, url }) => {
      if (url) m.set(name, url)
    })
    return m
  }, [all])

  // Only show filenames that have resolved URLs, in original order
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
  const showAll = editable && expanded && hasOverflow
  const visible = showAll
    ? resolved
    : hasOverflow
      ? resolved.slice(0, MAX_VISIBLE_PHOTOS - 1)
      : resolved
  const overflowCount = resolved.length - visible.length

  // ── Drag-to-reorder handlers (only active when editable) ──
  const handleDragStart = (e, i) => {
    setDragIdx(i)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', '') // Required for Firefox
  }
  const handleDragOver = (e, i) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (overIdx !== i) setOverIdx(i)
  }
  const handleDragLeave = () => setOverIdx(null)
  const handleDrop = (e, i) => {
    e.preventDefault()
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
  const handleDragEnd = () => {
    setDragIdx(null)
    setOverIdx(null)
  }

  return (
    <div className={`mt-4 flex ${showAll ? 'flex-wrap' : ''} gap-2`}>
      {visible.map((name, i) => {
        const url = resolvedMap.get(name)
        const isDragging = dragIdx === i
        const isOver = overIdx === i && dragIdx !== null && dragIdx !== i

        return (
          <button
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
              className="h-20 w-20 object-cover pointer-events-none"
            />
          </button>
        )
      })}

      {hasOverflow && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            if (editable) {
              setExpanded((v) => !v)
            } else {
              onOpenLightbox(MAX_VISIBLE_PHOTOS - 1)
            }
          }}
          className="flex-shrink-0 h-20 w-20 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500 cursor-pointer transition-colors"
          title={
            showAll
              ? 'Show fewer photos'
              : editable
                ? 'Show all photos to reorder'
                : `${overflowCount} more photo${overflowCount !== 1 ? 's' : ''}`
          }
        >
          {showAll ? '\u2212' : `+${overflowCount}`}
        </button>
      )}
    </div>
  )
}

// ─── Compact photo preview (inline thumbnail for compact cards) ─────────────
function CompactPhotoPreview({ filenames, onOpenLightbox }) {
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

const EventCard = memo(function EventCard({ event, compact = false, editable = false }) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [photoUploaderOpen, setPhotoUploaderOpen] = useState(false)
  const addPhotoBtnRef = useRef(null)
  const updateEvent = useTimelineStore((s) => s.updateEvent)
  const deleteEvent = useTimelineStore((s) => s.deleteEvent)

  const handleDelete = () => {
    if (confirmDelete) {
      deleteEvent(event.id)
    } else {
      setConfirmDelete(true)
      setTimeout(() => setConfirmDelete(false), 3000)
    }
  }

  const lightboxPhotos = useResolvedPhotos(event.photos || EMPTY_PHOTOS).filter((p) => p.url)

  const cardCls = compact
    ? 'group rounded-xl bg-white border border-gray-200 px-4 py-2.5 shadow-sm transition-colors hover:bg-gray-50/50'
    : 'group rounded-xl bg-white border border-gray-200 px-6 py-5 shadow-sm transition-colors hover:bg-gray-50/50'

  return (
    <div className={cardCls}>
      <div
        className={`flex justify-between ${compact ? 'items-center gap-2' : 'items-start gap-3'}`}
      >
        <div className="flex-1 min-w-0">
          {compact ? (
            /* ---- Compact layout: single tight row, vertically centered ---- */
            <div className="flex items-center gap-2">
              {(() => {
                const shortDate = formatEventDateShort(event)
                if (!shortDate) return null
                return editable ? (
                  <DatePicker
                    value={event.dateStart || ''}
                    precision={event.datePrecision || 'day'}
                    onChange={(v, p) => updateEvent(event.id, { dateStart: v, datePrecision: p })}
                    renderTrigger={() => (
                      <span className="text-sm font-semibold text-secondary tracking-wide uppercase whitespace-nowrap hover:text-secondary-hover transition-colors">
                        {shortDate}
                      </span>
                    )}
                  />
                ) : (
                  <span className="text-sm font-semibold text-secondary tracking-wide uppercase whitespace-nowrap shrink-0">
                    {shortDate}
                  </span>
                )
              })()}
              {editable ? (
                <InlineEditField
                  value={event.title}
                  onSave={(v) => updateEvent(event.id, { title: v })}
                  className="text-sm font-semibold text-gray-900 truncate min-w-0"
                  placeholder="Untitled"
                />
              ) : (
                <h3 className="text-sm font-semibold text-gray-900 truncate" title={event.title}>
                  {event.title}
                </h3>
              )}
              {event.flagged && <AlertTriangle size={11} className="text-flag flex-shrink-0" />}
              {event.people?.map((person) => (
                <Badge key={person} variant="accent" small>
                  {person}
                </Badge>
              ))}
              {event.tags?.map((tag) => (
                <Badge key={tag} variant={tag} small>
                  {tag}
                </Badge>
              ))}
            </div>
          ) : (
            /* ---- Expanded layout ---- */
            <>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {editable ? (
                  <>
                    {/* Start date picker */}
                    <DatePicker
                      value={event.dateStart || ''}
                      precision={event.datePrecision || 'day'}
                      onChange={(v, p) => updateEvent(event.id, { dateStart: v, datePrecision: p })}
                      renderTrigger={() => (
                        <span className="text-sm font-semibold text-secondary tracking-wide uppercase hover:text-secondary-hover transition-colors">
                          {formatSingleDate(event.dateStart, event.datePrecision)}
                        </span>
                      )}
                    />

                    {/* End date: show picker if exists, or "+ end date" button */}
                    {event.dateEnd ? (
                      <>
                        <span className="text-xs text-gray-400">&ndash;</span>
                        <DatePicker
                          value={event.dateEnd}
                          precision={event.datePrecision || 'day'}
                          onChange={(v) => updateEvent(event.id, { dateEnd: v })}
                          renderTrigger={() => (
                            <span className="text-sm font-semibold text-secondary tracking-wide uppercase hover:text-secondary-hover transition-colors">
                              {formatSingleDate(event.dateEnd, event.datePrecision)}
                            </span>
                          )}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            updateEvent(event.id, { dateEnd: null })
                          }}
                          className="rounded p-0.5 text-gray-300 hover:text-error hover:bg-red-50 transition-colors cursor-pointer"
                          title="Remove end date"
                        >
                          <X size={10} />
                        </button>
                      </>
                    ) : (
                      <DatePicker
                        value=""
                        precision={event.datePrecision || 'day'}
                        onChange={(v) => updateEvent(event.id, { dateEnd: v })}
                        renderTrigger={() => (
                          <span className="text-[11px] text-gray-400 hover:text-secondary transition-colors">
                            + end date
                          </span>
                        )}
                      />
                    )}
                  </>
                ) : (
                  <span className="text-sm font-semibold text-secondary tracking-wide uppercase">
                    {formatEventDate(event)}
                  </span>
                )}
                {event.flagged && (
                  <span
                    className="flex items-center gap-1 text-xs text-flag"
                    title={event.flagReason}
                  >
                    <AlertTriangle size={12} />
                    <span className="hidden sm:inline">Flagged</span>
                  </span>
                )}
              </div>

              {editable ? (
                <>
                  <InlineEditField
                    value={event.title}
                    onSave={(v) => updateEvent(event.id, { title: v })}
                    className="block text-sm font-semibold text-gray-900 mb-1"
                    placeholder="Untitled"
                  />
                  <InlineEditField
                    value={event.description || ''}
                    onSave={(v) => updateEvent(event.id, { description: v })}
                    multiline
                    className="block text-sm text-gray-600 leading-relaxed mb-2.5"
                    placeholder="Add a description..."
                  />
                </>
              ) : (
                <>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1">{event.title}</h3>
                  {event.description && (
                    <p className="text-sm text-gray-600 leading-relaxed mb-2.5">
                      {event.description}
                    </p>
                  )}
                </>
              )}

              <div className="flex flex-wrap items-center gap-1.5">
                {event.people?.map((person) => (
                  <Badge
                    key={person}
                    variant="accent"
                    onRemove={
                      editable
                        ? () =>
                            updateEvent(event.id, {
                              people: event.people.filter((p) => p !== person),
                            })
                        : undefined
                    }
                  >
                    {person}
                  </Badge>
                ))}
                {(() => {
                  const tags = event.tags || []
                  const MAX_VISIBLE = 6
                  const visible = tags.length > MAX_VISIBLE ? tags.slice(0, MAX_VISIBLE - 1) : tags
                  const overflow = tags.length > MAX_VISIBLE ? tags.length - (MAX_VISIBLE - 1) : 0
                  return (
                    <>
                      {visible.map((tag) => (
                        <Badge
                          key={tag}
                          variant={tag}
                          onRemove={
                            editable
                              ? () =>
                                  updateEvent(event.id, {
                                    tags: event.tags.filter((t) => t !== tag),
                                  })
                              : undefined
                          }
                        >
                          {tag}
                        </Badge>
                      ))}
                      {overflow > 0 && (
                        <span
                          className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold border tracking-wide leading-none"
                          style={{
                            backgroundColor: '#F5F5F4',
                            color: '#292524',
                            borderColor: '#D6D3D1',
                          }}
                          title={tags.slice(MAX_VISIBLE - 1).join(', ')}
                        >
                          +{overflow}
                        </span>
                      )}
                    </>
                  )
                })()}
                {editable && (
                  <>
                    <InlinePersonAdder eventId={event.id} currentPeople={event.people} />
                    <InlineTagEditor eventId={event.id} currentTags={event.tags} />
                  </>
                )}
              </div>
            </>
          )}
        </div>

        <div className={`flex ${compact ? 'items-center' : 'flex-col items-end'} gap-2`}>
          {compact && event.photos?.length > 0 && (
            <CompactPhotoPreview
              filenames={event.photos}
              onOpenLightbox={(i) => setLightboxIndex(i)}
            />
          )}

          {editable && !compact && (
            <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button
                ref={addPhotoBtnRef}
                onClick={(e) => {
                  e.stopPropagation()
                  setPhotoUploaderOpen(true)
                }}
                className="rounded-lg p-1.5 text-gray-400 hover:text-secondary hover:bg-soft-accent transition-colors cursor-pointer"
                title="Add photo"
              >
                <ImagePlus size={13} />
              </button>
              {confirmDelete ? (
                <button
                  onClick={handleDelete}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium text-error bg-red-50 border border-red-200 hover:bg-red-100 transition-colors cursor-pointer"
                >
                  Confirm
                </button>
              ) : (
                <button
                  onClick={handleDelete}
                  className="rounded-lg p-1.5 text-gray-400 hover:text-error hover:bg-red-50 transition-colors cursor-pointer"
                  title="Delete event"
                >
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          )}

          {editable && compact && (
            <button
              ref={addPhotoBtnRef}
              onClick={(e) => {
                e.stopPropagation()
                setPhotoUploaderOpen(true)
              }}
              className="rounded-md p-1 text-gray-300 hover:text-secondary hover:bg-soft-accent transition-colors cursor-pointer sm:opacity-0 sm:group-hover:opacity-100"
              title="Add photo"
            >
              <ImagePlus size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Inline photo preview for expanded cards */}
      {!compact && event.photos?.length > 0 && (
        <PhotoPreview
          filenames={event.photos}
          onOpenLightbox={(i) => setLightboxIndex(i)}
          editable={editable}
          eventId={event.id}
        />
      )}

      {editable && (
        <EventPhotoUploader
          eventId={event.id}
          open={photoUploaderOpen}
          onClose={() => setPhotoUploaderOpen(false)}
          anchorRef={addPhotoBtnRef}
        />
      )}

      {lightboxIndex !== null &&
        lightboxPhotos.length > 0 &&
        createPortal(
          <PhotoLightbox
            photos={lightboxPhotos}
            currentIndex={lightboxIndex}
            onIndexChange={setLightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />,
          document.body
        )}
    </div>
  )
})

export default EventCard
