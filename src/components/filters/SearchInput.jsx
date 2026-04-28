import { useState, useRef, useEffect } from 'react'
import { Search, X, Clock } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'

const HISTORY_KEY = 'timeliner_search_history'
const MAX_HISTORY = 8
const SEARCH_DEBOUNCE_MS = 250

function loadHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || []
  } catch {
    return []
  }
}

function saveHistory(history) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, MAX_HISTORY)))
  } catch {
    /* quota exceeded — non-critical */
  }
}

export default function SearchInput({ value, onChange, dark = false }) {
  const [focused, setFocused] = useState(false)
  const [localValue, setLocalValue] = useState(value)
  const [history, setHistory] = useState(loadHistory)
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const debounceRef = useRef(null)

  const searchFocusCounter = useTimelineStore((s) => s.searchFocusCounter)
  const clearSearchFocusRequest = useTimelineStore((s) => s.clearSearchFocusRequest)

  // Focus when the global requestSearchFocus() is called, then clear the request.
  // Works for both: already-mounted sidebar (counter change) and newly-mounted
  // sidebar after expand animation (pending counter > 0 detected on mount).
  useEffect(() => {
    if (searchFocusCounter > 0) {
      inputRef.current?.focus()
      clearSearchFocusRequest()
    }
  }, [searchFocusCounter, clearSearchFocusRequest])

  // Sync local value when parent value changes (e.g. clear from outside)
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  const showHistory = focused && !localValue && history.length > 0

  const commitSearch = (term) => {
    const trimmed = term.trim()
    if (!trimmed) return
    const updated = [trimmed, ...history.filter((h) => h !== trimmed)].slice(0, MAX_HISTORY)
    setHistory(updated)
    saveHistory(updated)
  }

  const handleChange = (e) => {
    const val = e.target.value
    setLocalValue(val)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => onChange(val), SEARCH_DEBOUNCE_MS)
  }

  const flushDebounce = (val) => {
    clearTimeout(debounceRef.current)
    onChange(val)
  }

  const handleBlur = () => {
    // Delay to allow click on history item
    setTimeout(() => {
      if (containerRef.current && !containerRef.current.contains(document.activeElement)) {
        setFocused(false)
        if (localValue.trim()) {
          commitSearch(localValue)
          flushDebounce(localValue)
        }
      }
    }, 150)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      inputRef.current?.blur()
      return
    }
    if (e.key === 'Enter' && localValue.trim()) {
      commitSearch(localValue)
      flushDebounce(localValue)
      inputRef.current?.blur()
    }
  }

  const selectHistoryItem = (term) => {
    setLocalValue(term)
    flushDebounce(term)
    setFocused(false)
    inputRef.current?.blur()
  }

  const removeHistoryItem = (term, e) => {
    e.stopPropagation()
    const updated = history.filter((h) => h !== term)
    setHistory(updated)
    saveHistory(updated)
  }

  return (
    <div className="relative" ref={containerRef}>
      <Search
        size={14}
        className={`absolute left-3 top-1/2 -translate-y-1/2 ${dark ? 'text-sidebar-muted' : 'text-gray-400'}`}
      />
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Search events…"
        aria-label="Search events"
        className={
          dark
            ? 'w-full rounded-lg border border-sidebar-input-border bg-sidebar-input py-2 pl-9 pr-8 text-sm text-sidebar-text placeholder:text-sidebar-muted focus:border-secondary focus:ring-2 focus:ring-secondary/15 focus:outline-none transition-colors duration-150'
            : 'w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-8 text-sm text-text-default placeholder:text-text-muted focus:border-secondary focus:ring-2 focus:ring-secondary/15 focus:outline-none transition-colors duration-150'
        }
      />
      {localValue && (
        <button
          onClick={() => { setLocalValue(''); flushDebounce('') }}
          className={`absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 transition-colors cursor-pointer ${
            dark
              ? 'text-sidebar-muted hover:text-sidebar-text'
              : 'text-text-muted hover:text-text-default'
          }`}
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
      {showHistory && (
        <div
          className={`absolute z-20 left-0 right-0 mt-1 rounded-lg border shadow-lg py-1 max-h-52 overflow-y-auto ${
            dark
              ? 'bg-sidebar-surface border-sidebar-border'
              : 'bg-white border-gray-200'
          }`}
        >
          <div
            className={`px-3 py-1.5 text-xs font-medium uppercase tracking-wider ${
              dark ? 'text-sidebar-muted' : 'text-text-muted'
            }`}
          >
            Recent searches
          </div>
          {history.map((term) => (
            <button
              key={term}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectHistoryItem(term)}
              className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer transition-colors duration-150 ${
                dark
                  ? 'text-sidebar-text hover:bg-sidebar-hover'
                  : 'text-text-default hover:bg-surface-raised'
              }`}
            >
              <Clock size={12} className={dark ? 'text-sidebar-muted' : 'text-text-muted'} />
              <span className="flex-1 text-left truncate">{term}</span>
              <span
                role="button"
                tabIndex={0}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => removeHistoryItem(term, e)}
                className={`rounded p-0.5 transition-colors ${
                  dark
                    ? 'text-sidebar-muted hover:text-sidebar-text'
                    : 'text-text-muted hover:text-text-default'
                }`}
                aria-label={`Remove "${term}" from history`}
              >
                <X size={12} />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
