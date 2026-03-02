import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Link2, Unlink, ImagePlus, Trash2, RefreshCw } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import AnimatedSidePanel from '@/components/shared/AnimatedSidePanel'
import PhotoLightbox from '@/components/shared/PhotoLightbox'
import { formatEventDate } from '@/utils/dateUtils'

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
  const uploadRef = useRef(null)

  const handleUpload = useCallback(
    (e) => {
      const files = Array.from(e.target.files).filter((f) => f.type.startsWith('image/'))
      if (files.length === 0) return
      const entries = {}
      let loaded = 0
      files.forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          entries[file.name] = reader.result
          loaded++
          if (loaded === files.length) {
            addToPhotoMap(entries)
            showToast(`Added ${files.length} photo${files.length !== 1 ? 's' : ''}`)
          }
        }
        reader.readAsDataURL(file)
      })
      e.target.value = ''
    },
    [addToPhotoMap, showToast]
  )

  const allPhotos = Object.entries(photoMap).map(([name, url]) => ({ name, url }))

  // For each photo, find which events reference it
  const getAttachedEvents = (filename) => events.filter((e) => e.photos?.includes(filename))

  const unattached = allPhotos.filter((p) => getAttachedEvents(p.name).length === 0)
  const attached = allPhotos.filter((p) => getAttachedEvents(p.name).length > 0)

  const handleDeletePhoto = useCallback(
    (filename) => {
      deletePhoto(filename)
      showToast('Photo deleted')
    },
    [deletePhoto, showToast]
  )

  const handleDetachAll = useCallback(
    (filename) => {
      const evts = getAttachedEvents(filename)
      evts.forEach((e) => detachPhotoFromEvent(filename, e.id))
      showToast('Photo unlinked')
    },
    [events, detachPhotoFromEvent, showToast]
  ) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRelink = useCallback(
    (filename) => {
      // First detach from all, then open assign dropdown
      const evts = getAttachedEvents(filename)
      evts.forEach((e) => detachPhotoFromEvent(filename, e.id))
      setAssigningPhoto(filename)
    },
    [events, detachPhotoFromEvent]
  ) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <AnimatedSidePanel open={open} onClose={onClose} wide>
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Photo Library</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {allPhotos.length} photo{allPhotos.length !== 1 ? 's' : ''}
            {unattached.length > 0 && ` · ${unattached.length} unlinked`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <label className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-secondary bg-soft-accent hover:bg-secondary/15 transition-colors cursor-pointer flex items-center gap-1.5">
            <ImagePlus size={14} />
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

      <div className="flex-1 overflow-y-auto p-4">
        {allPhotos.length === 0 ? (
          <div className="text-center py-12">
            <ImagePlus size={32} className="mx-auto text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">No photos uploaded yet</p>
            <label className="text-sm text-secondary cursor-pointer hover:underline mt-2 inline-block">
              Upload photos
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
            </label>
          </div>
        ) : (
          <div className="space-y-5">
            {unattached.length > 0 && (
              <div>
                <h3 className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Unlinked ({unattached.length})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {unattached.map((photo) => (
                    <PhotoTile
                      key={photo.name}
                      photo={photo}
                      linkedLabel="Unlinked"
                      onView={() =>
                        setLightboxIndex(allPhotos.findIndex((p) => p.name === photo.name))
                      }
                      onAssign={() => setAssigningPhoto(photo.name)}
                      onDelete={() => handleDeletePhoto(photo.name)}
                    />
                  ))}
                </div>
              </div>
            )}

            {attached.length > 0 && (
              <div>
                <h3 className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Linked ({attached.length})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {attached.map((photo) => {
                    const evts = getAttachedEvents(photo.name)
                    const linkedLabel = evts
                      .map((e) => {
                        const date = formatEventDate(e)
                        return date ? `${e.title} · ${date}` : e.title
                      })
                      .join(', ')
                    return (
                      <PhotoTile
                        key={photo.name}
                        photo={photo}
                        linkedLabel={linkedLabel}
                        linkedEvents={evts}
                        onView={() =>
                          setLightboxIndex(allPhotos.findIndex((p) => p.name === photo.name))
                        }
                        onDetach={() => handleDetachAll(photo.name)}
                        onRelink={() => handleRelink(photo.name)}
                        onDelete={() => handleDeletePhoto(photo.name)}
                      />
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Assign dropdown */}
      {assigningPhoto && (
        <AssignDropdown
          photoName={assigningPhoto}
          events={events}
          onAttach={(eventId) => {
            attachPhotoToEvent(assigningPhoto, eventId)
            setAssigningPhoto(null)
            showToast('Photo linked')
          }}
          onClose={() => setAssigningPhoto(null)}
        />
      )}

      {/* Lightbox */}
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
    </AnimatedSidePanel>
  )
}

function PhotoTile({
  photo,
  linkedLabel,
  linkedEvents,
  onView,
  onAssign,
  onDetach,
  onRelink,
  onDelete,
}) {
  const isLinked = linkedEvents && linkedEvents.length > 0

  return (
    <div className="group relative">
      <button
        onClick={onView}
        className="w-full aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-secondary transition-colors cursor-pointer"
      >
        <img src={photo.url} alt={photo.name} className="w-full h-full object-cover" />
      </button>

      {/* Filename */}
      <p className="text-[10px] text-gray-500 truncate mt-1 px-0.5">{photo.name}</p>

      {/* Linked event info */}
      <p
        className={`text-[10px] truncate px-0.5 ${isLinked ? 'text-secondary' : 'text-gray-400 italic'}`}
      >
        {linkedLabel}
      </p>

      {/* Action buttons overlay */}
      <div className="absolute top-1 right-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex gap-0.5">
        {onAssign && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAssign()
            }}
            className="rounded-md bg-white/90 border border-gray-200 p-1 text-gray-500 hover:text-secondary hover:border-secondary transition-colors cursor-pointer shadow-sm"
            title="Link to event"
          >
            <Link2 size={11} />
          </button>
        )}
        {onRelink && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onRelink()
            }}
            className="rounded-md bg-white/90 border border-gray-200 p-1 text-gray-500 hover:text-secondary hover:border-secondary transition-colors cursor-pointer shadow-sm"
            title="Change linked event"
          >
            <RefreshCw size={11} />
          </button>
        )}
        {onDetach && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDetach()
            }}
            className="rounded-md bg-white/90 border border-gray-200 p-1 text-gray-500 hover:text-amber-600 hover:border-amber-400 transition-colors cursor-pointer shadow-sm"
            title="Unlink from event"
          >
            <Unlink size={11} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onDelete()
            }}
            className="rounded-md bg-white/90 border border-gray-200 p-1 text-gray-500 hover:text-error hover:border-error transition-colors cursor-pointer shadow-sm"
            title="Delete photo"
          >
            <Trash2 size={11} />
          </button>
        )}
      </div>
    </div>
  )
}

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
    <div className="absolute inset-0 bg-black/20 flex items-end z-10">
      <div className="w-full bg-white rounded-t-xl border-t border-gray-200 shadow-lg p-4 max-h-[50%] flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">Link to event</h4>
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
