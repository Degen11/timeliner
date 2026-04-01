/**
 * Highlights matching portions of text based on a search query.
 * Returns the text with <mark> tags around matches.
 */
export default function SearchHighlight({ text, query }) {
  if (!text || !query) return text || null

  const q = query.trim()
  if (!q) return text

  // Escape regex special chars
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`(${escaped})`, 'gi')
  const parts = text.split(regex)

  if (parts.length === 1) return text

  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <mark key={i} className="bg-yellow-200/80 dark:bg-yellow-500/30 text-inherit rounded-sm px-0.5">
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  )
}
