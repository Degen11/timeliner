import { useMemo } from 'react'
import { X } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { getFlaggedEvents } from '@/store/selectors'
import AnimatedModal from '@/components/shared/AnimatedModal'
import FlaggedDate from './FlaggedDate'

export default function ReviewPanel() {
  const events = useTimelineStore((s) => s.events)
  const reviewMode = useTimelineStore((s) => s.reviewMode)
  const toggleReviewMode = useTimelineStore((s) => s.toggleReviewMode)
  const flagged = useMemo(() => getFlaggedEvents(events), [events])

  return (
    <AnimatedModal
      open={reviewMode}
      onClose={toggleReviewMode}
      className="bg-surface rounded-2xl shadow-2xl max-w-lg w-full mx-4 max-h-[85vh] flex flex-col overflow-hidden modal-surface"
    >
      <div className="flex items-center justify-between border-b border-gray-100 px-6 pt-5 pb-4 shrink-0">
        <div>
          <h2 className="font-display text-lg font-semibold text-text-strong">
            Review Flagged Dates
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            {flagged.length} item{flagged.length !== 1 ? 's' : ''} need review
          </p>
        </div>
        <button
          onClick={toggleReviewMode}
          className="rounded-lg p-1.5 text-gray-400 hover:text-text-strong hover:bg-surface-raised transition-colors cursor-pointer"
          aria-label="Close review panel"
        >
          <X size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {flagged.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-8">
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
    </AnimatedModal>
  )
}
