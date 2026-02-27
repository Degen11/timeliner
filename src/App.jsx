import { Routes, Route } from 'react-router-dom'
import Shell from '@/components/layout/Shell'
import InputPage from '@/components/input/InputPage'
import TimelinePage from '@/components/timeline/TimelinePage'
import SharedViewPage from '@/components/shared/SharedViewPage'
import ErrorBoundary from '@/components/shared/ErrorBoundary'
import useKeyboardShortcuts from '@/hooks/useKeyboardShortcuts'

function AppContent() {
  useKeyboardShortcuts()

  return (
    <Shell>
      <Routes>
        <Route path="/" element={<InputPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
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
