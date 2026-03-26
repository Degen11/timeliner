import { useState, useEffect, useRef } from 'react'
import useTimelineStore from '@/store/useTimelineStore'
import { useToolbar, useHideFooter, useSidebar, useMobileTab } from '@/components/layout/shellContexts'
import Sidebar from '@/components/layout/Sidebar'
import ToolbarContent from '@/components/timeline/TimelineToolbar'

// Module-level map to store scroll positions per timeline (session-only)
const scrollPositions = new Map()

/**
 * Manages shell integration (sidebar, toolbar, footer, scroll position, mobile tabs)
 * for TimelinePage. Extracted to keep the page component focused on rendering.
 *
 * @param {Object} opts
 * @param {boolean} opts.timelineActive
 * @param {boolean} opts.hasEvents
 * @param {number} opts.photoCount
 * @param {string} opts.timelineName
 * @param {Function} opts.onRenameTimeline
 * @param {boolean} opts.showImport
 * @param {Function} opts.setShowImport
 * @param {Function} opts.setAddEventOpen
 * @param {Function} opts.setPhotoLibOpen
 * @param {Function} opts.setShowShortcuts
 * @returns {{ drawerOpen, setDrawerOpen, SidebarDrawerEl }}
 */
export default function useTimelineShell({
  timelineActive,
  hasEvents,
  photoCount,
  timelineName,
  onRenameTimeline,
  showImport,
  setShowImport,
  setAddEventOpen,
  setPhotoLibOpen,
  setShowShortcuts,
}) {
  const activeTimelineId = useTimelineStore((s) => s.activeTimelineId)
  const setInsightsPanelOpen = useTimelineStore((s) => s.setInsightsPanelOpen)
  const [drawerOpen, setDrawerOpen] = useState(false)

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
  }, [mobileTabCtx, timelineActive, hasEvents, setAddEventOpen, setShowImport, setPhotoLibOpen])

  // Footer visibility
  const setHideFooter = useHideFooter()
  useEffect(() => {
    const shouldHide = timelineActive && hasEvents
    setHideFooter?.(shouldHide)
    return () => setHideFooter?.(false)
  }, [timelineActive, hasEvents, setHideFooter])

  // Sidebar content
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
  }, [timelineActive, hasEvents, photoCount, setSidebar, setPhotoLibOpen, setShowShortcuts])

  // Toolbar content — stable ref for rename callback to avoid effect churn
  const onRenameRef = useRef(onRenameTimeline)
  useEffect(() => {
    onRenameRef.current = onRenameTimeline
  })

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
          onRenameTimeline={(name) => onRenameRef.current(name)}
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
    setAddEventOpen,
    setShowImport,
    setPhotoLibOpen,
  ])

  // Scroll to top on initial load
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // Save/restore scroll position when switching timelines
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

  return { drawerOpen, setDrawerOpen }
}
