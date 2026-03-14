import { memo, lazy, Suspense } from 'react'
import { VIEWS } from '@/utils/constants'
import VerticalView from './VerticalView'
import VerticalCinematic from './VerticalCinematic'
import VerticalMagazine from './VerticalMagazine'
import VerticalNarrative from './VerticalNarrative'
import HorizontalView from './HorizontalView'
import HorizontalPanoramic from './HorizontalPanoramic'
import HorizontalFilmStrip from './HorizontalFilmStrip'
import HorizontalWave from './HorizontalWave'
import GridView from './GridView'
import ViewSkeleton from '@/components/shared/ViewSkeleton'

const MapView = lazy(() => import('./MapView'))
const GraphView = lazy(() => import('./GraphView'))

const TimelineViewRenderer = memo(function TimelineViewRenderer({
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
  if (activeView === VIEWS.VERTICAL) {
    switch (verticalDesign) {
      case 'cinematic':
        return <VerticalCinematic events={events} editable groupZoom={groupZoom} onEditEvent={onEditEvent} />
      case 'magazine':
        return <VerticalMagazine events={events} editable groupZoom={groupZoom} onEditEvent={onEditEvent} />
      case 'narrative':
        return <VerticalNarrative events={events} editable groupZoom={groupZoom} onEditEvent={onEditEvent} />
      default:
        return (
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
  }

  if (activeView === VIEWS.HORIZONTAL) {
    switch (horizontalDesign) {
      case 'panoramic':
        return <HorizontalPanoramic events={events} editable onEditEvent={onEditEvent} />
      case 'filmstrip':
        return <HorizontalFilmStrip events={events} editable onEditEvent={onEditEvent} />
      case 'wave':
        return <HorizontalWave events={events} editable onEditEvent={onEditEvent} />
      default:
        return <HorizontalView events={events} editable onEditEvent={onEditEvent} />
    }
  }

  if (activeView === VIEWS.GRID) {
    return (
      <GridView
        events={events}
        editable
        groupZoom={groupZoom}
        selectedEventIds={selectedEventIds}
        onToggleSelect={onToggleSelect}
        onEditEvent={onEditEvent}
      />
    )
  }

  if (activeView === VIEWS.MAP) {
    return (
      <Suspense fallback={<ViewSkeleton view={VIEWS.MAP} />}>
        <MapView events={events} />
      </Suspense>
    )
  }

  if (activeView === VIEWS.GRAPH) {
    return (
      <Suspense fallback={<ViewSkeleton view={VIEWS.GRAPH} />}>
        <GraphView events={events} editable onEditEvent={onEditEvent} />
      </Suspense>
    )
  }

  return null
})

export default TimelineViewRenderer
