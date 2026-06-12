import { useEffect, useRef } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { Analytics } from '@vercel/analytics/react'
import { TooltipProvider } from '@/components/ui/Tooltip'
import Shell from '@/components/layout/Shell'
import TimelinePage from '@/components/timeline/TimelinePage'
import SharedViewPage from '@/components/shared/SharedViewPage'
import NotFoundPage from '@/components/shared/NotFoundPage'
import ErrorBoundary from '@/components/shared/ErrorBoundary'
import useKeyboardShortcuts from '@/hooks/useKeyboardShortcuts'
import useTimelineStore from '@/store/useTimelineStore'
import { revokeAllObjectUrls } from '@/lib/photoStore'
import { applyDarkMode } from '@/utils/constants'

function AppContent() {
  useKeyboardShortcuts()

  const hydrateLocalData = useTimelineStore((s) => s.hydrateLocalData)
  const hydrateFromRemote = useTimelineStore((s) => s.hydrateFromRemote)
  const hydratePhotos = useTimelineStore((s) => s.hydratePhotos)
  const syncRemotePhotos = useTimelineStore((s) => s.syncRemotePhotos)
  const darkMode = useTimelineStore((s) => s.darkMode)

  // Apply dark mode on mount/hydration (instant) and on user toggle (animated crossfade)
  const prevDarkMode = useRef(null)
  useEffect(() => {
    const animate = prevDarkMode.current !== null && prevDarkMode.current !== darkMode
    prevDarkMode.current = darkMode
    applyDarkMode(darkMode, { animate })
  }, [darkMode])

  // Revoke blob URLs when app unmounts (prevents memory leaks on long sessions)
  useEffect(() => {
    return () => revokeAllObjectUrls()
  }, [])

  // On mount: hydrate local data → photos (sequential), then remote sync (parallel, non-blocking)
  useEffect(() => {
    async function hydrate() {
      await hydrateLocalData()
      await hydratePhotos()
      // Remote syncs run in parallel — not on the critical display path
      hydrateFromRemote()
      syncRemotePhotos()
    }
    hydrate()
  }, [hydrateLocalData, hydratePhotos, hydrateFromRemote, syncRemotePhotos])

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<TimelinePage />} />
        <Route path="/timeline" element={<Navigate to="/" replace />} />
        <Route path="/s" element={<SharedViewPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      <Analytics />
    </Shell>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <TooltipProvider delayDuration={400}>
          <AppContent />
        </TooltipProvider>
      </MotionConfig>
    </ErrorBoundary>
  )
}
