import { useMemo } from 'react'
import { GitMerge, ArrowDown } from 'lucide-react'
import AnimatedModal from '@/components/shared/AnimatedModal'
import Badge from '@/components/shared/Badge'
import { formatEventDate, formatEventDateShort } from '@/utils/dateUtils'
import { safeDateCompare } from '@/utils/dateUtils'

function EventRow({ event, label, labelColor = 'text-gray-400' }) {
  const date = formatEventDateShort(event) || formatEventDate(event) || 'No date'
  return (
    <div className="flex items-start gap-3 py-2">
      <span
        className={`text-[10px] uppercase tracking-wider font-semibold mt-0.5 shrink-0 w-14 ${labelColor}`}
      >
        {label}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">{event.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{date}</p>
      </div>
    </div>
  )
}

export default function MergeConfirmModal({ open, onClose, source, target, onConfirm }) {
  const preview = useMemo(() => {
    if (!source || !target) return null

    const useSourceDate =
      source.dateStart && target.dateStart
        ? safeDateCompare(source.dateStart, target.dateStart) < 0
        : !!source.dateStart

    const earliestStart = useSourceDate ? source.dateStart : target.dateStart

    const endCandidates = [target.dateEnd, source.dateEnd].filter(Boolean)
    let dateEnd = null
    if (endCandidates.length > 0) {
      dateEnd = endCandidates.reduce((latest, d) =>
        safeDateCompare(d, latest) > 0 ? d : latest
      )
    }
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

  const mergedDate =
    formatEventDate({
      dateStart: preview.dateStart,
      dateEnd: preview.dateEnd,
      datePrecision: preview.datePrecision,
    }) || 'No date'

  return (
    <AnimatedModal
      open={open}
      onClose={onClose}
      className="bg-white rounded-xl shadow-lg max-w-md w-full mx-4"
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-secondary/10 p-1.5">
            <GitMerge size={16} className="text-secondary" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-gray-900">
              Merge Events
            </h2>
            <p className="text-[11px] text-gray-400">
              Combine two events into one. This can be undone.
            </p>
          </div>
        </div>
      </div>

      {/* Source + Target rows */}
      <div className="px-5">
        <div className="rounded-lg bg-gray-50 px-3 py-1 divide-y divide-gray-200/60">
          <EventRow event={source} label="From" />
          <EventRow event={target} label="Into" />
        </div>

        {/* Arrow */}
        <div className="flex justify-center py-2">
          <ArrowDown size={16} className="text-gray-300" />
        </div>

        {/* Merged result */}
        <div className="rounded-lg border-2 border-secondary/20 bg-secondary/[0.03] px-4 py-3">
          <p className="text-[10px] uppercase tracking-wider text-secondary font-semibold mb-1.5">
            Result
          </p>
          <p className="text-sm font-semibold text-gray-900">{preview.title}</p>
          <p className="text-xs text-secondary mt-0.5">{mergedDate}</p>
          {preview.datesConflict && (
            <p className="text-[10px] text-amber-600 mt-0.5">{preview.dateExplanation}</p>
          )}
          {preview.description && (
            <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{preview.description}</p>
          )}
          {(preview.people.length > 0 || preview.tags.length > 0) && (
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
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 px-5 py-4">
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
        >
          Cancel
        </button>
        <button
          type="button"
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
