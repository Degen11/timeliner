import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { Analytics } from '@vercel/analytics/react'
import Shell from '@/components/layout/Shell'
import TimelinePage from '@/components/timeline/TimelinePage'
import SharedViewPage from '@/components/shared/SharedViewPage'
import ErrorBoundary from '@/components/shared/ErrorBoundary'
import useKeyboardShortcuts from '@/hooks/useKeyboardShortcuts'
import useTimelineStore from '@/store/useTimelineStore'

function AppContent() {
  useKeyboardShortcuts()

  const hydrateFromRemote = useTimelineStore((s) => s.hydrateFromRemote)
  const hydratePhotos = useTimelineStore((s) => s.hydratePhotos)

  // On mount, load photos from IndexedDB and pull latest data from Supabase
  useEffect(() => {
    hydratePhotos()
    hydrateFromRemote()
  }, [hydratePhotos, hydrateFromRemote])

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
        <AppContent />
      </MotionConfig>
    </ErrorBoundary>
  )
}
