import { useEffect, useState, lazy, Suspense } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ExternalLink, List, GripHorizontal, LayoutGrid, MapPin, GitBranch, Clock, Copy, Sun, Moon, Loader2 } from 'lucide-react'
import LZString from 'lz-string'
import { VIEWS, applyThemeColor } from '@/utils/constants'
import useTimelineStore from '@/store/useTimelineStore'
import useDocumentMeta from '@/hooks/useDocumentMeta'
import VerticalView from '@/components/timeline/VerticalView'
import HorizontalView from '@/components/timeline/HorizontalView'
import GridView from '@/components/timeline/GridView'
import EmptyState from './EmptyState'

const MapView = lazy(() => import('@/components/timeline/MapView'))
const GraphView = lazy(() => import('@/components/timeline/GraphView'))

const VIEW_OPTIONS = [
  { key: VIEWS.VERTICAL, label: 'Vertical', icon: List },
  { key: VIEWS.HORIZONTAL, label: 'Horizontal', icon: GripHorizontal },
  { key: VIEWS.GRID, label: 'Grid', icon: LayoutGrid },
  { key: VIEWS.MAP, label: 'Map', icon: MapPin },
  { key: VIEWS.GRAPH, label: 'Graph', icon: GitBranch },
]

export default function SharedViewPage() {
  const [events, setEvents] = useState(null)
  const [meta, setMeta] = useState(null)
  const [error, setError] = useState(null) // null | 'invalid' | 'expired' | 'not-found'
  const [activeView, setActiveView] = useState(VIEWS.VERTICAL)
  const [copied, setCopied] = useState(false)
  const [darkMode, setDarkMode] = useState(() => document.documentElement.classList.contains('dark'))
  const [searchParams] = useSearchParams()

  const saveCurrentAsTimeline = useTimelineStore((s) => s.saveCurrentAsTimeline)
  const showToast = useTimelineStore((s) => s.showToast)

  const sharedTitle = meta?.title || 'Shared Timeline'
  const shareId = searchParams.get('id')
  useDocumentMeta({
    title: events ? `${sharedTitle} — Timeliner` : 'Timeliner',
    description: events
      ? `View "${sharedTitle}" — a timeline with ${events.length} event${events.length !== 1 ? 's' : ''}, created with Timeliner.`
      : undefined,
    canonical: shareId ? `https://timeliner.app/share/${shareId}` : undefined,
  })

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const next = !prev
      document.documentElement.classList.toggle('dark', next)
      applyThemeColor(next)
      return next
    })
  }

  useEffect(() => {
    async function loadShare() {
      // Check for server-side share ID first
      const shareId = searchParams.get('id')
      if (shareId) {
        try {
          const res = await fetch(`/api/share?id=${encodeURIComponent(shareId)}`)
          if (res.ok) {
            const result = await res.json()
            if (result && result.events) {
              setEvents(result.events)
              setMeta(result.meta || {})
              return
            }
          } else if (res.status === 410) {
            setError('expired')
            return
          } else if (res.status === 404) {
            setError('not-found')
            return
          }
        } catch {
          // fall through to hash-based
        }
      }

      // Fall back to hash-based LZ decoding
      try {
        const hash = window.location.hash.slice(1)
        if (!hash) {
          setError('invalid')
          return
        }
        const json = LZString.decompressFromEncodedURIComponent(hash)
        const data = JSON.parse(json)
        setEvents(data.events || [])
      } catch {
        setError('invalid')
      }
    }

    loadShare()
  }, [searchParams])

  const handleCopyToTimelines = () => {
    if (!events || events.length === 0) return
    const name = meta?.title || 'Imported Timeline'
    // Pass events directly so they're saved into the new timeline without
    // polluting or depending on the current working state.
    saveCurrentAsTimeline(name, events)
    setCopied(true)
    showToast(`Copied ${events.length} events to "${name}"`)
    setTimeout(() => setCopied(false), 3000)
  }

  if (error) {
    const errorMessages = {
      expired: { title: 'Share link expired', description: 'This shared timeline link has expired and is no longer available.' },
      'not-found': { title: 'Timeline not found', description: 'This shared timeline could not be found. It may have been deleted.' },
      invalid: { title: 'Invalid or missing timeline', description: "This link doesn't contain valid timeline data." },
    }
    const { title, description } = errorMessages[error] || errorMessages.invalid
    return (
      <EmptyState
        title={title}
        description={description}
      >
        <Link
          to="/"
          className="text-sm text-secondary hover:underline inline-flex items-center gap-1"
        >
          Create your own timeline <ExternalLink size={12} />
        </Link>
      </EmptyState>
    )
  }

  if (!events) {
    return (
      <div className="flex items-center justify-center py-16">
        <span className="animate-spin h-6 w-6 border-2 border-gray-300 border-t-primary rounded-full" />
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <EmptyState
        icon={Clock}
        title="This timeline is empty"
        description="The shared timeline doesn't contain any events."
      >
        <Link
          to="/"
          className="text-sm text-secondary hover:underline inline-flex items-center gap-1"
        >
          Create your own timeline <ExternalLink size={12} />
        </Link>
      </EmptyState>
    )
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-gray-900 tracking-tight">
            {meta?.title || 'Shared Timeline'}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleCopyToTimelines}
            disabled={copied}
            className="text-sm text-secondary hover:text-secondary-hover inline-flex items-center gap-1.5 no-underline border border-secondary/20 rounded-lg px-3 py-1.5 hover:bg-secondary/5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Copy size={12} />
            {copied ? 'Copied!' : 'Copy to my timelines'}
          </button>

          <button
            onClick={toggleDarkMode}
            className="rounded-lg p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer border border-gray-200"
            title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
          </button>

          <Link
            to="/"
            className="text-sm text-secondary hover:underline inline-flex items-center gap-1 no-underline"
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
      {activeView === VIEWS.MAP && (
        <Suspense fallback={<div className="flex items-center justify-center py-20 text-gray-400"><Loader2 size={20} className="animate-spin mr-2" />Loading map...</div>}>
          <MapView events={events} />
        </Suspense>
      )}
      {activeView === VIEWS.GRAPH && (
        <Suspense fallback={<div className="flex items-center justify-center py-20 text-gray-400"><Loader2 size={20} className="animate-spin mr-2" />Loading graph...</div>}>
          <GraphView events={events} />
        </Suspense>
      )}
    </div>
  )
}
