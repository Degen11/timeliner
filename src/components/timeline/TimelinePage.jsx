import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars -- motion is used as JSX motion.div
import {
  List,
  GripHorizontal,
  LayoutGrid,
  FileText,
  Plus,
  SlidersHorizontal,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Undo2,
  Redo2,
  Upload,
  ImagePlus,
  Type,
  FileUp,
  Pencil,
  Check,
  X,
  ClipboardPaste,
  Share2,
} from 'lucide-react'
import Papa from 'papaparse'
import useTimelineStore from '@/store/useTimelineStore'
import { getFilteredEvents, getSortedEvents } from '@/store/selectors'
import { VIEWS, MAX_TEXT_LENGTH, SAMPLE_TEXT } from '@/utils/constants'
import { normalizeCSVEvent, normalizeJSONEvents } from '@/utils/importHelpers'
import { printTimeline } from '@/utils/exportHelpers'
import Button from '@/components/shared/Button'
import EmptyState from '@/components/shared/EmptyState'
import Sidebar, { SidebarDrawer } from '@/components/layout/Sidebar'
import ReviewPanel from '@/components/review/ReviewPanel'
import PhotoLibrary from './PhotoLibrary'
import VerticalView from './VerticalView'
import HorizontalView from './HorizontalView'
import GridView from './GridView'
import AddEventModal from './AddEventModal'
import ImportMenu from './ImportMenu'
import TextInput from '@/components/input/TextInput'
import PhotoUpload from '@/components/input/PhotoUpload'
import AnimatedModal from '@/components/shared/AnimatedModal'
import Tooltip from '@/components/shared/Tooltip'
import AnimatedCount from '@/components/shared/AnimatedCount'
import { useToolbar } from '@/components/layout/Shell'
import useKeyboardShortcutsTimeline from '@/hooks/useKeyboardShortcutsTimeline'

const VIEW_OPTIONS = [
  { key: VIEWS.VERTICAL, label: 'Vertical', icon: List, shortcut: '1' },
  { key: VIEWS.HORIZONTAL, label: 'Horizontal', icon: GripHorizontal, shortcut: '2' },
  { key: VIEWS.GRID, label: 'Grid', icon: LayoutGrid, shortcut: '3' },
]

const PAGE_SIZE = 50

const PARSING_STEPS = [
  'Reading your text\u2026',
  'Finding dates and events\u2026',
  'Identifying people\u2026',
  'Building connections\u2026',
  'Assembling timeline\u2026',
]

// ─── Overlays ─────────────────────────────────────────────

function ParsingOverlayContent() {
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIndex((i) => (i < PARSING_STEPS.length - 1 ? i + 1 : i))
    }, 2500)
    return () => clearInterval(interval)
  }, [])

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm"
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
          <h2 className="font-display text-xl font-semibold text-gray-900">
            Creating your timeline
          </h2>
          <div className="h-6">
            <AnimatePresence mode="wait">
              <motion.p
                key={stepIndex}
                className="text-sm text-text-muted"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
              >
                {PARSING_STEPS[stepIndex]}
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

function SuccessOverlay({ visible, eventCount, onContinue }) {
  useEffect(() => {
    if (!visible) return
    const timer = setTimeout(onContinue, 1800)
    return () => clearTimeout(timer)
  }, [visible, onContinue])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <motion.div
            className="flex flex-col items-center gap-4 text-center px-6"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.5, bounce: 0.3, delay: 0.1 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.6, bounce: 0.4, delay: 0.15 }}
            >
              <CheckCircle2 size={48} className="text-success" />
            </motion.div>
            <div>
              <h2 className="font-display text-xl font-semibold text-gray-900 mb-1">
                Timeline ready!
              </h2>
              <p className="text-sm text-text-muted">
                {eventCount} event{eventCount !== 1 ? 's' : ''} extracted
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// ─── Help & keyboard shortcuts modal ──────────────────────────────

const SHORTCUT_GROUPS = [
  {
    label: 'Views',
    items: [
      ['1', 'Vertical view'],
      ['2', 'Horizontal view'],
      ['3', 'Grid view'],
    ],
  },
  {
    label: 'Actions',
    items: [
      ['N', 'New event'],
      [navigator.platform?.includes('Mac') ? '\u2318+Z' : 'Ctrl+Z', 'Undo'],
      [navigator.platform?.includes('Mac') ? '\u2318+\u21e7+Z' : 'Ctrl+Shift+Z', 'Redo'],
      [navigator.platform?.includes('Mac') ? '\u2318+P' : 'Ctrl+P', 'Print / PDF'],
    ],
  },
  {
    label: 'Navigation',
    items: [
      ['Esc', 'Close modal / Cancel'],
      ['\u2190 \u2192', 'Photo lightbox'],
      ['Double-click', 'Edit fields inline'],
    ],
  },
]

function ShortcutsModal({ open, onClose }) {
  return (
    <AnimatedModal open={open} onClose={onClose} className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 max-h-[85vh] flex flex-col overflow-hidden">
      <div className="px-6 pt-6 pb-4 border-b border-gray-100 flex items-center justify-between shrink-0">
        <h3 className="font-display text-lg font-semibold text-gray-900">
          Help &amp; Shortcuts
        </h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>
      <div className="px-6 py-5 space-y-5 overflow-y-auto flex-1 min-h-0">
        {SHORTCUT_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="text-[11px] font-semibold text-secondary uppercase tracking-wider mb-2">{group.label}</p>
            <div className="space-y-1.5">
              {group.items.map(([key, desc]) => (
                <div key={key} className="flex items-center justify-between gap-4 py-1">
                  <span className="text-sm text-gray-600">{desc}</span>
                  <kbd className="inline-flex items-center rounded-md bg-gray-100 px-2 py-0.5 text-xs font-mono font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                    {key}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 space-y-3 shrink-0">
        <div>
          <p className="text-[11px] font-semibold text-secondary uppercase tracking-wider mb-1.5">Date Editing Tips</p>
          <ul className="space-y-1 text-xs text-gray-500">
            <li>Click a date to open the calendar picker.</li>
            <li>Pick a year, then close &rarr; saves at <span className="font-medium text-gray-600">year</span> precision.</li>
            <li>Pick a year + month, then close &rarr; saves at <span className="font-medium text-gray-600">month</span> precision.</li>
            <li>Pick year + month + day &rarr; saves at <span className="font-medium text-gray-600">day</span> precision.</li>
            <li>Use <span className="font-medium text-gray-600">+ end date</span> on an event to add a date range.</li>
          </ul>
        </div>
        <p className="text-xs text-gray-400 text-center">
          Tip: Double-click any event title, description, or date to edit it inline.
        </p>
      </div>
    </AnimatedModal>
  )
}

// ─── Inline text import panel ──────────────────────────────

function InlineImportPanel({ onDone, noWrapper = false }) {
  const [photos, setPhotos] = useState([])
  const [showSuccess, setShowSuccess] = useState(false)
  const [successCount, setSuccessCount] = useState(0)
  const pendingDone = useRef(false)

  const {
    events,
    setEvents,
    appendEvents,
    setPhotos: storePhotos,
    addToPhotoMap,
    isParsing,
    setIsParsing,
    parseError,
    setParseError,
    draftText,
    setDraftText,
    showToast,
    createNewTimeline,
  } = useTimelineStore()

  const hasExisting = events.length > 0
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
        storePhotos(photos)
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

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `Parsing failed (${res.status})`)
      }

      const newEvents = data.events || []

      await storeUploadedPhotos()

      if (append) {
        appendEvents(newEvents)
      } else {
        setEvents(newEvents)
      }

      storePhotos(photos)
      setDraftText('')
      setPhotos([])
      setIsParsing(false)

      setSuccessCount(newEvents.length)
      setShowSuccess(true)
      pendingDone.current = true
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

  const handleTrySample = () => {
    setDraftText(SAMPLE_TEXT)
  }

  const handleCreateNew = async () => {
    createNewTimeline('New Timeline')
    // Now parse into the fresh (empty) timeline — append=false since it's empty
    await handleParse(false)
  }

  // ─── Shared content pieces ───

  const textAndError = (
    <>
      <TextInput
        value={draftText}
        onChange={setDraftText}
        onSubmit={() => hasExisting ? handleParse(true) : handleParse(false)}
        disabled={!canSubmit}
        onTrySample={hasExisting ? undefined : handleTrySample}
        autoFocus={!noWrapper}
      />

      <AnimatePresence>
        {parseError && (
          <motion.div
            className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-error mt-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {parseError}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )

  const actionButtons = (
    <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-100 flex-wrap">
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

  const overlays = (
    <>
      <AnimatePresence>
        {isParsing && hasText && <ParsingOverlayContent />}
      </AnimatePresence>

      <SuccessOverlay
        visible={showSuccess}
        eventCount={successCount}
        onContinue={handleSuccessContinue}
      />

    </>
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
          <div className="rounded-2xl bg-surface border border-gray-200 p-6 lg:p-8 shadow-sm">
            {textAndError}
            {actionButtons}
          </div>
          <div className="rounded-2xl bg-surface border border-gray-200 p-6 lg:p-8 shadow-sm mt-6">
            {photoSection}
          </div>
        </div>
      )}
      {overlays}
    </>
  )
}

// ─── File import content (Upload CSV/JSON tab) ─────────────

function FileImportContent({ onDone }) {
  const [error, setError] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileRef = useRef(null)
  const events = useTimelineStore((s) => s.events)
  const appendEvents = useTimelineStore((s) => s.appendEvents)
  const setEvents = useTimelineStore((s) => s.setEvents)
  const showToast = useTimelineStore((s) => s.showToast)
  const hasExisting = events.length > 0

  const processFile = (file) => {
    setError(null)
    const ext = file.name.split('.').pop().toLowerCase()

    if (ext === 'json') {
      const reader = new FileReader()
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result)
          const newEvents = normalizeJSONEvents(data)
          if (newEvents.length === 0) {
            setError('No valid events found in JSON')
            return
          }
          if (hasExisting) {
            appendEvents(newEvents)
          } else {
            setEvents(newEvents)
          }
          showToast(`Imported ${newEvents.length} event${newEvents.length !== 1 ? 's' : ''} from JSON`)
          onDone?.()
        } catch (err) {
          setError(`Invalid JSON: ${err.message}`)
        }
      }
      reader.readAsText(file)
    } else if (ext === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            setError(`CSV error: ${results.errors[0].message}`)
            return
          }
          const newEvents = results.data.map(normalizeCSVEvent).filter((e) => e.dateStart)
          if (newEvents.length === 0) {
            setError('No valid events found in CSV (need at least a dateStart column)')
            return
          }
          if (hasExisting) {
            appendEvents(newEvents)
          } else {
            setEvents(newEvents)
          }
          showToast(`Imported ${newEvents.length} event${newEvents.length !== 1 ? 's' : ''} from CSV`)
          onDone?.()
        },
        error: (err) => setError(`CSV error: ${err.message}`),
      })
    } else {
      setError('Unsupported file type. Please use .csv or .json')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) processFile(file)
  }

  const handleChange = (e) => {
    const file = e.target.files?.[0]
    if (file) processFile(file)
    e.target.value = ''
  }

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-10 text-center transition-all ${
          isDragging
            ? 'border-secondary bg-soft-accent/50'
            : 'border-gray-200 bg-gray-50 hover:border-gray-300 hover:bg-gray-100/50'
        }`}
      >
        <Upload size={28} className="text-gray-400 mb-3" />
        <p className="text-sm text-gray-600 font-medium mb-1">
          Drag & drop a CSV or JSON file
        </p>
        <p className="text-sm text-gray-500">
          or{' '}
          <label className="text-secondary cursor-pointer hover:underline">
            browse
            <input
              ref={fileRef}
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={handleChange}
            />
          </label>
        </p>
        <div className="flex items-center gap-2 mt-4">
          <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-mono">.csv</span>
          <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded font-mono">.json</span>
        </div>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        CSV should have columns: title, dateStart, description, people, tags.
        JSON should contain an events array.
      </p>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-error mt-4">
          {error}
        </div>
      )}
    </div>
  )
}

// ─── Animated demo timeline (plays once) ────────────────────

const DEMO_EVENTS = [
  { date: 'Mar 2024', title: 'Started the project', color: 'bg-secondary' },
  { date: 'Jun 2024', title: 'First user milestone', color: 'bg-highlight' },
  { date: 'Sep 2024', title: 'Public launch day', color: 'bg-success' },
  { date: 'Dec 2024', title: 'Year in review', color: 'bg-error' },
]

function AnimatedDemoTimeline() {
  return (
    <div className="relative flex flex-col gap-0 py-2">
      {/* Animated vertical line */}
      <motion.div
        className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-secondary/20 rounded-full origin-top"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />

      {DEMO_EVENTS.map((evt, i) => (
        <motion.div
          key={i}
          className="relative flex items-start gap-4 py-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 + i * 0.4, ease: 'easeOut' }}
        >
          {/* Dot */}
          <motion.div
            className={`relative z-10 mt-1 h-[23px] w-[23px] rounded-full ${evt.color} flex items-center justify-center flex-shrink-0 shadow-sm`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5, delay: 0.4 + i * 0.4, bounce: 0.4 }}
          >
            <div className="h-2 w-2 rounded-full bg-white" />
          </motion.div>
          {/* Card */}
          <motion.div
            className="bg-white rounded-lg border border-gray-200 px-4 py-2.5 shadow-sm flex-1 min-w-0"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.5 + i * 0.4 }}
          >
            <span className="text-[10px] font-medium text-secondary/70 uppercase tracking-wider">{evt.date}</span>
            <p className="text-sm font-semibold text-text-strong leading-tight mt-0.5">{evt.title}</p>
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}

// ─── Landing page content ──────────────────────────────────

function LandingContent({ onActivate }) {
  const events = useTimelineStore((s) => s.events)
  const hasEvents = events.length > 0
  const [inputTab, setInputTab] = useState('text')

  return (
    <div className="flex flex-col items-center min-h-[60vh] py-4">
      <div className="max-w-5xl w-full">
        {/* ─── Split Hero Section ─── */}
        <div className="rounded-2xl bg-gradient-to-br from-soft-accent via-white to-soft-accent border border-gray-200/60 overflow-hidden mb-8 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Left: Animated timeline demo */}
            <div className="px-6 py-8 lg:px-10 lg:py-10 bg-gradient-to-b from-slate-50/80 to-white/50 lg:border-r border-b lg:border-b-0 border-gray-200/60">
              <motion.p
                className="text-[10px] font-semibold text-secondary uppercase tracking-widest mb-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                How it works
              </motion.p>
              <AnimatedDemoTimeline />
              <motion.div
                className="flex flex-wrap gap-2 mt-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 2.2 }}
              >
                <span className="inline-flex items-center rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-medium text-secondary">
                  No account required
                </span>
                <span className="inline-flex items-center rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-medium text-secondary">
                  Works with messy notes
                </span>
                <span className="inline-flex items-center rounded-full bg-secondary/10 px-3 py-1 text-[11px] font-medium text-secondary">
                  Export anytime
                </span>
              </motion.div>
            </div>

            {/* Right: Heading + CTA */}
            <div className="px-6 py-8 lg:px-10 lg:py-10 flex flex-col justify-center">
              <motion.h2
                className="font-display text-3xl lg:text-4xl font-bold text-text-strong tracking-tight leading-tight"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                Turn text into a&nbsp;timeline
              </motion.h2>
              <motion.p
                className="text-base text-text-muted leading-relaxed mt-3 max-w-md"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.25 }}
              >
                Paste journal entries, family history, research notes, or anything with dates.
                AI extracts events, people, and relationships into an interactive timeline.
              </motion.p>

              <motion.div
                className="mt-6 flex flex-col gap-3"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <ClipboardPaste size={16} className="text-secondary shrink-0" />
                  <span>Paste any text with dates</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Sparkles size={16} className="text-violet-500 shrink-0" />
                  <span>AI extracts events &amp; people automatically</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-text-muted">
                  <Share2 size={16} className="text-emerald-500 shrink-0" />
                  <span>Edit, filter, and share your timeline</span>
                </div>
              </motion.div>

              <motion.div
                className="mt-8"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.6 }}
              >
                <Button size="lg" onClick={() => {
                  document.getElementById('landing-input')?.scrollIntoView({ behavior: 'smooth' })
                }}>
                  <ArrowRight size={16} />
                  Get Started
                </Button>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Session restore banner */}
        {hasEvents && (
          <div className="rounded-xl bg-secondary/5 border border-secondary/20 px-5 py-4 mb-6 flex items-center justify-between gap-4 shadow-md">
            <p className="text-sm font-medium text-text-strong">
              You have {events.length} {events.length === 1 ? 'entry' : 'entries'} from a previous session
            </p>
            <Button size="sm" onClick={onActivate}>
              <RotateCcw size={14} />
              Restore Session
            </Button>
          </div>
        )}

        {/* Tabbed Input Card */}
        <div id="landing-input" className="max-w-3xl mx-auto">
          <div className="rounded-2xl bg-surface border border-gray-200 shadow-sm overflow-hidden">
            {/* Tab bar */}
            <div className="flex gap-1 p-1.5 bg-gray-100 border-b border-gray-200">
              <button
                onClick={() => setInputTab('text')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                  inputTab === 'text'
                    ? 'bg-white text-secondary shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Type size={15} />
                Paste Text
              </button>
              <button
                onClick={() => setInputTab('file')}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-all cursor-pointer ${
                  inputTab === 'file'
                    ? 'bg-white text-secondary shadow-sm border border-gray-200'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <FileUp size={15} />
                Upload CSV / JSON
              </button>
            </div>

            {/* Tab content */}
            <div className="p-6 lg:p-8">
              {inputTab === 'text' ? (
                <InlineImportPanel noWrapper onDone={onActivate} />
              ) : (
                <FileImportContent onDone={onActivate} />
              )}
            </div>
          </div>

          {/* Trust footer */}
          {!hasEvents && (
            <p className="text-center text-xs text-text-muted mt-6">
              Works with partial dates and messy notes. No sign-up needed.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Undo / Redo buttons ─────────────────────────────────
function UndoRedoButtons() {
  const canUndo = useTimelineStore((s) => s.canUndo)
  const canRedo = useTimelineStore((s) => s.canRedo)
  const undo = useTimelineStore((s) => s.undo)
  const redo = useTimelineStore((s) => s.redo)
  const isMac = navigator.platform?.includes('Mac')

  return (
    <div className="hidden sm:flex items-center gap-0.5">
      <Tooltip label="Undo" shortcut={isMac ? '\u2318Z' : 'Ctrl+Z'}>
        <button
          onClick={undo}
          disabled={!canUndo}
          className={`rounded-md p-1.5 transition-all cursor-pointer ${
            canUndo
              ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              : 'text-gray-200 cursor-default'
          }`}
        >
          <Undo2 size={15} />
        </button>
      </Tooltip>
      <Tooltip label="Redo" shortcut={isMac ? '\u2318\u21e7Z' : 'Ctrl+Shift+Z'}>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={`rounded-md p-1.5 transition-all cursor-pointer ${
            canRedo
              ? 'text-gray-500 hover:text-gray-900 hover:bg-gray-100'
              : 'text-gray-200 cursor-default'
          }`}
        >
          <Redo2 size={15} />
        </button>
      </Tooltip>
    </div>
  )
}

// ─── Toolbar content (rendered inside the header) ────────

function ToolbarContent({
  timelineActive, hasEvents, filtered, events, activeView, setActiveView,
  verticalCompact, setVerticalCompact, groupZoom, setGroupZoom,
  setAddEventOpen, showImport, setShowImport,
  setPhotoLibOpen, setDrawerOpen, timelineName, onRenameTimeline,
}) {
  const [isRenaming, setIsRenaming] = useState(false)
  const [nameInput, setNameInput] = useState(timelineName)
  const nameInputRef = useRef(null)

  useEffect(() => {
    setNameInput(timelineName)
  }, [timelineName])

  useEffect(() => {
    if (isRenaming && nameInputRef.current) {
      nameInputRef.current.focus()
      nameInputRef.current.select()
    }
  }, [isRenaming])

  const renameContainerRef = useRef(null)

  const handleSaveName = () => {
    const trimmed = nameInput.trim()
    if (trimmed && trimmed !== timelineName) {
      onRenameTimeline(trimmed)
    } else {
      setNameInput(timelineName)
    }
    setIsRenaming(false)
  }

  const handleCancelRename = () => {
    setNameInput(timelineName)
    setIsRenaming(false)
  }

  const handleNameBlur = (e) => {
    // If focus moved to another element within the rename container (save/cancel buttons), do nothing
    if (renameContainerRef.current?.contains(e.relatedTarget)) return
    handleSaveName()
  }

  const handleNameKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); handleSaveName() }
    if (e.key === 'Escape') handleCancelRename()
  }

  if (!timelineActive || !hasEvents) return null

  return (
    <div className="flex items-center justify-between gap-3 flex-1 min-w-0">
      {/* Left: Mobile drawer trigger */}
      <div className="flex items-center gap-3 shrink-0">
        <Tooltip label="Filters">
          <button
            onClick={() => setDrawerOpen(true)}
            className="lg:hidden flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <SlidersHorizontal size={14} />
            <span>Filters</span>
          </button>
        </Tooltip>
      </div>

      {/* Center: Timeline name + event count */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="min-w-0">
          {isRenaming ? (
            <div ref={renameContainerRef} className="flex items-center gap-1">
              <input
                ref={nameInputRef}
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={handleNameKeyDown}
                onBlur={handleNameBlur}
                className="font-display text-base font-semibold text-gray-900 leading-tight bg-white border border-secondary rounded-md px-2 py-0.5 w-48 focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
              <button
                onClick={handleSaveName}
                className="rounded-md p-1 text-success hover:bg-green-50 transition-colors cursor-pointer"
              >
                <Check size={14} className="pointer-events-none" />
              </button>
              <button
                onClick={handleCancelRename}
                className="rounded-md p-1 text-gray-400 hover:text-error hover:bg-red-50 transition-colors cursor-pointer"
              >
                <X size={14} className="pointer-events-none" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsRenaming(true)}
              className="group flex items-center gap-1.5 cursor-pointer rounded-md px-1 -mx-1 hover:bg-gray-100 transition-colors"
            >
              <h1 className="font-display text-base font-semibold text-gray-900 leading-tight truncate">
                {timelineName}
              </h1>
              <Pencil size={12} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
            </button>
          )}
          <p className="text-[11px] text-gray-400 mt-0.5">
            <AnimatedCount value={filtered.length} /> event{filtered.length !== 1 ? 's' : ''}
            {filtered.length !== events.length && <> of <AnimatedCount value={events.length} /></>}
          </p>
        </div>
      </div>

      {/* Right: View toggles + Add Event + Import */}
      <div className="flex items-center gap-2 shrink-0">
        <div className="flex items-center gap-0.5 relative">
          {VIEW_OPTIONS.map(({ key, label, icon: Icon, shortcut }) => (
            <Tooltip key={key} label={label} shortcut={shortcut}>
              <button
                onClick={() => setActiveView(key)}
                className={`relative rounded-md p-1.5 transition-colors cursor-pointer ${
                  activeView === key
                    ? 'text-gray-900'
                    : 'text-gray-300 hover:text-gray-500'
                }`}
              >
                {activeView === key && (
                  <motion.div
                    layoutId="view-pill"
                    className="absolute inset-0 bg-gray-100 rounded-md"
                    transition={{ type: 'spring', duration: 0.35, bounce: 0.15 }}
                  />
                )}
                <span className="relative z-10"><Icon size={16} /></span>
              </button>
            </Tooltip>
          ))}

          {/* Compact/Expanded — only for vertical view */}
          {activeView === VIEWS.VERTICAL && (
            <Tooltip label={verticalCompact ? 'Switch to expanded' : 'Switch to compact'}>
              <button
                onClick={() => setVerticalCompact(!verticalCompact)}
                className={`ml-0.5 rounded-md px-2 py-1 text-[11px] font-medium transition-all cursor-pointer hidden sm:inline-flex ${
                  verticalCompact
                    ? 'bg-soft-accent text-secondary'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                {verticalCompact ? 'Expand' : 'Compact'}
              </button>
            </Tooltip>
          )}

          {/* Zoom: Year / Month — for vertical + grid views */}
          {(activeView === VIEWS.VERTICAL || activeView === VIEWS.GRID) && (
            <Tooltip label={groupZoom === 'year' ? 'Zoom to months' : 'Zoom to years'}>
              <button
                onClick={() => setGroupZoom(groupZoom === 'year' ? 'month' : 'year')}
                className={`ml-0.5 rounded-md px-2 py-1 text-[11px] font-medium transition-all cursor-pointer hidden sm:inline-flex ${
                  groupZoom === 'month'
                    ? 'bg-soft-accent text-secondary'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                }`}
              >
                {groupZoom === 'month' ? 'Month' : 'Year'}
              </button>
            </Tooltip>
          )}
        </div>

        <span className="h-4 w-px bg-gray-200 hidden sm:block" />

        {/* ── Undo / Redo ── */}
        <UndoRedoButtons />

        <span className="h-4 w-px bg-gray-200 hidden sm:block" />

        {/* ── Unified action toolbar ── */}
        <div className="flex items-center gap-0.5 rounded-lg bg-gray-50 border border-gray-200 p-0.5">
          <Tooltip label="Add event" shortcut="N">
            <button
              onClick={() => setAddEventOpen(true)}
              className="rounded-md p-1.5 text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm transition-all cursor-pointer"
            >
              <Plus size={15} />
            </button>
          </Tooltip>
          <Tooltip label="Import text">
            <button
              onClick={() => setShowImport(!showImport)}
              className={`rounded-md p-1.5 transition-all cursor-pointer ${
                showImport
                  ? 'text-secondary bg-white shadow-sm'
                  : 'text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm'
              }`}
            >
              <Type size={15} />
            </button>
          </Tooltip>
          <Tooltip label="Photo library">
            <button
              onClick={() => setPhotoLibOpen(true)}
              className="rounded-md p-1.5 text-gray-500 hover:text-gray-900 hover:bg-white hover:shadow-sm transition-all cursor-pointer"
            >
              <ImagePlus size={15} />
            </button>
          </Tooltip>
          <Tooltip label="Import timeline data">
            <ImportMenu compact />
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

// ─── Main TimelinePage ─────────────────────────────────────

export default function TimelinePage() {
  const events = useTimelineStore((s) => s.events)
  const activeView = useTimelineStore((s) => s.activeView)
  const setActiveView = useTimelineStore((s) => s.setActiveView)
  const filters = useTimelineStore((s) => s.filters)
  const clearFilters = useTimelineStore((s) => s.clearFilters)
  const photoMap = useTimelineStore((s) => s.photoMap)
  const sortOrder = useTimelineStore((s) => s.sortOrder)
  const groupZoom = useTimelineStore((s) => s.groupZoom)
  const setGroupZoom = useTimelineStore((s) => s.setGroupZoom)
  const timelines = useTimelineStore((s) => s.timelines)
  const activeTimelineId = useTimelineStore((s) => s.activeTimelineId)
  const updateTimelineName = useTimelineStore((s) => s.updateTimelineName)
  const filtered = useMemo(() => getFilteredEvents(events, filters), [events, filters])
  const sorted = useMemo(() => getSortedEvents(filtered, sortOrder), [filtered, sortOrder])

  const verticalCompact = useTimelineStore((s) => s.verticalCompact)
  const setVerticalCompact = useTimelineStore((s) => s.setVerticalCompact)
  const [photoLibOpen, setPhotoLibOpen] = useState(false)
  const [addEventOpen, setAddEventOpen] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [showImport, setShowImport] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  // Auto-activate for returning users who already have events
  const [timelineActive, setTimelineActive] = useState(events.length > 0)
  const photoCount = useMemo(() => Object.keys(photoMap).length, [photoMap])

  // Reset pagination when filters change
  useEffect(() => { setPage(1) }, [filters])

  // Get the current timeline name
  const timelineName = useMemo(() => {
    if (activeTimelineId) {
      const tl = timelines.find((t) => t.id === activeTimelineId)
      return tl?.name || 'Timeline'
    }
    return 'Timeline'
  }, [activeTimelineId, timelines])

  const saveCurrentAsTimeline = useTimelineStore((s) => s.saveCurrentAsTimeline)

  const handleRenameTimeline = (name) => {
    if (activeTimelineId) {
      updateTimelineName(activeTimelineId, name)
    } else {
      saveCurrentAsTimeline(name)
    }
  }

  // Pagination — show all sorted items up to the current page limit
  const paginated = useMemo(
    () => sorted.slice(0, page * PAGE_SIZE),
    [sorted, page]
  )
  const hasMore = page * PAGE_SIZE < sorted.length

  // Keyboard shortcuts
  useKeyboardShortcutsTimeline({
    onAddEvent: () => setAddEventOpen(true),
    onTogglePrint: () => printTimeline(sorted),
    onShowShortcuts: () => setShowShortcuts(true),
  })

  const hasEvents = events.length > 0

  // Scroll to top on initial mount so users see the hero animation
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  // If events disappear (e.g. clear timeline), go back to landing
  useEffect(() => {
    if (timelineActive && events.length === 0) {
      setTimelineActive(false)
    }
  }, [events.length, timelineActive])

  // Inject toolbar into the header
  const setToolbar = useToolbar()
  useEffect(() => {
    if (!setToolbar) return
    if (timelineActive && hasEvents) {
      setToolbar(
        <ToolbarContent
          timelineActive={timelineActive}
          hasEvents={hasEvents}
          filtered={filtered}
          events={events}
          activeView={activeView}
          setActiveView={setActiveView}
          verticalCompact={verticalCompact}
          setVerticalCompact={setVerticalCompact}
          groupZoom={groupZoom}
          setGroupZoom={setGroupZoom}
          setAddEventOpen={setAddEventOpen}
          showImport={showImport}
          setShowImport={setShowImport}
          setPhotoLibOpen={setPhotoLibOpen}
          setDrawerOpen={setDrawerOpen}
          timelineName={timelineName}
          onRenameTimeline={handleRenameTimeline}
        />
      )
    } else {
      setToolbar(null)
    }
    return () => setToolbar?.(null)
  }, [timelineActive, hasEvents, filtered, events, activeView, verticalCompact, groupZoom, showImport, timelineName, setToolbar]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex">
      {/* ─── Desktop Sidebar (only when timeline is active) ─── */}
      {timelineActive && hasEvents && (
        <Sidebar
          photoCount={photoCount}
          onPhotoLibOpen={() => setPhotoLibOpen(true)}
          onShowShortcuts={() => setShowShortcuts(true)}
        />
      )}

      {/* ─── Main Canvas ─── */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* ─── Content Area ─── */}
        <div className="flex-1 px-4 sm:px-6 py-6 bg-gradient-to-b from-gray-50/80 via-slate-50/60 to-gray-100/70 min-h-[calc(100vh-3.5rem)]">
          {!timelineActive ? (
            /* ─── Landing Page ─── */
            <LandingContent onActivate={() => { setTimelineActive(true); window.scrollTo(0, 0) }} />
          ) : hasEvents ? (
            <>
              {/* Show inline import panel if user toggled it */}
              {showImport && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="font-display text-base font-semibold text-gray-900">Add more events from text</h2>
                    <button
                      onClick={() => setShowImport(false)}
                      className="text-sm text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                  <InlineImportPanel onDone={() => setShowImport(false)} />
                </div>
              )}

              {/* spacer when import panel is hidden */}
              {!showImport && <div className="mb-2" />}

              {filtered.length === 0 ? (
                <EmptyState
                  title="No matching events"
                  description="Try adjusting your filters."
                >
                  <Button variant="secondary" onClick={() => clearFilters()}>
                    Clear all filters
                  </Button>
                </EmptyState>
              ) : (
                <>
                  <AnimatePresence mode="wait">
                    {activeView === VIEWS.VERTICAL && (
                      <motion.div key="vertical" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                        <VerticalView events={paginated} editable compact={verticalCompact} groupZoom={groupZoom} />
                      </motion.div>
                    )}
                    {activeView === VIEWS.HORIZONTAL && (
                      <motion.div key="horizontal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                        <HorizontalView events={paginated} editable />
                      </motion.div>
                    )}
                    {activeView === VIEWS.GRID && (
                      <motion.div key="grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                        <GridView events={paginated} editable groupZoom={groupZoom} />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Load more */}
                  {hasMore && (
                    <div className="flex justify-center py-4">
                      <Button
                        variant="secondary"
                        onClick={() => setPage((p) => p + 1)}
                      >
                        Load more ({sorted.length - paginated.length} remaining)
                      </Button>
                    </div>
                  )}
                </>
              )}
            </>
          ) : (
            /* ─── Empty state: timeline is active but no events yet ─── */
            <EmptyState
              icon={Plus}
              title="No events yet"
              description="Add events manually or import text to get started."
            >
              <div className="flex gap-3">
                <Button onClick={() => setAddEventOpen(true)}>
                  <Plus size={16} />
                  Add Event
                </Button>
                <Button variant="secondary" onClick={() => setShowImport(true)}>
                  <Type size={16} />
                  Import Text
                </Button>
              </div>
            </EmptyState>
          )}
        </div>
      </div>

      {/* ─── Mobile Drawer (only when timeline is active) ─── */}
      {timelineActive && hasEvents && (
        <SidebarDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          photoCount={photoCount}
          onPhotoLibOpen={() => { setPhotoLibOpen(true); setDrawerOpen(false) }}
          onShowShortcuts={() => { setShowShortcuts(true); setDrawerOpen(false) }}
        />
      )}

      {/* ─── Modals & Side Panels ─── */}
      <ReviewPanel />
      <PhotoLibrary open={photoLibOpen} onClose={() => setPhotoLibOpen(false)} />
      <AddEventModal open={addEventOpen} onClose={() => setAddEventOpen(false)} />
      <ShortcutsModal open={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  )
}
