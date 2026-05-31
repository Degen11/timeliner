import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Loader2,
  AlertTriangle,
  Clock,
  HelpCircle,
  Shuffle,
  Plus,
  RefreshCw,
  Sparkles,
  Wrench,
} from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import AnimatedModal from '@/components/shared/AnimatedModal'
import { Button } from '@/components/ui/Button'
import LocationInput from '@/components/shared/LocationInput'
import { generateId } from '@/utils/constants'

const TYPE_CONFIG = {
  gap: {
    icon: Clock,
    label: 'Gap',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
    border: 'border-amber-200 dark:border-amber-500/20',
    iconBg: 'bg-amber-100 dark:bg-amber-500/20',
  },
  missing_context: {
    icon: HelpCircle,
    label: 'Missing Context',
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-50 dark:bg-violet-500/10',
    border: 'border-violet-200 dark:border-violet-500/20',
    iconBg: 'bg-violet-100 dark:bg-violet-500/20',
  },
  inconsistency: {
    icon: Shuffle,
    label: 'Inconsistency',
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-500/10',
    border: 'border-rose-200 dark:border-rose-500/20',
    iconBg: 'bg-rose-100 dark:bg-rose-500/20',
  },
}

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 }

function FixRow({ fix, onApply, applied }) {
  const isLocation = fix.field === 'location'
  const [editedValue, setEditedValue] = useState(fix.newValue || '')
  const fieldLabel = isLocation ? 'location' : fix.field

  if (applied) {
    return (
      <div className="flex items-center gap-3 py-2 opacity-50">
        <div className="flex-1 min-w-0">
          <p className="text-xs text-text-muted">
            <span className="font-medium text-text-strong">{fix.eventTitle}</span>
            {' — '}{fieldLabel} updated
          </p>
        </div>
        <span className="text-[10px] text-success font-medium px-2 shrink-0">Applied</span>
      </div>
    )
  }

  // Location fixes get an editable input
  if (isLocation) {
    return (
      <div className="py-2 space-y-2">
        <p className="text-xs text-text-muted">
          <span className="font-medium text-text-strong">{fix.eventTitle}</span>
          {fix.oldValue ? (
            <> — location: <span className="line-through">{fix.oldValue}</span></>
          ) : (
            <> — no location set</>
          )}
        </p>
        <LocationInput
          value={editedValue}
          onChange={setEditedValue}
          placeholder="Search for a location..."
        />
        <Button
          size="sm"
          disabled={!editedValue.trim()}
          onClick={() => onApply({ ...fix, newValue: editedValue.trim() })}
        >
          Set Location
        </Button>
      </div>
    )
  }

  // Non-location fixes (date, etc.)
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-muted">
          <span className="font-medium text-text-strong">{fix.eventTitle}</span>
          {' — '}
          {fieldLabel}: <span className="line-through">{fix.oldValue || '(empty)'}</span>
          {' → '}
          <span className="font-medium text-text-strong">{fix.newValue}</span>
        </p>
      </div>
      <Button size="sm" onClick={() => onApply(fix)}>
        Apply
      </Button>
    </div>
  )
}

function InsightCard({ insight, onAddEvent, onApplyFix, onDismiss }) {
  const config = TYPE_CONFIG[insight.type] || TYPE_CONFIG.gap
  const Icon = config.icon
  const hasSuggestion = insight.suggestedEvent
  // Support both suggestedFixes (array) and legacy suggestedFix (single object)
  const fixes = insight.suggestedFixes
    || (insight.suggestedFix ? [insight.suggestedFix] : [])
  const hasFixes = fixes.length > 0
  const [appliedFixIndices, setAppliedFixIndices] = useState(new Set())

  const handleApplyOne = (fix, index) => {
    onApplyFix(fix)
    setAppliedFixIndices((prev) => new Set([...prev, index]))
  }

  const allFixesApplied = hasFixes && appliedFixIndices.size === fixes.length

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      className={`rounded-xl border ${config.border} ${config.bg} p-4 space-y-3`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-lg ${config.iconBg} flex items-center justify-center shrink-0 mt-0.5`}>
          <Icon size={14} className={config.color} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-semibold uppercase tracking-wider ${config.color}`}>
              {config.label}
            </span>
            {insight.severity && (
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                insight.severity === 'high'
                  ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'
                  : insight.severity === 'medium'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {insight.severity}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-text-strong leading-snug">{insight.title}</p>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">{insight.description}</p>
        </div>
      </div>

      {/* Suggested new event */}
      {hasSuggestion && (
        <div className="ml-11">
          <div className="rounded-lg border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-white/5 p-3">
            <p className="text-xs font-medium text-text-muted mb-1.5 flex items-center gap-1">
              <Sparkles size={10} />
              Suggested event
            </p>
            <p className="text-sm font-medium text-text-strong">{insight.suggestedEvent.title}</p>
            {insight.suggestedEvent.description && (
              <p className="text-xs text-text-muted mt-0.5">{insight.suggestedEvent.description}</p>
            )}
            {insight.suggestedEvent.location && (
              <p className="text-xs text-text-muted mt-0.5">Location: {insight.suggestedEvent.location}</p>
            )}
            <div className="flex items-center gap-2 mt-3">
              <Button size="sm" onClick={() => onAddEvent(insight)}>
                <Plus size={12} />
                Add Event
              </Button>
              <Button size="sm" variant="secondary" onClick={() => onDismiss(insight.id)}>
                Dismiss
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Suggested fixes (date, location, etc.) — each independently actionable */}
      {hasFixes && (
        <div className="ml-11">
          <div className="rounded-lg border border-gray-200/60 dark:border-gray-700/60 bg-white/80 dark:bg-white/5 p-3">
            <p className="text-xs font-medium text-text-muted mb-1 flex items-center gap-1">
              <Wrench size={10} />
              Suggested fix{fixes.length > 1 ? 'es' : ''}
            </p>
            <div className="divide-y divide-gray-200/40 dark:divide-gray-700/40">
              {fixes.map((fix, i) => (
                <FixRow
                  key={`${fix.eventTitle}-${fix.field}-${i}`}
                  fix={fix}
                  applied={appliedFixIndices.has(i)}
                  onApply={() => handleApplyOne(fix, i)}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-200/40 dark:border-gray-700/40">
              {!allFixesApplied && fixes.length > 1 && (
                <Button
                  size="sm"
                  onClick={() => {
                    fixes.forEach((fix, i) => {
                      if (!appliedFixIndices.has(i)) handleApplyOne(fix, i)
                    })
                  }}
                >
                  Apply All
                </Button>
              )}
              <Button size="sm" variant="secondary" onClick={() => onDismiss(insight.id)}>
                {allFixesApplied ? 'Done' : 'Dismiss'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* No action available — just show dismiss */}
      {!hasSuggestion && !hasFixes && (
        <div className="ml-11">
          <Button size="sm" variant="secondary" onClick={() => onDismiss(insight.id)}>
            Dismiss
          </Button>
        </div>
      )}

      {insight.relatedEventTitles && insight.relatedEventTitles.length > 0 && (
        <div className="ml-11 flex flex-wrap gap-1.5">
          {insight.relatedEventTitles.map((title) => (
            <span key={title} className="text-[10px] px-2 py-0.5 rounded-full bg-white/60 dark:bg-white/10 border border-gray-200/60 dark:border-gray-700/60 text-text-muted">
              {title}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}

const LOADING_STEPS = [
  'Scanning chronological gaps...',
  'Checking event context...',
  'Looking for inconsistencies...',
  'Generating insights...',
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
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-12 h-12 rounded-xl bg-secondary/10 flex items-center justify-center mb-4">
        <Loader2 size={20} className="text-secondary animate-spin" />
      </div>
      <p className="text-sm font-medium text-text-strong mb-1">Analyzing timeline</p>
      <p className="text-xs text-text-muted">{currentStep}</p>
    </div>
  )
}

export default function InsightsPanel() {
  const open = useTimelineStore((s) => s.insightsPanelOpen)
  const loading = useTimelineStore((s) => s.insightsLoading)
  const data = useTimelineStore((s) => s.insightsData)
  const error = useTimelineStore((s) => s.insightsError)
  const dismissedIds = useTimelineStore((s) => s.dismissedInsightIds)
  const setOpen = useTimelineStore((s) => s.setInsightsPanelOpen)
  const fetchInsights = useTimelineStore((s) => s.fetchInsights)
  const dismissInsight = useTimelineStore((s) => s.dismissInsight)
  const addEvent = useTimelineStore((s) => s.addEvent)
  const updateEvent = useTimelineStore((s) => s.updateEvent)
  const events = useTimelineStore((s) => s.events)
  const showToast = useTimelineStore((s) => s.showToast)

  // Auto-fetch on first open if no data
  useEffect(() => {
    if (open && !data && !loading && !error) {
      fetchInsights()
    }
  }, [open, data, loading, error, fetchInsights])

  const visibleInsights = (() => {
    if (!data?.insights) return []
    return data.insights
      .filter((i) => !dismissedIds.includes(i.id))
      .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 2) - (SEVERITY_ORDER[b.severity] ?? 2))
  })()

  const dismissedCount = (() => {
    if (!data?.insights) return 0
    return data.insights.filter((i) => dismissedIds.includes(i.id)).length
  })()

  const handleAddEvent = (insight) => {
    const s = insight.suggestedEvent
    if (!s) return

    const event = {
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
    }

    addEvent(event)
    dismissInsight(insight.id)
    showToast(`Added "${event.title}"`)
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
    showToast(`Updated "${target.title}" — ${fix.field} changed to ${fix.newValue}`)
  }

  const handleClose = () => setOpen(false)

  return (
    <AnimatedModal
      open={open}
      onClose={handleClose}
      className="bg-surface rounded-2xl shadow-2xl max-w-3xl w-full mx-4 max-h-[85vh] flex flex-col overflow-hidden modal-surface"
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
            <Sparkles size={16} className="text-secondary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-text-strong">Timeline Insights</h3>
            {!loading && data && (
              <p className="text-[11px] text-text-muted">
                Analyzed {events.length} event{events.length !== 1 ? 's' : ''}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {data && !loading && (
            <button
              onClick={fetchInsights}
              className="rounded-lg p-2 text-text-muted hover:text-text-strong hover:bg-surface-raised transition-colors cursor-pointer"
              title="Re-analyze"
            >
              <RefreshCw size={14} />
            </button>
          )}
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-text-muted hover:text-text-strong hover:bg-surface-raised transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto app-scroll">
        {loading ? (
          <LoadingState />
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center mb-4">
              <AlertTriangle size={20} className="text-red-500" />
            </div>
            <p className="text-sm font-medium text-text-strong mb-1">Analysis failed</p>
            <p className="text-xs text-text-muted mb-4">{error}</p>
            <Button size="sm" variant="secondary" onClick={fetchInsights}>
              <RefreshCw size={12} />
              Try Again
            </Button>
          </div>
        ) : visibleInsights.length > 0 ? (
          <div className="p-5 space-y-3">
            <p className="text-xs text-text-muted mb-1">
              {visibleInsights.length} insight{visibleInsights.length !== 1 ? 's' : ''} found
              {dismissedCount > 0 && (
                <span className="ml-1">({dismissedCount} dismissed)</span>
              )}
            </p>
            <AnimatePresence mode="popLayout">
              {visibleInsights.map((insight) => (
                <InsightCard
                  key={insight.id}
                  insight={insight}
                  onAddEvent={handleAddEvent}
                  onApplyFix={handleApplyFix}
                  onDismiss={dismissInsight}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : data ? (
          <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
              <Sparkles size={20} className="text-emerald-500" />
            </div>
            <p className="text-sm font-medium text-text-strong mb-1">
              {dismissedCount > 0 ? 'All insights dismissed' : 'Timeline looks good!'}
            </p>
            <p className="text-xs text-text-muted">
              {dismissedCount > 0
                ? 'Re-analyze to check for new insights.'
                : 'No significant gaps or issues found.'}
            </p>
          </div>
        ) : null}
      </div>
    </AnimatedModal>
  )
}
