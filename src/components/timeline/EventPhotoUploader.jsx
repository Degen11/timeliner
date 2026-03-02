import { useState, useRef, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Upload } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'

/**
 * A popover for attaching photos to a specific event.
 * Allows uploading new photos or picking from existing unattached ones.
 */
export default function EventPhotoUploader({ eventId, open, onClose, anchorRef }) {
  const photoMap = useTimelineStore((s) => s.photoMap)
  const events = useTimelineStore((s) => s.events)
  const addToPhotoMap = useTimelineStore((s) => s.addToPhotoMap)
  const attachPhotoToEvent = useTimelineStore((s) => s.attachPhotoToEvent)
  const showToast = useTimelineStore((s) => s.showToast)
  const [uploading, setUploading] = useState(false)
  const [pos, setPos] = useState(null)
  const popoverRef = useRef(null)
  const fileRef = useRef(null)

  // Find unattached photos (not linked to any event)
  const unattached = Object.entries(photoMap).filter(([name]) => {
    return !events.some((e) => e.photos?.includes(name))
  })

  // Position popover relative to anchor
  useEffect(() => {
    if (!open || !anchorRef?.current) return
    const rect = anchorRef.current.getBoundingClientRect()
    const popoverWidth = 280
    const popoverHeight = 320
    let left = rect.left
    let top = rect.bottom + 4

    // Keep within viewport
    if (left + popoverWidth > window.innerWidth - 8) {
      left = window.innerWidth - popoverWidth - 8
    }
    if (left < 8) left = 8
    if (top + popoverHeight > window.innerHeight - 8) {
      top = rect.top - popoverHeight - 4
    }

    setPos({ top, left })
  }, [open, anchorRef])

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const handle = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        onClose()
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handle)
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handle)
    }
  }, [open, onClose])

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handle = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [open, onClose])

  const handleUpload = useCallback(
    (e) => {
      const files = Array.from(e.target.files).filter((f) => f.type.startsWith('image/'))
      if (files.length === 0) return
      setUploading(true)

      const entries = {}
      let loaded = 0
      files.forEach((file) => {
        const reader = new FileReader()
        reader.onloadend = () => {
          entries[file.name] = reader.result
          loaded++
          if (loaded === files.length) {
            addToPhotoMap(entries)
            // Attach all uploaded photos to this event
            Object.keys(entries).forEach((name) => {
              attachPhotoToEvent(name, eventId)
            })
            showToast(`${files.length} photo${files.length !== 1 ? 's' : ''} attached`)
            setUploading(false)
            onClose()
          }
        }
        reader.readAsDataURL(file)
      })
      e.target.value = ''
    },
    [addToPhotoMap, attachPhotoToEvent, eventId, showToast, onClose]
  )

  const handlePickExisting = useCallback(
    (filename) => {
      attachPhotoToEvent(filename, eventId)
      showToast('Photo attached')
      onClose()
    },
    [attachPhotoToEvent, eventId, showToast, onClose]
  )

  if (!open || !pos) return null

  return createPortal(
    <div
      ref={popoverRef}
      className="fixed z-50 w-[280px] bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden"
      style={{ top: pos.top, left: pos.left }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100">
        <h4 className="text-xs font-semibold text-gray-900">Add Photo</h4>
        <button
          onClick={onClose}
          className="rounded-md p-0.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      {/* Upload area */}
      <div className="p-3 border-b border-gray-100">
        <label
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-3 py-4 text-center transition-all cursor-pointer ${
            uploading
              ? 'border-secondary/40 bg-soft-accent/30'
              : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100/50'
          }`}
        >
          <Upload size={18} className="text-gray-400 mb-1.5" />
          <span className="text-xs text-gray-600 font-medium">
            {uploading ? 'Uploading...' : 'Upload new photo'}
          </span>
          <span className="text-[10px] text-gray-400 mt-0.5">Click or drag & drop</span>
          <input
            ref={fileRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Existing unattached photos */}
      {unattached.length > 0 && (
        <div className="p-3">
          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-2">
            Unattached photos ({unattached.length})
          </p>
          <div className="grid grid-cols-4 gap-1.5 max-h-[140px] overflow-y-auto">
            {unattached.map(([name, url]) => (
              <button
                key={name}
                onClick={() => handlePickExisting(name)}
                className="aspect-square rounded-md overflow-hidden border border-gray-200 hover:border-secondary hover:ring-2 hover:ring-secondary/20 transition-all cursor-pointer"
                title={`Attach "${name}"`}
              >
                <img src={url} alt={name} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* No unattached photos hint */}
      {unattached.length === 0 && (
        <div className="px-3 py-2 text-center">
          <p className="text-[10px] text-gray-400">No unattached photos available</p>
        </div>
      )}
    </div>,
    document.body
  )
}
