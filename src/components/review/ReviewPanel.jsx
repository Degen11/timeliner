import { useMemo } from 'react'
import { X } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { getFlaggedEvents } from '@/store/selectors'
import AnimatedSidePanel from '@/components/shared/AnimatedSidePanel'
import FlaggedDate from './FlaggedDate'

export default function ReviewPanel() {
  const events = useTimelineStore((s) => s.events)
  const reviewMode = useTimelineStore((s) => s.reviewMode)
  const toggleReviewMode = useTimelineStore((s) => s.toggleReviewMode)
  const flagged = useMemo(() => getFlaggedEvents(events), [events])

  return (
    <AnimatedSidePanel open={reviewMode} onClose={toggleReviewMode}>
      <div className="flex items-center justify-between border-b border-gray-200 bg-white px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-900">
            Review Flagged Dates
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {flagged.length} item{flagged.length !== 1 ? 's' : ''} need review
          </p>
        </div>
        <button
          onClick={toggleReviewMode}
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
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
    </AnimatedSidePanel>
  )
}
