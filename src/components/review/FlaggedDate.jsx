import { AlertTriangle, Check, X } from 'lucide-react'
import InlineEditor from './InlineEditor'
import useTimelineStore from '@/store/useTimelineStore'
import DatePicker from '@/components/shared/DatePicker'

export default function FlaggedDate({ event }) {
  const updateEvent = useTimelineStore((s) => s.updateEvent)
  const showToast = useTimelineStore((s) => s.showToast)

  const handleAccept = () => {
    updateEvent(event.id, { flagged: false, flagReason: null })
    showToast(`Accepted "${event.title}"`)
  }

  const handleDismiss = () => {
    updateEvent(event.id, { flagged: false, flagReason: null })
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-2.5 mb-3">
        <div className="rounded-full bg-amber-50 dark:bg-amber-500/15 p-1.5 flex-shrink-0 mt-0.5">
          <AlertTriangle size={13} className="text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-text-strong">{event.title}</p>
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">{event.flagReason}</p>
          <p className="text-xs text-text-muted mt-0.5">Original: &ldquo;{event.dateRaw}&rdquo;</p>
        </div>
      </div>

      {/* Editable fields */}
      <div className="space-y-2 mb-3">
        <div>
          <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
            Title
          </span>
          <InlineEditor
            value={event.title}
            label="title"
            onSave={(title) => updateEvent(event.id, { title })}
          />
        </div>
        <div>
          <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
            Date (start)
          </span>
          <DatePicker
            value={event.dateStart || ''}
            precision={event.datePrecision || 'day'}
            onChange={(dateStart, p) =>
              updateEvent(event.id, { dateStart, ...(p ? { datePrecision: p } : {}) })
            }
            placeholder="Pick a date"
          />
        </div>
        <div>
          <span className="text-[11px] font-medium text-text-muted uppercase tracking-wider">
            Description
          </span>
          <InlineEditor
            value={event.description || ''}
            label="description"
            multiline
            onSave={(description) => updateEvent(event.id, { description })}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleAccept}
          className="inline-flex items-center gap-1.5 rounded-full bg-success/10 border border-success/30 px-3 py-1.5 text-xs font-medium text-success hover:bg-success/15 transition-colors cursor-pointer"
        >
          <Check size={13} />
          Accept
        </button>
        <button
          onClick={handleDismiss}
          className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 px-3 py-1.5 text-xs font-medium text-text-muted hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
        >
          <X size={13} />
          Dismiss
        </button>
      </div>
    </div>
  )
}
