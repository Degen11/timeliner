import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ArrowRight, FileText, Sparkles, CheckCircle2, BookOpen, Calendar, Users, Link, X, Check, AlertTriangle, MapPin, RotateCw } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { findNearDuplicates } from '@/utils/dedupeHelpers'
import { MAX_TEXT_LENGTH, SAMPLE_TEXT, SPRING, EASE_OUT, SUCCESS_DISPLAY_MS } from '@/utils/constants'
import { Button } from '@/components/ui/Button'
import TextInput from '@/components/input/TextInput'
import PhotoUpload from '@/components/input/PhotoUpload'
import Badge from '@/components/shared/Badge'
import { formatEventDate } from '@/utils/dateUtils'

const STEP_INTERVAL_MS = 2500
const EVENT_REVEAL_DELAY_MS = 120

const PARSING_STEPS = [
  { icon: BookOpen, label: 'Reading your text\u2026' },
  { icon: Calendar, label: 'Finding dates and events\u2026' },
  { icon: Users, label: 'Identifying people\u2026' },
  { icon: Link, label: 'Building connections\u2026' },
  { icon: Sparkles, label: 'Assembling timeline\u2026' },
]

function ParsingOverlayContent({ wordCount }) {
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((i) => (i < PARSING_STEPS.length - 1 ? i + 1 : i))
    }, STEP_INTERVAL_MS)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center gap-6 text-center px-6">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles size={36} className="text-secondary" />
        </motion.div>
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-text-strong">
            Creating your timeline
          </h2>
          {wordCount > 0 && (
            <p className="text-xs text-text-muted/70">
              Analyzing {wordCount.toLocaleString()} word{wordCount !== 1 ? 's' : ''}&hellip;
            </p>
          )}
          <div className="h-6">
            <AnimatePresence mode="wait">
              <motion.p
                key={stepIndex}
                className="text-sm text-text-muted flex items-center justify-center gap-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                {(() => { const Icon = PARSING_STEPS[stepIndex].icon; return <Icon size={14} /> })()}
                {PARSING_STEPS[stepIndex].label}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
        <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-secondary rounded-full"
            initial={{ width: '5%' }}
            animate={{ width: `${Math.min(15 + stepIndex * 20, 90)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  )
}

function SuccessOverlay({ eventCount, duplicatesSkipped = 0, onContinue }) {
  useEffect(() => {
    const timer = setTimeout(onContinue, SUCCESS_DISPLAY_MS)
    return () => clearTimeout(timer)
  }, [onContinue])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm cursor-pointer"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onContinue}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onContinue() }}
    >
      <motion.div
        className="flex flex-col items-center gap-4 text-center px-6"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ ...SPRING.BOUNCY, delay: 0.1 }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ ...SPRING.BOUNCY, delay: 0.15 }}
        >
          <CheckCircle2 size={48} className="text-success" />
        </motion.div>
        <div>
          <h2 className="text-base font-semibold text-text-strong mb-1">
            Timeline ready!
          </h2>
          <p className="text-sm text-text-muted">
            {eventCount} event{eventCount !== 1 ? 's' : ''} extracted
          </p>
          {duplicatesSkipped > 0 && (
            <p className="text-xs text-text-muted/70 mt-0.5">
              {duplicatesSkipped} duplicate{duplicatesSkipped !== 1 ? 's' : ''} skipped
            </p>
          )}
        </div>
        <p className="text-xs text-text-muted/50 mt-2">Click to continue</p>
      </motion.div>
    </motion.div>
  )
}

function ReviewOverlay({ events, duplicatesSkipped = 0, duplicateMap = {}, onConfirm, onCancel }) {
  const [revealedCount, setRevealedCount] = useState(0)
  const [excluded, setExcluded] = useState(() => new Set(Object.keys(duplicateMap)))

  // Streaming reveal effect — show events one by one
  useEffect(() => {
    if (revealedCount >= events.length) return
    const timer = setTimeout(
      () => setRevealedCount((c) => c + 1),
      revealedCount === 0 ? 300 : EVENT_REVEAL_DELAY_MS
    )
    return () => clearTimeout(timer)
  }, [revealedCount, events.length])

  const toggleExclude = (id) => {
    setExcluded((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const includedCount = events.length - excluded.size
  const allRevealed = revealedCount >= events.length

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      <motion.div
        className="relative bg-surface rounded-2xl shadow-2xl border border-gray-200 w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col"
        initial={{ scale: 0.95, opacity: 0, y: 16 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 16 }}
        transition={SPRING.GENTLE}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
              <Sparkles size={16} className="text-secondary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-text-strong">
                Review extracted events
              </h2>
              <p className="text-xs text-text-muted">
                {allRevealed ? (
                  <>
                    {includedCount} of {events.length} event{events.length !== 1 ? 's' : ''} selected
                    {duplicatesSkipped > 0 && ` \u00B7 ${duplicatesSkipped} duplicate${duplicatesSkipped !== 1 ? 's' : ''} skipped`}
                  </>
                ) : (
                  <>Extracting events\u2026 ({revealedCount} of {events.length} found)</>
                )}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-1.5 text-text-muted hover:text-text-strong hover:bg-surface-raised transition-colors cursor-pointer"
            aria-label="Cancel"
          >
            <X size={16} />
          </button>
        </div>

        {/* Event list with streaming reveal */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2 app-scroll">
          {events.slice(0, revealedCount).map((event, i) => {
            const isExcluded = excluded.has(event.id)
            return (
              <motion.div
                key={event.id}
                className={`flex items-start gap-3 rounded-xl border px-4 py-3 transition-all duration-200 ${
                  isExcluded
                    ? 'bg-gray-50 border-gray-200 grayscale opacity-40'
                    : 'bg-white border-gray-200/60'
                }`}
                initial={{ opacity: 0, x: 24, scale: 0.97 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ type: 'spring', duration: 0.4, bounce: 0.12, delay: i < 5 ? i * 0.05 : 0 }}
              >
                <button
                  onClick={() => toggleExclude(event.id)}
                  className={`mt-0.5 shrink-0 w-5 h-5 rounded flex items-center justify-center border transition-colors cursor-pointer ${
                    isExcluded
                      ? 'border-gray-300 bg-gray-100 text-gray-400'
                      : 'border-secondary bg-secondary text-white'
                  }`}
                  aria-label={isExcluded ? 'Include event' : 'Exclude event'}
                >
                  {!isExcluded && <Check size={12} />}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {event.dateStart && (
                      <span className="text-xs font-semibold text-secondary uppercase shrink-0">
                        {formatEventDate(event)}
                      </span>
                    )}
                    {event.flagged && (
                      <AlertTriangle size={11} className="text-flag shrink-0" />
                    )}
                  </div>
                  <h4 className={`text-sm font-medium ${isExcluded ? 'text-text-muted line-through' : 'text-text-strong'}`}>
                    {event.title}
                  </h4>
                  {event.description && (
                    <p className="text-xs text-text-muted mt-0.5 line-clamp-2">{event.description}</p>
                  )}
                  {duplicateMap[event.id] && (
                    <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                      <AlertTriangle size={11} className="shrink-0" />
                      Possible duplicate of &ldquo;{duplicateMap[event.id]}&rdquo;
                    </p>
                  )}
                  {(event.people?.length > 0 || event.tags?.length > 0 || event.location) && (
                    <div className="flex flex-wrap items-center gap-1 mt-1.5">
                      {event.people?.map((p) => (
                        <Badge key={p} variant="accent" small>{p}</Badge>
                      ))}
                      {event.tags?.map((t) => (
                        <Badge key={t} variant={t} small>{t}</Badge>
                      ))}
                      {event.location && (
                        <span className="flex items-center gap-0.5 text-[10px] text-text-muted">
                          <MapPin size={10} className="shrink-0" />{event.location}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}
          {!allRevealed && (
            <div className="flex items-center justify-center py-4 gap-2 text-sm text-text-muted">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles size={14} className="text-secondary" />
              </motion.div>
              Extracting event {revealedCount + 1} of {events.length}\u2026
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-gray-200 shrink-0">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              const included = events.filter((e) => !excluded.has(e.id))
              onConfirm(included)
            }}
            disabled={includedCount === 0 || !allRevealed}
          >
            <Check size={16} />
            Add {includedCount} event{includedCount !== 1 ? 's' : ''} to timeline
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function InlineImportPanel({ onDone, noWrapper = false }) {
  const [photos, setPhotos] = useState([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [successCount, setSuccessCount] = useState(0)
  const [dupeCount, setDupeCount] = useState(0)
  const pendingDone = useRef(false)
  const [reviewEvents, setReviewEvents] = useState(null)
  const [reviewAppend, setReviewAppend] = useState(false)
  const [reviewDupes, setReviewDupes] = useState(0)
  const [reviewDupeMap, setReviewDupeMap] = useState({})

  const hasExisting = useTimelineStore((s) => s.events.length > 0)
  const setEvents = useTimelineStore((s) => s.setEvents)
  const appendEvents = useTimelineStore((s) => s.appendEvents)
  const addToPhotoMap = useTimelineStore((s) => s.addToPhotoMap)
  const isParsing = useTimelineStore((s) => s.isParsing)
  const setIsParsing = useTimelineStore((s) => s.setIsParsing)
  const parseError = useTimelineStore((s) => s.parseError)
  const setParseError = useTimelineStore((s) => s.setParseError)
  const draftText = useTimelineStore((s) => s.draftText)
  const setDraftText = useTimelineStore((s) => s.setDraftText)
  const showToast = useTimelineStore((s) => s.showToast)
  const createNewTimeline = useTimelineStore((s) => s.createNewTimeline)
  const hasText = draftText.trim().length > 0
  const hasPhotos = photos.length > 0
  const isOverLimit = draftText.length > MAX_TEXT_LENGTH
  const canSubmit = (hasText || hasPhotos) && !isParsing && !isOverLimit

  const storeUploadedPhotos = async () => {
    if (photos.length === 0) return
    const entries = {}
    await Promise.all(
      photos.map(
        (photo) =>
          new Promise((resolve) => {
            const reader = new FileReader()
            reader.onloadend = () => {
              entries[photo.name] = reader.result
              resolve()
            }
            reader.readAsDataURL(photo.file)
          })
      )
    )
    addToPhotoMap(entries)
  }

  const handleParse = async (append) => {
    if (!canSubmit) return

    setIsParsing(true)
    setParseError(null)

    try {
      if (!hasText && hasPhotos && hasExisting) {
        await storeUploadedPhotos()
        showToast(`Added ${photos.length} photo${photos.length !== 1 ? 's' : ''} to your library`)
        setPhotos([])
        setIsParsing(false)
        onDone?.()
        return
      }

      const photoFilenames = photos.map((p) => p.name)

      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: draftText, photoFilenames }),
      })

      if (!res.ok) {
        let message = `Parsing failed (${res.status})`
        try {
          const errData = await res.json()
          if (errData.error) message = errData.error
        } catch {
          // Response wasn't JSON (e.g. HTML error page) — use default message
        }
        throw new Error(message)
      }

      const data = await res.json()

      const newEvents = data.events || []

      await storeUploadedPhotos()

      setIsParsing(false)

      // Run duplicate detection before showing review so users see matches
      const existingEvents = useTimelineStore.getState().events
      const dupes = append ? findNearDuplicates(newEvents, existingEvents) : []
      const dupeMap = {}
      for (const { newEvent, existing } of dupes) {
        dupeMap[newEvent.id] = existing.title
      }

      // Show review overlay instead of auto-committing
      setReviewEvents(newEvents)
      setReviewAppend(append)
      setReviewDupes(dupes.length)
      setReviewDupeMap(dupeMap)
    } catch (err) {
      setParseError(err.message)
      setIsParsing(false)
    }
  }

  const handleSuccessContinue = () => {
    if (pendingDone.current) {
      pendingDone.current = false
      setShowSuccess(false)
      onDone?.()
    }
  }

  const handleReviewConfirm = (includedEvents) => {
    let skipped = 0
    if (reviewAppend) {
      const result = appendEvents(includedEvents)
      if (result) skipped = result.duplicatesSkipped
    } else {
      setEvents(includedEvents)
    }

    setDraftText('')
    setPhotos([])
    setReviewEvents(null)

    setDupeCount(skipped)
    setSuccessCount(includedEvents.length - skipped)
    setShowSuccess(true)
    pendingDone.current = true
  }

  const handleReviewCancel = () => {
    setReviewEvents(null)
  }

  const handleTrySample = () => {
    setDraftText(SAMPLE_TEXT)
  }

  const handleCreateNew = async () => {
    await createNewTimeline('New Timeline')
    await handleParse(false)
  }

  const textAndError = (
    <>
      <TextInput
        value={draftText}
        onChange={setDraftText}
        onSubmit={() => (hasExisting ? handleParse(true) : handleParse(false))}
        disabled={!canSubmit}
        onTrySample={hasExisting ? undefined : handleTrySample}
        autoFocus={!noWrapper}
      />

      <AnimatePresence>
        {parseError && (
          <motion.div
            className="flex items-center justify-between gap-3 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-error mt-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <span className="min-w-0">{parseError}</span>
            <button
              type="button"
              onClick={() => (hasExisting ? handleParse(true) : handleParse(false))}
              disabled={!canSubmit}
              className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-error transition-colors duration-150 hover:bg-red-100 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
            >
              <RotateCw size={13} className={isParsing ? 'animate-spin' : ''} />
              Try again
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )

  const actionButtons = (
    <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200 flex-wrap">
      {hasExisting ? (
        <>
          <Button onClick={() => handleParse(true)} disabled={!canSubmit} size="lg">
            {isParsing ? (
              <>
                <span className="animate-spin inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                Extracting events&hellip;
              </>
            ) : (
              <>
                <Plus size={16} />
                Add to Timeline
              </>
            )}
          </Button>
          <Button variant="secondary" onClick={handleCreateNew} disabled={!canSubmit} size="lg">
            <FileText size={16} />
            Create New Timeline
          </Button>
        </>
      ) : (
        <>
          <Button onClick={() => handleParse(false)} disabled={!canSubmit} size="lg">
            {isParsing ? (
              <>
                <span className="animate-spin inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                Extracting events&hellip;
              </>
            ) : (
              <>
                <ArrowRight size={16} />
                Generate Timeline
              </>
            )}
          </Button>
          {!hasText && (
            <button
              onClick={handleTrySample}
              className="text-sm text-secondary hover:underline cursor-pointer"
            >
              Use sample text
            </button>
          )}
        </>
      )}
    </div>
  )

  const photoSection = <PhotoUpload photos={photos} onPhotosChange={setPhotos} />

  // Determine the current overlay phase — only one shows at a time.
  // mode="wait" ensures the exiting overlay fully animates out before the
  // entering one mounts, preventing visual overlap between phases.
  const overlayPhase = isParsing && hasText
    ? 'parsing'
    : reviewEvents
      ? 'review'
      : showSuccess
        ? 'success'
        : null

  const overlays = createPortal(
    <AnimatePresence mode="wait">
      {overlayPhase === 'parsing' && (
        <ParsingOverlayContent key="parsing" wordCount={draftText.trim().split(/\s+/).filter(Boolean).length} />
      )}
      {overlayPhase === 'review' && (
        <ReviewOverlay
          key="review"
          events={reviewEvents}
          duplicatesSkipped={reviewDupes}
          duplicateMap={reviewDupeMap}
          onConfirm={handleReviewConfirm}
          onCancel={handleReviewCancel}
        />
      )}
      {overlayPhase === 'success' && (
        <SuccessOverlay
          key="success"
          eventCount={successCount}
          duplicatesSkipped={dupeCount}
          onContinue={handleSuccessContinue}
        />
      )}
    </AnimatePresence>,
    document.body
  )

  return (
    <>
      {noWrapper ? (
        <div>
          {textAndError}
          <div className="mt-6">{photoSection}</div>
          {actionButtons}
        </div>
      ) : (
        <div className="max-w-3xl mx-auto">
          <div className="rounded-xl bg-surface border border-gray-200 p-4 sm:p-6 lg:p-8 shadow-sm">
            {textAndError}
            {actionButtons}
          </div>
          <div className="rounded-xl bg-surface border border-gray-200 p-4 sm:p-6 lg:p-8 shadow-sm mt-4 sm:mt-6">
            {photoSection}
          </div>
        </div>
      )}
      {overlays}
    </>
  )
}
