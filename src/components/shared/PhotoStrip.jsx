/**
 * Renders a row of photo thumbnails with a "+N" overflow badge.
 * Used across all timeline view variants that display photo strips.
 *
 * @param {Object} props
 * @param {Array} props.photos - Resolved photo objects ({ name, url })
 * @param {Function} props.onPhotoClick - Called with (index) when a thumbnail is clicked
 * @param {number} [props.maxVisible=4] - Max thumbnails to show before the "+N" badge
 * @param {'sm'|'md'|'lg'} [props.size='sm'] - Thumbnail size preset
 * @param {string} [props.className] - Additional container classes
 */

const SIZE_CLASSES = {
  sm: { img: 'w-8 h-8', badge: 'w-8 h-8 text-[9px]' },
  md: { img: 'w-9 h-9', badge: 'w-9 h-9 text-[9px]' },
  lg: { img: 'w-12 h-12', badge: 'w-12 h-12 text-xs' },
}

export default function PhotoStrip({
  photos,
  onPhotoClick,
  maxVisible = 4,
  size = 'sm',
  className = '',
}) {
  if (photos.length <= 1) return null

  const sizeClasses = SIZE_CLASSES[size] || SIZE_CLASSES.sm
  const visible = photos.slice(1, maxVisible + 1)
  const overflow = photos.length - maxVisible - 1

  return (
    <div className={`flex gap-1.5 ${className}`}>
      {visible.map((p, i) => (
        <img
          key={p.name}
          src={p.url}
          alt={p.name}
          data-photo-click
          className={`${sizeClasses.img} rounded-md object-cover border-2 border-white/80 shadow-md cursor-pointer hover:scale-110 transition-transform`}
          onClick={(e) => {
            e.stopPropagation()
            onPhotoClick(i + 1)
          }}
        />
      ))}
      {overflow > 0 && (
        <div
          data-photo-click
          className={`${sizeClasses.badge} rounded-md bg-black/50 backdrop-blur-sm border-2 border-white/80 flex items-center justify-center font-bold text-white cursor-pointer hover:bg-black/60 transition-colors`}
          onClick={(e) => {
            e.stopPropagation()
            onPhotoClick(maxVisible + 1)
          }}
        >
          +{overflow}
        </div>
      )}
    </div>
  )
}
