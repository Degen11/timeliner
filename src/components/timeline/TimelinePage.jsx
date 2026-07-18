import { useState, useEffect, useRef, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import clsx from 'clsx'
import { Plus, Type, CheckSquare, Loader2, X, SlidersHorizontal } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { getFilteredEvents, getSortedEvents } from '@/store/selectors'
import { VIEWS, MOTION_DURATION, EASE_OUT as EASE, prefersReducedMotion } from '@/utils/constants'
import { printTimeline } from '@/utils/exportText'
import { Button } from '@/components/ui/Button'
import EmptyState from '@/components/shared/EmptyState'
import { SidebarDrawer } from '@/components/layout/Sidebar'
import TimelineViewRenderer from './TimelineViewRenderer'
import TimelineModals from './TimelineModals'
import EventDetailView from './EventDetailView'
import CommandPalette from '@/components/shared/CommandPalette'
import WelcomeBanner from './WelcomeBanner'
import FilterEmptyState from './FilterEmptyState'
import useKeyboardShortcutsTimeline from '@/hooks/useKeyboardShortcutsTimeline'
import useFilterParams from '@/hooks/useFilterParams'
import useDocumentMeta from '@/hooks/useDocumentMeta'
import useTimelineSelection from '@/hooks/useTimelineSelection'
import useTimelineShell from '@/hooks/useTimelineShell'
import LandingContent from './LandingContent'

const PAGE_SIZE = 50

function ActiveFilterBar({ filters, setFilters, clearFilters, filteredCount, totalCount }) {
  return (
    <motion.div
      key="active-filter-bar"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
    >
      <div className="flex items-center gap-2 rounded-lg bg-gray-100/80 dark:bg-white/[0.06] border border-gray-200/60 px-3 py-2 mb-3 text-xs">
        <SlidersHorizontal size={12} className="text-text-muted shrink-0" />
        <span className="text-text-muted shrink-0">
          Showing <span className="font-semibold text-text-default">{filteredCount}</span> of {totalCount} event{totalCount !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
          {!!filters.search && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-xs text-text-muted border border-gray-200/60">
              &ldquo;{filters.search}&rdquo;
              <button
                onClick={() => setFilters({ ...filters, search: '' })}
                className="hover:text-text-strong cursor-pointer"
                aria-label="Clear search filter"
              >
                <X size={10} />
              </button>
            </span>
          )}
          {filters.people.map((p) => (
            <span key={p} className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-xs text-text-muted border border-gray-200/60">
              {p}
              <button
                onClick={() => setFilters({ ...filters, people: filters.people.filter((x) => x !== p) })}
                className="hover:text-text-strong cursor-pointer"
                aria-label={`Remove ${p} filter`}
              >
                <X size={10} />
              </button>
            </span>
          ))}
          {filters.tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-xs text-text-muted border border-gray-200/60">
              {t}
              <button
                onClick={() => setFilters({ ...filters, tags: filters.tags.filter((x) => x !== t) })}
                className="hover:text-text-strong cursor-pointer"
                aria-label={`Remove ${t} filter`}
              >
                <X size={10} />
              </button>
            </span>
          ))}
          {(!!filters.dateFrom || !!filters.dateTo) && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-0.5 text-xs text-text-muted border border-gray-200/60">
              {filters.dateFrom || '…'} – {filters.dateTo || '…'}
              <button
                onClick={() => setFilters({ ...filters, dateFrom: '', dateTo: '' })}
                className="hover:text-text-strong cursor-pointer"
                aria-label="Clear date range filter"
              >
                <X size={10} />
              </button>
            </span>
          )}
        </div>
        <button
          onClick={clearFilters}
          className="text-xs text-text-muted hover:text-text-strong transition-colors duration-150 cursor-pointer whitespace-nowrap"
        >
          Clear all
        </button>
      </div>
    </motion.div>
  )
}

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
  // Derive the name string inside the selector so the page doesn't re-render on
  // every timelines-array replacement (switch/create/snapshot/remote merge).
  const timelineName = useTimelineStore(
    (s) => s.timelines.find((t) => t.id === s.activeTimelineId)?.name || 'Timeline'
  )
  const activeTimelineId = useTimelineStore((s) => s.activeTimelineId)
  const updateTimelineName = useTimelineStore((s) => s.updateTimelineName)
  const saveCurrentAsTimeline = useTimelineStore((s) => s.saveCurrentAsTimeline)
  const verticalCompact = useTimelineStore((s) => s.verticalCompact)
  const verticalDesign = useTimelineStore((s) => s.verticalDesign)
  const horizontalDesign = useTimelineStore((s) => s.horizontalDesign)
  const setInsightsPanelOpen = useTimelineStore((s) => s.setInsightsPanelOpen)
  const selectedEventIds = useTimelineStore((s) => s.selectedEventIds)
  const clearSelection = useTimelineStore((s) => s.clearSelection)

  const filtered = getFilteredEvents(events, filters)
  const sorted = getSortedEvents(filtered, sortOrder)

  const [photoLibOpen, setPhotoLibOpen] = useState(false)
  const [addEventOpen, setAddEventOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [showImport, setShowImport] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [timelineActive, setTimelineActive] = useState(events.length > 0)
  const [showWelcome, setShowWelcome] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null)
  const [isFirstLoad, setIsFirstLoad] = useState(true)
  const [isLoadingMore, startLoadMore] = useTransition()
  const prevEventCount = useRef(events.length)
  const loadMorePrevCount = useRef(null)
  const photoCount = Object.keys(photoMap).length
  const hasEvents = events.length > 0

  const handleRenameTimeline = (name) => {
    if (activeTimelineId) {
      updateTimelineName(activeTimelineId, name)
    } else {
      saveCurrentAsTimeline(name)
    }
  }

  // Selection
  const { selectionMode, setSelectionMode, handleToggleSelect } = useTimelineSelection(sorted)

  // Clear selection on filter/view change. Resets pagination alongside the
  // store-backed selection actions, which can't run during render.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset pagination in lockstep with the store-driven selection clear when filters change
    setPage(1)
    clearSelection()
    setSelectionMode(false)
  }, [filters, clearSelection, setSelectionMode])

  useEffect(() => {
    clearSelection()
    setSelectionMode(false)
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' })
  }, [activeView, clearSelection, setSelectionMode])

  // Shell integration (sidebar, toolbar, footer, scroll, mobile tabs)
  const { drawerOpen, setDrawerOpen } = useTimelineShell({
    timelineActive,
    hasEvents,
    photoCount,
    timelineName,
    onRenameTimeline: handleRenameTimeline,
    showImport,
    setShowImport,
    setAddEventOpen,
    setPhotoLibOpen,
    setShowShortcuts,
  })

  // Timeline active state tracking. This is a latched flag (also toggled
  // manually elsewhere), gated on hydration, so it's synced via effect rather
  // than derived during render.
  useEffect(() => {
    if (timelineActive && events.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- latched flag synced to event count, gated on hydration
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

  // Map, Graph, and Horizontal are aggregate visualizations — paginating them
  // silently truncates the picture, so they get the full sorted set. Their own
  // render caps (HORIZONTAL_RENDER_CAP, GRAPH_MAX_PEOPLE) protect performance.
  const isPaginatedView = activeView === VIEWS.VERTICAL || activeView === VIEWS.GRID
  const paginated = sorted.slice(0, page * PAGE_SIZE)
  const hasMore = isPaginatedView && page * PAGE_SIZE < sorted.length

  // Scroll to the first newly-loaded card after "Load more" commits
  useEffect(() => {
    if (loadMorePrevCount.current === null) return
    const prev = loadMorePrevCount.current
    loadMorePrevCount.current = null
    const cards = document.querySelectorAll('[data-event-card]')
    cards[prev]?.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' })
  }, [paginated.length])

  useKeyboardShortcutsTimeline({
    onAddEvent: () => setAddEventOpen(true),
    onTogglePrint: () => printTimeline(sorted, useTimelineStore.getState().showToast),
    onShowShortcuts: () => setShowShortcuts(true),
    onOpenInsights: () => setInsightsPanelOpen(true),
    onOpenPalette: () => setPaletteOpen(true),
  })

  useFilterParams()

  useDocumentMeta({
    title: timelineActive && hasEvents ? `${timelineName} — Timeliner` : undefined,
  })

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
            initial={{ opacity: 0, y: isFirstLoad ? 12 : 0 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: isFirstLoad ? 0.5 : MOTION_DURATION.NORMAL,
              ease: EASE,
            }}
            onAnimationComplete={() => {
              if (isFirstLoad) setIsFirstLoad(false)
            }}
          >
            <AnimatePresence>
              {showWelcome && <WelcomeBanner events={events} />}
            </AnimatePresence>

            {!showImport && !showWelcome && <div className="mb-2" />}

            <AnimatePresence>
              {(!!filters.search || filters.people.length > 0 || filters.tags.length > 0 || !!filters.dateFrom || !!filters.dateTo) && filtered.length < events.length && (
                <ActiveFilterBar
                  filters={filters}
                  setFilters={setFilters}
                  clearFilters={clearFilters}
                  filteredCount={filtered.length}
                  totalCount={events.length}
                />
              )}
            </AnimatePresence>

            {filtered.length === 0 ? (
              <FilterEmptyState
                filters={filters}
                setFilters={setFilters}
                clearFilters={clearFilters}
                totalCount={events.length}
              />
            ) : (
              <>
                {/* Mobile selection mode toggle — only the classic Vertical and
                    Grid views wire up per-card selection (see TimelineViewRenderer),
                    so hide the toggle elsewhere to avoid a dead button. */}
                {(
                  (activeView === VIEWS.VERTICAL && verticalDesign === 'classic') ||
                  activeView === VIEWS.GRID
                ) && (
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
                )}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${activeView}-${activeView === VIEWS.VERTICAL ? verticalDesign : activeView === VIEWS.HORIZONTAL ? horizontalDesign : ''}-${sortOrder}`}
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
                      events={isPaginatedView ? paginated : sorted}
                      groupZoom={groupZoom}
                      verticalCompact={verticalCompact}
                      selectedEventIds={selectedEventIds}
                      onToggleSelect={handleToggleSelect}
                      onEditEvent={setEditingEvent}
                      searchQuery={filters.search}
                    />
                  </motion.div>
                </AnimatePresence>

                {hasMore && (
                  <div className="flex justify-center py-4">
                    <Button variant="secondary" disabled={isLoadingMore} onClick={() => {
                      loadMorePrevCount.current = paginated.length
                      startLoadMore(() => setPage((p) => p + 1))
                    }}>
                      {isLoadingMore ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          Loading…
                        </>
                      ) : (
                        <>Load more ({sorted.length - paginated.length} remaining)</>
                      )}
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

      <EventDetailView events={events} onEdit={setEditingEvent} />

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        events={events}
        onAddEvent={() => setAddEventOpen(true)}
        onImportText={() => setShowImport(true)}
        onOpenPhotos={() => setPhotoLibOpen(true)}
        onOpenInsights={() => setInsightsPanelOpen(true)}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

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
