/**
 * Shared click/double-click handlers for timeline event cards.
 * Prevents triggering edits when the user is selecting text or clicking photos.
 *
 * @param {Object} event - The event object
 * @param {boolean} editable - Whether the card is in edit mode
 * @param {Function} onEdit - Callback when the card is clicked/double-clicked for editing
 * @param {Function} [onSelect] - Optional callback for single-click selection (e.g. horizontal views)
 * @returns {{ handleClick, handleDoubleClick }}
 */
export default function useCardClick(event, { editable, onEdit, onSelect } = {}) {
  const handleClick = (e) => {
    if (window.getSelection()?.toString()) return
    if (e.target.closest('[data-photo-click]')) return
    if (editable && onEdit) {
      onEdit(event)
    } else if (onSelect) {
      onSelect(event.id)
    }
  }

  const handleDoubleClick = () => {
    if (editable && onEdit) onEdit(event)
  }

  return { handleClick, handleDoubleClick }
}
