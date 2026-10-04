import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { X, AlertTriangle, ArrowRight, Calendar, CheckCircle2 } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { getFlaggedEvents } from '@/store/selectors'
import AnimatedModal from '@/components/shared/AnimatedModal'
import DatePicker from '@/components/shared/DatePicker'
import { Button } from '@/components/ui/Button'
import { DATE_PRECISION_OPTIONS, MOTION_DURATION, EASE_OUT } from '@/utils/constants'
import { formatEventDate, getDateChoices } from '@/utils/dateUtils'
import { pluralize } from '@/utils/ui'

const PRECISION_LABEL = Object.fromEntries(DATE_PRECISION_OPTIONS.map((o) => [o.value, o.short]))

const choiceCls = (selected) =>
  `flex items-center gap-3 rounded-xl px-3.5 py-3 transition-colors duration-150 cursor-pointer ${
    selected
      ? 'border-2 border-text-strong bg-surface-raised px-[13px] py-[11px]'
      : 'border border-gray-200 bg-surface hover:border-gray-300'
  }`

function Progress({ position, total }) {
  if (total < 2) return null
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex gap-1" aria-hidden="true">
        {Array.from({ length: Math.min(total, 12) }, (_, i) => (
          <span
            key={i}
            className={`h-1 w-[18px] rounded-full ${i < Math.min(position, 12) ? 'bg-text-strong' : 'bg-gray-200'}`}
          />
        ))}
      </span>
      <span className="text-xs text-text-default">
        {position} of {total}
      </span>
    </span>
  )
}

function ReviewItem({ event, onConfirm, onSkip, onEditFull }) {
  const choices = getDateChoices(event.dateStart, event.datePrecision)
  const [picked, setPicked] = useState(choices.length ? 'keep' : 'custom')
  const [custom, setCustom] = useState({ dateStart: event.dateStart || '', datePrecision: event.datePrecision || 'day' })

  const quote = event.dateRaw && event.dateRaw !== event.dateStart ? event.dateRaw : null

  const handleSubmit = (e) => {
    e.preventDefault()
    const choice = picked === 'custom' ? custom : choices.find((c) => c.key === picked)
    if (!choice?.dateStart) return
    onConfirm({ dateStart: choice.dateStart, datePrecision: choice.datePrecision })
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 sm:px-6 pb-5 app-scroll">
        <div className="space-y-1">
          <h3 className="font-serif text-2xl font-semibold text-text-strong">{event.title}</h3>
          {event.description && <p className="text-sm text-text-default line-clamp-2">{event.description}</p>}
        </div>

        <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 dark:border-amber-500/30 dark:bg-amber-500/10">
          <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden="true" />
          <div className="space-y-1 text-[13px] text-amber-900 dark:text-amber-200">
            <p>
              <strong className="font-semibold">Why it's flagged:</strong> {event.flagReason || 'the date may be ambiguous'}
            </p>
            {quote && (
              <p>
                Your text said{' '}
                <span className="rounded bg-amber-100 px-1 font-serif text-[15px] dark:bg-amber-500/20">“{quote}”</span>
              </p>
            )}
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-xs font-semibold text-text-default">Which date is right?</legend>
          {choices.map((choice) => (
            <label key={choice.key} className={choiceCls(picked === choice.key)}>
              <input
                type="radio"
                name="date-choice"
                value={choice.key}
                checked={picked === choice.key}
                onChange={() => setPicked(choice.key)}
                className="h-4 w-4 shrink-0 accent-text-strong"
              />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-serif text-[17px] font-semibold text-text-strong">
                  {formatEventDate({ dateStart: choice.dateStart, datePrecision: choice.datePrecision })}
                </span>
                <span className="text-xs text-text-default">{choice.hint}</span>
              </span>
              <span className="shrink-0 rounded-full border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-text-default">
                {PRECISION_LABEL[choice.datePrecision]}
              </span>
            </label>
          ))}
          <label className={choiceCls(picked === 'custom')}>
            <input
              type="radio"
              name="date-choice"
              value="custom"
              checked={picked === 'custom'}
              onChange={() => setPicked('custom')}
              className="h-4 w-4 shrink-0 accent-text-strong"
            />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-medium text-text-strong">A different date…</span>
              <span className="text-xs text-text-default">Pick it on a calendar</span>
            </span>
            <Calendar size={15} className="shrink-0 text-text-muted" aria-hidden="true" />
          </label>
          {picked === 'custom' && (
            <div className="pl-1 pt-1">
              <DatePicker
                value={custom.dateStart}
                precision={custom.datePrecision}
                onChange={(dateStart, p) => setCustom((prev) => ({ dateStart, datePrecision: p || prev.datePrecision }))}
                placeholder="Pick a date"
              />
            </div>
          )}
        </fieldset>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 border-t border-gray-200 bg-surface-raised px-5 sm:px-6 py-3">
        <button
          type="button"
          onClick={onEditFull}
          className="-ml-2.5 h-11 sm:h-9 rounded-lg px-2.5 text-[13px] font-medium text-text-default hover:bg-surface hover:text-text-strong transition-colors duration-150 cursor-pointer"
        >
          Edit full event
        </button>
        <span className="flex-1" />
        <Button type="button" variant="secondary" onClick={onSkip} className="rounded-[10px]">
          Skip for now
        </Button>
        <button
          type="submit"
          disabled={picked === 'custom' && !custom.dateStart}
          className="inline-flex h-11 sm:h-9 items-center gap-2 rounded-[10px] bg-text-strong px-4 text-sm font-semibold text-canvas shadow-sm transition-opacity duration-150 hover:opacity-90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
        >
          Confirm
          <ArrowRight size={14} aria-hidden="true" />
        </button>
      </div>
    </form>
  )
}

/**
 * Walks through flagged dates one at a time: why it was flagged, what the
 * source text said, and a single question (keep it, keep only what's certain,
 * or pick another date). Skipped items come back at the end of the session.
 */
export default function ReviewPanel({ onEditEvent }) {
  const events = useTimelineStore((s) => s.events)
  const reviewMode = useTimelineStore((s) => s.reviewMode)
  const toggleReviewMode = useTimelineStore((s) => s.toggleReviewMode)
  const updateEvent = useTimelineStore((s) => s.updateEvent)
  const flagged = getFlaggedEvents(events)

  const [skipped, setSkipped] = useState([])
  const [resolved, setResolved] = useState(0)

  // Fresh session every time the panel opens
  const [prevOpen, setPrevOpen] = useState(reviewMode)
  if (reviewMode !== prevOpen) {
    setPrevOpen(reviewMode)
    if (reviewMode) {
      setSkipped([])
      setResolved(0)
    }
  }

  const skippedStillFlagged = flagged.filter((e) => skipped.includes(e.id)).length
  const current = flagged.find((e) => !skipped.includes(e.id)) ?? null
  const total = resolved + flagged.length
  const position = resolved + skippedStillFlagged + 1

  const currentId = current?.id ?? null

  const handleConfirm = (date) => {
    if (!currentId) return
    updateEvent(currentId, { ...date, flagged: false, flagReason: null })
    setResolved((n) => n + 1)
  }

  const handleSkip = () => {
    if (currentId) setSkipped((s) => [...s, currentId])
  }

  const handleEditFull = () => {
    if (!current) return
    toggleReviewMode()
    onEditEvent?.(current)
  }

  return (
    <AnimatedModal
      label="Check flagged dates"
      open={reviewMode}
      onClose={toggleReviewMode}
      className="bg-surface sm:rounded-2xl shadow-2xl max-w-xl w-full sm:mx-4 max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden modal-surface"
    >
      <div className="flex shrink-0 items-center justify-between gap-3 px-5 sm:px-6 pt-3 sm:pt-4 pb-1">
        <div className="flex items-center gap-3">
          <h2 className="text-xs font-medium text-text-muted">Check dates</h2>
          {current && <Progress position={position} total={total} />}
        </div>
        <Button variant="ghost" size="icon" onClick={toggleReviewMode} aria-label="Close" className="-mr-2">
          <X size={16} />
        </Button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {current ? (
          <motion.div
            key={currentId}
            className="flex min-h-0 flex-1 flex-col"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            transition={{ duration: MOTION_DURATION.FAST, ease: EASE_OUT }}
          >
            <ReviewItem
              event={current}
              onConfirm={handleConfirm}
              onSkip={handleSkip}
              onEditFull={handleEditFull}
            />
          </motion.div>
        ) : (
          <motion.div
            key="done"
            className="flex flex-col items-center gap-3 px-6 pt-6 pb-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            role="status"
          >
            <CheckCircle2 size={36} className="text-success" aria-hidden="true" />
            <div className="space-y-1">
              <p className="font-serif text-xl font-semibold text-text-strong">
                {skippedStillFlagged > 0 ? 'That’s everything for now' : 'All dates checked'}
              </p>
              <p className="text-sm text-text-default">
                {resolved > 0 && `${pluralize(resolved, 'date')} confirmed. `}
                {skippedStillFlagged > 0 && `${pluralize(skippedStillFlagged, 'date')} skipped.`}
              </p>
            </div>
            <div className="mt-2 flex gap-2">
              {skippedStillFlagged > 0 && (
                <Button variant="secondary" onClick={() => setSkipped([])} className="rounded-[10px]">
                  Go through skipped
                </Button>
              )}
              <Button variant="secondary" onClick={toggleReviewMode} className="rounded-[10px]">
                Done
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AnimatedModal>
  )
}
