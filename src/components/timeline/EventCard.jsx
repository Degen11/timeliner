import { format, parseISO } from 'date-fns'
import { AlertTriangle } from 'lucide-react'
import Badge from '@/components/shared/Badge'

function formatEventDate(event) {
  if (!event.dateStart) return event.dateRaw || 'Unknown date'

  const start = parseISO(event.dateStart)
  let formatted

  switch (event.datePrecision) {
    case 'day':
      formatted = format(start, 'MMMM d, yyyy')
      break
    case 'month':
      formatted = format(start, 'MMMM yyyy')
      break
    case 'year':
      formatted = format(start, 'yyyy')
      break
    case 'decade':
      formatted = `${format(start, 'yyyy')}s`
      break
    default:
      formatted = format(start, 'MMMM d, yyyy')
  }

  if (event.dateEnd) {
    const end = parseISO(event.dateEnd)
    const endFormatted =
      event.datePrecision === 'year'
        ? format(end, 'yyyy')
        : format(end, 'MMMM d, yyyy')
    formatted = `${formatted} – ${endFormatted}`
  }

  return formatted
}

export default function EventCard({ event, compact = false }) {
  return (
    <div className="group rounded-xl bg-white border border-gray-200 px-5 py-4 transition-all hover:shadow-md hover:border-gray-300">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-medium text-accent/60 tracking-wide uppercase">
              {formatEventDate(event)}
            </span>
            {event.flagged && (
              <span className="flex items-center gap-1 text-xs text-flag" title={event.flagReason}>
                <AlertTriangle size={12} />
                <span className="hidden sm:inline">Flagged</span>
              </span>
            )}
          </div>

          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            {event.title}
          </h3>

          {!compact && event.description && (
            <p className="text-sm text-gray-500 leading-relaxed mb-2.5">{event.description}</p>
          )}

          <div className="flex flex-wrap gap-1.5">
            {event.people?.map((person) => (
              <Badge key={person} variant="accent">
                {person}
              </Badge>
            ))}
            {event.tags?.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        </div>

        {event.photos?.length > 0 && (
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center text-xs text-gray-400">
              {event.photos.length} img
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
