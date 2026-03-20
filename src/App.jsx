import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { Analytics } from '@vercel/analytics/react'
import { TooltipProvider } from '@/components/ui/Tooltip'
import Shell from '@/components/layout/Shell'
import TimelinePage from '@/components/timeline/TimelinePage'
import SharedViewPage from '@/components/shared/SharedViewPage'
import ErrorBoundary from '@/components/shared/ErrorBoundary'
import useKeyboardShortcuts from '@/hooks/useKeyboardShortcuts'
import useTimelineStore from '@/store/useTimelineStore'
import { revokeAllObjectUrls } from '@/lib/photoStore'

function AppContent() {
  useKeyboardShortcuts()

  const hydrateLocalData = useTimelineStore((s) => s.hydrateLocalData)
  const hydrateFromRemote = useTimelineStore((s) => s.hydrateFromRemote)
  const hydratePhotos = useTimelineStore((s) => s.hydratePhotos)
  const syncRemotePhotos = useTimelineStore((s) => s.syncRemotePhotos)
  const darkMode = useTimelineStore((s) => s.darkMode)

  // Apply dark mode class on mount and when toggled
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode)
  }, [darkMode])

  // Revoke blob URLs when app unmounts (prevents memory leaks on long sessions)
  useEffect(() => {
    return () => revokeAllObjectUrls()
  }, [])

  // On mount: hydrate local data from IndexedDB first, then photos and remote
  useEffect(() => {
    hydrateLocalData().then(() => {
      hydratePhotos().then(() => {
        // After local photos are loaded, sync with Supabase Storage
        syncRemotePhotos()
      })
      hydrateFromRemote()
    })
  }, [hydrateLocalData, hydratePhotos, hydrateFromRemote, syncRemotePhotos])

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<TimelinePage />} />
        <Route path="/timeline" element={<Navigate to="/" replace />} />
        <Route path="/s" element={<SharedViewPage />} />
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
