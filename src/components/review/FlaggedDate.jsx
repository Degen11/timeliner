import { AlertTriangle, CheckCircle } from 'lucide-react'
import InlineEditor from './InlineEditor'
import useTimelineStore from '@/store/useTimelineStore'

export default function FlaggedDate({ event }) {
  const updateEvent = useTimelineStore((s) => s.updateEvent)

  const handleResolve = () => {
    updateEvent(event.id, { flagged: false, flagReason: null })
  }

  return (
    <div className="rounded-md border border-flag/30 bg-flag-light/30 p-3">
      <div className="flex items-start gap-2 mb-2">
        <AlertTriangle size={14} className="text-flag mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs text-flag font-medium">{event.flagReason}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Original: &ldquo;{event.dateRaw}&rdquo;
          </p>
        </div>
      </div>

      <div className="space-y-1 mb-2">
        <div>
          <span className="text-xs text-gray-500">Title</span>
          <InlineEditor
            value={event.title}
            label="title"
            onSave={(title) => updateEvent(event.id, { title })}
          />
        </div>
        <div>
          <span className="text-xs text-gray-500">Date (start)</span>
          <InlineEditor
            value={event.dateStart || ''}
            label="start date"
            onSave={(dateStart) => updateEvent(event.id, { dateStart })}
          />
        </div>
        <div>
          <span className="text-xs text-gray-500">Description</span>
          <InlineEditor
            value={event.description || ''}
            label="description"
            multiline
            onSave={(description) => updateEvent(event.id, { description })}
          />
        </div>
      </div>

      <button
        onClick={handleResolve}
        className="flex items-center gap-1 text-xs text-success hover:underline"
      >
        <CheckCircle size={12} />
        Mark as resolved
      </button>
    </div>
  )
}
