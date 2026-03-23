import { lazy, Suspense, Component } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { VIEWS } from '@/utils/constants'
import VerticalView from './VerticalView'
import HorizontalView from './HorizontalView'
import GridView from './GridView'
import ViewSkeleton from '@/components/shared/ViewSkeleton'

const VerticalCinematic = lazy(() => import('./VerticalCinematic'))
const VerticalMagazine = lazy(() => import('./VerticalMagazine'))
const VerticalNarrative = lazy(() => import('./VerticalNarrative'))
const HorizontalPanoramic = lazy(() => import('./HorizontalPanoramic'))
const HorizontalFilmStrip = lazy(() => import('./HorizontalFilmStrip'))
const HorizontalWave = lazy(() => import('./HorizontalWave'))
const MapView = lazy(() => import('./MapView'))
const GraphView = lazy(() => import('./GraphView'))

class ViewErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('View render error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="rounded-full bg-red-50 p-3 mb-3">
            <AlertTriangle size={24} className="text-error" />
          </div>
          <h3 className="font-display text-base font-semibold text-text-strong mb-1">
            View failed to render
          </h3>
          <p className="text-sm text-text-muted mb-4 max-w-sm">
            {this.state.error?.message || 'Something went wrong rendering this view.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="inline-flex items-center gap-2 rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary-hover transition-colors cursor-pointer"
          >
            <RefreshCw size={14} />
            Try Again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

function TimelineViewRenderer({
  activeView,
  verticalDesign,
  horizontalDesign,
  events,
  groupZoom,
  verticalCompact,
  selectedEventIds,
  onToggleSelect,
  onEditEvent,
}) {
  const boundaryKey = `${activeView}-${verticalDesign}-${horizontalDesign}`
  let view = null

  if (activeView === VIEWS.VERTICAL) {
    switch (verticalDesign) {
      case 'cinematic':
        view = (
          <Suspense fallback={<ViewSkeleton view={VIEWS.VERTICAL} />}>
            <VerticalCinematic events={events} editable groupZoom={groupZoom} onEditEvent={onEditEvent} />
          </Suspense>
        )
        break
      case 'magazine':
        view = (
          <Suspense fallback={<ViewSkeleton view={VIEWS.VERTICAL} />}>
            <VerticalMagazine events={events} editable groupZoom={groupZoom} onEditEvent={onEditEvent} />
          </Suspense>
        )
        break
      case 'narrative':
        view = (
          <Suspense fallback={<ViewSkeleton view={VIEWS.VERTICAL} />}>
            <VerticalNarrative events={events} editable groupZoom={groupZoom} onEditEvent={onEditEvent} />
          </Suspense>
        )
        break
      default:
        view = (
          <VerticalView
            events={events}
            editable
            compact={verticalCompact}
            groupZoom={groupZoom}
            selectedEventIds={selectedEventIds}
            onToggleSelect={onToggleSelect}
            onEditEvent={onEditEvent}
          />
        )
    }
  } else if (activeView === VIEWS.HORIZONTAL) {
    switch (horizontalDesign) {
      case 'panoramic':
        view = (
          <Suspense fallback={<ViewSkeleton view={VIEWS.HORIZONTAL} />}>
            <HorizontalPanoramic events={events} editable onEditEvent={onEditEvent} />
          </Suspense>
        )
        break
      case 'filmstrip':
        view = (
          <Suspense fallback={<ViewSkeleton view={VIEWS.HORIZONTAL} />}>
            <HorizontalFilmStrip events={events} editable onEditEvent={onEditEvent} />
          </Suspense>
        )
        break
      case 'wave':
        view = (
          <Suspense fallback={<ViewSkeleton view={VIEWS.HORIZONTAL} />}>
            <HorizontalWave events={events} editable onEditEvent={onEditEvent} />
          </Suspense>
        )
        break
      default:
        view = <HorizontalView events={events} editable onEditEvent={onEditEvent} />
    }
  } else if (activeView === VIEWS.GRID) {
    view = (
      <GridView
        events={events}
        editable
        groupZoom={groupZoom}
        selectedEventIds={selectedEventIds}
        onToggleSelect={onToggleSelect}
        onEditEvent={onEditEvent}
      />
    )
  } else if (activeView === VIEWS.MAP) {
    view = (
      <Suspense fallback={<ViewSkeleton view={VIEWS.MAP} />}>
        <MapView events={events} />
      </Suspense>
    )
  } else if (activeView === VIEWS.GRAPH) {
    view = (
      <Suspense fallback={<ViewSkeleton view={VIEWS.GRAPH} />}>
        <GraphView events={events} editable onEditEvent={onEditEvent} />
      </Suspense>
    )
  }

  return <ViewErrorBoundary key={boundaryKey}>{view}</ViewErrorBoundary>
}

export default TimelineViewRenderer
