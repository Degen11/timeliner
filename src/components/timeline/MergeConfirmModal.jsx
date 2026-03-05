import { useMemo } from 'react'
import { ArrowRight, GitMerge } from 'lucide-react'
import AnimatedModal from '@/components/shared/AnimatedModal'
import Badge from '@/components/shared/Badge'
import { formatEventDate } from '@/utils/dateUtils'
import { safeDateCompare } from '@/utils/dateUtils'

function EventPreview({ event, label }) {
  return (
    <div className="flex-1 min-w-0 rounded-lg border border-gray-200 bg-gray-50 p-3">
      <p className="text-[10px] uppercase tracking-wider text-gray-400 font-semibold mb-1.5">
        {label}
      </p>
      <p className="text-sm font-semibold text-gray-900 truncate">{event.title}</p>
      <p className="text-xs text-secondary mt-0.5">{formatEventDate(event) || 'No date'}</p>
      {event.description && (
        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{event.description}</p>
      )}
      <div className="flex flex-wrap gap-1 mt-2">
        {event.people?.map((p) => (
          <Badge key={p} variant="accent" small>
            {p}
          </Badge>
        ))}
        {event.tags?.map((t) => (
          <Badge key={t} variant={t} small>
            {t}
          </Badge>
        ))}
      </div>
    </div>
  )
}

export default function MergeConfirmModal({ open, onClose, source, target, onConfirm }) {
  // Compute merged preview
  const preview = useMemo(() => {
    if (!source || !target) return null

    const useSourceDate =
      source.dateStart && target.dateStart
        ? safeDateCompare(source.dateStart, target.dateStart) < 0
        : !!source.dateStart

    const earliestStart = useSourceDate ? source.dateStart : target.dateStart

    // For end date: take the latest of all available dates
    const endCandidates = [target.dateEnd, source.dateEnd].filter(Boolean)
    let dateEnd = null
    if (endCandidates.length > 0) {
      dateEnd = endCandidates.reduce((latest, d) =>
        safeDateCompare(d, latest) > 0 ? d : latest
      )
    }
    // If both have different dateStarts and no dateEnd, create a range
    if (
      !dateEnd &&
      source.dateStart &&
      target.dateStart &&
      source.dateStart !== target.dateStart
    ) {
      const laterStart =
        safeDateCompare(source.dateStart, target.dateStart) > 0
          ? source.dateStart
          : target.dateStart
      dateEnd = laterStart
    }

    const people = [...new Set([...(target.people || []), ...(source.people || [])])]
    const tags = [...new Set([...(target.tags || []), ...(source.tags || [])])]
    const description = [target.description, source.description].filter(Boolean).join('\n\n')

    const dateRawParts = [target.dateRaw, source.dateRaw].filter(Boolean)
    const dateRaw =
      dateRawParts.length === 2 && dateRawParts[0] !== dateRawParts[1]
        ? dateRawParts.join(' / ')
        : dateRawParts[0] || null

    return {
      title: target.title,
      dateStart: earliestStart,
      dateEnd,
      dateRaw,
      datePrecision: target.datePrecision || source.datePrecision,
      description,
      people,
      tags,
      datesConflict:
        source.dateStart &&
        target.dateStart &&
        source.dateStart !== target.dateStart,
      dateExplanation: useSourceDate
        ? `Using earlier date from "${source.title}"`
        : target.dateStart
          ? `Keeping date from "${target.title}"`
          : 'No date available',
    }
  }, [source, target])

  if (!source || !target || !preview) return null

  return (
    <AnimatedModal
      open={open}
      onClose={onClose}
      className="bg-white rounded-xl shadow-lg max-w-lg w-full mx-4"
    >
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <GitMerge size={18} className="text-secondary" />
          <h2 className="font-display text-lg font-semibold text-gray-900">Merge Events</h2>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          The dragged event will be merged into the target. This can be undone.
        </p>
      </div>

      <div className="p-5 space-y-4">
        {/* Side-by-side source → target */}
        <div className="flex items-stretch gap-2">
          <EventPreview event={source} label="Dragged" />
          <div className="flex items-center shrink-0">
            <ArrowRight size={16} className="text-gray-300" />
          </div>
          <EventPreview event={target} label="Target (kept)" />
        </div>

        {/* Merged result preview */}
        <div className="rounded-lg border-2 border-secondary/20 bg-secondary/[0.03] p-3">
          <p className="text-[10px] uppercase tracking-wider text-secondary font-semibold mb-2">
            Merged Result
          </p>
          <p className="text-sm font-semibold text-gray-900">{preview.title}</p>

          {/* Date section */}
          <div className="mt-1.5">
            <p className="text-xs text-secondary">
              {formatEventDate({
                dateStart: preview.dateStart,
                dateEnd: preview.dateEnd,
                datePrecision: preview.datePrecision,
              }) || 'No date'}
            </p>
            {preview.datesConflict && (
              <p className="text-[10px] text-amber-600 mt-0.5">{preview.dateExplanation}</p>
            )}
          </div>

          {preview.description && (
            <p className="text-xs text-gray-500 mt-1.5 line-clamp-3">{preview.description}</p>
          )}

          <div className="flex flex-wrap gap-1 mt-2">
            {preview.people.map((p) => (
              <Badge key={p} variant="accent" small>
                {p}
              </Badge>
            ))}
            {preview.tags.map((t) => (
              <Badge key={t} variant={t} small>
                {t}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 p-5 border-t border-gray-100">
        <button
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onConfirm(source.id, target.id)
            onClose()
          }}
          className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-secondary hover:bg-secondary-hover transition-colors cursor-pointer"
        >
          Merge
        </button>
      </div>
    </AnimatedModal>
  )
}
