import { Routes, Route } from 'react-router-dom'
import Shell from '@/components/layout/Shell'
import InputPage from '@/components/input/InputPage'
import TimelinePage from '@/components/timeline/TimelinePage'
import SharedViewPage from '@/components/shared/SharedViewPage'

export default function App() {
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
