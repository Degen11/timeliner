import { haptic } from '@/utils/haptics'
import useTimelineStore from '@/store/useTimelineStore'

/**
 * Shared click/double-click handlers for the variant view cards (Cinematic,
 * Magazine, Narrative, Panoramic, FilmStrip, Wave). Behaves like EventCard:
 * a click opens the read-only detail view, which has its own Edit button.
 * Ignores clicks made while selecting text or clicking photos.
 *
 * With `onSelect` (horizontal views), a click selects the event instead and a
 * double-click opens the editor.
 *
 * @param {Object} event - The event object
 * @param {boolean} editable - Whether the card is interactive (false in shared views)
 * @param {Function} onEdit - Opens the editor (double-click in select mode)
 * @param {Function} [onSelect] - Optional callback for single-click selection (horizontal views)
 * @returns {{ handleClick, handleDoubleClick }}
 */
export default function useCardClick(event, { editable, onEdit, onSelect } = {}) {
  const handleClick = (e) => {
    if (window.getSelection()?.toString()) return
    if (e.target.closest('[data-photo-click]')) return
    if (onSelect) {
      haptic('light')
      onSelect(event.id)
    } else if (editable) {
      useTimelineStore.getState().openEventDetail(event)
    }
  }

  const handleDoubleClick = () => {
    if (onSelect && editable && onEdit) onEdit(event)
  }

  return { handleClick, handleDoubleClick }
}
