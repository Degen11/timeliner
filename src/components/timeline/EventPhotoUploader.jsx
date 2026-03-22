import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Upload } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'

/**
 * A popover for attaching photos to a specific event.
 * Allows uploading new photos or picking from existing unattached ones.
 */
export default function EventPhotoUploader({ eventId, open, onClose, anchorRef, zIndex = 1200 }) {
  const photoMap = useTimelineStore((s) => s.photoMap)
  const events = useTimelineStore((s) => s.events)
  const addToPhotoMap = useTimelineStore((s) => s.addToPhotoMap)
  const attachPhotoToEvent = useTimelineStore((s) => s.attachPhotoToEvent)
  const showToast = useTimelineStore((s) => s.showToast)
  const setUploadProgress = useTimelineStore((s) => s.setPhotoUploadProgress)
  const [uploading, setUploading] = useState(false)
  const [localProgress, setLocalProgress] = useState(null)
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

  const handleUpload = (e) => {
    const files = Array.from(e.target.files).filter((f) => f.type.startsWith('image/'))
    if (files.length === 0) return
    setUploading(true)
    setLocalProgress({ loaded: 0, total: files.length })
    setUploadProgress({ loaded: 0, total: files.length })

    const entries = {}
    let loaded = 0
    let failed = 0
    files.forEach((file) => {
      const reader = new FileReader()
      const onDone = () => {
        loaded++
        setLocalProgress({ loaded, total: files.length })
        setUploadProgress({ loaded, total: files.length })
        if (loaded === files.length) {
          if (Object.keys(entries).length > 0) {
            addToPhotoMap(entries)
            Object.keys(entries).forEach((name) => {
              attachPhotoToEvent(name, eventId)
            })
          }
          const attached = Object.keys(entries).length
          if (failed > 0) {
            showToast(`${attached} photo${attached !== 1 ? 's' : ''} attached, ${failed} failed to read`, { variant: 'warning' })
          } else {
            showToast(`${attached} photo${attached !== 1 ? 's' : ''} attached`)
          }
          setUploading(false)
          setLocalProgress(null)
          setUploadProgress(null)
          onClose()
        }
      }
      reader.onloadend = () => {
        entries[file.name] = reader.result
        onDone()
      }
      reader.onerror = () => {
        failed++
        onDone()
      }
      reader.readAsDataURL(file)
    })
    e.target.value = ''
  }

  const handlePickExisting = (filename) => {
    attachPhotoToEvent(filename, eventId)
    showToast('Photo attached')
    onClose()
  }

  if (!open || !pos) return null

  return createPortal(
    <div
      ref={popoverRef}
      data-photo-uploader
      className="fixed w-[280px] bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-xl overflow-hidden"
      style={{ top: pos.top, left: pos.left, zIndex }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-100 dark:border-gray-700">
        <h4 className="text-xs font-semibold text-gray-900 dark:text-gray-100">Add Photo</h4>
        <button
          onClick={onClose}
          className="rounded-md p-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      {/* Upload area */}
      <div className="p-3 border-b border-gray-100 dark:border-gray-700">
        <label
          className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed px-3 py-4 text-center transition-all cursor-pointer ${
            uploading
              ? 'border-secondary/40 bg-soft-accent/30'
              : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100/50 dark:hover:bg-gray-700'
          }`}
        >
          <Upload size={18} className="text-gray-400 dark:text-gray-500 mb-1.5" />
          <span className="text-xs text-gray-600 dark:text-gray-300 font-medium">
            {localProgress
              ? `Processing ${localProgress.loaded}/${localProgress.total}…`
              : 'Upload new photo'}
          </span>
          {localProgress ? (
            <div className="w-full mt-1.5 h-1 rounded-full bg-gray-200 overflow-hidden">
              <div
                className="h-full bg-secondary rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.round((localProgress.loaded / localProgress.total) * 100)}%` }}
              />
            </div>
          ) : (
            <span className="text-[11px] text-gray-400 mt-0.5">Click or drag & drop</span>
          )}
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
          <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-2">
            Unattached photos ({unattached.length})
          </p>
          <div className="grid grid-cols-4 gap-1.5 max-h-[140px] overflow-y-auto">
            {unattached.map(([name, url]) => (
              <button
                key={name}
                onClick={() => handlePickExisting(name)}
                className="aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600 hover:opacity-80 transition-opacity cursor-pointer"
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
          <p className="text-[11px] text-gray-400">No unattached photos available</p>
        </div>
      )}
    </div>,
    document.body
  )
}
