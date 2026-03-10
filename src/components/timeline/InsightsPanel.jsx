import { useState, useEffect, useMemo, useRef } from 'react'
import { createPortal } from 'react-dom'
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
} from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import Button from '@/components/shared/Button'
import { generateId } from '@/utils/constants'

const TYPE_CONFIG = {
  gap: {
    icon: Clock,
    label: 'Gap',
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconBg: 'bg-amber-100',
  },
  missing_context: {
    icon: HelpCircle,
    label: 'Missing Context',
    color: 'text-violet-600',
    bg: 'bg-violet-50',
    border: 'border-violet-200',
    iconBg: 'bg-violet-100',
  },
  inconsistency: {
    icon: Shuffle,
    label: 'Inconsistency',
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    iconBg: 'bg-rose-100',
  },
}

const SEVERITY_ORDER = { high: 0, medium: 1, low: 2 }

function InsightCard({ insight, onAddEvent, onDismiss }) {
  const config = TYPE_CONFIG[insight.type] || TYPE_CONFIG.gap
  const Icon = config.icon
  const hasSuggestion = insight.suggestedEvent

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
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
                  ? 'bg-red-100 text-red-700'
                  : insight.severity === 'medium'
                    ? 'bg-amber-100 text-amber-700'
                    : 'bg-gray-100 text-gray-600'
              }`}>
                {insight.severity}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-text-strong leading-snug">{insight.title}</p>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">{insight.description}</p>
        </div>
        <button
          onClick={() => onDismiss(insight.id)}
          className="rounded-lg p-1 text-gray-400 hover:text-gray-600 hover:bg-white/60 transition-colors cursor-pointer shrink-0"
          aria-label="Dismiss"
        >
          <X size={14} />
        </button>
      </div>

      {hasSuggestion && (
        <div className="ml-11">
          <div className="rounded-lg border border-gray-200/60 bg-white/80 p-3">
            <p className="text-xs font-medium text-text-muted mb-1.5 flex items-center gap-1">
              <Sparkles size={10} />
              Suggested event
            </p>
            <p className="text-sm font-medium text-text-strong">{insight.suggestedEvent.title}</p>
            {insight.suggestedEvent.description && (
              <p className="text-xs text-text-muted mt-0.5">{insight.suggestedEvent.description}</p>
            )}
            <div className="flex items-center gap-3 mt-2">
              <Button
                size="sm"
                onClick={() => onAddEvent(insight)}
              >
                <Plus size={12} />
                Add Event
              </Button>
            </div>
          </div>
        </div>
      )}

      {insight.relatedEventTitles && insight.relatedEventTitles.length > 0 && (
        <div className="ml-11 flex flex-wrap gap-1.5">
          {insight.relatedEventTitles.map((title) => (
            <span key={title} className="text-[10px] px-2 py-0.5 rounded-full bg-white/60 border border-gray-200/60 text-text-muted">
              {title}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}

function LoadingState() {
  const steps = [
    'Scanning chronological gaps...',
    'Checking event context...',
    'Looking for inconsistencies...',
    'Generating insights...',
  ]
  const stepIndex = useRef(0)
  const [currentStep, setCurrentStep] = useState(steps[0])

  useEffect(() => {
    const interval = setInterval(() => {
      stepIndex.current = Math.min(stepIndex.current + 1, steps.length - 1)
      setCurrentStep(steps[stepIndex.current])
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
  const showToast = useTimelineStore((s) => s.showToast)
  const events = useTimelineStore((s) => s.events)

  // Auto-fetch on first open if no data
  useEffect(() => {
    if (open && !data && !loading && !error) {
      fetchInsights()
    }
  }, [open])

  const visibleInsights = useMemo(() => {
    if (!data?.insights) return []
    return data.insights
      .filter((i) => !dismissedIds.includes(i.id))
      .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 2) - (SEVERITY_ORDER[b.severity] ?? 2))
  }, [data, dismissedIds])

  const dismissedCount = useMemo(() => {
    if (!data?.insights) return 0
    return data.insights.filter((i) => dismissedIds.includes(i.id)).length
  }, [data, dismissedIds])

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
      location: null,
      tags: s.tags || [],
      photos: [],
    }

    addEvent(event)
    dismissInsight(insight.id)
    showToast(`Added "${event.title}"`)
  }

  const handleClose = () => setOpen(false)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 z-50"
            onClick={handleClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-surface shadow-2xl z-50 flex flex-col border-l border-gray-200"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                  <Sparkles size={16} className="text-secondary" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-text-strong">Timeline Insights</h3>
                  <p className="text-[11px] text-text-muted">AI-powered timeline analysis</p>
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
                  <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center mb-4">
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
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-text-muted">
                      {visibleInsights.length} insight{visibleInsights.length !== 1 ? 's' : ''} found
                      {dismissedCount > 0 && (
                        <span className="ml-1">({dismissedCount} dismissed)</span>
                      )}
                    </p>
                    {data?.usage && (
                      <p className="text-[10px] text-text-muted/50 tabular-nums">
                        {data.usage.cacheRead > 0 ? 'cached' : ''} {data.usage.inputTokens + data.usage.outputTokens} tok
                      </p>
                    )}
                  </div>
                  <AnimatePresence mode="popLayout">
                    {visibleInsights.map((insight) => (
                      <InsightCard
                        key={insight.id}
                        insight={insight}
                        onAddEvent={handleAddEvent}
                        onDismiss={dismissInsight}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              ) : data ? (
                <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center mb-4">
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

            {/* Footer */}
            {events.length > 0 && !loading && (
              <div className="px-5 py-3 border-t border-gray-200 shrink-0">
                <p className="text-[10px] text-text-muted text-center">
                  Analyzing {events.length} event{events.length !== 1 ? 's' : ''} with AI
                </p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  )
}
