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
} from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import AnimatedModal from '@/components/shared/AnimatedModal'
import { searchTimeline } from '@/store/selectors'
import { VIEWS, PALETTE_GROUP_MAX, getEventColor } from '@/utils/constants'
import { formatEventDateShort, safeGetUTCYear } from '@/utils/dateUtils'
import { pluralize } from '@/utils/ui'

const RECENT_SHOWN = 3
const YEAR_RESULTS_MAX = 5

// "Hermann Einstein" → "HE"
const initials = (name) =>
  name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('')

// Bold the first case-insensitive occurrence of the query
function Highlight({ text, query }) {
  const q = query.trim().toLowerCase()
  const i = q ? text.toLowerCase().indexOf(q) : -1
  if (i < 0) return text
  return (
    <>
      {text.slice(0, i)}
      <strong className="font-semibold text-text-strong">{text.slice(i, i + q.length)}</strong>
      {text.slice(i + q.length)}
    </>
  )
}

function Kbd({ children }) {
  return (
    <kbd className="inline-flex min-w-[1.25rem] items-center justify-center rounded-[5px] border border-gray-300 bg-surface px-1.5 font-sans text-[11px] leading-[18px] text-text-default">
      {children}
    </kbd>
  )
}

const EVENT_DETAIL_PREFIX = { people: 'with ', location: 'in ', tags: 'tagged ' }

/**
 * Cmd+K command palette. Empty: recently opened events, the views and the
 * main actions with their shortcuts. Typing searches people, places and events
 * (title, people, place, tags, description), jumps to a year, and filters the
 * views and actions.
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
  const recentEventIds = useTimelineStore((s) => s.recentEventIds)
  const hasActiveFilters = useTimelineStore(
    (s) =>
      !!s.filters.search ||
      s.filters.people.length > 0 ||
      s.filters.tags.length > 0 ||
      !!s.filters.dateFrom ||
      !!s.filters.dateTo
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
      { icon: List, label: 'Vertical', keywords: 'view vertical timeline', kbd: '1', run: () => store.setActiveView(VIEWS.VERTICAL) },
      { icon: GripHorizontal, label: 'Horizontal', keywords: 'view horizontal axis', kbd: '2', run: () => store.setActiveView(VIEWS.HORIZONTAL) },
      { icon: LayoutGrid, label: 'Grid', keywords: 'view grid cards', kbd: '3', run: () => store.setActiveView(VIEWS.GRID) },
      { icon: MapPin, label: 'Map', keywords: 'view map locations', kbd: '4', run: () => store.setActiveView(VIEWS.MAP) },
      { icon: GitBranch, label: 'Graph', keywords: 'view graph people connections', kbd: '5', run: () => store.setActiveView(VIEWS.GRAPH) },
    ].map((it) => ({ ...it, key: `view-${it.label}`, section: 'Go to', kind: q ? 'row' : 'tile', label: q ? `${it.label} view` : it.label }))

    const actions = [
      { icon: Plus, label: 'Add event', keywords: 'new create', kbd: 'N', run: onAddEvent },
      { icon: Type, label: 'Import text', keywords: 'paste parse ai upload file', run: onImportText },
      { icon: Sparkles, label: 'Open insights', keywords: 'ai analysis gaps', kbd: 'I', run: onOpenInsights },
      { icon: Image, label: 'Photo library', keywords: 'photos images', run: onOpenPhotos },
      {
        icon: darkMode ? Sun : Moon,
        label: darkMode ? 'Switch to light mode' : 'Switch to dark mode',
        keywords: 'theme dark light toggle',
        run: () => store.toggleDarkMode(),
      },
      ...(hasActiveFilters
        ? [{ icon: FilterX, label: 'Clear all filters', keywords: 'reset filters', run: () => store.clearFilters() }]
        : []),
      { icon: HelpCircle, label: 'Help & shortcuts', keywords: 'keyboard help', kbd: '?', run: onShowShortcuts },
    ].map((it) => ({ ...it, key: `action-${it.label}`, section: 'Actions', kind: 'row' }))

    const eventRow = (e, extra = {}) => ({
      key: `event-${e.id}`,
      kind: 'event',
      event: e,
      label: e.title,
      sub: formatEventDateShort(e),
      run: () => store.openEventDetail(e),
      ...extra,
    })

    if (!q) {
      const recent = recentEventIds
        .map((id) => events.find((e) => e.id === id))
        .filter(Boolean)
        .slice(0, RECENT_SHOWN)
        .map((e) => eventRow(e, { section: 'Recently opened' }))
      return [...recent, ...views, ...actions]
    }

    const years = [...new Set(events.map((e) => safeGetUTCYear(e.dateStart, null)).filter((y) => y != null))].sort(
      (a, b) => a - b
    )
    const yearItems = (/^\d{1,4}$/.test(q) ? years.filter((y) => String(y).startsWith(q)) : [])
      .slice(0, YEAR_RESULTS_MAX)
      .map((year) => ({
        key: `year-${year}`,
        section: 'Jump to year',
        kind: 'row',
        icon: CalendarDays,
        label: String(year),
        serif: true,
        run: () => {
          store.setActiveView(VIEWS.VERTICAL)
          store.requestYearJump(year)
        },
      }))

    const found = searchTimeline(events, q, PALETTE_GROUP_MAX)
    const filterTo = (patch) => () => store.setFilters({ ...useTimelineStore.getState().filters, ...patch })

    const people = found.people.map(({ name, count }) => ({
      key: `person-${name}`,
      section: 'People',
      kind: 'person',
      label: name,
      sub: pluralize(count, 'event'),
      hint: 'Filter',
      run: filterTo({ people: [name] }),
    }))
    const places = found.places.map(({ name, count }) => ({
      key: `place-${name}`,
      section: 'Places',
      kind: 'row',
      icon: MapPin,
      label: name,
      sub: pluralize(count, 'event'),
      hint: 'Filter',
      run: filterTo({ search: name }),
    }))
    const eventItems = found.events.map(({ event, match, detail }) =>
      eventRow(event, {
        section: 'Events',
        detail: match === 'title' ? null : `${EVENT_DETAIL_PREFIX[match] || ''}${detail}`,
      })
    )

    const matchesCommand = (it) => `${it.label} ${it.keywords}`.toLowerCase().includes(q)
    return [
      ...yearItems,
      ...people,
      ...places,
      ...eventItems,
      ...views.filter(matchesCommand),
      ...actions.filter(matchesCommand),
    ]
  }

  const execute = (item) => {
    onClose()
    // Let the modal close before actions that open other modals
    requestAnimationFrame(() => item.run?.())
  }

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown' || (e.key === 'ArrowRight' && items[highlighted]?.kind === 'tile')) {
      e.preventDefault()
      setHighlighted((h) => Math.min(h + 1, items.length - 1))
    } else if (e.key === 'ArrowUp' || (e.key === 'ArrowLeft' && items[highlighted]?.kind === 'tile')) {
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

  // Group consecutive items by section, keeping each item's flat index for keyboard nav
  const groups = []
  items.forEach((item, index) => {
    const last = groups[groups.length - 1]
    if (last && last.section === item.section) last.items.push({ item, index })
    else groups.push({ section: item.section, items: [{ item, index }] })
  })

  const rowProps = (item, index) => ({
    type: 'button',
    'data-cmd-index': index,
    onClick: () => execute(item),
    onMouseEnter: () => setHighlighted(index),
    'aria-current': index === clampedHighlight ? 'true' : undefined,
  })

  const rowCls = (index) =>
    `flex w-full items-center gap-3 rounded-lg px-2.5 text-left transition-colors duration-100 cursor-pointer ${
      index === clampedHighlight ? 'bg-soft-accent dark:bg-surface-raised' : ''
    }`

  const renderItem = ({ item, index }) => {
    const active = index === clampedHighlight
    if (item.kind === 'tile') {
      const Icon = item.icon
      return (
        <button
          key={item.key}
          {...rowProps(item, index)}
          className={`flex flex-col items-center gap-1 rounded-[10px] border py-2.5 text-xs text-text-strong transition-colors duration-100 cursor-pointer ${
            active ? 'border-text-strong bg-soft-accent dark:bg-surface-raised' : 'border-gray-200 bg-surface hover:bg-surface-raised'
          }`}
        >
          <Icon size={15} className={active ? 'text-highlight' : 'text-text-muted'} aria-hidden="true" />
          {item.label}
          <span className="text-[10px] text-text-muted" aria-label={`shortcut ${item.kbd}`}>{item.kbd}</span>
        </button>
      )
    }
    if (item.kind === 'event') {
      return (
        <button key={item.key} {...rowProps(item, index)} className={`${rowCls(index)} min-h-11 py-1.5`}>
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: getEventColor(item.event).dot }} aria-hidden="true" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm text-text-strong">
              <Highlight text={item.label} query={query} />
            </span>
            {item.detail && (
              <span className="truncate text-xs text-text-default">
                <Highlight text={item.detail} query={query} />
              </span>
            )}
          </span>
          {item.sub && <span className="shrink-0 font-serif text-[13px] tabular-nums text-text-default">{item.sub}</span>}
          {active && <Kbd>↵</Kbd>}
        </button>
      )
    }
    if (item.kind === 'person') {
      return (
        <button key={item.key} {...rowProps(item, index)} className={`${rowCls(index)} h-11`}>
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-surface text-[11px] font-semibold text-text-default" aria-hidden="true">
            {initials(item.label)}
          </span>
          <span className="min-w-0 flex-1 truncate text-sm text-text-strong">
            <Highlight text={item.label} query={query} />
          </span>
          <span className="shrink-0 text-xs text-text-default">{item.sub}</span>
          <span className="shrink-0 text-xs text-text-muted">{item.hint}</span>
          {active && <Kbd>↵</Kbd>}
        </button>
      )
    }
    const Icon = item.icon
    return (
      <button key={item.key} {...rowProps(item, index)} className={`${rowCls(index)} h-10`}>
        <Icon size={15} className={`shrink-0 ${active ? 'text-highlight' : 'text-text-muted'}`} aria-hidden="true" />
        <span className={`min-w-0 flex-1 truncate text-sm text-text-strong ${item.serif ? 'font-serif tabular-nums' : ''}`}>
          <Highlight text={item.label} query={query} />
        </span>
        {item.sub && <span className="shrink-0 text-xs text-text-default">{item.sub}</span>}
        {item.hint && <span className="shrink-0 text-xs text-text-muted">{item.hint}</span>}
        {item.kbd ? <Kbd>{item.kbd}</Kbd> : active && <Kbd>↵</Kbd>}
      </button>
    )
  }

  return (
    <AnimatedModal
      open={open}
      onClose={onClose}
      label="Command palette"
      className="bg-surface sm:rounded-2xl shadow-2xl max-w-xl w-full sm:mx-4 overflow-hidden modal-surface"
    >
      <div className="flex h-14 items-center gap-3 border-b border-gray-200 px-4">
        <Search size={18} className="shrink-0 text-text-muted" aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setHighlighted(0)
          }}
          onKeyDown={handleKeyDown}
          placeholder="Search events, people, places, or type a year"
          aria-label="Command palette search"
          className="flex-1 bg-transparent text-base sm:text-[17px] text-text-strong placeholder:text-text-muted focus:outline-none focus-visible:outline-none!"
          autoFocus
        />
        <span className="hidden sm:inline-flex"><Kbd>esc</Kbd></span>
      </div>

      <div ref={listRef} className="max-h-[min(26rem,60vh)] overflow-y-auto p-2 app-scroll">
        {items.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-text-default">
            Nothing matches &ldquo;{query}&rdquo;
          </p>
        ) : (
          groups.map((group) => (
            <div key={group.section} role="group" aria-label={group.section} className="pb-1">
              <p className="px-2.5 pt-2 pb-1 text-xs font-semibold text-text-default">{group.section}</p>
              {group.items[0].item.kind === 'tile' ? (
                <div className="grid grid-cols-5 gap-1.5 px-1 pb-1">{group.items.map(renderItem)}</div>
              ) : (
                group.items.map(renderItem)
              )}
            </div>
          ))
        )}
      </div>

      <div className="hidden sm:flex items-center gap-4 border-t border-gray-200 bg-surface-raised px-4 py-2.5 text-xs text-text-default">
        <span>↑↓ move</span>
        <span>↵ open</span>
        <span className="flex-1 text-right text-text-muted">
          {query.trim() ? pluralize(items.length, 'result') : 'Type a year to jump, e.g. 1905'}
        </span>
      </div>
    </AnimatedModal>
  )
}
