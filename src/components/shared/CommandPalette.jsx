import { useState, useEffect, useRef } from 'react'
import {
  Search,
  List,
  GripHorizontal,
  LayoutGrid,
  MapPin,
  GitBranch,
  Plus,
  Type,
  Image,
  Sparkles,
  Moon,
  Sun,
  HelpCircle,
  FilterX,
  CalendarDays,
  FileText,
} from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import AnimatedModal from '@/components/shared/AnimatedModal'
import { VIEWS } from '@/utils/constants'
import { formatEventDateShort, safeGetUTCYear } from '@/utils/dateUtils'

const MAX_EVENT_RESULTS = 6

/**
 * Cmd+K command palette: switch views, run actions, jump to a year, or find
 * an event by title (opens its detail view).
 */
export default function CommandPalette({
  open,
  onClose,
  events,
  onAddEvent,
  onImportText,
  onOpenPhotos,
  onOpenInsights,
  onShowShortcuts,
}) {
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)
  const listRef = useRef(null)

  const darkMode = useTimelineStore((s) => s.darkMode)
  const hasActiveFilters = useTimelineStore(
    (s) => !!s.filters.search || s.filters.people.length > 0 || s.filters.tags.length > 0
  )

  // Reset on open/close
  useEffect(() => {
    if (!open) return
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset transient palette state each time it opens
    setQuery('')
    setHighlighted(0)
  }, [open])

  const items = open ? buildItems() : []

  function buildItems() {
    const store = useTimelineStore.getState()
    const q = query.trim().toLowerCase()

    const views = [
      { icon: List, label: 'Vertical view', keywords: 'view vertical timeline', run: () => store.setActiveView(VIEWS.VERTICAL) },
      { icon: GripHorizontal, label: 'Horizontal view', keywords: 'view horizontal axis', run: () => store.setActiveView(VIEWS.HORIZONTAL) },
      { icon: LayoutGrid, label: 'Grid view', keywords: 'view grid cards', run: () => store.setActiveView(VIEWS.GRID) },
      { icon: MapPin, label: 'Map view', keywords: 'view map locations', run: () => store.setActiveView(VIEWS.MAP) },
      { icon: GitBranch, label: 'Graph view', keywords: 'view graph people connections', run: () => store.setActiveView(VIEWS.GRAPH) },
    ].map((it) => ({ ...it, section: 'Views' }))

    const actions = [
      { icon: Plus, label: 'Add event', keywords: 'new create', run: onAddEvent },
      { icon: Type, label: 'Import text', keywords: 'paste parse ai', run: onImportText },
      { icon: Image, label: 'Photo library', keywords: 'photos images', run: onOpenPhotos },
      { icon: Sparkles, label: 'Open insights', keywords: 'ai analysis', run: onOpenInsights },
      {
        icon: darkMode ? Sun : Moon,
        label: darkMode ? 'Switch to light mode' : 'Switch to dark mode',
        keywords: 'theme dark light toggle',
        run: () => store.toggleDarkMode(),
      },
      ...(hasActiveFilters
        ? [{ icon: FilterX, label: 'Clear all filters', keywords: 'reset filters', run: () => store.clearFilters() }]
        : []),
      { icon: HelpCircle, label: 'Help & shortcuts', keywords: 'keyboard help', run: onShowShortcuts },
    ].map((it) => ({ ...it, section: 'Actions' }))

    const years = [...new Set(events.map((e) => safeGetUTCYear(e.dateStart, null)).filter((y) => y != null))]
      .sort((a, b) => a - b)
      .map((year) => ({
        section: 'Jump to year',
        icon: CalendarDays,
        label: String(year),
        keywords: `jump year ${year}`,
        serif: true,
        run: () => {
          store.setActiveView(VIEWS.VERTICAL)
          store.requestYearJump(year)
        },
      }))

    const eventItems =
      q.length >= 2
        ? events
            .filter((e) => e.title?.toLowerCase().includes(q))
            .slice(0, MAX_EVENT_RESULTS)
            .map((e) => ({
              section: 'Events',
              icon: FileText,
              label: e.title,
              sub: formatEventDateShort(e),
              keywords: '',
              run: () => store.openEventDetail(e),
            }))
        : []

    const all = [...eventItems, ...views, ...actions, ...years]
    if (!q) {
      // Untyped: hide the (long) year list down to a taste of recent years
      return [...views, ...actions, ...years.slice(-5)]
    }
    return all.filter((it) => it.section === 'Events' || `${it.label} ${it.keywords}`.toLowerCase().includes(q))
  }

  const execute = (item) => {
    onClose()
    // Let the modal close before actions that open other modals
    requestAnimationFrame(() => item.run?.())
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, items.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlighted((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (items[highlighted]) execute(items[highlighted])
    }
  }

  // Keep the highlighted row in view
  useEffect(() => {
    listRef.current
      ?.querySelector(`[data-cmd-index="${highlighted}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [highlighted])

  const clampedHighlight = Math.min(highlighted, Math.max(items.length - 1, 0))

  let lastSection = null

  return (
    <AnimatedModal
      open={open}
      onClose={onClose}
      label="Command palette"
      className="bg-surface rounded-2xl shadow-2xl max-w-xl w-full mx-4 overflow-hidden modal-surface"
    >
      <div className="flex items-center gap-2.5 px-4 py-3 border-b border-gray-200">
        <Search size={16} className="text-text-muted shrink-0" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setHighlighted(0)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search events, views, actions, or a year…"
          aria-label="Command palette search"
          className="flex-1 bg-transparent text-base text-text-strong placeholder:text-text-muted focus:outline-none"
        />
        <kbd className="hidden sm:inline-flex items-center rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] font-mono text-text-muted border border-gray-200">
          Esc
        </kbd>
      </div>

      <div ref={listRef} className="max-h-80 overflow-y-auto app-scroll py-2">
        {items.length === 0 ? (
          <p className="px-4 py-6 text-sm text-text-muted text-center">No matches for &ldquo;{query}&rdquo;</p>
        ) : (
          items.map((item, i) => {
            const showHeader = item.section !== lastSection
            lastSection = item.section
            const Icon = item.icon
            return (
              <div key={`${item.section}-${item.label}-${i}`}>
                {showHeader && (
                  <p className="px-4 pt-2 pb-1 text-[10px] font-semibold text-text-muted uppercase tracking-wider">
                    {item.section}
                  </p>
                )}
                <button
                  type="button"
                  data-cmd-index={i}
                  onClick={() => execute(item)}
                  onMouseEnter={() => setHighlighted(i)}
                  className={`flex items-center gap-2.5 w-full px-4 py-2 text-left text-sm cursor-pointer transition-colors duration-100 ${
                    i === clampedHighlight ? 'bg-surface-raised text-text-strong' : 'text-text-default'
                  }`}
                >
                  <Icon size={15} className={i === clampedHighlight ? 'text-highlight shrink-0' : 'text-text-muted shrink-0'} />
                  <span className={`flex-1 truncate ${item.serif ? 'font-serif tabular-nums' : ''}`}>{item.label}</span>
                  {item.sub && (
                    <span className="font-serif text-xs text-text-muted tabular-nums shrink-0">{item.sub}</span>
                  )}
                </button>
              </div>
            )
          })
        )}
      </div>
    </AnimatedModal>
  )
}
