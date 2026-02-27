import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  List,
  GripHorizontal,
  LayoutGrid,
  FileText,
  Image,
  Plus,
  Undo2,
  Redo2,
  Printer,
  Keyboard,
} from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { getFilteredEvents, getSortedEvents } from '@/store/selectors'
import { VIEWS } from '@/utils/constants'
import { printTimeline } from '@/utils/exportHelpers'
import Button from '@/components/shared/Button'
import EmptyState from '@/components/shared/EmptyState'
import FilterBar from '@/components/filters/FilterBar'
import ReviewPanel from '@/components/review/ReviewPanel'
import ExportMenu from '@/components/export/ExportMenu'
import PhotoLibrary from './PhotoLibrary'
import VerticalView from './VerticalView'
import HorizontalView from './HorizontalView'
import GridView from './GridView'
import AddEventModal from './AddEventModal'
import ImportMenu from './ImportMenu'
import TimelineManager from './TimelineManager'
import SortBar from './SortBar'
import useKeyboardShortcutsTimeline from '@/hooks/useKeyboardShortcutsTimeline'

const VIEW_OPTIONS = [
  { key: VIEWS.VERTICAL, label: 'Vertical', icon: List, shortcut: '1' },
  { key: VIEWS.HORIZONTAL, label: 'Horizontal', icon: GripHorizontal, shortcut: '2' },
  { key: VIEWS.GRID, label: 'Grid', icon: LayoutGrid, shortcut: '3' },
]

const PAGE_SIZE = 50

export default function TimelinePage() {
  const navigate = useNavigate()
  const {
    events,
    activeView,
    setActiveView,
    filters,
    photoMap,
    sortOrder,
    canUndo,
    canRedo,
    undo,
    redo,
    reorderEvents,
  } = useTimelineStore()
  const filtered = getFilteredEvents(events, filters)
  const sorted = useMemo(() => getSortedEvents(filtered, sortOrder), [filtered, sortOrder])

  const [photoLibOpen, setPhotoLibOpen] = useState(false)
  const [addEventOpen, setAddEventOpen] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [dragMode, setDragMode] = useState(false)
  const [page, setPage] = useState(1)
  const photoCount = Object.keys(photoMap).length

  // Pagination
  const paginated = useMemo(
    () => sorted.slice(0, page * PAGE_SIZE),
    [sorted, page]
  )
  const hasMore = page * PAGE_SIZE < sorted.length

  // Keyboard shortcuts
  useKeyboardShortcutsTimeline({
    onAddEvent: () => setAddEventOpen(true),
    onTogglePrint: () => printTimeline(sorted),
  })

  // Drag-to-reorder
  const handleDragStart = useCallback((e, idx) => {
    e.dataTransfer.setData('text/plain', idx.toString())
    e.dataTransfer.effectAllowed = 'move'
  }, [])

  const handleDrop = useCallback(
    (e, dropIdx) => {
      e.preventDefault()
      const dragIdx = parseInt(e.dataTransfer.getData('text/plain'), 10)
      if (isNaN(dragIdx) || dragIdx === dropIdx) return

      const newEvents = [...events]
      const [moved] = newEvents.splice(dragIdx, 1)
      newEvents.splice(dropIdx, 0, moved)
      reorderEvents(newEvents)
    },
    [events, reorderEvents]
  )

  if (events.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No timeline yet"
        description="Paste some text on the input page to generate your timeline."
      >
        <div className="flex items-center gap-3">
          <Button onClick={() => navigate('/')}>Go to Input</Button>
          <ImportMenu />
        </div>
      </EmptyState>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 tracking-tight">
            Timeline
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} event{filtered.length !== 1 ? 's' : ''}
            {filtered.length !== events.length && ` of ${events.length}`}
          </p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          {/* Group 1: History */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={undo}
              disabled={!canUndo}
              className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <Undo2 size={15} />
            </button>
            <button
              onClick={redo}
              disabled={!canRedo}
              className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 size={15} />
            </button>
          </div>

          {/* Group 2: Primary Action */}
          <div className="flex items-center gap-1.5">
            <Button size="sm" onClick={() => setAddEventOpen(true)} title="Add event manually (N)">
              <Plus size={14} />
              <span className="hidden sm:inline">Add Event</span>
            </Button>
          </div>

          {/* Group 3: Data Management */}
          <div className="flex items-center gap-1.5">
            <TimelineManager />

            {photoCount > 0 && (
              <button
                onClick={() => setPhotoLibOpen(true)}
                className="relative flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Photo library"
              >
                <Image size={14} />
                <span className="hidden sm:inline">Photos</span>
                <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-accent-light text-accent text-[10px] font-semibold px-1">
                  {photoCount}
                </span>
              </button>
            )}

            <ImportMenu />
            <ExportMenu />
          </div>

          {/* Group 4: Secondary Utilities */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => printTimeline(sorted)}
              className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Print / PDF (Ctrl+P)"
            >
              <Printer size={14} />
            </button>
            <button
              onClick={() => setShowShortcuts(true)}
              className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
              title="Keyboard shortcuts (?)"
            >
              <Keyboard size={14} />
            </button>
          </div>

          {/* Group 5: View Switcher */}
          <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
            {VIEW_OPTIONS.map(({ key, label, icon: Icon, shortcut }) => (
              <button
                key={key}
                onClick={() => setActiveView(key)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  activeView === key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title={`${label} (${shortcut})`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters + Sort */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <FilterBar />
        <SortBar onDragMode={setDragMode} dragMode={dragMode} />
      </div>

      {/* Active view */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No matching events"
          description="Try adjusting your filters."
        />
      ) : (
        <>
          {activeView === VIEWS.VERTICAL && (
            <VerticalView
              events={paginated}
              editable
              dragMode={dragMode}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          )}
          {activeView === VIEWS.HORIZONTAL && (
            <HorizontalView events={paginated} editable />
          )}
          {activeView === VIEWS.GRID && (
            <GridView
              events={paginated}
              editable
              dragMode={dragMode}
              onDragStart={handleDragStart}
              onDrop={handleDrop}
            />
          )}

          {/* Load more */}
          {hasMore && (
            <div className="flex justify-center py-4">
              <Button
                variant="secondary"
                onClick={() => setPage((p) => p + 1)}
              >
                Load more ({sorted.length - paginated.length} remaining)
              </Button>
            </div>
          )}
        </>
      )}

      {/* Modals & side panels */}
      <ReviewPanel />
      <PhotoLibrary open={photoLibOpen} onClose={() => setPhotoLibOpen(false)} />
      <AddEventModal open={addEventOpen} onClose={() => setAddEventOpen(false)} />

      {/* Keyboard shortcuts modal */}
      {showShortcuts && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setShowShortcuts(false)}
        >
          <div
            className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display text-lg font-semibold text-gray-900 mb-4">
              Keyboard Shortcuts
            </h3>
            <div className="space-y-2 text-sm">
              {[
                ['1 / 2 / 3', 'Switch view (Vertical / Horizontal / Grid)'],
                ['N', 'Add new event'],
                ['Ctrl+Z', 'Undo'],
                ['Ctrl+Shift+Z', 'Redo'],
                ['Ctrl+P', 'Print / Export PDF'],
                ['Ctrl+Enter', 'Submit text (Input page)'],
                ['Esc', 'Close modals / Cancel edit'],
                ['Arrow Keys', 'Navigate photo lightbox'],
              ].map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <span className="text-gray-500">{desc}</span>
                  <kbd className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700 border border-gray-200 whitespace-nowrap">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
            <div className="mt-5 flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setShowShortcuts(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
