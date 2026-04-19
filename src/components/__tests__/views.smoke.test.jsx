import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Suspense } from 'react'

// ─── Store mock ───────────────────────────────────────────
// Prevent real Zustand store init (localStorage/IndexedDB access) during tests.
vi.mock('@/store/useTimelineStore', () => ({
  default: vi.fn((selector) =>
    selector({
      photoMap: {},
      darkMode: false,
      sortOrder: 'date-asc',
      events: [],
      selectedEventIds: [],
      activeTimelineId: 'tl_test',
    }),
  ),
}))

// Leaflet and react-leaflet are not usable in jsdom
vi.mock('leaflet', () => {
  const proto = {}
  const Default = { prototype: proto, mergeOptions: vi.fn() }
  return {
    default: {
      Icon: { Default },
      divIcon: vi.fn(() => ({})),
      latLngBounds: vi.fn(() => ({ extend: vi.fn(), isValid: () => false })),
    },
    Icon: { Default },
    divIcon: vi.fn(() => ({})),
  }
})

vi.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div data-testid="map-container">{children}</div>,
  TileLayer: () => null,
  Marker: ({ children }) => <div data-testid="map-marker">{children}</div>,
  Popup: ({ children }) => <div>{children}</div>,
  useMap: () => ({ setView: vi.fn(), fitBounds: vi.fn() }),
}))

// Supabase / photo sync — avoid real network calls
vi.mock('@/lib/photoSync', () => ({ getSignedUrl: vi.fn(() => Promise.resolve(null)) }))

// Stub fetch globally to prevent geocoding network calls from MapView
beforeAll(() => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network disabled in tests')))
})

afterAll(() => {
  vi.unstubAllGlobals()
})

// ─── Shared fixtures ──────────────────────────────────────

const makeEvent = (overrides = {}) => ({
  id: `evt_${Math.random().toString(36).slice(2, 8)}`,
  title: 'Test Event',
  description: 'A description for this event.',
  dateStart: '2010-06-15',
  dateEnd: null,
  dateRaw: 'June 2010',
  datePrecision: 'day',
  flagged: false,
  flagReason: null,
  people: [],
  tags: [],
  photos: [],
  ...overrides,
})

const EVENTS = [
  makeEvent({ id: 'e1', title: 'Event One', dateStart: '2005-03-01', tags: ['family'] }),
  makeEvent({ id: 'e2', title: 'Event Two', dateStart: '2010-07-20', tags: ['career'], people: ['Alice'] }),
  makeEvent({ id: 'e3', title: 'Event Three', dateStart: '2015-11-10', tags: ['education'], people: ['Alice', 'Bob'] }),
]

// ─── VerticalView ─────────────────────────────────────────

describe('VerticalView smoke test', () => {
  it('renders without crashing with a set of events', async () => {
    const { default: VerticalView } = await import('../timeline/VerticalView')
    render(<VerticalView events={EVENTS} editable groupZoom="year" />)
    expect(screen.getByText('Event One')).toBeInTheDocument()
    expect(screen.getByText('Event Two')).toBeInTheDocument()
    expect(screen.getByText('Event Three')).toBeInTheDocument()
  })

  it('renders without crashing with an empty events array', async () => {
    const { default: VerticalView } = await import('../timeline/VerticalView')
    const { container } = render(<VerticalView events={[]} editable groupZoom="year" />)
    expect(container).toBeTruthy()
  })

  it('renders in compact mode', async () => {
    const { default: VerticalView } = await import('../timeline/VerticalView')
    const { container } = render(<VerticalView events={EVENTS} editable compact groupZoom="year" />)
    expect(container.firstChild).toBeTruthy()
  })
})

// ─── HorizontalView ───────────────────────────────────────

describe('HorizontalView smoke test', () => {
  it('renders without crashing with a set of events', async () => {
    const { default: HorizontalView } = await import('../timeline/HorizontalView')
    const { container } = render(<HorizontalView events={EVENTS} editable />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders an SVG timeline axis', async () => {
    const { default: HorizontalView } = await import('../timeline/HorizontalView')
    const { container } = render(<HorizontalView events={EVENTS} editable />)
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders without crashing with an empty events array', async () => {
    const { default: HorizontalView } = await import('../timeline/HorizontalView')
    const { container } = render(<HorizontalView events={[]} />)
    expect(container.firstChild).toBeTruthy()
  })
})

// ─── GridView ─────────────────────────────────────────────

describe('GridView smoke test', () => {
  it('renders without crashing with a set of events', async () => {
    const { default: GridView } = await import('../timeline/GridView')
    render(<GridView events={EVENTS} editable groupZoom="year" />)
    expect(screen.getByText('Event One')).toBeInTheDocument()
  })

  it('renders without crashing with an empty events array', async () => {
    const { default: GridView } = await import('../timeline/GridView')
    const { container } = render(<GridView events={[]} groupZoom="year" />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders grouped by month when groupZoom is month', async () => {
    const { default: GridView } = await import('../timeline/GridView')
    const { container } = render(<GridView events={EVENTS} editable groupZoom="month" />)
    expect(container.firstChild).toBeTruthy()
  })
})

// ─── MapView ─────────────────────────────────────────────

describe('MapView smoke test', () => {
  it('renders the map container when events have locations', async () => {
    const { default: MapView } = await import('../timeline/MapView')
    // Events must have a location field for the MapContainer to render
    const locatedEvents = EVENTS.map((e) => ({ ...e, location: 'New York' }))
    render(
      <Suspense fallback={<div>loading</div>}>
        <MapView events={locatedEvents} />
      </Suspense>,
    )
    // MapContainer mock renders data-testid="map-container"
    expect(screen.getByTestId('map-container')).toBeInTheDocument()
  })

  it('shows empty state when no events have locations', async () => {
    const { default: MapView } = await import('../timeline/MapView')
    render(
      <Suspense fallback={null}>
        <MapView events={EVENTS} />
      </Suspense>,
    )
    expect(screen.getByText('No events with locations')).toBeInTheDocument()
  })

  it('renders without crashing with an empty events array', async () => {
    const { default: MapView } = await import('../timeline/MapView')
    render(
      <Suspense fallback={null}>
        <MapView events={[]} />
      </Suspense>,
    )
    expect(screen.getByText('No events with locations')).toBeInTheDocument()
  })
})

// ─── GraphView ────────────────────────────────────────────

describe('GraphView smoke test', () => {
  it('renders without crashing with a set of events', async () => {
    const { default: GraphView } = await import('../timeline/GraphView')
    const { container } = render(<GraphView events={EVENTS} editable />)
    expect(container.firstChild).toBeTruthy()
  })

  it('renders an SVG graph when events have people', async () => {
    const { default: GraphView } = await import('../timeline/GraphView')
    const { container } = render(<GraphView events={EVENTS} editable />)
    // The graph renders SVG nodes for people; Alice and Bob appear in EVENTS
    expect(container.querySelector('svg')).toBeInTheDocument()
  })

  it('renders without crashing with an empty events array', async () => {
    const { default: GraphView } = await import('../timeline/GraphView')
    render(<GraphView events={[]} />)
    // Empty state — no crash is the only assertion needed
  })

  it('renders without crashing with events that have no people', async () => {
    const { default: GraphView } = await import('../timeline/GraphView')
    const noPeople = EVENTS.map((e) => ({ ...e, people: [] }))
    const { container } = render(<GraphView events={noPeople} />)
    expect(container.firstChild).toBeTruthy()
  })
})
