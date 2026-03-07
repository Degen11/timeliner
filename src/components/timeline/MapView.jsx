import { memo, useMemo, useState, useEffect, useRef, useCallback } from 'react'
import { MapPin, Loader2 } from 'lucide-react'
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

/** Create a colored circular marker icon */
function createMarkerIcon(color) {
  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="
      width: 14px; height: 14px; border-radius: 50%;
      background: ${color}; border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10],
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

          {geocoded.map((g) => {
            const palette = getTagPalette(g.event.tags?.[0] || 'general')
            const icon = createMarkerIcon(palette.activeBg)

            return (
              <Marker
                key={g.event.id}
                position={[g.lat, g.lng]}
                icon={icon}
              >
                <Popup>
                  <div className="min-w-[180px]">
                    <p className="font-semibold text-sm text-text-strong mb-0.5">{g.event.title}</p>
                    <p className="text-xs text-text-muted">{formatEventDate(g.event)}</p>
                    {g.event.location && (
                      <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                        <MapPin size={10} />
                        {g.event.location}
                      </p>
                    )}
                    {g.event.people?.length > 0 && (
                      <p className="text-xs text-text-muted mt-0.5">
                        {g.event.people.join(', ')}
                      </p>
                    )}
                    {g.event.description && (
                      <p className="text-xs text-text-muted mt-1 line-clamp-2">
                        {g.event.description}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          })}

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
