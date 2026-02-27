import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ExternalLink, List, GripHorizontal, LayoutGrid } from 'lucide-react'
import LZString from 'lz-string'
import { VIEWS } from '@/utils/constants'
import VerticalView from '@/components/timeline/VerticalView'
import HorizontalView from '@/components/timeline/HorizontalView'
import GridView from '@/components/timeline/GridView'
import EmptyState from './EmptyState'

const VIEW_OPTIONS = [
  { key: VIEWS.VERTICAL, label: 'Vertical', icon: List },
  { key: VIEWS.HORIZONTAL, label: 'Horizontal', icon: GripHorizontal },
  { key: VIEWS.GRID, label: 'Grid', icon: LayoutGrid },
]

export default function SharedViewPage() {
  const [events, setEvents] = useState(null)
  const [error, setError] = useState(false)
  const [activeView, setActiveView] = useState(VIEWS.VERTICAL)

  useEffect(() => {
    try {
      const hash = window.location.hash.slice(1)
      if (!hash) {
        setError(true)
        return
      }
      const json = LZString.decompressFromEncodedURIComponent(hash)
      const data = JSON.parse(json)
      setEvents(data.events || [])
    } catch {
      setError(true)
    }
  }, [])

  if (error) {
    return (
      <EmptyState
        title="Invalid or missing timeline"
        description="This link doesn't contain valid timeline data."
      >
        <Link
          to="/"
          className="text-sm text-accent hover:underline inline-flex items-center gap-1"
        >
          Create your own timeline <ExternalLink size={12} />
        </Link>
      </EmptyState>
    )
  }

  if (!events) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-accent rounded-full" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 tracking-tight">
            Shared Timeline
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/"
            className="text-sm text-accent hover:underline inline-flex items-center gap-1 no-underline"
          >
            Create your own <ExternalLink size={12} />
          </Link>

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

      {activeView === VIEWS.VERTICAL && <VerticalView events={events} />}
      {activeView === VIEWS.HORIZONTAL && <HorizontalView events={events} />}
      {activeView === VIEWS.GRID && <GridView events={events} />}
    </div>
  )
}
