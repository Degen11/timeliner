import { X } from 'lucide-react'
import AnimatedModal from '@/components/shared/AnimatedModal'
import BatchActionBar from './BatchActionBar'
import ReviewPanel from '@/components/review/ReviewPanel'
import PhotoLibrary from './PhotoLibrary'
import InlineImportPanel from './InlineImportPanel'
import AddEventModal from './AddEventModal'
import EditEventModal from './EditEventModal'
import ShortcutsModal from './ShortcutsModal'
import InsightsPanel from './InsightsPanel'

function TimelineModals({
  showImport,
  setShowImport,
  addEventOpen,
  setAddEventOpen,
  photoLibOpen,
  setPhotoLibOpen,
  editingEvent,
  setEditingEvent,
  showShortcuts,
  setShowShortcuts,
}) {
  return (
    <>
      <BatchActionBar />
      <ReviewPanel />
      <PhotoLibrary open={photoLibOpen} onClose={() => setPhotoLibOpen(false)} />
      <AnimatedModal
        label="Import events"
        open={showImport}
        onClose={() => setShowImport(false)}
        className="bg-surface sm:rounded-2xl shadow-2xl max-w-3xl w-full sm:mx-4 max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden modal-surface"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 px-5 sm:px-6 pt-4 sm:pt-5 pb-3">
          <div className="min-w-0 space-y-1">
            <h2 className="font-serif text-2xl font-semibold text-text-strong">Import events</h2>
            <p className="text-sm text-text-default">
              Paste any text with dates. Claude pulls out the events, people and places.
            </p>
          </div>
          <button
            onClick={() => setShowImport(false)}
            className="-mr-2 flex h-11 w-11 sm:h-9 sm:w-9 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-surface-raised hover:text-text-strong transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <InlineImportPanel onDone={() => setShowImport(false)} variant="modal" />
      </AnimatedModal>
      <AddEventModal open={addEventOpen} onClose={() => setAddEventOpen(false)} />
      <EditEventModal event={editingEvent} onClose={() => setEditingEvent(null)} />
      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <InsightsPanel />
    </>
  )
}

export default TimelineModals
