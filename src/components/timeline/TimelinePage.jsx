import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  List,
  GripHorizontal,
  LayoutGrid,
  FileText,
  Plus,
  SlidersHorizontal,
} from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { getFilteredEvents, getSortedEvents } from '@/store/selectors'
import { VIEWS } from '@/utils/constants'
import { printTimeline } from '@/utils/exportHelpers'
import Button from '@/components/shared/Button'
import EmptyState from '@/components/shared/EmptyState'
import Sidebar, { SidebarDrawer } from '@/components/layout/Sidebar'
import ReviewPanel from '@/components/review/ReviewPanel'
import PhotoLibrary from './PhotoLibrary'
import VerticalView from './VerticalView'
import HorizontalView from './HorizontalView'
import GridView from './GridView'
import AddEventModal from './AddEventModal'
import ImportMenu from './ImportMenu'
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
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [page, setPage] = useState(1)
  const photoCount = useMemo(() => Object.keys(photoMap).length, [photoMap])

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

  return (
    <div className="flex">
      {/* ─── Desktop Sidebar ─── */}
      <Sidebar
        photoCount={photoCount}
        onPhotoLibOpen={() => setPhotoLibOpen(true)}
      />

      {/* ─── Main Canvas ─── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* ─── Minimal Header ─── */}
        <div className="border-b border-gray-200/60 bg-white/80 backdrop-blur-sm shrink-0">
          <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
            {/* Left: Mobile drawer trigger + Page identity */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setDrawerOpen(true)}
                className="lg:hidden flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
              >
                <SlidersHorizontal size={14} />
                <span>Filters</span>
              </button>

              <div>
                <h1 className="font-display text-lg font-semibold text-gray-900 leading-tight">
                  Timeline
                </h1>
                <p className="text-xs text-gray-400 mt-0.5">
                  {filtered.length} event{filtered.length !== 1 ? 's' : ''}
                  {filtered.length !== events.length && ` of ${events.length}`}
                </p>
              </div>
            </div>

            {/* Right: View toggles + Add Event */}
            <div className="flex items-center gap-2">
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
                    className={`ml-0.5 rounded-md px-2 py-1 text-[11px] font-medium transition-all cursor-pointer hidden sm:inline-flex ${
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

              <span className="h-4 w-px bg-gray-200 hidden sm:block" />

              <Button size="sm" onClick={() => setAddEventOpen(true)} title="Add event (N)">
                <Plus size={14} />
                <span className="hidden sm:inline">Add Event</span>
              </Button>
            </div>
          </div>
        </div>

        {/* ─── Content Area ─── */}
        <div className="flex-1 px-4 sm:px-6 py-6">
          {events.length === 0 ? (
            <div className="flex items-center justify-center min-h-[60vh]">
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
            </div>
          ) : filtered.length === 0 ? (
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
      </div>

      {/* ─── Mobile Drawer ─── */}
      <SidebarDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        photoCount={photoCount}
        onPhotoLibOpen={() => { setPhotoLibOpen(true); setDrawerOpen(false) }}
      />

      {/* ─── Modals & Side Panels ─── */}
      <ReviewPanel />
      <PhotoLibrary open={photoLibOpen} onClose={() => setPhotoLibOpen(false)} />
      <AddEventModal open={addEventOpen} onClose={() => setAddEventOpen(false)} />
    </div>
  )
}
