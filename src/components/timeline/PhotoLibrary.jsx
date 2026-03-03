import { useState, useRef, useCallback, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, Link2, Unlink, ImagePlus, Trash2, RefreshCw, Search, Upload } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import AnimatedModal from '@/components/shared/AnimatedModal'
import PhotoLightbox from '@/components/shared/PhotoLightbox'
import { formatEventDate } from '@/utils/dateUtils'

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'unlinked', label: 'Unlinked' },
  { key: 'linked', label: 'Linked' },
]

export default function PhotoLibrary({ open, onClose }) {
  const photoMap = useTimelineStore((s) => s.photoMap)
  const events = useTimelineStore((s) => s.events)
  const attachPhotoToEvent = useTimelineStore((s) => s.attachPhotoToEvent)
  const detachPhotoFromEvent = useTimelineStore((s) => s.detachPhotoFromEvent)
  const deletePhoto = useTimelineStore((s) => s.deletePhoto)
  const addToPhotoMap = useTimelineStore((s) => s.addToPhotoMap)
  const showToast = useTimelineStore((s) => s.showToast)

  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [assigningPhoto, setAssigningPhoto] = useState(null)
  const [activeTab, setActiveTab] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isDragging, setIsDragging] = useState(false)
  const uploadRef = useRef(null)
  const dragCounter = useRef(0)

  // ─── Upload handler ─────────────────────────────────────
  const processFiles = useCallback(
    (files) => {
      const images = Array.from(files).filter((f) => f.type.startsWith('image/'))
      if (images.length === 0) return
      const entries = {}
      let loaded = 0
      images.forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          entries[file.name] = reader.result
          loaded++
          if (loaded === images.length) {
            addToPhotoMap(entries)
            showToast(`Added ${images.length} photo${images.length !== 1 ? 's' : ''}`)
          }
        }
        reader.readAsDataURL(file)
      })
    },
    [addToPhotoMap, showToast]
  )

  const handleUpload = useCallback(
    (e) => {
      processFiles(e.target.files)
      e.target.value = ''
    },
    [processFiles]
  )

  // ─── Drag-and-drop (only respond to external file drags) ─
  const isFileDrag = useCallback((e) => e.dataTransfer.types.includes('Files'), [])

  const handleDragEnter = useCallback(
    (e) => {
      if (!isFileDrag(e)) return
      e.preventDefault()
      dragCounter.current++
      setIsDragging(true)
    },
    [isFileDrag]
  )

  const handleDragLeave = useCallback(
    (e) => {
      if (!isFileDrag(e)) return
      e.preventDefault()
      dragCounter.current--
      if (dragCounter.current === 0) setIsDragging(false)
    },
    [isFileDrag]
  )

  const handleDragOver = useCallback(
    (e) => {
      if (!isFileDrag(e)) return
      e.preventDefault()
    },
    [isFileDrag]
  )

  const handleDrop = useCallback(
    (e) => {
      if (!isFileDrag(e)) return
      e.preventDefault()
      dragCounter.current = 0
      setIsDragging(false)
      if (e.dataTransfer.files?.length) {
        processFiles(e.dataTransfer.files)
      }
    },
    [isFileDrag, processFiles]
  )

  // ─── Photo data ─────────────────────────────────────────
  const allPhotos = useMemo(
    () => Object.entries(photoMap).map(([name, url]) => ({ name, url })),
    [photoMap]
  )

  const getAttachedEvents = useCallback(
    (filename) => events.filter((e) => e.photos?.includes(filename)),
    [events]
  )

  const { unlinked, linked } = useMemo(() => {
    const u = []
    const l = []
    for (const p of allPhotos) {
      if (getAttachedEvents(p.name).length === 0) u.push(p)
      else l.push(p)
    }
    return { unlinked: u, linked: l }
  }, [allPhotos, getAttachedEvents])

  // ─── Filtered + tabbed photos ───────────────────────────
  const displayPhotos = useMemo(() => {
    let photos
    if (activeTab === 'unlinked') photos = unlinked
    else if (activeTab === 'linked') photos = linked
    else photos = allPhotos

    if (!searchQuery.trim()) return photos

    const q = searchQuery.toLowerCase()
    return photos.filter((p) => {
      if (p.name.toLowerCase().includes(q)) return true
      const evts = getAttachedEvents(p.name)
      return evts.some((e) => e.title.toLowerCase().includes(q) || (e.dateStart || '').includes(q))
    })
  }, [activeTab, allPhotos, unlinked, linked, searchQuery, getAttachedEvents])

  const tabCounts = useMemo(
    () => ({
      all: allPhotos.length,
      unlinked: unlinked.length,
      linked: linked.length,
    }),
    [allPhotos.length, unlinked.length, linked.length]
  )

  // ─── Actions ────────────────────────────────────────────
  const handleDeletePhoto = useCallback(
    (filename) => {
      deletePhoto(filename)
      showToast('Photo deleted')
    },
    [deletePhoto, showToast]
  )

  const handleDetachAll = useCallback(
    (filename) => {
      const evts = events.filter((e) => e.photos?.includes(filename))
      evts.forEach((e) => detachPhotoFromEvent(filename, e.id))
      showToast('Photo unlinked')
    },
    [events, detachPhotoFromEvent, showToast]
  )

  const handleRelink = useCallback(
    (filename) => {
      const evts = events.filter((e) => e.photos?.includes(filename))
      evts.forEach((e) => detachPhotoFromEvent(filename, e.id))
      setAssigningPhoto(filename)
    },
    [events, detachPhotoFromEvent]
  )

  return (
    <AnimatedModal
      open={open}
      onClose={onClose}
      className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[85vh] flex flex-col overflow-hidden"
    >
      {/* ─── Header ─── */}
      <div className="shrink-0 border-b border-gray-100 px-6 pt-5 pb-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-gray-900">Photo Library</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {allPhotos.length} photo{allPhotos.length !== 1 ? 's' : ''}
              {unlinked.length > 0 && (
                <span className="text-amber-500"> · {unlinked.length} unlinked</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-white bg-secondary hover:bg-secondary/90 transition-colors cursor-pointer">
              <ImagePlus size={15} />
              Upload
              <input
                ref={uploadRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
            </label>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ─── Tabs + Search row ─── */}
        <div className="flex items-end justify-between gap-4">
          <div className="flex gap-0.5">
            {TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-2 text-sm font-medium rounded-t-lg transition-colors cursor-pointer ${
                  activeTab === tab.key
                    ? 'text-secondary border-b-2 border-secondary bg-secondary/5'
                    : 'text-gray-400 hover:text-gray-600 border-b-2 border-transparent'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-1.5 text-xs ${
                    activeTab === tab.key ? 'text-secondary/70' : 'text-gray-300'
                  }`}
                >
                  {tabCounts[tab.key]}
                </span>
              </button>
            ))}
          </div>

          {allPhotos.length > 0 && (
            <div className="relative mb-1">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search photos…"
                className="w-48 rounded-lg border border-gray-200 bg-gray-50 py-1.5 pl-8 pr-3 text-sm text-gray-700 placeholder:text-gray-400 focus:border-secondary focus:ring-2 focus:ring-secondary/10 focus:outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Body ─── */}
      <div
        className="flex-1 overflow-y-auto p-6 relative"
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Drag overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-10 bg-secondary/5 border-2 border-dashed border-secondary rounded-xl flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <Upload size={32} className="mx-auto text-secondary mb-2" />
              <p className="text-sm font-medium text-secondary">Drop photos here</p>
            </div>
          </div>
        )}

        {allPhotos.length === 0 ? (
          /* ─── Empty state ─── */
          <div
            className="flex flex-col items-center justify-center py-16 cursor-pointer"
            onClick={() => uploadRef.current?.click()}
          >
            <div className="rounded-2xl bg-gray-50 p-6 mb-4">
              <ImagePlus size={40} className="text-gray-300" />
            </div>
            <p className="text-base font-medium text-gray-600 mb-1">No photos yet</p>
            <p className="text-sm text-gray-400 mb-4">
              Upload images to attach them to your timeline events
            </p>
            <span className="inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium text-white bg-secondary hover:bg-secondary/90 transition-colors">
              <ImagePlus size={15} />
              Upload photos
            </span>
          </div>
        ) : displayPhotos.length === 0 ? (
          /* ─── No results state ─── */
          <div className="flex flex-col items-center justify-center py-16">
            <Search size={32} className="text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No photos match your search</p>
            <button
              onClick={() => {
                setSearchQuery('')
                setActiveTab('all')
              }}
              className="text-sm text-secondary hover:underline mt-2 cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        ) : (
          /* ─── Photo grid ─── */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {displayPhotos.map((photo) => {
              const evts = getAttachedEvents(photo.name)
              const isLinked = evts.length > 0
              const linkedLabel = isLinked
                ? evts
                    .map((e) => {
                      const date = formatEventDate(e)
                      return date ? `${e.title} · ${date}` : e.title
                    })
                    .join(', ')
                : 'Unlinked'

              return (
                <PhotoTile
                  key={photo.name}
                  photo={photo}
                  isLinked={isLinked}
                  linkedLabel={linkedLabel}
                  onView={() => setLightboxIndex(allPhotos.findIndex((p) => p.name === photo.name))}
                  onAssign={!isLinked ? () => setAssigningPhoto(photo.name) : undefined}
                  onRelink={isLinked ? () => handleRelink(photo.name) : undefined}
                  onDetach={isLinked ? () => handleDetachAll(photo.name) : undefined}
                  onDelete={() => handleDeletePhoto(photo.name)}
                />
              )
            })}
          </div>
        )}
      </div>

      {/* ─── Assign dropdown ─── */}
      {assigningPhoto && (
        <AssignDropdown
          events={events}
          onAttach={(eventId) => {
            attachPhotoToEvent(assigningPhoto, eventId)
            setAssigningPhoto(null)
            showToast('Photo linked')
          }}
          onClose={() => setAssigningPhoto(null)}
        />
      )}

      {/* ─── Lightbox ─── */}
      {lightboxIndex !== null &&
        allPhotos.length > 0 &&
        createPortal(
          <PhotoLightbox
            photos={allPhotos}
            currentIndex={lightboxIndex}
            onIndexChange={setLightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />,
          document.body
        )}
    </AnimatedModal>
  )
}

// ─── Photo tile with hover action bar ────────────────────

function PhotoTile({
  photo,
  isLinked,
  linkedLabel,
  onView,
  onAssign,
  onRelink,
  onDetach,
  onDelete,
}) {
  return (
    <div className="group relative rounded-xl overflow-hidden border border-gray-200 hover:border-secondary/40 hover:shadow-md transition-all bg-white">
      {/* Thumbnail */}
      <button
        onClick={onView}
        className="w-full aspect-square overflow-hidden cursor-pointer bg-gray-50"
      >
        <img
          src={photo.url}
          alt={photo.name}
          draggable={false}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
      </button>

      {/* Info bar */}
      <div className="px-2.5 py-2">
        <p className="text-xs text-gray-700 font-medium truncate" title={photo.name}>
          {photo.name}
        </p>
        <p
          className={`text-[10px] truncate mt-0.5 ${
            isLinked ? 'text-secondary' : 'text-gray-400 italic'
          }`}
          title={linkedLabel}
        >
          {linkedLabel}
        </p>
      </div>

      {/* Hover action bar */}
      <div className="absolute bottom-0 left-0 right-0 sm:translate-y-full sm:group-hover:translate-y-0 transition-transform duration-200 bg-white/95 backdrop-blur-sm border-t border-gray-100">
        <div className="flex">
          {onAssign && (
            <ActionButton
              icon={<Link2 size={12} />}
              label="Link"
              onClick={onAssign}
              className="text-secondary hover:bg-secondary/10"
            />
          )}
          {onRelink && (
            <ActionButton
              icon={<RefreshCw size={12} />}
              label="Relink"
              onClick={onRelink}
              className="text-secondary hover:bg-secondary/10"
            />
          )}
          {onDetach && (
            <ActionButton
              icon={<Unlink size={12} />}
              label="Unlink"
              onClick={onDetach}
              className="text-amber-600 hover:bg-amber-50"
            />
          )}
          <ActionButton
            icon={<Trash2 size={12} />}
            label="Delete"
            onClick={onDelete}
            className="text-red-500 hover:bg-red-50"
          />
        </div>
      </div>
    </div>
  )
}

function ActionButton({ icon, label, onClick, className = '' }) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className={`flex-1 flex items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors cursor-pointer ${className}`}
      title={label}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

// ─── Assign-to-event dropdown (bottom sheet style) ───────

function AssignDropdown({ events, onAttach, onClose }) {
  const [search, setSearch] = useState('')

  const filtered = search.trim()
    ? events.filter(
        (e) =>
          e.title.toLowerCase().includes(search.toLowerCase()) ||
          (e.dateStart || '').includes(search)
      )
    : events

  return (
    <div className="absolute inset-0 z-20 flex items-end rounded-2xl overflow-hidden">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full bg-white rounded-t-xl border-t border-gray-200 shadow-lg p-5 max-h-[50%] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-900">Link to event</h4>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
        {events.length > 5 && (
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events..."
            className="w-full rounded-lg border border-gray-200 px-3 py-1.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
            autoFocus
          />
        )}
        <div className="space-y-0.5 overflow-y-auto flex-1 min-h-0">
          {filtered.length === 0 && (
            <p className="text-xs text-gray-400 text-center py-4">No matching events</p>
          )}
          {filtered.map((event) => (
            <button
              key={event.id}
              onClick={() => onAttach(event.id)}
              className="w-full text-left rounded-lg px-3 py-2 hover:bg-soft-accent hover:text-secondary transition-colors cursor-pointer"
            >
              <span className="text-sm text-gray-700 block truncate">{event.title}</span>
              {event.dateStart && (
                <span className="text-[10px] text-gray-400 block">{formatEventDate(event)}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
