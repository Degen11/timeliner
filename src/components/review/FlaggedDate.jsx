import { AlertTriangle, CheckCircle } from 'lucide-react'
import InlineEditor from './InlineEditor'
import useTimelineStore from '@/store/useTimelineStore'
import DatePicker from '@/components/shared/DatePicker'

export default function FlaggedDate({ event }) {
  const updateEvent = useTimelineStore((s) => s.updateEvent)

  const handleResolve = () => {
    updateEvent(event.id, { flagged: false, flagReason: null })
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {/* Header */}
      <div className="flex items-start gap-2.5 mb-3">
        <div className="rounded-full bg-amber-50 p-1.5 flex-shrink-0 mt-0.5">
          <AlertTriangle size={13} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900">{event.title}</p>
          <p className="text-xs text-amber-600 mt-0.5">{event.flagReason}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Original: &ldquo;{event.dateRaw}&rdquo;
          </p>
        </div>
      </div>

      {/* Editable fields */}
      <div className="space-y-2 mb-3">
        <div>
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Title</span>
          <InlineEditor
            value={event.title}
            label="title"
            onSave={(title) => updateEvent(event.id, { title })}
          />
        </div>
        <div>
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Date (start)</span>
          <DatePicker
            value={event.dateStart || ''}
            precision={event.datePrecision || 'day'}
            onChange={(dateStart, p) => updateEvent(event.id, { dateStart, ...(p ? { datePrecision: p } : {}) })}
            placeholder="Pick a date"
          />
        </div>
        <div>
          <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Description</span>
          <InlineEditor
            value={event.description || ''}
            label="description"
            multiline
            onSave={(description) => updateEvent(event.id, { description })}
          />
        </div>
      </div>

      {/* Resolve button — proper pill */}
      <button
        onClick={handleResolve}
        className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-100 hover:border-emerald-300 transition-colors cursor-pointer"
      >
        <CheckCircle size={13} />
        Mark as resolved
      </button>
    </div>
  )
}
