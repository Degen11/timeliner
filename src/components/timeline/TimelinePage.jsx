import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars
import { Plus, Type } from 'lucide-react'
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
import { useToolbar, useHideFooter, useSidebar } from '@/components/layout/Shell'
import useKeyboardShortcutsTimeline from '@/hooks/useKeyboardShortcutsTimeline'
import InlineImportPanel from './InlineImportPanel'
import LandingContent from './LandingContent'
import ToolbarContent from './TimelineToolbar'
import ShortcutsModal from './ShortcutsModal'

const PAGE_SIZE = 50

export default function TimelinePage() {
  const events = useTimelineStore((s) => s.events)
  const activeView = useTimelineStore((s) => s.activeView)
  const setActiveView = useTimelineStore((s) => s.setActiveView)
  const filters = useTimelineStore((s) => s.filters)
  const clearFilters = useTimelineStore((s) => s.clearFilters)
  const photoMap = useTimelineStore((s) => s.photoMap)
  const sortOrder = useTimelineStore((s) => s.sortOrder)
  const groupZoom = useTimelineStore((s) => s.groupZoom)
  const setGroupZoom = useTimelineStore((s) => s.setGroupZoom)
  const timelines = useTimelineStore((s) => s.timelines)
  const activeTimelineId = useTimelineStore((s) => s.activeTimelineId)
  const updateTimelineName = useTimelineStore((s) => s.updateTimelineName)
  const filtered = useMemo(() => getFilteredEvents(events, filters), [events, filters])
  const sorted = useMemo(() => getSortedEvents(filtered, sortOrder), [filtered, sortOrder])

  const verticalCompact = useTimelineStore((s) => s.verticalCompact)
  const setVerticalCompact = useTimelineStore((s) => s.setVerticalCompact)
  const [photoLibOpen, setPhotoLibOpen] = useState(false)
  const [addEventOpen, setAddEventOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [showImport, setShowImport] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [timelineActive, setTimelineActive] = useState(events.length > 0)
  const photoCount = useMemo(() => Object.keys(photoMap).length, [photoMap])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setPage(1)
  }, [filters])
  /* eslint-enable react-hooks/set-state-in-effect */

  const timelineName = useMemo(() => {
    if (activeTimelineId) {
      const tl = timelines.find((t) => t.id === activeTimelineId)
      return tl?.name || 'Timeline'
    }
    return 'Timeline'
  }, [activeTimelineId, timelines])

  const saveCurrentAsTimeline = useTimelineStore((s) => s.saveCurrentAsTimeline)

  const handleRenameTimeline = (name) => {
    if (activeTimelineId) {
      updateTimelineName(activeTimelineId, name)
    } else {
      saveCurrentAsTimeline(name)
    }
  }

  const paginated = useMemo(() => sorted.slice(0, page * PAGE_SIZE), [sorted, page])
  const hasMore = page * PAGE_SIZE < sorted.length

  useKeyboardShortcutsTimeline({
    onAddEvent: () => setAddEventOpen(true),
    onTogglePrint: () => printTimeline(sorted),
    onShowShortcuts: () => setShowShortcuts(true),
  })

  const hasEvents = events.length > 0

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const setHideFooter = useHideFooter()
  useEffect(() => {
    const shouldHide = timelineActive && hasEvents
    setHideFooter?.(shouldHide)
    return () => setHideFooter?.(false)
  }, [timelineActive, hasEvents, setHideFooter])

  const setSidebar = useSidebar()
  useEffect(() => {
    if (!setSidebar) return
    if (timelineActive && hasEvents) {
      setSidebar(
        <Sidebar
          photoCount={photoCount}
          onPhotoLibOpen={() => setPhotoLibOpen(true)}
          onShowShortcuts={() => setShowShortcuts(true)}
        />
      )
    } else {
      setSidebar(null)
    }
    return () => setSidebar?.(null)
  }, [timelineActive, hasEvents, photoCount, setSidebar])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (timelineActive && events.length === 0) {
      setTimelineActive(false)
    }
  }, [events.length, timelineActive])
  /* eslint-enable react-hooks/set-state-in-effect */

  const setToolbar = useToolbar()
  useEffect(() => {
    if (!setToolbar) return
    if (timelineActive && hasEvents) {
      setToolbar(
        <ToolbarContent
          timelineActive={timelineActive}
          hasEvents={hasEvents}
          filtered={filtered}
          events={events}
          activeView={activeView}
          setActiveView={setActiveView}
          verticalCompact={verticalCompact}
          setVerticalCompact={setVerticalCompact}
          groupZoom={groupZoom}
          setGroupZoom={setGroupZoom}
          setAddEventOpen={setAddEventOpen}
          showImport={showImport}
          setShowImport={setShowImport}
          setPhotoLibOpen={setPhotoLibOpen}
          setDrawerOpen={setDrawerOpen}
          timelineName={timelineName}
          onRenameTimeline={handleRenameTimeline}
        />
      )
    } else {
      setToolbar(null)
    }
    return () => setToolbar?.(null)
  }, [
    timelineActive,
    hasEvents,
    filtered,
    events,
    activeView,
    verticalCompact,
    groupZoom,
    showImport,
    timelineName,
    setToolbar,
  ])

  return (
    <>
      <div className="flex-1 px-4 sm:px-6 py-6 bg-canvas min-h-[calc(100vh-3.5rem)]">
        {!timelineActive ? (
          <LandingContent
            onActivate={() => {
              setTimelineActive(true)
              window.scrollTo(0, 0)
            }}
          />
        ) : hasEvents ? (
          <>
            {showImport && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-display text-base font-semibold text-gray-900">
                    Add more events from text
                  </h2>
                  <button
                    onClick={() => setShowImport(false)}
                    className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
                <InlineImportPanel onDone={() => setShowImport(false)} />
              </div>
            )}

            {!showImport && <div className="mb-2" />}

            {filtered.length === 0 ? (
              <EmptyState title="No matching events" description="Try adjusting your filters.">
                <Button variant="secondary" onClick={() => clearFilters()}>
                  Clear all filters
                </Button>
              </EmptyState>
            ) : (
              <>
                <AnimatePresence mode="wait">
                  {activeView === VIEWS.VERTICAL && (
                    <motion.div
                      key="vertical"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <VerticalView
                        events={paginated}
                        editable
                        compact={verticalCompact}
                        groupZoom={groupZoom}
                      />
                    </motion.div>
                  )}
                  {activeView === VIEWS.HORIZONTAL && (
                    <motion.div
                      key="horizontal"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <HorizontalView events={paginated} editable />
                    </motion.div>
                  )}
                  {activeView === VIEWS.GRID && (
                    <motion.div
                      key="grid"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                    >
                      <GridView events={paginated} editable groupZoom={groupZoom} />
                    </motion.div>
                  )}
                </AnimatePresence>

                {hasMore && (
                  <div className="flex justify-center py-4">
                    <Button variant="secondary" onClick={() => setPage((p) => p + 1)}>
                      Load more ({sorted.length - paginated.length} remaining)
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <EmptyState
            icon={Plus}
            title="No events yet"
            description="Add events manually or import text to get started."
          >
            <div className="flex gap-3">
              <Button onClick={() => setAddEventOpen(true)}>
                <Plus size={16} />
                Add Event
              </Button>
              <Button variant="secondary" onClick={() => setShowImport(true)}>
                <Type size={16} />
                Import Text
              </Button>
            </div>
          </EmptyState>
        )}
      </div>

      {timelineActive && hasEvents && (
        <SidebarDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          photoCount={photoCount}
          onPhotoLibOpen={() => {
            setPhotoLibOpen(true)
            setDrawerOpen(false)
          }}
          onShowShortcuts={() => {
            setShowShortcuts(true)
            setDrawerOpen(false)
          }}
        />
      )}

      <ReviewPanel />
      <PhotoLibrary open={photoLibOpen} onClose={() => setPhotoLibOpen(false)} />
      <AddEventModal open={addEventOpen} onClose={() => setAddEventOpen(false)} />
      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  )
}
