import { memo, useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { formatEventDate } from '@/utils/dateUtils'
import { getTagPalette } from '@/utils/constants'

// Fix default Leaflet marker icons (broken in bundlers)
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
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

const MapView = memo(function MapView({ events }) {
  const [geocoded, setGeocoded] = useState([]) // [{ event, lat, lng }]
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [noLocations, setNoLocations] = useState(false)
  const cacheRef = useRef(loadCache())

  // Events that have location data
  const eventsWithLocation = useMemo(
    () => events.filter((e) => e.location),
    [events]
  )

  // Geocode all locations — results appear progressively
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
      const results = []
      for (let i = 0; i < eventsWithLocation.length; i++) {
        if (cancelled) return
        const evt = eventsWithLocation[i]
        // Check cache before requesting — delay only for uncached locations
        const isCached = !!cacheRef.current[evt.location.toLowerCase().trim()]
        const coords = await geocodeLocation(evt.location, cacheRef.current)
        if (coords && !cancelled) {
          results.push({ event: evt, ...coords })
          setGeocoded([...results])
        }
        if (!cancelled) setProgress(i + 1)
        // Nominatim rate limit: max 1 req/sec for uncached
        if (!isCached && i < eventsWithLocation.length - 1) {
          await new Promise((r) => setTimeout(r, 1100))
        }
      }
      if (!cancelled) setLoading(false)
    }

    geocodeAll()
    return () => { cancelled = true }
  }, [eventsWithLocation])

  const positions = useMemo(
    () => geocoded.map((g) => [g.lat, g.lng]),
    [geocoded]
  )

  if (noLocations) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <MapPin size={32} className="mb-3 text-gray-300" />
        <p className="text-sm font-medium">No events with locations</p>
        <p className="text-xs text-gray-400 mt-1">Add locations to your events to see them on the map</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {loading && (
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <Loader2 size={14} className="animate-spin" />
          <span>Geocoding locations... {progress} of {eventsWithLocation.length}</span>
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
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

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
})

export default MapView
