import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Type, Sparkles, Calendar, Users } from 'lucide-react'
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
import VerticalCinematic from './VerticalCinematic'
import VerticalMagazine from './VerticalMagazine'
import VerticalNarrative from './VerticalNarrative'
import HorizontalView from './HorizontalView'
import HorizontalPanoramic from './HorizontalPanoramic'
import HorizontalFilmStrip from './HorizontalFilmStrip'
import HorizontalWave from './HorizontalWave'
import GridView from './GridView'
import MapView from './MapView'
import GraphView from './GraphView'
import AddEventModal from './AddEventModal'
import EditEventModal from './EditEventModal'
import BatchActionBar from './BatchActionBar'
import { useToolbar, useHideFooter, useSidebar, useMobileTab } from '@/components/layout/Shell'
import useKeyboardShortcutsTimeline from '@/hooks/useKeyboardShortcutsTimeline'
import InlineImportPanel from './InlineImportPanel'
import LandingContent from './LandingContent'
import ToolbarContent from './TimelineToolbar'
import ShortcutsModal from './ShortcutsModal'

const PAGE_SIZE = 50

export default function TimelinePage() {
  const hydrating = useTimelineStore((s) => s._hydrating)
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

  // Selection state
  const selectedEventIds = useTimelineStore((s) => s.selectedEventIds)
  const toggleSelectEvent = useTimelineStore((s) => s.toggleSelectEvent)
  const selectEvents = useTimelineStore((s) => s.selectEvents)
  const clearSelection = useTimelineStore((s) => s.clearSelection)

  const verticalCompact = useTimelineStore((s) => s.verticalCompact)
  const setVerticalCompact = useTimelineStore((s) => s.setVerticalCompact)
  const verticalDesign = useTimelineStore((s) => s.verticalDesign)
  const setVerticalDesign = useTimelineStore((s) => s.setVerticalDesign)
  const horizontalDesign = useTimelineStore((s) => s.horizontalDesign)
  const setHorizontalDesign = useTimelineStore((s) => s.setHorizontalDesign)
  const [photoLibOpen, setPhotoLibOpen] = useState(false)
  const [addEventOpen, setAddEventOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [showImport, setShowImport] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [timelineActive, setTimelineActive] = useState(events.length > 0)
  const [showWelcome, setShowWelcome] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const prevEventCount = useRef(events.length)
  const photoCount = useMemo(() => Object.keys(photoMap).length, [photoMap])

  // Mobile bottom tab navigation
  const mobileTabCtx = useMobileTab()
  useEffect(() => {
    if (!mobileTabCtx) return
    const { mobileTab, setMobileTab } = mobileTabCtx
    if (!timelineActive || !hasEvents) return

    if (mobileTab === 'add') {
      setAddEventOpen(true)
      setMobileTab('timeline')
    } else if (mobileTab === 'import') {
      setShowImport(true)
      setMobileTab('timeline')
    } else if (mobileTab === 'photos') {
      setPhotoLibOpen(true)
      setMobileTab('timeline')
    } else if (mobileTab === 'more') {
      setDrawerOpen(true)
      setMobileTab('timeline')
    }
  }, [mobileTabCtx?.mobileTab])

  // Clear selection on filter/view change
  useEffect(() => {
    setPage(1)
    clearSelection()
  }, [filters, clearSelection])

  useEffect(() => {
    clearSelection()
  }, [activeView, clearSelection])

  // Handle Shift/Ctrl+click for multi-select
  const handleToggleSelect = useCallback(
    (eventId, e) => {
      if (e?.shiftKey && selectedEventIds.length > 0) {
        // Range select: select all events between last selected and current
        const lastId = selectedEventIds[selectedEventIds.length - 1]
        const sortedIds = sorted.map((e) => e.id)
        const lastIdx = sortedIds.indexOf(lastId)
        const currentIdx = sortedIds.indexOf(eventId)
        if (lastIdx !== -1 && currentIdx !== -1) {
          const start = Math.min(lastIdx, currentIdx)
          const end = Math.max(lastIdx, currentIdx)
          const rangeIds = sortedIds.slice(start, end + 1)
          const merged = [...new Set([...selectedEventIds, ...rangeIds])]
          selectEvents(merged)
          return
        }
      }
      toggleSelectEvent(eventId)
    },
    [selectedEventIds, sorted, selectEvents, toggleSelectEvent]
  )

  // Ctrl/Cmd+A to select all visible
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && events.length > 0) {
        const target = e.target
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
          return
        e.preventDefault()
        selectEvents(sorted.map((ev) => ev.id))
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [sorted, events.length, selectEvents])

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

  useEffect(() => {
    if (timelineActive && events.length === 0) {
      setTimelineActive(false)
    }
    // Activate timeline when events arrive from hydration
    if (!timelineActive && events.length > 0 && !hydrating) {
      setTimelineActive(true)
    }
  }, [events.length, timelineActive, hydrating])

  // Show welcome banner when timeline first gets events
  useEffect(() => {
    if (timelineActive && events.length > 0 && prevEventCount.current === 0) {
      setShowWelcome(true)
      const timer = setTimeout(() => setShowWelcome(false), 4000)
      return () => clearTimeout(timer)
    }
    prevEventCount.current = events.length
  }, [timelineActive, events.length])

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
          photoCount={photoCount}
          verticalDesign={verticalDesign}
          setVerticalDesign={setVerticalDesign}
          horizontalDesign={horizontalDesign}
          setHorizontalDesign={setHorizontalDesign}
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
    photoCount,
    verticalDesign,
    horizontalDesign,
    setToolbar,
  ])

  return (
    <>
      <div className="flex-1 px-4 sm:px-6 py-6 bg-canvas min-h-[calc(100vh-3.5rem)] relative overflow-x-clip">
        {/* Subtle ambient glow for timeline area */}
        {timelineActive && hasEvents && (
          <>
            <div className="absolute top-0 left-0 w-96 h-96 bg-[radial-gradient(circle,rgba(37,99,235,0.04),transparent_70%)] pointer-events-none" />
            <div className="absolute top-32 right-0 w-80 h-80 bg-[radial-gradient(circle,rgba(14,165,233,0.03),transparent_70%)] pointer-events-none" />
          </>
        )}
        {hydrating ? (
          <div className="space-y-6 animate-pulse py-4">
            <div className="h-6 w-32 bg-gray-200 rounded-lg" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-white border border-gray-200/60 p-5 space-y-3">
                <div className="h-3 w-24 bg-gray-200 rounded" />
                <div className="h-4 w-48 bg-gray-200 rounded" />
                <div className="h-3 w-full bg-gray-100 rounded" />
                <div className="flex gap-2">
                  <div className="h-5 w-16 bg-gray-100 rounded-full" />
                  <div className="h-5 w-14 bg-gray-100 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : !timelineActive ? (
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

            <AnimatePresence>
              {showWelcome && (
                <motion.div
                  initial={{ opacity: 0, y: -12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="mb-6 rounded-2xl bg-gradient-to-r from-secondary/5 via-blue-50/50 to-sky-50/30 border border-secondary/15 px-6 py-5 shadow-sm"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-secondary/10 flex items-center justify-center">
                      <Sparkles size={18} className="text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-text-strong text-base">Timeline created</h3>
                      <p className="text-sm text-text-muted">Your story is ready to explore</p>
                    </div>
                  </div>
                  <div className="flex gap-6 text-sm">
                    <span className="flex items-center gap-1.5 text-text-default">
                      <Calendar size={14} className="text-secondary/70" />
                      <span className="font-semibold">{events.length}</span> events
                    </span>
                    {(() => {
                      const allPeople = [...new Set(events.flatMap(e => e.people || []))]
                      if (allPeople.length === 0) return null
                      return (
                        <span className="flex items-center gap-1.5 text-text-default">
                          <Users size={14} className="text-secondary/70" />
                          <span className="font-semibold">{allPeople.length}</span> {allPeople.length === 1 ? 'person' : 'people'}
                        </span>
                      )
                    })()}
                    {(() => {
                      const years = events.map(e => {
                        const d = e.dateStart
                        if (!d) return null
                        return new Date(d).getUTCFullYear()
                      }).filter(Boolean)
                      if (years.length < 2) return null
                      const span = Math.max(...years) - Math.min(...years)
                      if (span === 0) return null
                      return (
                        <span className="flex items-center gap-1.5 text-text-default">
                          <Calendar size={14} className="text-secondary/70" />
                          spanning <span className="font-semibold">{span}</span> years
                        </span>
                      )
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!showImport && !showWelcome && <div className="mb-2" />}

            {filtered.length === 0 ? (
              <EmptyState title="No matching events" description="Try adjusting your filters.">
                <Button variant="secondary" onClick={() => clearFilters()}>
                  Clear all filters
                </Button>
              </EmptyState>
            ) : (
              <>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeView}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                  >
                    {activeView === VIEWS.VERTICAL && verticalDesign === 'classic' && (
                      <VerticalView
                        events={paginated}
                        editable
                        compact={verticalCompact}
                        groupZoom={groupZoom}
                        selectedEventIds={selectedEventIds}
                        onToggleSelect={handleToggleSelect}
                        onEditEvent={setEditingEvent}
                      />
                    )}
                    {activeView === VIEWS.VERTICAL && verticalDesign === 'cinematic' && (
                      <VerticalCinematic
                        events={paginated}
                        editable
                        groupZoom={groupZoom}
                        onEditEvent={setEditingEvent}
                      />
                    )}
                    {activeView === VIEWS.VERTICAL && verticalDesign === 'magazine' && (
                      <VerticalMagazine
                        events={paginated}
                        editable
                        groupZoom={groupZoom}
                        onEditEvent={setEditingEvent}
                      />
                    )}
                    {activeView === VIEWS.VERTICAL && verticalDesign === 'narrative' && (
                      <VerticalNarrative
                        events={paginated}
                        editable
                        groupZoom={groupZoom}
                        onEditEvent={setEditingEvent}
                      />
                    )}
                    {activeView === VIEWS.HORIZONTAL && horizontalDesign === 'classic' && (
                      <HorizontalView events={paginated} editable onEditEvent={setEditingEvent} />
                    )}
                    {activeView === VIEWS.HORIZONTAL && horizontalDesign === 'panoramic' && (
                      <HorizontalPanoramic events={paginated} editable onEditEvent={setEditingEvent} />
                    )}
                    {activeView === VIEWS.HORIZONTAL && horizontalDesign === 'filmstrip' && (
                      <HorizontalFilmStrip events={paginated} editable onEditEvent={setEditingEvent} />
                    )}
                    {activeView === VIEWS.HORIZONTAL && horizontalDesign === 'wave' && (
                      <HorizontalWave events={paginated} editable onEditEvent={setEditingEvent} />
                    )}
                    {activeView === VIEWS.GRID && (
                      <GridView
                        events={paginated}
                        editable
                        groupZoom={groupZoom}
                        selectedEventIds={selectedEventIds}
                        onToggleSelect={handleToggleSelect}
                        onEditEvent={setEditingEvent}
                      />
                    )}
                    {activeView === VIEWS.MAP && <MapView events={paginated} />}
                    {activeView === VIEWS.GRAPH && <GraphView events={paginated} />}
                  </motion.div>
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

      <BatchActionBar />
      <ReviewPanel />
      <PhotoLibrary open={photoLibOpen} onClose={() => setPhotoLibOpen(false)} />
      <AddEventModal open={addEventOpen} onClose={() => setAddEventOpen(false)} />
      <EditEventModal event={editingEvent} onClose={() => setEditingEvent(null)} />
      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </>
  )
}
