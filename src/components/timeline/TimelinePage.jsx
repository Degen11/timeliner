import { useState, useMemo, useRef, useEffect } from 'react'
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
  const events = useTimelineStore((s) => s.events)
  const activeView = useTimelineStore((s) => s.activeView)
  const setActiveView = useTimelineStore((s) => s.setActiveView)
  const filters = useTimelineStore((s) => s.filters)
  const photoMap = useTimelineStore((s) => s.photoMap)
  const sortOrder = useTimelineStore((s) => s.sortOrder)
  const canUndo = useTimelineStore((s) => s.canUndo)
  const canRedo = useTimelineStore((s) => s.canRedo)
  const undo = useTimelineStore((s) => s.undo)
  const redo = useTimelineStore((s) => s.redo)
  const filtered = useMemo(() => getFilteredEvents(events, filters), [events, filters])
  const sorted = useMemo(() => getSortedEvents(filtered, sortOrder), [filtered, sortOrder])

  const [photoLibOpen, setPhotoLibOpen] = useState(false)
  const [addEventOpen, setAddEventOpen] = useState(false)
  const [page, setPage] = useState(1)
  const photoCount = useMemo(() => Object.keys(photoMap).length, [photoMap])

  // Sticky toolbar detection
  const sentinelRef = useRef(null)
  const [isSticky, setIsSticky] = useState(false)

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsSticky(!entry.isIntersecting),
      { threshold: 0, rootMargin: '-57px 0px 0px 0px' }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [])

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
      {/* Title row */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 tracking-tight">
            Timeline
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} event{filtered.length !== 1 ? 's' : ''}
            {filtered.length !== events.length && ` of ${events.length}`}
          </p>
        </div>

        {/* Undo / Redo — subtle, top-right */}
        <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
          <button
            onClick={undo}
            disabled={!canUndo}
            className="rounded-md p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Undo (Ctrl+Z)"
          >
            <Undo2 size={14} />
          </button>
          <button
            onClick={redo}
            disabled={!canRedo}
            className="rounded-md p-1.5 text-gray-400 hover:text-gray-700 hover:bg-white transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
            title="Redo (Ctrl+Shift+Z)"
          >
            <Redo2 size={14} />
          </button>
        </div>
      </div>

      {/* Sentinel for sticky detection */}
      <div ref={sentinelRef} className="h-0 -mt-6" />

      {/* Action toolbar — becomes sticky on scroll */}
      <div
        className={`transition-all duration-200 ${
          isSticky
            ? 'sticky top-14 z-20 -mx-4 px-4 py-2.5 bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm'
            : ''
        }`}
      >
        <div className="flex items-center justify-between gap-3 flex-wrap">
          {/* Left: Create + Data management */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Create */}
            <Button size="sm" onClick={() => setAddEventOpen(true)} title="Add event manually (N)">
              <Plus size={14} />
              <span className="hidden sm:inline">Add Event</span>
            </Button>

            <span className="hidden sm:block h-5 w-px bg-gray-200" />

            {/* Data management */}
            <div className="flex items-center gap-1.5">
              <TimelineManager />

              {photoCount > 0 && (
                <button
                  onClick={() => setPhotoLibOpen(true)}
                  className="relative flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                  title="Photo library"
                >
                  <Image size={14} />
                  <span className="hidden sm:inline">Photos</span>
                  <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-accent-light text-accent text-[10px] font-semibold px-1">
                    {photoCount}
                  </span>
                </button>
              )}
            </div>

            <span className="hidden sm:block h-5 w-px bg-gray-200" />

            {/* Import / Export */}
            <div className="flex items-center gap-1.5">
              <ImportMenu />
              <ExportMenu />
            </div>
          </div>

          {/* Right: View controls + Sort */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* View switcher */}
            <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
              {VIEW_OPTIONS.map(({ key, label, icon: Icon, shortcut }) => (
                <button
                  key={key}
                  onClick={() => setActiveView(key)}
                  className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                    activeView === key
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                  title={`${label} (${shortcut})`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{label}</span>
                </button>
              ))}
            </div>

            <SortBar />
          </div>
        </div>
      </div>

      {/* Filters */}
      <FilterBar />

      {/* Active view */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No matching events"
          description="Try adjusting your filters."
        />
      ) : (
        <>
          {activeView === VIEWS.VERTICAL && (
            <VerticalView events={paginated} editable />
          )}
          {activeView === VIEWS.HORIZONTAL && (
            <HorizontalView events={paginated} editable />
          )}
          {activeView === VIEWS.GRID && (
            <GridView events={paginated} editable />
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
    </div>
  )
}
