import { useState, useRef, useCallback } from 'react'
import { X, ChevronDown, Check } from 'lucide-react'
import Badge from '@/components/shared/Badge'
import { getTagPalette } from '@/utils/constants'
import { inputCls, dropdownCls } from '@/utils/ui'
import useClickOutside from '@/hooks/useClickOutside'

/**
 * Shared tag selector dropdown used by AddEventModal and EditEventModal.
 */
export default function TagDropdown({
  allTagOptions,
  selectedTags,
  onToggleTag,
  newTag,
  onNewTagChange,
  onAddCustomTag,
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const close = useCallback(() => setOpen(false), [])
  useClickOutside(ref, close, open)

  return (
    <div className="relative" ref={ref}>
      <label className="block text-sm font-medium text-text-default mb-1">Tags</label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`${inputCls()} text-left flex items-center gap-2 cursor-pointer`}
      >
        <div className="flex-1 flex flex-wrap gap-1 min-h-[20px]">
          {selectedTags.length === 0 ? (
            <span className="text-text-muted">Select tags...</span>
          ) : (
            selectedTags.map((tag) => (
              <Badge key={tag} variant={tag}>
                {tag}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleTag(tag)
                  }}
                  className="hover:opacity-70 cursor-pointer ml-0.5"
                >
                  <X size={10} />
                </button>
              </Badge>
            ))
          )}
        </div>
        <ChevronDown size={14} className={`text-text-muted shrink-0 transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className={`${dropdownCls} left-0 right-0 max-h-52 overflow-y-auto app-scroll`}>
          {allTagOptions.map((tag) => {
            const isActive = selectedTags.includes(tag)
            const palette = getTagPalette(tag)
            return (
              <button
                key={tag}
                type="button"
                onClick={() => onToggleTag(tag)}
                className="w-full text-left px-3 py-2 text-sm cursor-pointer transition-colors duration-150 flex items-center gap-2 hover:bg-surface-raised"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: palette.activeBg }}
                />
                <span className="flex-1 text-text-default">{tag}</span>
                {isActive && <Check size={14} className="text-secondary shrink-0" />}
              </button>
            )
          })}
          <div className="border-t border-gray-200 mt-1 pt-1 px-3 pb-1">
            <div className="flex items-center gap-1.5">
              <input
                value={newTag}
                onChange={(e) => onNewTagChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    onAddCustomTag()
                  }
                }}
                placeholder="Create new tag..."
                className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-canvas px-2 py-1 text-sm text-text-default focus:outline-none focus:ring-2 focus:ring-secondary/15 focus:border-secondary transition-colors"
                onClick={(e) => e.stopPropagation()}
              />
              <button
                type="button"
                onClick={onAddCustomTag}
                className="rounded-lg px-2 py-1 text-sm font-medium text-secondary hover:bg-secondary/10 transition-colors duration-150 cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
