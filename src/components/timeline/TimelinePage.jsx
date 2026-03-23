import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { Plus, Type, Sparkles, Calendar, Users, X, CheckSquare } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { getFilteredEvents, getSortedEvents } from '@/store/selectors'
import { VIEWS, MOTION_DURATION, EASE_OUT as EASE } from '@/utils/constants'
import { printTimeline } from '@/utils/exportHelpers'
import { Button } from '@/components/ui/Button'
import EmptyState from '@/components/shared/EmptyState'
import Sidebar, { SidebarDrawer } from '@/components/layout/Sidebar'
import TimelineViewRenderer from './TimelineViewRenderer'
import TimelineModals from './TimelineModals'
import { useToolbar, useHideFooter, useSidebar, useMobileTab } from '@/components/layout/shellContexts'
import useKeyboardShortcutsTimeline from '@/hooks/useKeyboardShortcutsTimeline'
import useFilterParams from '@/hooks/useFilterParams'
import useDocumentMeta from '@/hooks/useDocumentMeta'
import LandingContent from './LandingContent'
import ToolbarContent from './TimelineToolbar'

const PAGE_SIZE = 50

// Module-level map to store scroll positions per timeline (session-only)
const scrollPositions = new Map()

export default function TimelinePage() {
  const hydrating = useTimelineStore((s) => s._hydrating)
  const events = useTimelineStore((s) => s.events)
  const activeView = useTimelineStore((s) => s.activeView)
  const filters = useTimelineStore((s) => s.filters)
  const setFilters = useTimelineStore((s) => s.setFilters)
  const clearFilters = useTimelineStore((s) => s.clearFilters)
  const photoMap = useTimelineStore((s) => s.photoMap)
  const sortOrder = useTimelineStore((s) => s.sortOrder)
  const groupZoom = useTimelineStore((s) => s.groupZoom)
  const timelines = useTimelineStore((s) => s.timelines)
  const activeTimelineId = useTimelineStore((s) => s.activeTimelineId)
  const updateTimelineName = useTimelineStore((s) => s.updateTimelineName)
  const filtered = getFilteredEvents(events, filters)
  const sorted = getSortedEvents(filtered, sortOrder)

  // Selection state
  const [selectionMode, setSelectionMode] = useState(false)
  const selectedEventIds = useTimelineStore((s) => s.selectedEventIds)
  const toggleSelectEvent = useTimelineStore((s) => s.toggleSelectEvent)
  const selectEvents = useTimelineStore((s) => s.selectEvents)
  const clearSelection = useTimelineStore((s) => s.clearSelection)

  const verticalCompact = useTimelineStore((s) => s.verticalCompact)
  const verticalDesign = useTimelineStore((s) => s.verticalDesign)
  const horizontalDesign = useTimelineStore((s) => s.horizontalDesign)
  const setInsightsPanelOpen = useTimelineStore((s) => s.setInsightsPanelOpen)
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
  const photoCount = Object.keys(photoMap).length
  const hasEvents = events.length > 0

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
  }, [mobileTabCtx, timelineActive, hasEvents])

  // Clear selection on filter/view change
  useEffect(() => {
    setPage(1)
    clearSelection()
    setSelectionMode(false)
  }, [filters, clearSelection])

  useEffect(() => {
    clearSelection()
    setSelectionMode(false)
  }, [activeView, clearSelection])

  // Handle Shift/Ctrl+click for multi-select
  const handleToggleSelect = (eventId, e) => {
    // In selection mode (mobile), always toggle without modifier keys
    if (selectionMode) {
      toggleSelectEvent(eventId)
      return
    }
    if (e?.shiftKey && selectedEventIds.length > 0) {
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
  }

  // Ctrl/Cmd+A to select all visible, Esc to deselect
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && events.length > 0) {
        const target = e.target
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)
          return
        e.preventDefault()
        selectEvents(sorted.map((ev) => ev.id))
      }
      if (e.key === 'Escape' && selectedEventIds.length > 0) {
        clearSelection()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [sorted, events.length, selectEvents, selectedEventIds.length, clearSelection])

  const timelineName = (() => {
    if (activeTimelineId) {
      const tl = timelines.find((t) => t.id === activeTimelineId)
      return tl?.name || 'Timeline'
    }
    return 'Timeline'
  })()

  const saveCurrentAsTimeline = useTimelineStore((s) => s.saveCurrentAsTimeline)

  const handleRenameTimeline = (name) => {
    if (activeTimelineId) {
      updateTimelineName(activeTimelineId, name)
    } else {
      saveCurrentAsTimeline(name)
    }
  }
  // Stable ref for handleRenameTimeline so the toolbar effect doesn't churn
  const handleRenameRef = useRef(handleRenameTimeline)
  useEffect(() => {
    handleRenameRef.current = handleRenameTimeline
  })

  const paginated = sorted.slice(0, page * PAGE_SIZE)
  const hasMore = page * PAGE_SIZE < sorted.length

  useKeyboardShortcutsTimeline({
    onAddEvent: () => setAddEventOpen(true),
    onTogglePrint: () => printTimeline(sorted, useTimelineStore.getState().showToast),
    onShowShortcuts: () => setShowShortcuts(true),
    onOpenInsights: () => setInsightsPanelOpen(true),
  })

  // Sync filters bidirectionally with URL search params
  useFilterParams()

  useDocumentMeta({
    title: timelineActive && hasEvents ? `${timelineName} — Timeliner` : undefined,
  })

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Save scroll position when leaving a timeline, restore when returning
  const prevTimelineId = useRef(activeTimelineId)
  useEffect(() => {
    if (prevTimelineId.current && prevTimelineId.current !== activeTimelineId) {
      scrollPositions.set(prevTimelineId.current, window.scrollY)
    }
    prevTimelineId.current = activeTimelineId
    const saved = scrollPositions.get(activeTimelineId)
    if (saved != null) {
      requestAnimationFrame(() => window.scrollTo(0, saved))
    } else {
      window.scrollTo(0, 0)
    }
  }, [activeTimelineId])

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
          setAddEventOpen={setAddEventOpen}
          showImport={showImport}
          setShowImport={setShowImport}
          setPhotoLibOpen={setPhotoLibOpen}
          setDrawerOpen={setDrawerOpen}
          timelineName={timelineName}
          onRenameTimeline={(name) => handleRenameRef.current(name)}
          photoCount={photoCount}
          onOpenInsights={() => setInsightsPanelOpen(true)}
        />
      )
    } else {
      setToolbar(null)
    }
    return () => setToolbar?.(null)
  }, [
    timelineActive,
    hasEvents,
    showImport,
    timelineName,
    photoCount,
    setToolbar,
    setInsightsPanelOpen,
  ])

  return (
    <>
      <div className="flex-1 px-3 sm:px-6 py-4 sm:py-6 bg-canvas min-h-[calc(100vh-3.5rem)] min-h-[calc(100dvh-3.5rem)] relative overflow-x-clip no-overscroll">
        {/* Subtle ambient glow for timeline area */}
        {timelineActive && hasEvents && (
          <>
            <div className="absolute top-0 left-0 w-96 h-96 bg-[radial-gradient(circle,rgba(37,99,235,0.04),transparent_70%)] pointer-events-none" />
            <div className="absolute top-32 right-0 w-80 h-80 bg-[radial-gradient(circle,rgba(14,165,233,0.03),transparent_70%)] pointer-events-none" />
          </>
        )}
        <AnimatePresence mode="wait">
        {hydrating ? (
          <motion.div
            key="skeleton"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION_DURATION.NORMAL, ease: EASE }}
            className="space-y-5 py-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="skeleton h-5 w-28 rounded-lg" />
              <div className="flex items-center gap-2">
                <div className="skeleton h-8 w-48 rounded-xl" />
                <div className="skeleton h-8 w-20 rounded-lg hidden sm:block" />
              </div>
            </div>
            <div className="skeleton h-5 w-16 rounded" />
            {[1, 2, 3].map((i) => (
              <div key={i} className="rounded-xl bg-surface border border-gray-200/60 p-5 space-y-3">
                <div className="skeleton h-3 w-20 rounded" />
                <div className="skeleton h-4 w-52 rounded" />
                <div className="skeleton h-3 w-full rounded" style={{ maxWidth: '80%' }} />
                <div className="flex gap-2">
                  <div className="skeleton h-5 w-16 rounded-full" />
                  <div className="skeleton h-5 w-14 rounded-full" />
                </div>
              </div>
            ))}
          </motion.div>
        ) : !timelineActive ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION_DURATION.NORMAL, ease: EASE }}
          >
            <LandingContent
              onActivate={() => {
                setTimelineActive(true)
                window.scrollTo(0, 0)
              }}
            />
          </motion.div>
        ) : hasEvents ? (
          <motion.div
            key="timeline"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION_DURATION.NORMAL, ease: EASE }}
          >
            <AnimatePresence>
              {showWelcome && (
                <motion.div
                  initial={{ opacity: 0, y: -12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.98 }}
                  transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  className="mb-4 sm:mb-6 rounded-xl sm:rounded-2xl bg-gradient-to-r from-secondary/5 via-blue-50/50 to-sky-50/30 border border-secondary/15 px-4 py-4 sm:px-6 sm:py-5 shadow-sm"
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
                  <div className="flex flex-wrap gap-3 sm:gap-6 text-sm">
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
              <EmptyState title="No matching events" description={`0 of ${events.length} event${events.length !== 1 ? 's' : ''} match your filters`}>
                <div className="flex flex-col items-center gap-3">
                  <div className="flex flex-wrap justify-center gap-1.5 max-w-sm">
                    {filters.search && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-white/10 px-2.5 py-1 text-xs text-text-muted">
                        Search: &ldquo;{filters.search}&rdquo;
                        <button onClick={() => setFilters({ ...filters, search: '' })} className="ml-0.5 hover:text-text-strong cursor-pointer" aria-label="Clear search filter"><X size={12} /></button>
                      </span>
                    )}
                    {filters.people.map((p) => (
                      <span key={p} className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-white/10 px-2.5 py-1 text-xs text-text-muted">
                        {p}
                        <button onClick={() => setFilters({ ...filters, people: filters.people.filter((x) => x !== p) })} className="ml-0.5 hover:text-text-strong cursor-pointer" aria-label={`Remove ${p} filter`}><X size={12} /></button>
                      </span>
                    ))}
                    {filters.tags.map((t) => (
                      <span key={t} className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-white/10 px-2.5 py-1 text-xs text-text-muted">
                        {t}
                        <button onClick={() => setFilters({ ...filters, tags: filters.tags.filter((x) => x !== t) })} className="ml-0.5 hover:text-text-strong cursor-pointer" aria-label={`Remove ${t} filter`}><X size={12} /></button>
                      </span>
                    ))}
                  </div>
                  <Button variant="secondary" onClick={() => clearFilters()}>
                    Clear all filters
                  </Button>
                </div>
              </EmptyState>
            ) : (
              <>
                {/* Mobile selection mode toggle */}
                <div className="flex items-center justify-end mb-2 sm:hidden">
                  <button
                    onClick={() => {
                      setSelectionMode((m) => !m)
                      if (selectionMode) clearSelection()
                    }}
                    className={clsx(
                      'flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors duration-150 cursor-pointer touch-target',
                      selectionMode
                        ? 'bg-secondary text-white active:opacity-80'
                        : 'bg-gray-100 text-text-default active:bg-gray-200'
                    )}
                  >
                    <CheckSquare size={14} />
                    {selectionMode ? 'Done' : 'Select'}
                  </button>
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeView}-${activeView === VIEWS.VERTICAL ? verticalDesign : activeView === VIEWS.HORIZONTAL ? horizontalDesign : ''}`}
                    initial={{ opacity: 0, y: 6, scale: 0.995 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.995 }}
                    transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {activeView === VIEWS.HORIZONTAL && (
                      <div className="sm:hidden mb-3 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-800 flex items-center justify-between gap-2">
                        <span>Swipe to scroll. Best on wider screens.</span>
                        <button
                          onClick={() => useTimelineStore.getState().setActiveView(VIEWS.VERTICAL)}
                          className="font-medium text-amber-900 underline underline-offset-2 whitespace-nowrap cursor-pointer touch-target"
                        >
                          Switch
                        </button>
                      </div>
                    )}
                    <TimelineViewRenderer
                      activeView={activeView}
                      verticalDesign={verticalDesign}
                      horizontalDesign={horizontalDesign}
                      events={paginated}
                      groupZoom={groupZoom}
                      verticalCompact={verticalCompact}
                      selectedEventIds={selectedEventIds}
                      onToggleSelect={handleToggleSelect}
                      onEditEvent={setEditingEvent}
                    />
                  </motion.div>
                </AnimatePresence>

                {hasMore && (
                  <div className="flex justify-center py-4">
                    <Button variant="secondary" onClick={() => {
                      const prevCount = paginated.length
                      setPage((p) => p + 1)
                      // After render, scroll the first newly loaded card into view
                      requestAnimationFrame(() => {
                        const cards = document.querySelectorAll('[data-event-card]')
                        cards[prevCount]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
                      })
                    }}>
                      Load more ({sorted.length - paginated.length} remaining)
                    </Button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: MOTION_DURATION.NORMAL, ease: EASE }}
          >
            <EmptyState
              icon={Plus}
              title="No events yet"
              description="Add events manually or import text to get started."
            >
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <Button onClick={() => setAddEventOpen(true)} className="w-full sm:w-auto">
                  <Plus size={16} />
                  Add Event
                </Button>
                <Button variant="secondary" onClick={() => setShowImport(true)} className="w-full sm:w-auto">
                  <Type size={16} />
                  Import Text
                </Button>
              </div>
            </EmptyState>
          </motion.div>
        )}
        </AnimatePresence>
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

      <TimelineModals
        showImport={showImport}
        setShowImport={setShowImport}
        addEventOpen={addEventOpen}
        setAddEventOpen={setAddEventOpen}
        photoLibOpen={photoLibOpen}
        setPhotoLibOpen={setPhotoLibOpen}
        editingEvent={editingEvent}
        setEditingEvent={setEditingEvent}
        showShortcuts={showShortcuts}
        setShowShortcuts={setShowShortcuts}
      />
    </>
  )
}
