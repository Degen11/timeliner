import { useState, useMemo, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  List,
  GripHorizontal,
  LayoutGrid,
  FileText,
  Image,
  Plus,
} from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { getFilteredEvents, getSortedEvents } from '@/store/selectors'
import { VIEWS } from '@/utils/constants'
import { printTimeline } from '@/utils/exportHelpers'
import Button from '@/components/shared/Button'
import EmptyState from '@/components/shared/EmptyState'
import FilterBar from '@/components/filters/FilterBar'
import ReviewPanel from '@/components/review/ReviewPanel'
import PhotoLibrary from './PhotoLibrary'
import VerticalView from './VerticalView'
import HorizontalView from './HorizontalView'
import GridView from './GridView'
import AddEventModal from './AddEventModal'
import ImportMenu from './ImportMenu'
import MoreActionsMenu from './MoreActionsMenu'
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
  const filtered = useMemo(() => getFilteredEvents(events, filters), [events, filters])
  const sorted = useMemo(() => getSortedEvents(filtered, sortOrder), [filtered, sortOrder])

  const [photoLibOpen, setPhotoLibOpen] = useState(false)
  const [addEventOpen, setAddEventOpen] = useState(false)
  const [verticalCompact, setVerticalCompact] = useState(false)
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
    <div className="flex flex-col">
      {/* ─── Compact sticky bar (fixed, appears on scroll) ─── */}
      <div
        className={`fixed top-14 left-0 right-0 z-20 transition-all duration-200 ${
          isSticky
            ? 'opacity-100 translate-y-0'
            : 'opacity-0 -translate-y-1 pointer-events-none'
        }`}
      >
        <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/60 shadow-sm">
          <div className="mx-auto max-w-5xl px-4 py-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-900 font-display">
              Timeline
              <span className="text-gray-400 font-normal font-sans ml-1.5">
                {filtered.length} event{filtered.length !== 1 ? 's' : ''}
              </span>
            </span>

            <div className="flex items-center gap-1">
              {VIEW_OPTIONS.map(({ key, label, icon: Icon, shortcut }) => (
                <button
                  key={key}
                  onClick={() => setActiveView(key)}
                  className={`rounded-md p-1.5 transition-all cursor-pointer ${
                    activeView === key
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-300 hover:text-gray-500'
                  }`}
                  title={`${label} (${shortcut})`}
                >
                  <Icon size={15} />
                </button>
              ))}

              <span className="w-px h-4 bg-gray-200 mx-1" />

              <MoreActionsMenu compact />

              <span className="w-px h-4 bg-gray-200 mx-1" />

              <button
                onClick={() => setAddEventOpen(true)}
                className="rounded-lg p-1.5 bg-primary text-white hover:bg-primary-hover transition-colors cursor-pointer"
                title="Add event (N)"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Layer 1: Page Identity (left) + Primary Actions (right) ─── */}
      <div className="flex items-start justify-between gap-4">
        {/* Page identity — anchored top left */}
        <div>
          <h1 className="font-display text-3xl font-bold text-gray-900 tracking-tight">
            Timeline
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {filtered.length} event{filtered.length !== 1 ? 's' : ''}
            {filtered.length !== events.length && ` of ${events.length}`}
          </p>
        </div>

        {/* Primary action zone — top right */}
        <div className="flex items-center gap-2">
          {/* View switcher — subtle icon controls */}
          <div className="flex items-center gap-0.5">
            {VIEW_OPTIONS.map(({ key, label, icon: Icon, shortcut }) => (
              <button
                key={key}
                onClick={() => setActiveView(key)}
                className={`rounded-md p-1.5 transition-all cursor-pointer ${
                  activeView === key
                    ? 'bg-gray-100 text-gray-900'
                    : 'text-gray-300 hover:text-gray-500'
                }`}
                title={`${label} (${shortcut})`}
              >
                <Icon size={16} />
              </button>
            ))}

            {/* Compact/Expanded — only for vertical view */}
            {activeView === VIEWS.VERTICAL && (
              <button
                onClick={() => setVerticalCompact(!verticalCompact)}
                className={`ml-0.5 rounded-md px-2 py-1 text-[11px] font-medium transition-all cursor-pointer ${
                  verticalCompact
                    ? 'bg-soft-accent text-secondary'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
                title={verticalCompact ? 'Switch to expanded' : 'Switch to compact'}
              >
                {verticalCompact ? 'Dense' : 'Expanded'}
              </button>
            )}
          </div>

          <span className="h-4 w-px bg-gray-200" />

          {/* More actions (Import + Export combined) */}
          <MoreActionsMenu />

          <span className="h-4 w-px bg-gray-200" />

          {/* Add Event — the only high-contrast button */}
          <Button size="sm" onClick={() => setAddEventOpen(true)} title="Add event (N)">
            <Plus size={14} />
            <span className="hidden sm:inline">Add Event</span>
          </Button>
        </div>
      </div>

      {/* Sentinel for sticky detection */}
      <div ref={sentinelRef} className="h-0" />

      {/* ─── Layer 2: Filter / Utility Bar (separate container) ─── */}
      <div className="mt-8 rounded-xl bg-gray-50/80 border border-gray-200/60 px-4 py-3.5">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          {/* Left group: Search + Tags + Flagged */}
          <div className="flex-1 min-w-0">
            <FilterBar />
          </div>

          {/* Right group: Projects + Photos + Sort */}
          <div className="flex items-center gap-2 shrink-0 pt-px">
            <TimelineManager />
            {photoCount > 0 && (
              <button
                onClick={() => setPhotoLibOpen(true)}
                className="relative flex items-center gap-1.5 rounded-lg border border-gray-200/80 bg-white px-2.5 py-1.5 text-sm text-gray-700 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
                title="Photo library"
              >
                <Image size={14} />
                <span className="hidden sm:inline">Photos</span>
                <span className="ml-0.5 inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-soft-accent text-secondary text-[10px] font-semibold px-1">
                  {photoCount}
                </span>
              </button>
            )}
            <SortBar />
          </div>
        </div>
      </div>

      {/* ─── Active view ─── */}
      <div className="mt-6">
        {filtered.length === 0 ? (
          <EmptyState
            title="No matching events"
            description="Try adjusting your filters."
          />
        ) : (
          <>
            {activeView === VIEWS.VERTICAL && (
              <VerticalView events={paginated} editable compact={verticalCompact} />
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
      </div>

      {/* Modals & side panels */}
      <ReviewPanel />
      <PhotoLibrary open={photoLibOpen} onClose={() => setPhotoLibOpen(false)} />
      <AddEventModal open={addEventOpen} onClose={() => setAddEventOpen(false)} />
    </div>
  )
}
