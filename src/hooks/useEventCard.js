import { useState } from 'react'
import { useResolvedPhotos } from '@/hooks/useResolvedPhotos'
import useCardClick from '@/hooks/useCardClick'
import { getTagPalette, getEventColor } from '@/utils/constants'

const EMPTY_PHOTOS = []

/**
 * Shared setup logic for event card components across all view variants.
 * Resolves photos, computes palette/accent colors, and wires up click handling.
 *
 * @param {Object} event - The event object
 * @param {Object} options
 * @param {boolean} options.editable - Whether the card supports editing
 * @param {Function} options.onEdit - Edit callback
 * @param {Function} [options.onSelect] - Optional selection callback (horizontal views)
 * @returns {{ photos, heroPhoto, palette, accentColor, color, lightboxIndex, setLightboxIndex, handleClick, handleDoubleClick }}
 */
export default function useEventCard(event, { editable, onEdit, onSelect } = {}) {
  const [lightboxIndex, setLightboxIndex] = useState(null)
  const photos = useResolvedPhotos(event.photos || EMPTY_PHOTOS).filter((p) => p.url)
  const heroPhoto = photos[0] || null
  const palette = event.tags?.[0] ? getTagPalette(event.tags[0]) : null
  const accentColor = palette?.activeBg || '#525252'
  const color = getEventColor(event)

  const { handleClick, handleDoubleClick } = useCardClick(event, { editable, onEdit, onSelect })

  return {
    photos,
    heroPhoto,
    palette,
    accentColor,
    color,
    lightboxIndex,
    setLightboxIndex,
    handleClick,
    handleDoubleClick,
  }
}
