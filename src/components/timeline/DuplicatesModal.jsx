import { useState } from 'react'
import { X, CopyCheck, GitMerge, Check } from 'lucide-react'
import AnimatedModal from '@/components/shared/AnimatedModal'
import { Button } from '@/components/ui/Button'
import Badge from '@/components/shared/Badge'
import EmptyState from '@/components/shared/EmptyState'
import { findDuplicatesWithin } from '@/utils/dedupeHelpers'
import { formatEventDate, safeDateCompare } from '@/utils/dateUtils'
import useTimelineStore from '@/store/useTimelineStore'

/** Stable key for an unordered pair, independent of scan order. */
function pairKey(a, b) {
  return [a.id, b.id].sort().join('::')
}

/**
 * Choose which event survives the merge as the base ("target"). Prefer the one
 * with the richer description; break ties by the earlier start date. mergeEvents
 * still unions people/tags/photos and joins descriptions either way — this just
 * decides whose title/id is kept.
 */
function pickTarget(a, b) {
  const da = (a.description || '').length
  const db = (b.description || '').length
  if (da !== db) return da > db ? a : b
  if (a.dateStart && b.dateStart) return safeDateCompare(a.dateStart, b.dateStart) <= 0 ? a : b
  return a
}

function EventSummary({ event, isTarget }) {
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1.5">
        <p className="text-sm font-semibold text-text-strong truncate">{event.title || 'Untitled'}</p>
        {isTarget && (
          <span className="shrink-0 rounded-full bg-secondary/10 text-secondary text-[10px] font-medium px-1.5 py-0.5">
            Kept
          </span>
        )}
      </div>
      <p className="text-xs text-text-muted tabular-nums">{formatEventDate(event) || 'No date'}</p>
      {event.description && (
        <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{event.description}</p>
      )}
      {(event.tags?.length > 0 || event.people?.length > 0) && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {event.people?.map((p) => (
            <Badge key={`p-${p}`} variant="accent" small>{p}</Badge>
          ))}
          {event.tags?.map((t) => (
            <Badge key={`t-${t}`} variant={t} small>{t}</Badge>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DuplicatesModal({ open, onClose, events }) {
  // Session-only: pairs the user chose to keep both of. Keyed so they stay
  // dismissed across the re-scan that follows each merge.
  const [dismissed, setDismissed] = useState(() => new Set())
  const mergeEvents = useTimelineStore((s) => s.mergeEvents)

  // Re-scan whenever events change (a merge deletes one event, so its pairs
  // vanish automatically). Only compute while open.
  const allPairs = open ? findDuplicatesWithin(events) : []
  const pairs = allPairs.filter((p) => !dismissed.has(pairKey(p.a, p.b)))

  const handleClose = () => {
    setDismissed(new Set())
    onClose()
  }

  const handleMerge = (a, b) => {
    const target = pickTarget(a, b)
    const source = target === a ? b : a
    mergeEvents(source.id, target.id)
  }

  const handleKeepBoth = (a, b) => {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(pairKey(a, b))
      return next
    })
  }

  return (
    <AnimatedModal
      label="Find duplicate events"
      open={open}
      onClose={handleClose}
      className="bg-surface rounded-xl shadow-2xl max-w-xl w-full mx-4 max-h-[85vh] flex flex-col overflow-hidden modal-surface"
    >
      <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
            <CopyCheck size={16} className="text-secondary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-strong">Find duplicates</h3>
            {pairs.length > 0 && (
              <p className="text-xs text-text-muted">
                {pairs.length} possible duplicate{pairs.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Close">
          <X size={16} />
        </Button>
      </div>

      {pairs.length === 0 ? (
        <div className="px-5 py-8">
          <EmptyState
            icon={Check}
            title="No duplicates found"
            description="Every event looks distinct. Merging combines two events into one, keeping all people, tags, and photos."
          />
        </div>
      ) : (
        <div className="px-5 py-4 overflow-y-auto app-scroll flex-1 min-h-0 space-y-3">
          {pairs.map(({ a, b }) => {
            const target = pickTarget(a, b)
            return (
              <div
                key={pairKey(a, b)}
                className="rounded-xl border border-gray-200/60 bg-surface-raised/40 p-3 space-y-3"
              >
                <div className="space-y-2">
                  <EventSummary event={a} isTarget={target === a} />
                  <div className="border-t border-gray-200/60" />
                  <EventSummary event={b} isTarget={target === b} />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    onClick={() => handleKeepBoth(a, b)}
                    className="text-xs text-text-muted hover:text-text-default transition-colors duration-150 cursor-pointer px-2 py-1.5"
                  >
                    Keep both
                  </button>
                  <Button variant="secondary" size="sm" onClick={() => handleMerge(a, b)}>
                    <GitMerge size={14} />
                    Merge
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AnimatedModal>
  )
}
