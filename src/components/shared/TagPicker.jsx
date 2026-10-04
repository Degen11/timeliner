import { useState } from 'react'
import { X, Search, Check, Plus } from 'lucide-react'
import { getTagPalette, TAG_SUGGESTIONS_VISIBLE } from '@/utils/constants'
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/Popover'

function ColorDot({ tag }) {
  return (
    <span
      className="h-2 w-2 shrink-0 rounded-full"
      style={{ backgroundColor: getTagPalette(tag).activeBg }}
      aria-hidden="true"
    />
  )
}

const chipCls =
  'inline-flex h-8 items-center gap-1.5 rounded-full border px-2.5 text-[13px] transition-colors duration-150 cursor-pointer'

/**
 * Tag selector for the event form: the event's tags as removable chips, a few
 * suggestions (most-used in this timeline) one tap away, and a searchable
 * popover over every tag that can also create a new one.
 */
export default function TagPicker({
  allTagOptions,
  selectedTags,
  onToggleTag,
  newTag,
  onNewTagChange,
  onAddCustomTag,
  tagCounts = {},
  labelId,
}) {
  const [open, setOpen] = useState(false)

  const byUsage = (a, b) => (tagCounts[b] ?? 0) - (tagCounts[a] ?? 0) || a.localeCompare(b)
  const suggestions = allTagOptions
    .filter((t) => !selectedTags.includes(t))
    .sort(byUsage)
    .slice(0, TAG_SUGGESTIONS_VISIBLE)

  const query = newTag.trim().toLowerCase()
  const listed = query ? allTagOptions.filter((t) => t.includes(query)) : [...allTagOptions].sort(byUsage)
  const canCreate = query.length > 0 && !allTagOptions.includes(query)

  const handleOpenChange = (next) => {
    setOpen(next)
    if (!next) onNewTagChange('')
  }

  return (
    <div role="group" aria-labelledby={labelId} className="flex flex-wrap items-center gap-1.5">
      {selectedTags.map((tag) => (
        <button
          key={tag}
          type="button"
          onClick={() => onToggleTag(tag)}
          aria-label={`Remove tag ${tag}`}
          className={`${chipCls} border-text-strong bg-text-strong pr-2 text-canvas`}
        >
          <ColorDot tag={tag} />
          {tag}
          <X size={12} strokeWidth={2.5} className="opacity-70" aria-hidden="true" />
        </button>
      ))}

      {suggestions.length > 0 && (
        <>
          {selectedTags.length > 0 && <span className="mx-1 h-[18px] w-px bg-gray-200" aria-hidden="true" />}
          <span className="text-xs text-text-muted">Suggested</span>
          {suggestions.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => onToggleTag(tag)}
              aria-label={`Add tag ${tag}`}
              className={`${chipCls} border-gray-200 bg-surface text-text-default hover:border-gray-300 hover:bg-surface-raised`}
            >
              <ColorDot tag={tag} />
              {tag}
            </button>
          ))}
        </>
      )}

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={`${chipCls} border-dashed border-gray-300 bg-transparent text-text-default hover:bg-surface-raised`}
          >
            <Search size={12} className="text-text-muted" aria-hidden="true" />
            Find or create tag
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="flex max-h-80 w-64 flex-col p-0">
          <div className="shrink-0 border-b border-gray-200 p-2">
            <input
              value={newTag}
              onChange={(e) => onNewTagChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return
                e.preventDefault()
                if (canCreate) onAddCustomTag()
                else if (listed.length === 1) onToggleTag(listed[0])
              }}
              placeholder="Search or create…"
              aria-label="Search or create a tag"
              className="w-full rounded-lg border border-gray-200 bg-surface px-2.5 py-1.5 text-base sm:text-sm text-text-default placeholder:text-text-muted focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/15"
              autoFocus
            />
          </div>
          <div className="overflow-y-auto py-1 app-scroll">
            {listed.map((tag) => {
              const active = selectedTags.includes(tag)
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onToggleTag(tag)}
                  aria-pressed={active}
                  className="flex w-full min-w-0 items-center gap-2 px-3 py-2 text-sm text-text-default transition-colors duration-150 hover:bg-surface-raised cursor-pointer"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded ${
                      active ? 'bg-text-strong text-canvas' : 'border border-gray-300'
                    }`}
                    aria-hidden="true"
                  >
                    {active && <Check size={11} strokeWidth={3} />}
                  </span>
                  <ColorDot tag={tag} />
                  <span className="truncate">{tag}</span>
                  {tagCounts[tag] != null && (
                    <span className="ml-auto shrink-0 text-xs tabular-nums text-text-muted">{tagCounts[tag]}</span>
                  )}
                </button>
              )
            })}
            {canCreate && (
              <button
                type="button"
                onClick={onAddCustomTag}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-text-strong transition-colors duration-150 hover:bg-surface-raised cursor-pointer"
              >
                <Plus size={14} className="text-text-muted" aria-hidden="true" />
                Create “{query}”
              </button>
            )}
            {!canCreate && listed.length === 0 && (
              <p className="px-3 py-2 text-xs text-text-muted">No tags yet</p>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
