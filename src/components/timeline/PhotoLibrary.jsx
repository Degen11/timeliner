import { useState, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, Image, Link2, Unlink, ImagePlus } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import AnimatedSidePanel from '@/components/shared/AnimatedSidePanel'
import PhotoLightbox from '@/components/shared/PhotoLightbox'

export default function PhotoLibrary({ open, onClose }) {
  const photoMap = useTimelineStore((s) => s.photoMap)
  const events = useTimelineStore((s) => s.events)
  const attachPhotoToEvent = useTimelineStore((s) => s.attachPhotoToEvent)
  const detachPhotoFromEvent = useTimelineStore((s) => s.detachPhotoFromEvent)
  const addToPhotoMap = useTimelineStore((s) => s.addToPhotoMap)
  const showToast = useTimelineStore((s) => s.showToast)
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const [assigningPhoto, setAssigningPhoto] = useState(null)
  const uploadRef = useRef(null)

  const handleUpload = useCallback((e) => {
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
  }, [addToPhotoMap, showToast])

  const allPhotos = Object.entries(photoMap).map(([name, url]) => ({ name, url }))

  // For each photo, find which events reference it
  const getAttachedEvents = (filename) =>
    events.filter((e) => e.photos?.includes(filename))

  const unattached = allPhotos.filter(
    (p) => getAttachedEvents(p.name).length === 0
  )
  const attached = allPhotos.filter(
    (p) => getAttachedEvents(p.name).length > 0
  )

  return (
    <AnimatedSidePanel open={open} onClose={onClose}>
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">Photo Library</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {allPhotos.length} photo{allPhotos.length !== 1 ? 's' : ''}
            {unattached.length > 0 && ` · ${unattached.length} unattached`}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <label
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-secondary bg-soft-accent hover:bg-secondary/15 transition-colors cursor-pointer flex items-center gap-1.5"
          >
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
                  Unattached ({unattached.length})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {unattached.map((photo, i) => (
                    <PhotoTile
                      key={photo.name}
                      photo={photo}
                      onView={() =>
                        setLightboxIndex(allPhotos.findIndex((p) => p.name === photo.name))
                      }
                      onAssign={() => setAssigningPhoto(photo.name)}
                    />
                  ))}
                </div>
              </div>
            )}

            {attached.length > 0 && (
              <div>
                <h3 className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">
                  Attached ({attached.length})
                </h3>
                <div className="grid grid-cols-3 gap-2">
                  {attached.map((photo) => {
                    const evts = getAttachedEvents(photo.name)
                    return (
                      <PhotoTile
                        key={photo.name}
                        photo={photo}
                        attachedTo={evts[0]?.title}
                        onView={() =>
                          setLightboxIndex(allPhotos.findIndex((p) => p.name === photo.name))
                        }
                        onDetach={() =>
                          evts.forEach((e) => detachPhotoFromEvent(photo.name, e.id))
                        }
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
          }}
          onClose={() => setAssigningPhoto(null)}
        />
      )}

      {/* Lightbox */}
      {lightboxIndex !== null && allPhotos.length > 0 &&
        createPortal(
          <PhotoLightbox
            photos={allPhotos}
            currentIndex={lightboxIndex}
            onIndexChange={setLightboxIndex}
            onClose={() => setLightboxIndex(null)}
          />,
          document.body
        )
      }
    </AnimatedSidePanel>
  )
}

function PhotoTile({ photo, attachedTo, onView, onAssign, onDetach }) {
  return (
    <div className="group relative">
      <button
        onClick={onView}
        className="w-full aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-secondary transition-colors cursor-pointer"
      >
        <img
          src={photo.url}
          alt={photo.name}
          className="w-full h-full object-cover"
        />
      </button>

      {/* Filename */}
      <p className="text-[10px] text-gray-500 truncate mt-1 px-0.5">{photo.name}</p>

      {/* Attached indicator */}
      {attachedTo && (
        <p className="text-[10px] text-secondary truncate px-0.5">{attachedTo}</p>
      )}

      {/* Action button */}
      <div className="absolute top-1 right-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
        {onAssign && (
          <button
            onClick={(e) => { e.stopPropagation(); onAssign() }}
            className="rounded-lg bg-white/90 border border-gray-200 p-1 text-gray-500 hover:text-secondary hover:border-secondary transition-colors cursor-pointer shadow-sm"
            title="Attach to event"
          >
            <Link2 size={12} />
          </button>
        )}
        {onDetach && (
          <button
            onClick={(e) => { e.stopPropagation(); onDetach() }}
            className="rounded-lg bg-white/90 border border-gray-200 p-1 text-gray-500 hover:text-error hover:border-error transition-colors cursor-pointer shadow-sm"
            title="Detach from event"
          >
            <Unlink size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

function AssignDropdown({ photoName, events, onAttach, onClose }) {
  return (
    <div className="absolute inset-0 bg-black/20 flex items-end z-10">
      <div className="w-full bg-white rounded-t-xl border-t border-gray-200 shadow-lg p-4 max-h-[50%] overflow-y-auto">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900">Attach to event</h4>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:text-gray-700 cursor-pointer"
          >
            <X size={14} />
          </button>
        </div>
        <div className="space-y-1">
          {events.map((event) => (
            <button
              key={event.id}
              onClick={() => onAttach(event.id)}
              className="w-full text-left rounded-lg px-3 py-2 text-sm text-gray-700 hover:bg-soft-accent hover:text-secondary transition-colors cursor-pointer"
            >
              {event.title}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
