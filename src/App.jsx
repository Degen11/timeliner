import { useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Shell from '@/components/layout/Shell'
import TimelinePage from '@/components/timeline/TimelinePage'
import SharedViewPage from '@/components/shared/SharedViewPage'
import ErrorBoundary from '@/components/shared/ErrorBoundary'
import useKeyboardShortcuts from '@/hooks/useKeyboardShortcuts'
import useTimelineStore from '@/store/useTimelineStore'

function AppContent() {
  useKeyboardShortcuts()

  const hydrateFromRemote = useTimelineStore((s) => s.hydrateFromRemote)

  // On mount, pull latest data from Supabase (non-blocking)
  useEffect(() => {
    hydrateFromRemote()
  }, [hydrateFromRemote])

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<TimelinePage />} />
        <Route path="/timeline" element={<Navigate to="/" replace />} />
        <Route path="/s" element={<SharedViewPage />} />
      </Routes>
    </Shell>
  )
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  )
}
