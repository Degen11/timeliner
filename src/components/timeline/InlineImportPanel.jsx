import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, ArrowRight, FileText, Sparkles, CheckCircle2, BookOpen, Calendar, Users, Link, X, Check, AlertTriangle, MapPin, RotateCw, Eye, Braces, Table, Image as ImageIcon } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { findNearDuplicates } from '@/utils/dedupeHelpers'
import { MAX_TEXT_LENGTH, SAMPLE_TEXT, SAMPLE_TEXTS, SPRING, SUCCESS_DISPLAY_MS, TOAST_DURATION } from '@/utils/constants'
import { Button } from '@/components/ui/Button'
import TextInput from '@/components/input/TextInput'
import PhotoUpload from '@/components/input/PhotoUpload'
import Badge from '@/components/shared/Badge'
import { formatEventDate, countDateMentions } from '@/utils/dateUtils'
import { pluralize } from '@/utils/ui'
import useFileImport from '@/hooks/useFileImport'

const FILE_KINDS = [
  { kind: 'csv', label: 'Spreadsheet', hint: '.csv with a dateStart column', icon: Table },
  { kind: 'json', label: 'Timeliner export', hint: '.json from Export & share', icon: Braces },
  { kind: 'ics', label: 'Calendar', hint: '.ics from Google, Apple or Outlook', icon: Calendar },
  { kind: 'markdown', label: 'Markdown notes', hint: '.md with dated headings or lists', icon: FileText },
]

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
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex flex-col items-center gap-6 text-center px-6" role="status" aria-live="polite">
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
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm cursor-pointer"
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
      className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
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
                  <>Extracting events… ({revealedCount} of {events.length} found)</>
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
                    : 'bg-surface border-gray-200/60'
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
              Extracting event {revealedCount + 1} of {events.length}…
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

export default function InlineImportPanel({ onDone, noWrapper = false, variant = 'inline' }) {
  const [importTab, setImportTab] = useState('paste')
  const [destination, setDestination] = useState('current')
  const [showPhotos, setShowPhotos] = useState(false)
  const fileImport = useFileImport({ onImported: () => onDone?.() })
  const activeTimelineName = useTimelineStore(
    (s) => s.timelines.find((t) => t.id === s.activeTimelineId)?.name || 'This timeline'
  )
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

      if (data.truncated) {
        showToast(
          `Extracted ${newEvents.length} events, but the text was long enough that some may be missing — try importing it in smaller sections.`,
          { variant: 'warning', duration: TOAST_DURATION.LONG }
        )
      }

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

  const errorBanner = (
      <AnimatePresence>
      {parseError && (
        <motion.div
          className="flex items-center justify-between gap-3 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 px-4 py-3 text-sm text-error mt-4"
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
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-red-200 dark:border-red-500/20 bg-white dark:bg-surface px-2.5 py-1.5 text-xs font-semibold text-error transition-colors duration-150 hover:bg-red-100 dark:hover:bg-red-500/10 disabled:opacity-50 disabled:pointer-events-none cursor-pointer"
          >
            <RotateCw size={13} className={isParsing ? 'animate-spin' : ''} />
            Try again
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )

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

      {errorBanner}
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

  // ── Modal variant (import from inside an open timeline) ──
  const wordCount = draftText.trim() ? draftText.trim().split(/\s+/).length : 0
  const dateMentions = countDateMentions(draftText)
  const submitModal = () => {
    if (!canSubmit) return
    if (!hasExisting) handleParse(false)
    else if (destination === 'new') handleCreateNew()
    else handleParse(true)
  }

  const modalTabCls = (active) =>
    `-mb-px flex h-11 sm:h-10 items-center gap-2 border-b-2 px-3 text-sm transition-colors duration-150 cursor-pointer ${
      active ? 'border-text-strong font-semibold text-text-strong' : 'border-transparent text-text-default hover:text-text-strong'
    }`

  const modalBody = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div role="tablist" aria-label="Import source" className="flex shrink-0 gap-1 border-b border-gray-200 px-5 sm:px-6">
        <button
          role="tab"
          id="import-tab-paste"
          aria-selected={importTab === 'paste'}
          aria-controls="import-panel-paste"
          onClick={() => setImportTab('paste')}
          className={modalTabCls(importTab === 'paste')}
        >
          Paste text
        </button>
        <button
          role="tab"
          id="import-tab-file"
          aria-selected={importTab === 'file'}
          aria-controls="import-panel-file"
          onClick={() => setImportTab('file')}
          className={modalTabCls(importTab === 'file')}
        >
          Upload a file
          <span className="hidden sm:inline text-xs font-normal text-text-muted">CSV, JSON, ICS, Markdown</span>
        </button>
      </div>

      {importTab === 'paste' ? (
        <>
          <div
            role="tabpanel"
            id="import-panel-paste"
            aria-labelledby="import-tab-paste"
            className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto px-5 sm:px-6 pt-4 pb-5 app-scroll"
          >
            <div
              className={`flex min-h-[15rem] flex-1 flex-col rounded-xl border bg-surface transition-colors focus-within:ring-2 ${
                isOverLimit
                  ? 'border-error focus-within:ring-error/15'
                  : 'border-gray-200 focus-within:border-secondary focus-within:ring-secondary/15'
              }`}
            >
              <label htmlFor="import-text" className="sr-only">Text to import</label>
              <textarea
                id="import-text"
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                    e.preventDefault()
                    submitModal()
                  }
                }}
                placeholder="Paste a biography, journal entries, family history, meeting notes… anything with dates in it."
                aria-describedby="import-text-meta"
                className="min-h-[10rem] flex-1 resize-none rounded-xl bg-transparent px-4 py-3.5 text-base leading-relaxed text-text-strong placeholder:text-text-muted focus:outline-none"
                autoFocus
              />
              <div className="flex flex-wrap items-center gap-2 border-t border-dashed border-gray-200 px-3.5 py-2.5 text-[13px] text-text-default">
                {hasText ? (
                  <span id="import-text-meta" aria-live="polite" className={isOverLimit ? 'font-medium text-error' : 'text-text-muted'}>
                    {isOverLimit
                      ? `${draftText.length.toLocaleString()} / ${MAX_TEXT_LENGTH.toLocaleString()} characters, too long`
                      : `${pluralize(wordCount, 'word')} · ${pluralize(dateMentions, 'date')} spotted`}
                  </span>
                ) : (
                  <>
                    <span id="import-text-meta">Nothing to paste? Try a sample:</span>
                    {SAMPLE_TEXTS.map(({ label, text }) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => setDraftText(text)}
                        className="h-8 rounded-full border border-gray-200 bg-surface-raised px-3 text-[13px] text-text-strong hover:bg-soft-accent transition-colors duration-150 cursor-pointer"
                      >
                        {label}
                      </button>
                    ))}
                  </>
                )}
                <span className="flex-1" />
                <button
                  type="button"
                  onClick={() => setShowPhotos((v) => !v)}
                  aria-expanded={showPhotos || hasPhotos}
                  className="flex h-8 items-center gap-1.5 rounded-lg bg-soft-accent px-2.5 text-xs font-medium text-text-default hover:text-text-strong dark:bg-surface-raised transition-colors duration-150 cursor-pointer"
                >
                  <ImageIcon size={13} aria-hidden="true" />
                  {hasPhotos ? pluralize(photos.length, 'photo') : 'Attach photos'}
                </button>
              </div>
            </div>
            {(showPhotos || hasPhotos) && photoSection}
            {errorBanner}
          </div>

          <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-t border-gray-200 bg-surface-raised px-5 sm:px-6 py-3">
            {hasExisting ? (
              <fieldset className="flex items-center gap-2.5">
                <legend className="sr-only">Add events to</legend>
                <span className="text-[13px] text-text-default" aria-hidden="true">Add to</span>
                <div className="inline-flex rounded-[10px] bg-soft-accent p-[3px] dark:bg-surface">
                  {[['current', activeTimelineName], ['new', 'New timeline']].map(([value, label]) => (
                    <label key={value} className="relative">
                      <input
                        type="radio"
                        name="import-destination"
                        value={value}
                        checked={destination === value}
                        onChange={() => setDestination(value)}
                        className="peer sr-only"
                      />
                      <span className="flex h-8 max-w-[11rem] items-center truncate rounded-[7px] px-3 text-[13px] text-text-default transition-colors duration-150 cursor-pointer peer-checked:bg-surface peer-checked:font-medium peer-checked:text-text-strong peer-checked:shadow-sm peer-focus-visible:ring-2 peer-focus-visible:ring-focus-ring dark:peer-checked:bg-surface-raised">
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : (
              <span className="text-[13px] text-text-default">Creates your timeline</span>
            )}
            <span className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-text-muted">
              <Eye size={13} className="shrink-0" aria-hidden="true" />
              You'll review each event first
            </span>
            <button
              type="button"
              onClick={submitModal}
              disabled={!canSubmit}
              className="inline-flex h-11 sm:h-10 items-center gap-2 rounded-[10px] bg-text-strong px-4 text-sm font-semibold text-canvas shadow-sm transition-opacity duration-150 hover:opacity-90 disabled:bg-gray-200 disabled:text-text-muted disabled:shadow-none cursor-pointer disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2"
            >
              {isParsing ? (
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" aria-hidden="true" />
              ) : (
                <Sparkles size={15} className={canSubmit ? 'text-orange-400 dark:text-orange-600' : ''} aria-hidden="true" />
              )}
              {isParsing ? 'Extracting…' : 'Extract events'}
              <kbd className="ml-0.5 hidden sm:inline rounded-[5px] border border-current/30 px-1.5 font-sans text-[11px] font-medium opacity-70" aria-hidden="true">
                {navigator.platform?.includes('Mac') ? '⌘↵' : 'Ctrl+↵'}
              </kbd>
            </button>
          </div>
        </>
      ) : (
        <div
          role="tabpanel"
          id="import-panel-file"
          aria-labelledby="import-tab-file"
          className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 app-scroll"
        >
          <p className="mb-4 text-sm text-text-default">
            Files that already have dates are imported directly, without AI extraction.
            {hasExisting && ` Events are added to ${activeTimelineName}.`}
          </p>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {FILE_KINDS.map(({ kind, label, hint, icon: Icon }) => (
              <button
                key={kind}
                type="button"
                onClick={() => fileImport.pick(kind)}
                className="flex items-start gap-3 rounded-xl border border-gray-200 bg-surface p-3.5 text-left transition-colors duration-150 hover:border-gray-300 hover:bg-surface-raised cursor-pointer"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-soft-accent text-text-default dark:bg-surface-raised">
                  <Icon size={16} aria-hidden="true" />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="text-sm font-semibold text-text-strong">{label}</span>
                  <span className="text-xs text-text-muted">{hint}</span>
                </span>
              </button>
            ))}
          </div>
          {fileImport.error && (
            <p role="alert" className="mt-3 flex items-start gap-1.5 text-sm text-error">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" aria-hidden="true" />
              {fileImport.error}
            </p>
          )}
          {fileImport.inputs}
        </div>
      )}
    </div>
  )

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

  if (variant === 'modal') {
    return (
      <>
        {modalBody}
        {overlays}
      </>
    )
  }

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
