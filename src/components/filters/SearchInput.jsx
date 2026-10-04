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

const INPUT_VARIANTS = {
  // Sidebar: quiet filled field
  filled:
    'h-10 border-transparent bg-soft-accent dark:bg-sidebar-input hover:bg-gray-100 focus:bg-surface focus:border-secondary',
  // Mobile header: white field on the canvas
  outlined: 'h-11 border-gray-200 bg-surface focus:border-secondary',
}

export default function SearchInput({
  value,
  onChange,
  variant = 'filled',
  placeholder = 'Search events',
  shortcutHint = null,
  // Only one mounted instance should answer the global "/" focus request
  listenForFocusRequests = true,
}) {
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
    if (listenForFocusRequests && searchFocusCounter > 0) {
      inputRef.current?.focus()
      clearSearchFocusRequest()
    }
  }, [listenForFocusRequests, searchFocusCounter, clearSearchFocusRequest])

  // Sync local value when parent value changes (e.g. clear from outside).
  // Done during render via the previous-value pattern rather than an effect so
  // the input never flashes a stale value for a frame.
  const [prevValue, setPrevValue] = useState(value)
  if (value !== prevValue) {
    setPrevValue(value)
    setLocalValue(value)
  }

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
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
        aria-hidden="true"
      />
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        aria-label="Search events"
        className={`w-full rounded-[10px] border pl-9 pr-9 text-base sm:text-sm text-text-strong placeholder:text-text-muted focus:ring-2 focus:ring-secondary/15 focus:outline-none transition-colors duration-150 ${INPUT_VARIANTS[variant]}`}
      />
      {shortcutHint && !localValue && !focused && (
        <kbd
          className="hidden lg:inline-flex absolute right-2.5 top-1/2 -translate-y-1/2 items-center rounded-[5px] border border-gray-300 bg-surface px-1.5 font-sans text-[11px] leading-[18px] text-text-muted pointer-events-none"
          aria-hidden="true"
        >
          {shortcutHint}
        </kbd>
      )}
      {localValue && (
        <button
          onClick={() => { setLocalValue(''); flushDebounce('') }}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-text-muted hover:text-text-default transition-colors cursor-pointer"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
      {showHistory && (
        <div
          className="absolute z-20 left-0 right-0 mt-1 rounded-lg border border-gray-200 bg-surface shadow-lg py-1 max-h-52 overflow-y-auto"
        >
          <div
            className="px-3 py-1.5 text-xs font-medium uppercase tracking-wider text-text-muted"
          >
            Recent searches
          </div>
          {history.map((term) => (
            <button
              key={term}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => selectHistoryItem(term)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-sm cursor-pointer transition-colors duration-150 text-text-default hover:bg-surface-raised"
            >
              <Clock size={12} className="text-text-muted" />
              <span className="flex-1 text-left truncate">{term}</span>
              <span
                role="button"
                tabIndex={0}
                onMouseDown={(e) => e.preventDefault()}
                onClick={(e) => removeHistoryItem(term, e)}
                className="rounded p-0.5 transition-colors text-text-muted hover:text-text-default"
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
