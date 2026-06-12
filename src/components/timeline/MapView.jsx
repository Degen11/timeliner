import { useState, useEffect, useRef } from 'react'
import { MapPin, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { formatEventDate } from '@/utils/dateUtils'
import { getTagPalette } from '@/utils/constants'
import EmptyState from '@/components/shared/EmptyState'
import useTimelineStore from '@/store/useTimelineStore'

// Fix default Leaflet marker icons (broken in bundlers).
// This app uses custom divIcon markers exclusively, so default icons are unused —
// but we suppress the broken-image error by clearing the defaults.
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '',
  iconUrl: '',
  shadowUrl: '',
})

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const GEOCODE_CACHE_KEY = 'timeliner_geocode_cache'

/** Load geocode cache from localStorage */
function loadCache() {
  try {
    return JSON.parse(localStorage.getItem(GEOCODE_CACHE_KEY) || '{}')
  } catch {
    return {}
  }
}

/** Save geocode cache to localStorage */
function saveCache(cache) {
  try {
    localStorage.setItem(GEOCODE_CACHE_KEY, JSON.stringify(cache))
  } catch {}
}

/** Geocode a location string → { lat, lng } or null */
async function geocodeLocation(location, cache) {
  if (!location) return null
  const key = location.toLowerCase().trim()
  if (cache[key]) return cache[key]

  try {
    const params = new URLSearchParams({ q: location, format: 'json', limit: '1' })
    const res = await fetch(`${NOMINATIM_URL}?${params}`, {
      headers: { 'Accept-Language': 'en' },
    })
    if (!res.ok) return null
    const data = await res.json()
    if (data.length === 0) return null
    const result = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
    cache[key] = result
    saveCache(cache)
    return result
  } catch {
    return null
  }
}

/** Create a colored circular marker icon with optional count badge */
function createMarkerIcon(color, count = 1) {
  if (count <= 1) {
    return L.divIcon({
      className: 'custom-map-marker',
      html: `<div style="
        width: 24px; height: 24px; border-radius: 50%;
        background: ${color}; border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12],
      popupAnchor: [0, -14],
    })
  }
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="
      position: relative; width: 32px; height: 32px; border-radius: 50%;
      background: ${color}; border: 3px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      color: white; font-size: 11px; font-weight: 700;
      line-height: 1;
    ">${count}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18],
  })
}

/** Component to fit map bounds to markers */
function FitBounds({ positions }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length === 0) return
    if (positions.length === 1) {
      map.setView(positions[0], 6)
    } else {
      const bounds = L.latLngBounds(positions)
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 12 })
    }
  }, [positions, map])
  return null
}

function PopupContent({ events: popupEvents }) {
  const [idx, setIdx] = useState(0)
  const evt = popupEvents[idx]
  const total = popupEvents.length

  if (total === 1) {
    return (
      <div className="min-w-[180px]">
        <p className="font-semibold text-sm text-text-strong mb-0.5">{evt.title}</p>
        <p className="text-xs text-text-muted">{formatEventDate(evt)}</p>
        {evt.location && (
          <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
            <MapPin size={10} />
            {evt.location}
          </p>
        )}
        {evt.people?.length > 0 && (
          <p className="text-xs text-text-muted mt-0.5">{evt.people.join(', ')}</p>
        )}
        {evt.description && (
          <p className="text-xs text-text-muted mt-1 line-clamp-2">{evt.description}</p>
        )}
      </div>
    )
  }

  return (
    <div className="min-w-[200px]">
      <div className="flex items-center justify-between mb-2">
        <p className="text-[10px] font-semibold text-text-muted uppercase tracking-wider">
          {evt.location} &middot; {total} events
        </p>
      </div>
      <div>
        <p className="font-semibold text-sm text-text-strong mb-0.5">{evt.title}</p>
        <p className="text-xs text-text-muted">{formatEventDate(evt)}</p>
        {evt.people?.length > 0 && (
          <p className="text-xs text-text-muted mt-0.5">{evt.people.join(', ')}</p>
        )}
        {evt.description && (
          <p className="text-xs text-text-muted mt-1 line-clamp-2">{evt.description}</p>
        )}
      </div>
      <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100">
        <button
          onClick={(e) => { e.stopPropagation(); setIdx((i) => Math.max(0, i - 1)) }}
          disabled={idx === 0}
          className={`rounded p-0.5 transition-colors ${idx === 0 ? 'text-gray-200' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100 cursor-pointer'}`}
        >
          <ChevronLeft size={14} />
        </button>
        <span className="text-[11px] text-text-muted tabular-nums">{idx + 1} / {total}</span>
        <button
          onClick={(e) => { e.stopPropagation(); setIdx((i) => Math.min(total - 1, i + 1)) }}
          disabled={idx === total - 1}
          className={`rounded p-0.5 transition-colors ${idx === total - 1 ? 'text-gray-200' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100 cursor-pointer'}`}
        >
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  )
}

function MapView({ events }) {
  const darkMode = useTimelineStore((s) => s.darkMode)
  const [geocoded, setGeocoded] = useState([]) // [{ event, lat, lng }]
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [noLocations, setNoLocations] = useState(false)
  const cacheRef = useRef(loadCache())

  // Events that have location data
  const eventsWithLocation = events.filter((e) => e.location)

  // Deduplicate locations so "New York" is geocoded once, not per-event
  const uniqueLocations = (() => {
    const map = new Map()
    for (const evt of eventsWithLocation) {
      const key = evt.location.toLowerCase().trim()
      if (!map.has(key)) map.set(key, evt.location)
    }
    return [...map.values()]
  })()

  // Geocode unique locations, then map results back to events progressively
  useEffect(() => {
    if (eventsWithLocation.length === 0) {
      setNoLocations(true)
      setGeocoded([])
      return
    }
    setNoLocations(false)

    let cancelled = false
    setLoading(true)
    setProgress(0)
    setGeocoded([])

    const geocodeAll = async () => {
      // Phase 1: geocode each unique location string
      const coordsByKey = {}
      for (let i = 0; i < uniqueLocations.length; i++) {
        if (cancelled) return
        const loc = uniqueLocations[i]
        const key = loc.toLowerCase().trim()
        const isCached = !!cacheRef.current[key]
        const coords = await geocodeLocation(loc, cacheRef.current)
        if (coords) coordsByKey[key] = coords
        if (!cancelled) setProgress(i + 1)
        // Nominatim rate limit: max 1 req/sec for uncached
        if (!isCached && i < uniqueLocations.length - 1) {
          await new Promise((r) => setTimeout(r, 1100))
        }
      }

      if (cancelled) return

      // Phase 2: map all events to their geocoded coordinates
      const results = []
      for (const evt of eventsWithLocation) {
        const key = evt.location.toLowerCase().trim()
        const coords = coordsByKey[key]
        if (coords) results.push({ event: evt, ...coords })
      }
      setGeocoded(results)
      setLoading(false)
    }

    geocodeAll()
    return () => { cancelled = true }
  }, [eventsWithLocation, uniqueLocations])

  const positions = geocoded.map((g) => [g.lat, g.lng])

  if (noLocations) {
    return (
      <EmptyState
        icon={MapPin}
        title="No events with locations"
        description="Add locations to your events to see them on the map."
        hint="Edit an event and use the location field to add a place."
      />
    )
  }

  return (
    <div className="space-y-3">
      {loading && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Loader2 size={14} className="animate-spin" />
          <span>Geocoding locations... {progress} of {uniqueLocations.length}</span>
        </div>
      )}

      <div className="rounded-xl border border-gray-200/60 overflow-hidden" style={{ height: 500 }}>
        <MapContainer
          center={[20, 0]}
          zoom={2}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom
          zoomControl
        >
          {/* key forces a tile remount on theme switch — Leaflet doesn't re-render on url change */}
          {darkMode ? (
            <TileLayer
              key="dark"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
          ) : (
            <TileLayer
              key="light"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          )}

          {/* Group events by location coordinate so co-located events share a marker */}
          {(() => {
            const groups = new Map()
            for (const g of geocoded) {
              const key = `${g.lat.toFixed(5)},${g.lng.toFixed(5)}`
              if (!groups.has(key)) groups.set(key, { lat: g.lat, lng: g.lng, events: [] })
              groups.get(key).events.push(g.event)
            }
            return [...groups.values()].map((group) => {
              const firstEvent = group.events[0]
              const palette = getTagPalette(firstEvent.tags?.[0] || 'general')
              const icon = createMarkerIcon(palette.activeBg, group.events.length)
              return (
                <Marker
                  key={`${group.lat},${group.lng}`}
                  position={[group.lat, group.lng]}
                  icon={icon}
                >
                  <Popup>
                    <PopupContent events={group.events} />
                  </Popup>
                </Marker>
              )
            })
          })()}

          {positions.length > 0 && <FitBounds positions={positions} />}
        </MapContainer>
      </div>

      {!loading && geocoded.length > 0 && (
        <p className="text-[11px] text-gray-400">
          {geocoded.length} of {eventsWithLocation.length} location{eventsWithLocation.length !== 1 ? 's' : ''} mapped
        </p>
      )}
    </div>
  )
}

export default MapView
