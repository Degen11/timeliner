import { X } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { getFlaggedEvents } from '@/store/selectors'
import FlaggedDate from './FlaggedDate'

export default function ReviewPanel() {
  const { events, reviewMode, toggleReviewMode } = useTimelineStore()
  const flagged = getFlaggedEvents(events)

  if (!reviewMode) return null

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-sm bg-white border-l border-gray-200 shadow-lg flex flex-col">
      <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            Review Flagged Dates
          </h2>
          <p className="text-xs text-gray-500">
            {flagged.length} item{flagged.length !== 1 ? 's' : ''} need review
          </p>
        </div>
        <button
          onClick={toggleReviewMode}
          className="rounded p-1 text-gray-400 hover:text-gray-700 hover:bg-gray-100"
          aria-label="Close review panel"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {flagged.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            All dates have been reviewed. Nice work!
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {flagged.map((event) => (
              <FlaggedDate key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
