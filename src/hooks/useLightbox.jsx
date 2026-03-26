import { createPortal } from 'react-dom'
import PhotoLightbox from '@/components/shared/PhotoLightbox'

/**
 * Renders a PhotoLightbox portal when lightboxIndex is set.
 * Returns a JSX element (or null) to include in the component's render output.
 *
 * @param {{ photos: Array, lightboxIndex: number|null, setLightboxIndex: Function }} options
 * @returns {import('react').ReactPortal|null}
 */
export default function renderLightbox({ photos, lightboxIndex, setLightboxIndex }) {
  if (lightboxIndex === null || photos.length === 0) return null

  return createPortal(
    <PhotoLightbox
      photos={photos}
      currentIndex={lightboxIndex}
      onIndexChange={setLightboxIndex}
      onClose={() => setLightboxIndex(null)}
    />,
    document.body
  )
}
