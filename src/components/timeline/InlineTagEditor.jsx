import { useState, useMemo, useRef, useEffect } from 'react'
import { Plus } from 'lucide-react'
import { TAG_OPTIONS, getTagButtonColor } from '@/utils/constants'
import useTimelineStore from '@/store/useTimelineStore'

export default function InlineTagEditor({ eventId, currentTags }) {
  const [open, setOpen] = useState(false)
  const [newTag, setNewTag] = useState('')
  const ref = useRef(null)
  const updateEvent = useTimelineStore((s) => s.updateEvent)
  const customTags = useTimelineStore((s) => s.customTags)
  const addCustomTag = useTimelineStore((s) => s.addCustomTag)

  const allOptions = useMemo(() => {
    const set = new Set([...TAG_OPTIONS, ...customTags])
    return [...set].sort()
  }, [customTags])

  useEffect(() => {
    if (!open) return
    const handle = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  const toggle = (tag) => {
    const tags = currentTags?.includes(tag)
      ? currentTags.filter((t) => t !== tag)
      : [...(currentTags || []), tag]
    updateEvent(eventId, { tags })
  }

  const handleAddCustom = () => {
    const trimmed = newTag.trim().toLowerCase()
    if (!trimmed) return
    addCustomTag(trimmed)
    if (!currentTags?.includes(trimmed)) {
      updateEvent(eventId, { tags: [...(currentTags || []), trimmed] })
    }
    setNewTag('')
  }

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        onClick={(e) => {
          e.stopPropagation()
          setOpen(!open)
        }}
        className="inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] text-gray-400 hover:text-secondary hover:bg-secondary/5 transition-colors cursor-pointer"
        title="Edit tags"
      >
        <Plus size={10} />
        tag
      </button>
      {open && (
        <div
          className="absolute top-full left-0 z-30 mt-1 min-w-[180px] rounded-xl border border-gray-200 bg-white p-3 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex flex-wrap gap-1 mb-2">
            {allOptions.map((tag) => {
              const colors = getTagButtonColor(tag)
              const isActive = currentTags?.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggle(tag)}
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold border transition-colors cursor-pointer"
                  style={isActive ? colors.active : colors.inactive}
                >
                  {tag}
                </button>
              )
            })}
          </div>
          <div className="flex items-center gap-1 border-t border-gray-100 pt-1.5">
            <input
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddCustom()
                }
              }}
              placeholder="New tag..."
              className="flex-1 min-w-0 rounded border border-gray-200 px-1.5 py-0.5 text-[11px] focus:outline-none focus:border-secondary"
            />
            <button
              onClick={handleAddCustom}
              className="rounded px-1.5 py-0.5 text-[11px] font-medium text-secondary hover:bg-secondary/10 transition-colors cursor-pointer"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
