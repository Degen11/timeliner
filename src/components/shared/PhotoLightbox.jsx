import { useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export default function PhotoLightbox({ photos, initialIndex = 0, currentIndex, onIndexChange, onClose }) {
  const index = currentIndex ?? initialIndex
  const total = photos.length
  const hasMultiple = total > 1

  const goNext = useCallback(() => {
    if (hasMultiple) onIndexChange((index + 1) % total)
  }, [index, total, hasMultiple, onIndexChange])

  const goPrev = useCallback(() => {
    if (hasMultiple) onIndexChange((index - 1 + total) % total)
  }, [index, total, hasMultiple, onIndexChange])

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose, goNext, goPrev])

  const current = photos[index]
  if (!current) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
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
      <img
        src={current.url}
        alt={current.name || `Photo ${index + 1}`}
        className="relative z-[5] max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
      />

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
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 rounded-full bg-black/50 px-3 py-1 text-xs text-white/60 max-w-xs truncate">
          {current.name}
        </div>
      )}
    </div>
  )
}
