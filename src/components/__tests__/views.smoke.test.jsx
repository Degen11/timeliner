import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest'
import { render as rtlRender, screen } from '@testing-library/react'
import { Suspense } from 'react'
import { TooltipProvider } from '@/components/ui/Tooltip'

// EventCard uses Radix Tooltips, which require a provider in the tree
const render = (ui) => rtlRender(ui, { wrapper: TooltipProvider })

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
vi.mock('@/lib/photoSync', () => ({ getRemotePhotoUrl: vi.fn(() => Promise.resolve(null)) }))

// Stub fetch globally to prevent geocoding network calls from MapView
beforeAll(() => {
  vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network disabled in tests')))
})

// The first dynamic import of a view transforms most of src/ cold. Under a
// loaded parallel run that can pass the 5s per-test timeout, so warm the
// module graph once here with a longer budget.
beforeAll(async () => {
  await import('../timeline/VerticalView')
}, 60_000)

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

  it('renders compact rows in compact mode', async () => {
    const { default: VerticalView } = await import('../timeline/VerticalView')
    render(<VerticalView events={EVENTS} editable compact groupZoom="year" />)
    // Compact rows carry the tag-colored left edge; full cards don't
    const card = screen.getByRole('button', { name: 'View details for Event One' })
    expect(card.style.borderLeftWidth).toBe('3px')
  })

  it('renders full cards (no compact edge) by default', async () => {
    const { default: VerticalView } = await import('../timeline/VerticalView')
    render(<VerticalView events={EVENTS} editable groupZoom="year" />)
    const card = screen.getByRole('button', { name: 'View details for Event One' })
    expect(card.style.borderLeftWidth).toBe('')
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

  // Several events per group: one event per group switches the grid to a
  // header-less masonry layout
  const DENSE = [
    ...['03-01', '03-09', '03-20'].map((d, i) => makeEvent({ id: `m${i}`, title: `March ${i}`, dateStart: `2005-${d}` })),
    ...['07-02', '07-15', '07-28'].map((d, i) => makeEvent({ id: `j${i}`, title: `July ${i}`, dateStart: `2005-${d}` })),
  ]

  it('renders month group headers when groupZoom is month', async () => {
    const { default: GridView } = await import('../timeline/GridView')
    render(<GridView events={DENSE} editable groupZoom="month" />)
    expect(screen.getByText(/March 2005/)).toBeInTheDocument()
    expect(screen.getByText(/July 2005/)).toBeInTheDocument()
  })

  it('renders year group headers (not months) when groupZoom is year', async () => {
    const { default: GridView } = await import('../timeline/GridView')
    render(<GridView events={DENSE} editable groupZoom="year" />)
    expect(screen.queryByText(/March 2005/)).toBeNull()
    expect(screen.getAllByText(/2005/).length).toBeGreaterThan(0)
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

  it('shows the empty state for an empty events array', async () => {
    const { default: GraphView } = await import('../timeline/GraphView')
    render(<GraphView events={[]} />)
    expect(screen.getByText('No people to graph')).toBeInTheDocument()
  })

  it('renders without crashing with events that have no people', async () => {
    const { default: GraphView } = await import('../timeline/GraphView')
    const noPeople = EVENTS.map((e) => ({ ...e, people: [] }))
    const { container } = render(<GraphView events={noPeople} />)
    expect(container.firstChild).toBeTruthy()
  })
})

// ─── Variant views (lazy-loaded in the app) ───────────────

describe('variant views', () => {
  const VARIANTS = [
    ['VerticalCinematic', (C) => <C events={EVENTS} editable groupZoom="year" />],
    ['VerticalMagazine', (C) => <C events={EVENTS} editable groupZoom="year" />],
    ['VerticalNarrative', (C) => <C events={EVENTS} editable groupZoom="year" />],
    ['HorizontalPanoramic', (C) => <C events={EVENTS} editable />],
    ['HorizontalFilmStrip', (C) => <C events={EVENTS} editable />],
    ['HorizontalWave', (C) => <C events={EVENTS} editable />],
  ]

  for (const [name, element] of VARIANTS) {
    it(`${name} renders every event title`, async () => {
      const { default: View } = await import(`../timeline/${name}.jsx`)
      render(element(View))
      for (const title of ['Event One', 'Event Two', 'Event Three']) {
        expect(screen.getAllByText(title).length).toBeGreaterThan(0)
      }
    })

    it(`${name} renders an empty events array`, async () => {
      const { default: View } = await import(`../timeline/${name}.jsx`)
      const { container } = render(<View events={[]} />)
      expect(container).toBeTruthy()
      expect(screen.queryByText('Event One')).toBeNull()
    })
  }
})

// ─── Render caps ──────────────────────────────────────────

describe('render caps', () => {
  const manyEvents = (n) =>
    Array.from({ length: n }, (_, i) =>
      makeEvent({ id: `cap_${i}`, title: `Capped ${i}`, dateStart: `${1800 + (i % 200)}-01-01` }),
    )

  for (const name of ['HorizontalView', 'HorizontalPanoramic', 'HorizontalFilmStrip', 'HorizontalWave']) {
    it(`${name} shows only HORIZONTAL_RENDER_CAP events and says so`, async () => {
      const { HORIZONTAL_RENDER_CAP } = await import('@/utils/constants')
      const { default: View } = await import(`../timeline/${name}.jsx`)
      render(<View events={manyEvents(HORIZONTAL_RENDER_CAP + 25)} editable />)
      expect(
        screen.getByText(`Showing first ${HORIZONTAL_RENDER_CAP} of ${HORIZONTAL_RENDER_CAP + 25} events`, { exact: false }),
      ).toBeInTheDocument()
    }, 20_000)

    it(`${name} shows no cap notice under the cap`, async () => {
      const { default: View } = await import(`../timeline/${name}.jsx`)
      render(<View events={EVENTS} editable />)
      expect(screen.queryByText(/Showing first/)).toBeNull()
    })
  }

  it('GraphView keeps the GRAPH_MAX_PEOPLE most connected people and says so', async () => {
    const { GRAPH_MAX_PEOPLE } = await import('@/utils/constants')
    const { default: GraphView } = await import('../timeline/GraphView')
    const total = GRAPH_MAX_PEOPLE + 15
    // Each event pairs person i with a hub, so every person is connected
    const events = Array.from({ length: total }, (_, i) =>
      makeEvent({ id: `g_${i}`, title: `Meeting ${i}`, people: ['Hub', `Person ${i}`] }),
    )
    render(<GraphView events={events} editable />)
    expect(
      screen.getByText(`Showing the ${GRAPH_MAX_PEOPLE} most connected people of ${total + 1}`, { exact: false }),
    ).toBeInTheDocument()
  }, 20_000)
})
