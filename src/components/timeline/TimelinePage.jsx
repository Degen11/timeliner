import { useNavigate } from 'react-router-dom'
import { List, GripHorizontal, LayoutGrid, FileText } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { getFilteredEvents } from '@/store/selectors'
import { VIEWS } from '@/utils/constants'
import Button from '@/components/shared/Button'
import EmptyState from '@/components/shared/EmptyState'
import FilterBar from '@/components/filters/FilterBar'
import ReviewPanel from '@/components/review/ReviewPanel'
import ExportMenu from '@/components/export/ExportMenu'
import VerticalView from './VerticalView'
import HorizontalView from './HorizontalView'
import GridView from './GridView'

const VIEW_OPTIONS = [
  { key: VIEWS.VERTICAL, label: 'Vertical', icon: List },
  { key: VIEWS.HORIZONTAL, label: 'Horizontal', icon: GripHorizontal },
  { key: VIEWS.GRID, label: 'Grid', icon: LayoutGrid },
]

export default function TimelinePage() {
  const navigate = useNavigate()
  const { events, activeView, setActiveView, filters } = useTimelineStore()
  const filtered = getFilteredEvents(events, filters)

  if (events.length === 0) {
    return (
      <EmptyState
        icon={FileText}
        title="No timeline yet"
        description="Paste some text on the input page to generate your timeline."
      >
        <Button onClick={() => navigate('/')}>Go to Input</Button>
      </EmptyState>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 tracking-tight">
            Timeline
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {filtered.length} event{filtered.length !== 1 ? 's' : ''}
            {filtered.length !== events.length && ` of ${events.length}`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <ExportMenu />

          {/* View switcher */}
          <div className="flex items-center gap-0.5 rounded-lg border border-gray-200 bg-gray-50 p-0.5">
            {VIEW_OPTIONS.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveView(key)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all cursor-pointer ${
                  activeView === key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                title={label}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <FilterBar />

      {/* Active view */}
      {filtered.length === 0 ? (
        <EmptyState
          title="No matching events"
          description="Try adjusting your filters."
        />
      ) : (
        <>
          {activeView === VIEWS.VERTICAL && <VerticalView events={filtered} editable />}
          {activeView === VIEWS.HORIZONTAL && (
            <HorizontalView events={filtered} editable />
          )}
          {activeView === VIEWS.GRID && <GridView events={filtered} editable />}
        </>
      )}

      {/* Review panel (slides in from right) */}
      <ReviewPanel />
    </div>
  )
}
