import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Loader2, AlertTriangle, RefreshCw, Sparkles, CheckCircle2 } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import AnimatedModal from '@/components/shared/AnimatedModal'
import { Button } from '@/components/ui/Button'
import { Tooltip } from '@/components/ui/Tooltip'
import LocationInput from '@/components/shared/LocationInput'
import { getYearSpan } from '@/store/selectors'
import { formatEventDate, safeGetUTCYear } from '@/utils/dateUtils'
import { generateId } from '@/utils/constants'
import { pluralize } from '@/utils/ui'

const TYPE_CONFIG = {
  gap: { label: 'Gaps', dot: 'bg-amber-500' },
  missing_context: { label: 'Missing events', dot: 'bg-violet-600' },
  inconsistency: { label: 'Fixes', dot: 'bg-rose-600' },
}
const FALLBACK_TYPE = { label: 'Other', dot: 'bg-stone-500' }

const SEVERITY_LABEL = { high: 'High', medium: 'Medium', low: 'Low' }
const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 }

const primaryBtn =
  'inline-flex h-9 sm:h-8 items-center rounded-lg bg-text-strong px-3 text-xs font-semibold text-canvas transition-opacity duration-150 hover:opacity-90 disabled:opacity-50 cursor-pointer'
const secondaryBtn =
  'inline-flex h-9 sm:h-8 items-center rounded-lg border border-gray-200 bg-surface px-3 text-xs text-text-default transition-colors duration-150 hover:bg-surface-raised hover:text-text-strong cursor-pointer'
const actionLineCls =
  'mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-2 rounded-[10px] border border-gray-200 bg-surface-raised py-2 pl-3 pr-2'

// Events an insight points at, resolved by title
function relatedEvents(insight, events) {
  const titles = [insight.relatedEventTitle, ...(insight.relatedEventTitles || [])].filter(Boolean)
  return [...new Set(titles)].map((t) => events.find((e) => e.title === t)).filter(Boolean)
}

function fixesOf(insight) {
  return insight.suggestedFixes || (insight.suggestedFix ? [insight.suggestedFix] : [])
}

/**
 * Thin strip across the timeline's years: event dots in grey, gap insights as
 * a dashed amber band, other insights as a colored marker on their event.
 */
function InsightStrip({ events, insights }) {
  const span = getYearSpan(events)
  if (!span || span.min === span.max) return null
  const pct = (year) => ((year - span.min) / (span.max - span.min)) * 100
  const years = [...new Set(events.map((e) => safeGetUTCYear(e.dateStart, null)).filter((y) => y != null))]

  const markers = []
  const bands = []
  for (const insight of insights) {
    if (insight.type === 'gap') {
      const from = safeGetUTCYear(insight.dateStart, null)
      const to = safeGetUTCYear(insight.dateEnd, null)
      if (from != null && to != null && to > from) bands.push({ id: insight.id, left: pct(from), width: pct(to) - pct(from) })
      continue
    }
    for (const e of relatedEvents(insight, events)) {
      const y = safeGetUTCYear(e.dateStart, null)
      if (y != null) markers.push({ id: `${insight.id}-${e.id}`, left: pct(y), dot: (TYPE_CONFIG[insight.type] || FALLBACK_TYPE).dot })
    }
  }

  return (
    <div className="space-y-1" aria-hidden="true">
      <div className="relative mx-1.5 h-7">
        <div className="absolute inset-x-0 top-1/2 h-0.5 -translate-y-1/2 rounded-full bg-gray-200" />
        {bands.map((b) => (
          <div
            key={b.id}
            className="absolute top-1/2 h-4 -translate-y-1/2 rounded-[5px] border border-dashed border-amber-500 bg-amber-100 dark:bg-amber-500/20"
            style={{ left: `${b.left}%`, width: `${Math.max(b.width, 1)}%` }}
          />
        ))}
        {years.map((y) => (
          <span
            key={y}
            className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-stone-500 dark:bg-stone-400"
            style={{ left: `${pct(y)}%` }}
          />
        ))}
        {markers.map((m) => (
          <span
            key={m.id}
            className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface ${m.dot}`}
            style={{ left: `${m.left}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between font-serif text-xs tabular-nums text-text-default">
        <span>{span.min}</span>
        <span>{span.max}</span>
      </div>
    </div>
  )
}

function FixLine({ fix, applied, onApply, onShow }) {
  const isLocation = fix.field === 'location'
  // A missing place with no suggestion goes straight to the place picker
  const [editing, setEditing] = useState(isLocation && !fix.newValue)
  const [value, setValue] = useState(fix.newValue || '')

  if (applied) {
    return (
      <div className={`${actionLineCls} opacity-70`}>
        <CheckCircle2 size={14} className="text-success" aria-hidden="true" />
        <span className="text-[13px] text-text-default">
          {fix.eventTitle}: {isLocation ? 'place' : fix.field} updated
        </span>
      </div>
    )
  }

  return (
    <div className={actionLineCls}>
      {editing ? (
        <div className="min-w-[12rem] flex-1">
          <LocationInput value={value} onChange={setValue} placeholder="City, country or place" />
        </div>
      ) : (
        <span className="min-w-0 flex-1 text-[13px] text-text-strong">
          {fix.eventTitle && <span className="text-text-default">{fix.eventTitle}: </span>}
          <span className="text-text-default">{isLocation ? 'set place to' : `change ${fix.field} to`}</span>{' '}
          {fix.newValue || '…'}
        </span>
      )}
      <button
        type="button"
        onClick={() => onApply({ ...fix, newValue: editing ? value.trim() : fix.newValue })}
        disabled={editing ? !value.trim() : !fix.newValue}
        className={primaryBtn}
      >
        Apply fix
      </button>
      {isLocation && !editing && (
        <button type="button" onClick={() => setEditing(true)} className={secondaryBtn}>
          Change
        </button>
      )}
      {onShow && !editing && (
        <button type="button" onClick={onShow} className={secondaryBtn}>
          Show event
        </button>
      )}
    </div>
  )
}

function InsightRow({ insight, events, onAdd, onAddAndEdit, onApplyFix, onShowEvent, onDismiss }) {
  const config = TYPE_CONFIG[insight.type] || FALLBACK_TYPE
  const related = relatedEvents(insight, events)
  const fixes = fixesOf(insight)
  const [applied, setApplied] = useState([])
  const s = insight.suggestedEvent

  const suggestionMeta = s
    ? [s.dateStart && formatEventDate({ dateStart: s.dateStart, datePrecision: s.datePrecision || 'year' }), s.location]
        .filter(Boolean)
        .join(' · ')
    : ''

  const applyFix = (fix, i) => {
    onApplyFix(fix)
    setApplied((prev) => [...prev, i])
  }

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, transition: { duration: 0.15 } }}
      className="flex gap-3 border-b border-gray-100 py-3.5 last:border-b-0 dark:border-gray-200"
    >
      <span className={`mt-[7px] h-2 w-2 shrink-0 rounded-full ${config.dot}`} aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-1">
        <p className="flex flex-wrap items-baseline gap-x-2">
          <span className="text-[15px] font-semibold text-text-strong">{insight.title}</span>
          {insight.severity && (
            <span className={`text-[11px] font-semibold ${insight.severity === 'high' ? 'text-amber-700 dark:text-amber-400' : 'text-text-default'}`}>
              {SEVERITY_LABEL[insight.severity] || insight.severity}
            </span>
          )}
        </p>
        <p className="text-[13px] leading-relaxed text-text-default">
          {insight.description}
          {related.length > 0 && !fixes.length && (
            <>
              {' '}
              {related.map((e, i) => (
                <span key={e.id}>
                  {i > 0 && ', '}
                  <button
                    type="button"
                    onClick={() => onShowEvent(e)}
                    className="text-text-strong underline underline-offset-2 hover:text-text-strong/80 cursor-pointer"
                  >
                    Show {e.title}
                  </button>
                </span>
              ))}
            </>
          )}
        </p>

        {s && (
          <div className={actionLineCls}>
            <span className="min-w-0 flex-1 text-[13px] text-text-strong">
              <span className="text-text-default">Add</span> {s.title}
              {suggestionMeta && <span className="font-serif text-text-default"> · {suggestionMeta}</span>}
            </span>
            <button type="button" onClick={() => onAdd(insight)} className={primaryBtn}>
              Add to timeline
            </button>
            <button type="button" onClick={() => onAddAndEdit(insight)} className={secondaryBtn}>
              Add &amp; edit
            </button>
          </div>
        )}

        {fixes.map((fix, i) => (
          <FixLine
            key={`${fix.eventTitle}-${fix.field}-${i}`}
            fix={fix}
            applied={applied.includes(i)}
            onApply={(f) => applyFix(f, i)}
            onShow={(() => {
              const target = events.find((e) => e.title === fix.eventTitle)
              return target ? () => onShowEvent(target) : null
            })()}
          />
        ))}
      </div>
      <Tooltip label="Dismiss">
        <button
          type="button"
          onClick={() => onDismiss(insight.id)}
          aria-label={`Dismiss: ${insight.title}`}
          className="-mr-2 -mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-surface-raised hover:text-text-strong cursor-pointer"
        >
          <X size={14} />
        </button>
      </Tooltip>
    </motion.li>
  )
}

const LOADING_STEPS = [
  'Scanning chronological gaps…',
  'Checking event context…',
  'Looking for inconsistencies…',
  'Writing it up…',
]

function LoadingState() {
  const stepIndex = useRef(0)
  const [currentStep, setCurrentStep] = useState(LOADING_STEPS[0])

  useEffect(() => {
    const interval = setInterval(() => {
      stepIndex.current = Math.min(stepIndex.current + 1, LOADING_STEPS.length - 1)
      setCurrentStep(LOADING_STEPS[stepIndex.current])
    }, 2000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center" role="status">
      <Loader2 size={22} className="mb-3 animate-spin text-highlight" aria-hidden="true" />
      <p className="text-sm font-medium text-text-strong">Claude is reading your timeline</p>
      <p className="mt-1 text-xs text-text-default">{currentStep}</p>
    </div>
  )
}

export default function InsightsPanel({ onEditEvent }) {
  const open = useTimelineStore((s) => s.insightsPanelOpen)
  const loading = useTimelineStore((s) => s.insightsLoading)
  const data = useTimelineStore((s) => s.insightsData)
  const error = useTimelineStore((s) => s.insightsError)
  const checkedAt = useTimelineStore((s) => s.insightsCheckedAt)
  const dismissedIds = useTimelineStore((s) => s.dismissedInsightIds)
  const setOpen = useTimelineStore((s) => s.setInsightsPanelOpen)
  const fetchInsights = useTimelineStore((s) => s.fetchInsights)
  const dismissInsight = useTimelineStore((s) => s.dismissInsight)
  const addEvent = useTimelineStore((s) => s.addEvent)
  const updateEvent = useTimelineStore((s) => s.updateEvent)
  const events = useTimelineStore((s) => s.events)
  const showToast = useTimelineStore((s) => s.showToast)

  const [typeFilter, setTypeFilter] = useState('all')

  // Auto-fetch on first open if no data
  useEffect(() => {
    if (open && !data && !loading && !error) {
      fetchInsights()
    }
  }, [open, data, loading, error, fetchInsights])

  const visibleInsights = (data?.insights || [])
    .filter((i) => !dismissedIds.includes(i.id))
    .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 2) - (SEVERITY_ORDER[b.severity] ?? 2))
  const dismissedCount = (data?.insights || []).filter((i) => dismissedIds.includes(i.id)).length

  const typeCounts = {}
  for (const i of visibleInsights) typeCounts[i.type] = (typeCounts[i.type] || 0) + 1
  const activeFilter = typeFilter !== 'all' && typeCounts[typeFilter] ? typeFilter : 'all'
  const shown = activeFilter === 'all' ? visibleInsights : visibleInsights.filter((i) => i.type === activeFilter)
  const withSuggestions = visibleInsights.filter((i) => i.suggestedEvent)

  const buildEvent = (s) => ({
    id: generateId(),
    title: s.title,
    description: s.description || null,
    dateStart: s.dateStart,
    dateEnd: s.dateEnd || null,
    dateRaw: s.dateStart,
    datePrecision: s.datePrecision || 'year',
    flagged: false,
    flagReason: null,
    people: s.people || [],
    location: s.location || null,
    tags: s.tags || [],
    photos: [],
  })

  const handleAdd = (insight, { quiet = false } = {}) => {
    if (!insight.suggestedEvent) return null
    const event = buildEvent(insight.suggestedEvent)
    addEvent(event)
    dismissInsight(insight.id)
    if (!quiet) showToast(`Added "${event.title}"`, { variant: 'success' })
    return event
  }

  const handleAddAndEdit = (insight) => {
    const event = handleAdd(insight, { quiet: true })
    if (!event) return
    setOpen(false)
    onEditEvent?.(event)
  }

  const handleAddAll = () => {
    for (const insight of withSuggestions) handleAdd(insight, { quiet: true })
    showToast(`Added ${pluralize(withSuggestions.length, 'suggested event')}`, { variant: 'success' })
  }

  const handleApplyFix = (fix) => {
    if (!fix) return

    // Find the event by title. If several events share the title, disambiguate
    // using the fix's oldValue against the current field value so we don't edit
    // the wrong duplicate.
    const matches = events.filter((e) => e.title === fix.eventTitle)
    let target = matches[0]
    if (matches.length > 1 && fix.oldValue != null && fix.oldValue !== '') {
      target = matches.find((e) => (e[fix.field] ?? '') === fix.oldValue) || matches[0]
    }
    if (!target) {
      showToast(`Could not find event "${fix.eventTitle}"`, { variant: 'error' })
      return
    }

    const changes = { [fix.field]: fix.newValue }
    if (fix.datePrecision && fix.field !== 'location') {
      changes.datePrecision = fix.datePrecision
    }

    updateEvent(target.id, changes)
    showToast(`Updated "${target.title}"`, { variant: 'success' })
  }

  const handleShowEvent = (event) => {
    setOpen(false)
    useTimelineStore.getState().openEventDetail(event)
  }

  const handleClose = () => setOpen(false)

  const checkedLabel = checkedAt
    ? new Date(checkedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : null

  const heading = loading
    ? 'Checking your timeline'
    : error
      ? 'Couldn’t check the timeline'
      : visibleInsights.length > 0
        ? `${visibleInsights.length} ${visibleInsights.length === 1 ? 'thing' : 'things'} worth a look`
        : data
          ? 'Nothing to flag'
          : 'Insights'

  const chips = [
    { value: 'all', label: `All ${visibleInsights.length}` },
    ...Object.entries(TYPE_CONFIG)
      .filter(([type]) => typeCounts[type])
      .map(([type, cfg]) => ({ value: type, label: `${cfg.label} ${typeCounts[type]}`, dot: cfg.dot })),
  ]

  return (
    <AnimatedModal
      label="Timeline insights"
      open={open}
      onClose={handleClose}
      className="bg-surface sm:rounded-2xl shadow-2xl max-w-2xl w-full sm:mx-4 max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden modal-surface"
    >
      <div className="flex shrink-0 items-start gap-2 pl-5 sm:pl-6 pr-3 pt-4 sm:pt-5">
        <div className="min-w-0 flex-1 space-y-1">
          <p className="flex items-center gap-1.5 text-xs font-medium text-text-muted">
            <Sparkles size={13} className="text-highlight" aria-hidden="true" />
            Insights
          </p>
          <h2 className="font-serif text-2xl font-semibold text-text-strong" aria-live="polite">{heading}</h2>
          {!loading && data && (
            <p className="text-[13px] text-text-default">
              Claude checked {pluralize(events.length, 'event')}
              {checkedLabel && ` at ${checkedLabel}`}
              {dismissedCount > 0 && ` · ${dismissedCount} dismissed`}
            </p>
          )}
        </div>
        {data && !loading && (
          <Button variant="secondary" size="sm" onClick={fetchInsights} className="rounded-[9px] sm:h-9">
            <RefreshCw size={13} />
            Check again
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={handleClose} aria-label="Close">
          <X size={16} />
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 sm:px-6 pb-5 pt-3 app-scroll">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <AlertTriangle size={22} className="mb-3 text-error" aria-hidden="true" />
            <p className="text-sm text-text-default">{error}</p>
            <Button size="sm" variant="secondary" onClick={fetchInsights} className="mt-4">
              <RefreshCw size={12} />
              Try again
            </Button>
          </div>
        ) : visibleInsights.length > 0 ? (
          <div className="space-y-3">
            <InsightStrip events={events} insights={visibleInsights} />
            {chips.length > 2 && (
              <fieldset className="flex flex-wrap gap-1.5">
                <legend className="sr-only">Show insights</legend>
                {chips.map((chip) => (
                  <label key={chip.value} className="relative">
                    <input
                      type="radio"
                      name="insight-type"
                      value={chip.value}
                      checked={activeFilter === chip.value}
                      onChange={() => setTypeFilter(chip.value)}
                      className="peer sr-only"
                    />
                    <span className="inline-flex h-8 items-center gap-1.5 rounded-full border border-gray-200 bg-surface px-3 text-[13px] text-text-default transition-colors duration-150 cursor-pointer hover:bg-surface-raised peer-checked:border-text-strong peer-checked:bg-text-strong peer-checked:text-canvas peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring">
                      {chip.dot && <span className={`h-2 w-2 rounded-full ${chip.dot}`} aria-hidden="true" />}
                      {chip.label}
                    </span>
                  </label>
                ))}
              </fieldset>
            )}
            <ul>
              <AnimatePresence mode="popLayout" initial={false}>
                {shown.map((insight) => (
                  <InsightRow
                    key={insight.id}
                    insight={insight}
                    events={events}
                    onAdd={handleAdd}
                    onAddAndEdit={handleAddAndEdit}
                    onApplyFix={handleApplyFix}
                    onShowEvent={handleShowEvent}
                    onDismiss={dismissInsight}
                  />
                ))}
              </AnimatePresence>
            </ul>
          </div>
        ) : data ? (
          <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
            <CheckCircle2 size={24} className="mb-3 text-success" aria-hidden="true" />
            <p className="text-sm text-text-default">
              {dismissedCount > 0
                ? 'You’ve gone through everything. Check again after you add more events.'
                : 'No gaps, missing events or inconsistencies stood out.'}
            </p>
          </div>
        ) : null}
      </div>

      {!loading && !error && visibleInsights.length > 0 && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-gray-200 bg-surface-raised px-5 sm:px-6 py-3 text-xs text-text-default">
          <span className="min-w-0 flex-1">Suggestions are Claude’s best guess. Check the dates before adding.</span>
          {withSuggestions.length > 1 && (
            <button type="button" onClick={handleAddAll} className={secondaryBtn}>
              Add all {withSuggestions.length} suggestions
            </button>
          )}
        </div>
      )}
    </AnimatedModal>
  )
}
