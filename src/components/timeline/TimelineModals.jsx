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
        className="bg-surface rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[85vh] flex flex-col overflow-hidden modal-surface"
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 shrink-0">
          <h2 className="font-display text-lg font-semibold text-text-strong">Import Text</h2>
          <button
            onClick={() => setShowImport(false)}
            className="rounded-lg p-1.5 text-gray-400 hover:text-text-strong hover:bg-surface-raised transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
          <InlineImportPanel onDone={() => setShowImport(false)} noWrapper />
        </div>
      </AnimatedModal>
      <AddEventModal open={addEventOpen} onClose={() => setAddEventOpen(false)} />
      <EditEventModal event={editingEvent} onClose={() => setEditingEvent(null)} />
      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
      <InsightsPanel />
    </>
  )
}

export default TimelineModals
