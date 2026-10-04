import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useHotkeys } from 'react-hotkeys-hook'
import { X, Flag, ArrowRight, Calendar, CheckCircle2 } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { getFlaggedEvents } from '@/store/selectors'
import AnimatedModal from '@/components/shared/AnimatedModal'
import DatePicker from '@/components/shared/DatePicker'
import { Button } from '@/components/ui/Button'
import { DATE_PRECISION_OPTIONS, MOTION_DURATION, EASE_OUT } from '@/utils/constants'
import { formatEventDate, getReviewChoices, safeDateCompare } from '@/utils/dateUtils'
import { pluralize } from '@/utils/ui'

const PRECISION_LABEL = Object.fromEntries(DATE_PRECISION_OPTIONS.map((o) => [o.value, o.short]))

const choiceCls = (selected) =>
  `flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors duration-150 cursor-pointer has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-focus-ring ${
    selected
      ? 'border-[1.5px] border-text-strong bg-surface-raised px-[11.5px] py-[9.5px]'
      : 'border border-gray-200 bg-surface hover:border-gray-300'
  }`

// Number key that picks this answer; filled when selected
function ChoiceKey({ n, selected }) {
  return (
    <span
      aria-hidden="true"
      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold ${
        selected ? 'bg-text-strong text-canvas' : 'border border-gray-200 text-text-muted'
      }`}
    >
      {n}
    </span>
  )
}

function Progress({ position, total }) {
  if (total < 2) return null
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex gap-1" aria-hidden="true">
        {Array.from({ length: Math.min(total, 12) }, (_, i) => (
          <span
            key={i}
            className={`h-1 w-[18px] rounded-full ${i < Math.min(position, 12) ? 'bg-flag' : 'bg-gray-200'}`}
          />
        ))}
      </span>
      <span className="text-xs text-text-default">
        {position} of {total}
      </span>
    </span>
  )
}

// The dated events either side of this one, for "Between X and Y" context
function getNeighbors(events, event) {
  const dated = events
    .filter((e) => e.id !== event.id && e.dateStart)
    .sort((a, b) => safeDateCompare(a.dateStart, b.dateStart))
  let before = null
  let after = null
  for (const e of dated) {
    if (safeDateCompare(e.dateStart, event.dateStart) <= 0) before = e
    else if (!after) after = e
  }
  return { before, after }
}

const neighborLabel = (e) => `${e.title} (${formatEventDate({ dateStart: e.dateStart, datePrecision: e.datePrecision })})`

function ReviewItem({ event, events, onConfirm, onSkip, onEditFull }) {
  const choices = getReviewChoices(event)
  const [picked, setPicked] = useState(choices[0]?.key ?? 'custom')
  const [custom, setCustom] = useState({ dateStart: event.dateStart || '', datePrecision: event.datePrecision || 'day' })
  const options = [...choices.map((c) => c.key), 'custom']

  const quote = event.dateRaw && event.dateRaw !== event.dateStart ? event.dateRaw : null
  const { before, after } = getNeighbors(events, event)
  const context = before && after
    ? `Between ${neighborLabel(before)} and ${neighborLabel(after)}.`
    : before
      ? `After ${neighborLabel(before)}.`
      : after
        ? `Before ${neighborLabel(after)}.`
        : null

  // 1–9 pick an answer; the radios are inputs, so allow form tags but not
  // while typing in a text field
  useHotkeys('1,2,3,4,5,6,7,8,9', (e) => {
    if (e.target instanceof HTMLInputElement && e.target.type !== 'radio') return
    const key = options[parseInt(e.key, 10) - 1]
    if (key) setPicked(key)
  }, { enableOnFormTags: true })

  const pickedChoice = picked === 'custom' ? custom : choices.find((c) => c.key === picked)
  const pickedLabel = pickedChoice?.dateStart ? formatEventDate(pickedChoice) : null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!pickedChoice?.dateStart) return
    const date = { dateStart: pickedChoice.dateStart, datePrecision: pickedChoice.datePrecision }
    if ('dateEnd' in pickedChoice) date.dateEnd = pickedChoice.dateEnd
    onConfirm(date)
  }

  return (
    <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-4 overflow-y-auto px-5 sm:px-6 pb-5 app-scroll">
        <h3 className="font-serif text-2xl font-semibold leading-tight text-text-strong">{event.title}</h3>

        <figure className="m-0 space-y-1.5 rounded-xl bg-flag-light px-4 py-3.5">
          {quote ? (
            <>
              <span className="block text-[11px] font-semibold uppercase tracking-wider text-rose-700 dark:text-rose-300">
                Your text says
              </span>
              <blockquote className="m-0 font-serif text-lg italic leading-snug text-rose-900 dark:text-rose-100">
                &ldquo;{quote}&rdquo;
              </blockquote>
            </>
          ) : (
            <span className="flex items-center gap-2 text-[13px] font-semibold text-rose-800 dark:text-rose-200">
              <Flag size={14} className="shrink-0 text-flag" aria-hidden="true" />
              Flagged by the import
            </span>
          )}
          <figcaption className="text-xs leading-relaxed text-rose-800 dark:text-rose-200">
            {event.flagReason || 'The date may be ambiguous.'}
            {context && <span className="block text-rose-800/80 dark:text-rose-200/80">{context}</span>}
          </figcaption>
        </figure>

        <fieldset className="space-y-1.5">
          <legend className="mb-2 text-xs font-semibold text-text-default">Which date is right?</legend>
          {choices.map((choice, i) => (
            <label key={choice.key} className={choiceCls(picked === choice.key)}>
              <input
                type="radio"
                name="date-choice"
                value={choice.key}
                checked={picked === choice.key}
                onChange={() => setPicked(choice.key)}
                aria-keyshortcuts={String(i + 1)}
                className="peer sr-only"
              />
              <ChoiceKey n={i + 1} selected={picked === choice.key} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="font-serif text-[17px] font-semibold text-text-strong">{formatEventDate(choice)}</span>
                <span className="text-xs text-text-default">{choice.hint}</span>
              </span>
              {choice.badge ? (
                <span className="shrink-0 rounded-full bg-flag-light px-2.5 py-0.5 text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                  Matches &ldquo;{choice.badge}&rdquo;
                </span>
              ) : (
                <span className="shrink-0 rounded-full border border-gray-200 px-2 py-0.5 text-[11px] font-medium text-text-default">
                  {PRECISION_LABEL[choice.datePrecision]}
                </span>
              )}
            </label>
          ))}
          <label className={choiceCls(picked === 'custom')}>
            <input
              type="radio"
              name="date-choice"
              value="custom"
              checked={picked === 'custom'}
              onChange={() => setPicked('custom')}
              aria-keyshortcuts={String(choices.length + 1)}
              className="peer sr-only"
            />
            <ChoiceKey n={choices.length + 1} selected={picked === 'custom'} />
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
          Skip
        </Button>
        <button
          type="submit"
          disabled={!pickedLabel}
          className="inline-flex h-11 sm:h-9 max-w-full items-center gap-2 rounded-[10px] bg-text-strong px-4 text-sm font-semibold text-canvas shadow-sm transition-opacity duration-150 hover:opacity-90 disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
        >
          <span className="truncate">{pickedLabel ? `Use ${pickedLabel}` : 'Confirm'}</span>
          <ArrowRight size={14} className="shrink-0" aria-hidden="true" />
        </button>
      </div>
    </form>
  )
}

/**
 * Walks through flagged dates one at a time: what the source text said, why
 * it was flagged, the events either side, and a single question — dates read
 * from the source phrase first ("summer" → June–August), then keep it, keep
 * only what's certain, or pick another date. Number keys pick an answer. Skipped items come back at the end of the session.
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
              events={events}
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
