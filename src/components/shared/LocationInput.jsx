import { useState, useRef, useCallback, useEffect } from 'react'
import { MapPin, X, Loader2 } from 'lucide-react'

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search'
const DEBOUNCE_MS = 350
const MIN_QUERY_LENGTH = 3

/**
 * LocationInput — Autocomplete location input powered by OpenStreetMap Nominatim.
 * Shows suggestions as user types, with debounced API calls.
 *
 * @param {string} value - Current location string
 * @param {function} onChange - Callback with new location string
 * @param {string} [placeholder] - Input placeholder
 * @param {string} [className] - Additional class names for the input
 * @param {boolean} [dark] - Dark mode variant
 * @param {boolean} [compact] - Compact inline variant (no label, smaller)
 */
export default function LocationInput({
  value = '',
  onChange,
  placeholder = 'Add location...',
  className = '',
  dark = false,
  compact = false,
}) {
  const [query, setQuery] = useState(value)
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const debounceRef = useRef(null)
  const abortRef = useRef(null)
  const inputRef = useRef(null)
  const containerRef = useRef(null)

  // Sync external value changes
  useEffect(() => {
    setQuery(value)
  }, [value])

  const fetchSuggestions = useCallback(async (q) => {
    if (q.length < MIN_QUERY_LENGTH) {
      setSuggestions([])
      setLoading(false)
      return
    }

    // Abort previous request
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    setLoading(true)
    try {
      const params = new URLSearchParams({
        q,
        format: 'json',
        addressdetails: '1',
        limit: '5',
      })
      const res = await fetch(`${NOMINATIM_URL}?${params}`, {
        signal: controller.signal,
        headers: { 'Accept-Language': 'en' },
      })
      if (!res.ok) throw new Error('Nominatim request failed')
      const data = await res.json()
      const items = data.map((item) => ({
        id: item.place_id,
        display: item.display_name,
        // Shortened display: city, state, country
        short: formatShortLocation(item),
        lat: item.lat,
        lon: item.lon,
      }))
      setSuggestions(items)
      setOpen(items.length > 0)
      setActiveIdx(-1)
    } catch (err) {
      if (err.name !== 'AbortError') {
        setSuggestions([])
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = useCallback(
    (e) => {
      const val = e.target.value
      setQuery(val)
      clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => fetchSuggestions(val), DEBOUNCE_MS)
    },
    [fetchSuggestions]
  )

  const acceptSuggestion = useCallback(
    (suggestion) => {
      setQuery(suggestion.short)
      onChange(suggestion.short)
      setSuggestions([])
      setOpen(false)
      setActiveIdx(-1)
    },
    [onChange]
  )

  const handleKeyDown = useCallback(
    (e) => {
      if (!open || suggestions.length === 0) {
        if (e.key === 'Enter') {
          e.preventDefault()
          onChange(query)
          inputRef.current?.blur()
        }
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIdx((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (activeIdx >= 0) {
          acceptSuggestion(suggestions[activeIdx])
        } else {
          onChange(query)
          setOpen(false)
          inputRef.current?.blur()
        }
      } else if (e.key === 'Escape') {
        setOpen(false)
        setActiveIdx(-1)
      }
    },
    [open, suggestions, activeIdx, acceptSuggestion, onChange, query]
  )

  const handleBlur = useCallback(() => {
    // Delay to allow click on suggestion
    setTimeout(() => {
      setOpen(false)
      if (query !== value) {
        onChange(query)
      }
    }, 200)
  }, [query, value, onChange])

  const handleClear = useCallback(() => {
    setQuery('')
    onChange('')
    setSuggestions([])
    setOpen(false)
    inputRef.current?.focus()
  }, [onChange])

  useEffect(() => {
    return () => {
      clearTimeout(debounceRef.current)
      abortRef.current?.abort()
    }
  }, [])

  const inputCls = compact
    ? `w-full text-xs px-2 py-1 rounded-md border bg-transparent transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/20 ${
        dark
          ? 'border-sidebar-input-border text-sidebar-text placeholder-sidebar-muted focus:border-secondary'
          : 'border-gray-200 text-gray-700 placeholder-gray-400 focus:border-secondary'
      } ${className}`
    : `w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary/20 edit-field-input ${
        dark
          ? 'border-sidebar-input-border bg-sidebar-input text-sidebar-text placeholder-sidebar-muted focus:border-secondary'
          : 'text-text-default focus:border-secondary'
      } ${className}`

  const locationBorderStyle = dark ? {} : { border: '1px solid var(--color-gray-400)' }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <MapPin
          size={compact ? 12 : 14}
          className={`absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none ${
            dark ? 'text-sidebar-muted' : 'text-gray-400'
          }`}
        />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className={inputCls}
          style={{ paddingLeft: compact ? '1.5rem' : '2rem', ...(!dark && !compact ? locationBorderStyle : {}) }}
          autoComplete="off"
        />
        {loading && (
          <Loader2
            size={compact ? 12 : 14}
            className={`absolute right-2 top-1/2 -translate-y-1/2 animate-spin ${
              dark ? 'text-sidebar-muted' : 'text-gray-400'
            }`}
          />
        )}
        {!loading && query && (
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleClear}
            className={`absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 cursor-pointer transition-colors ${
              dark ? 'text-sidebar-muted hover:text-sidebar-text' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <X size={compact ? 10 : 12} />
          </button>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div
          className={`absolute z-30 left-0 right-0 mt-1 rounded-lg border shadow-lg py-1 max-h-48 overflow-y-auto ${
            dark
              ? 'bg-sidebar-surface border-sidebar-border'
              : 'bg-white border-gray-200'
          }`}
        >
          {suggestions.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => acceptSuggestion(s)}
              className={`w-full text-left px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                i === activeIdx
                  ? dark
                    ? 'bg-sidebar-hover text-sidebar-text'
                    : 'bg-secondary/10 text-secondary'
                  : dark
                    ? 'text-sidebar-text hover:bg-sidebar-hover'
                    : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center gap-2">
                <MapPin size={12} className={dark ? 'text-sidebar-muted' : 'text-gray-400'} />
                <span className="truncate">{s.short}</span>
              </span>
              {s.short !== s.display && (
                <p className={`text-[10px] ml-5 mt-0.5 truncate ${dark ? 'text-sidebar-muted' : 'text-gray-400'}`}>
                  {s.display}
                </p>
              )}
            </button>
          ))}
          <p className={`text-[9px] px-3 py-1 ${dark ? 'text-sidebar-muted' : 'text-gray-400'}`}>
            Powered by OpenStreetMap
          </p>
        </div>
      )}
    </div>
  )
}

/** Format a Nominatim result into a shorter display string */
function formatShortLocation(item) {
  const addr = item.address || {}
  const parts = []

  // City or town or village
  const city = addr.city || addr.town || addr.village || addr.municipality || addr.hamlet
  if (city) parts.push(city)

  // State or region
  const state = addr.state || addr.region || addr.county
  if (state && state !== city) parts.push(state)

  // Country
  if (addr.country && addr.country !== city) parts.push(addr.country)

  return parts.length > 0 ? parts.join(', ') : item.display_name
}
