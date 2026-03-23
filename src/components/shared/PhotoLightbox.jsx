import { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { pushModal, popModal } from '@/utils/modalStack'

export default function PhotoLightbox({ photos, initialIndex = 0, currentIndex, onIndexChange, onClose }) {
  const index = currentIndex ?? initialIndex
  const total = photos.length
  const hasMultiple = total > 1
  const layerRef = useRef(null)
  const [zIndex, setZIndex] = useState(1100)
  const directionRef = useRef(0)

  // Register with modal stack in useEffect to avoid mutating ref during render
  useEffect(() => {
    const entry = pushModal()
    layerRef.current = entry
    setZIndex(entry.zIndex)
    return () => {
      popModal(entry.id)
      layerRef.current = null
    }
  }, [])

  const goNext = () => {
    if (hasMultiple) {
      directionRef.current = 1
      onIndexChange((index + 1) % total)
    }
  }

  const goPrev = () => {
    if (hasMultiple) {
      directionRef.current = -1
      onIndexChange((index - 1 + total) % total)
    }
  }

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight' && hasMultiple) {
        directionRef.current = 1
        onIndexChange((index + 1) % total)
      }
      if (e.key === 'ArrowLeft' && hasMultiple) {
        directionRef.current = -1
        onIndexChange((index - 1 + total) % total)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, index, total, hasMultiple, onIndexChange])

  const current = photos[index]
  if (!current) return null

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Backdrop — click to close */}
      <div className="absolute inset-0 bg-black/80" onClick={onClose} />

      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 rounded-full bg-black/50 p-2 text-white/80 hover:text-white hover:bg-black/70 transition-colors cursor-pointer"
        aria-label="Close"
      >
        <X size={20} />
      </button>

      {/* Counter */}
      {hasMultiple && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 rounded-full bg-black/50 px-3 py-1 text-sm text-white/80">
          {index + 1} / {total}
        </div>
      )}

      {/* Prev button */}
      {hasMultiple && (
        <button
          onClick={goPrev}
          className="absolute left-4 z-10 rounded-full bg-black/50 p-2 text-white/80 hover:text-white hover:bg-black/70 transition-colors cursor-pointer"
          aria-label="Previous photo"
        >
          <ChevronLeft size={24} />
        </button>
      )}

      {/* Image */}
      <AnimatePresence mode="popLayout" initial={false} custom={directionRef.current}>
        <motion.img
          key={index}
          src={current.url}
          alt={current.name || `Photo ${index + 1}`}
          className="relative z-[5] max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
          custom={directionRef.current}
          initial={(d) => ({ opacity: 0, x: d * 50, scale: 0.95 })}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={(d) => ({ opacity: 0, x: d * -50, scale: 0.95 })}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        />
      </AnimatePresence>

      {/* Next button */}
      {hasMultiple && (
        <button
          onClick={goNext}
          className="absolute right-4 z-10 rounded-full bg-black/50 p-2 text-white/80 hover:text-white hover:bg-black/70 transition-colors cursor-pointer"
          aria-label="Next photo"
        >
          <ChevronRight size={24} />
        </button>
      )}

      {/* Filename */}
      {current.name && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 rounded-full bg-black/50 px-3 py-1 text-xs text-white/60 max-w-xs truncate" title={current.name}>
          {current.name}
        </div>
      )}
    </div>
  )
}
