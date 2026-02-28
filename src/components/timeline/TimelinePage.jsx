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
  CornerDownRight,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  Upload,
} from 'lucide-react'
import Papa from 'papaparse'
import useTimelineStore from '@/store/useTimelineStore'
import { getFilteredEvents, getSortedEvents } from '@/store/selectors'
import { VIEWS, MAX_TEXT_LENGTH, SAMPLE_TEXT } from '@/utils/constants'
import { isValidISODate } from '@/utils/dateUtils'
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

// ─── File import helpers ──────────────────────────────────

function generateId() {
  return 'evt_' + Math.random().toString(36).slice(2, 9)
}

function normalizeCSVEvent(row) {
  const rawDate = row.dateStart || row.date || null
  const dateInvalid = rawDate && !isValidISODate(rawDate)
  return {
    id: generateId(),
    title: row.title || 'Untitled',
    description: row.description || null,
    dateStart: dateInvalid ? null : rawDate,
    dateEnd: row.dateEnd || null,
    dateRaw: row.dateRaw || row.dateStart || row.date || '',
    datePrecision: row.datePrecision || 'day',
    flagged: dateInvalid || row.flagged === 'Yes' || row.flagged === 'true' || row.flagged === true,
    flagReason: dateInvalid ? `Invalid date format: "${rawDate}"` : (row.flagReason || null),
    people: typeof row.people === 'string'
      ? row.people.split(';').map((s) => s.trim()).filter(Boolean)
      : [],
    tags: typeof row.tags === 'string'
      ? row.tags.split(';').map((s) => s.trim()).filter(Boolean)
      : [],
    photos: [],
  }
}

function normalizeJSONEvents(data) {
  const events = data.events || data
  if (!Array.isArray(events)) return []
  return events.map((e) => {
    const rawDate = e.dateStart || e.date || null
    const dateInvalid = rawDate && !isValidISODate(rawDate)
    return {
      id: e.id || generateId(),
      title: e.title || 'Untitled',
      description: e.description || null,
      dateStart: dateInvalid ? null : rawDate,
      dateEnd: e.dateEnd || null,
      dateRaw: e.dateRaw || e.dateStart || '',
      datePrecision: e.datePrecision || 'day',
      flagged: dateInvalid || e.flagged || false,
      flagReason: dateInvalid ? `Invalid date format: "${rawDate}"` : (e.flagReason || null),
      people: Array.isArray(e.people) ? e.people : [],
      tags: Array.isArray(e.tags) ? e.tags : [],
      photos: Array.isArray(e.photos) ? e.photos : [],
    }
  })
}

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

// ─── Keyboard shortcuts modal ──────────────────────────────

function ShortcutsModal({ open, onClose }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-lg font-semibold text-gray-900 mb-4">
          Keyboard Shortcuts
        </h3>
        <div className="space-y-2 text-sm">
          {[
            ['1 / 2 / 3', 'Switch view (Vertical / Horizontal / Grid)'],
            ['N', 'Add new event'],
            ['Ctrl+Z', 'Undo'],
            ['Ctrl+Shift+Z', 'Redo'],
            ['Ctrl+P', 'Print / Export PDF'],
            ['Esc', 'Close modals / Cancel edit'],
            ['Arrow Keys', 'Navigate photo lightbox'],
          ].map(([key, desc]) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <span className="text-gray-500">{desc}</span>
              <kbd className="inline-flex items-center rounded bg-gray-100 px-2 py-0.5 text-xs font-mono text-gray-700 border border-gray-200 whitespace-nowrap">
                {key}
              </kbd>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  )
}

// ─── Inline text import panel ──────────────────────────────

function InlineImportPanel({ onDone, noWrapper = false }) {
  const [photos, setPhotos] = useState([])
  const [showConfirm, setShowConfirm] = useState(false)
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

  const handleStartFresh = () => {
    if (hasExisting) {
      setShowConfirm(true)
    } else {
      handleParse(false)
    }
  }

  const confirmStartFresh = () => {
    setShowConfirm(false)
    handleParse(false)
  }

  const handleTrySample = () => {
    setDraftText(SAMPLE_TEXT)
  }

  // ─── Shared content pieces ───

  const textAndError = (
    <>
      <TextInput
        value={draftText}
        onChange={setDraftText}
        onSubmit={() => hasExisting ? handleParse(true) : handleParse(false)}
        disabled={!canSubmit}
        onTrySample={handleTrySample}
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
                {hasText ? 'Extracting events\u2026' : 'Adding photos\u2026'}
              </>
            ) : (
              <>
                <Plus size={16} />
                {hasText ? 'Add to Timeline' : 'Add Photos'}
              </>
            )}
          </Button>
          <Button
            variant="secondary"
            onClick={handleStartFresh}
            disabled={!canSubmit}
            size="lg"
          >
            <CornerDownRight size={14} />
            Start Fresh
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

      <AnimatedModal open={showConfirm} onClose={() => setShowConfirm(false)} className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6">
        <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">
          Replace existing timeline?
        </h3>
        <p className="text-sm text-text-muted mb-5">
          This will replace your current {events.length} event{events.length !== 1 ? 's' : ''} with a new timeline. This can&apos;t be undone.
        </p>
        <div className="flex items-center gap-3 justify-end">
          <Button variant="secondary" onClick={() => setShowConfirm(false)}>
            Cancel
          </Button>
          <Button onClick={confirmStartFresh} variant="danger">
            Replace Timeline
          </Button>
        </div>
      </AnimatedModal>
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

// ─── Landing page content ──────────────────────────────────

function LandingContent({ onActivate }) {
  const events = useTimelineStore((s) => s.events)
  const hasEvents = events.length > 0
  const [inputTab, setInputTab] = useState('text')

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="max-w-xl w-full">
        {/* CTA Block */}
        <div className="rounded-2xl bg-soft-accent px-6 py-8 lg:px-10 lg:py-10 mb-6 text-center">
          <h2 className="font-display text-2xl font-bold text-text-strong tracking-tight mb-3">
            Turn text into a timeline
          </h2>
          <p className="text-base text-text-muted leading-relaxed max-w-lg mx-auto">
            Paste journal entries, family history, research notes, or anything with dates.
            AI extracts events, people, and relationships into an interactive timeline.
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            <span className="inline-flex items-center rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
              No account required
            </span>
            <span className="inline-flex items-center rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
              Works with messy notes
            </span>
            <span className="inline-flex items-center rounded-full bg-secondary/10 px-3 py-1 text-xs font-medium text-secondary">
              Export anytime
            </span>
          </div>
        </div>

        {/* Session restore banner */}
        {hasEvents && (
          <div className="rounded-xl bg-secondary/5 border border-secondary/20 px-5 py-4 mb-6 flex items-center justify-between gap-4">
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
        <div className="rounded-2xl bg-surface border border-gray-200 shadow-sm overflow-hidden">
          {/* Tab bar */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setInputTab('text')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
                inputTab === 'text'
                  ? 'text-secondary border-b-2 border-secondary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Paste Text
            </button>
            <button
              onClick={() => setInputTab('file')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors cursor-pointer ${
                inputTab === 'file'
                  ? 'text-secondary border-b-2 border-secondary'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
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
  )
}

// ─── Main TimelinePage ─────────────────────────────────────

export default function TimelinePage() {
  const events = useTimelineStore((s) => s.events)
  const activeView = useTimelineStore((s) => s.activeView)
  const setActiveView = useTimelineStore((s) => s.setActiveView)
  const filters = useTimelineStore((s) => s.filters)
  const photoMap = useTimelineStore((s) => s.photoMap)
  const sortOrder = useTimelineStore((s) => s.sortOrder)
  const filtered = useMemo(() => getFilteredEvents(events, filters), [events, filters])
  const sorted = useMemo(() => getSortedEvents(filtered, sortOrder), [filtered, sortOrder])

  const [photoLibOpen, setPhotoLibOpen] = useState(false)
  const [addEventOpen, setAddEventOpen] = useState(false)
  const [verticalCompact, setVerticalCompact] = useState(false)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [page, setPage] = useState(1)
  const [showImport, setShowImport] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)
  const [timelineActive, setTimelineActive] = useState(false)
  const photoCount = useMemo(() => Object.keys(photoMap).length, [photoMap])

  // Pagination
  const paginated = useMemo(
    () => sorted.slice(0, page * PAGE_SIZE),
    [sorted, page]
  )
  const hasMore = page * PAGE_SIZE < sorted.length

  // Keyboard shortcuts
  useKeyboardShortcutsTimeline({
    onAddEvent: () => setAddEventOpen(true),
    onTogglePrint: () => printTimeline(sorted),
  })

  const hasEvents = events.length > 0

  // If events disappear (e.g. clear timeline), go back to landing
  useEffect(() => {
    if (timelineActive && events.length === 0) {
      setTimelineActive(false)
    }
  }, [events.length, timelineActive])

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
        {/* ─── Sticky Mini-Toolbar (only when timeline is active) ─── */}
        {timelineActive && hasEvents && (
          <div className="border-b border-gray-200/60 bg-white/80 backdrop-blur-sm shrink-0 sticky top-14 z-20">
            <div className="px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
              {/* Left: Mobile drawer trigger + Page identity */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setDrawerOpen(true)}
                  className="lg:hidden flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-1.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <SlidersHorizontal size={14} />
                  <span>Filters</span>
                </button>

                <div>
                  <h1 className="font-display text-lg font-semibold text-gray-900 leading-tight">
                    Timeline
                  </h1>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {filtered.length} event{filtered.length !== 1 ? 's' : ''}
                    {filtered.length !== events.length && ` of ${events.length}`}
                  </p>
                </div>
              </div>

              {/* Right: View toggles + Add Event + Import */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {VIEW_OPTIONS.map(({ key, label, icon: Icon, shortcut }) => (
                    <button
                      key={key}
                      onClick={() => setActiveView(key)}
                      className={`rounded-md p-1.5 transition-all cursor-pointer ${
                        activeView === key
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-300 hover:text-gray-500'
                      }`}
                      title={`${label} (${shortcut})`}
                    >
                      <Icon size={16} />
                    </button>
                  ))}

                  {/* Compact/Expanded — only for vertical view */}
                  {activeView === VIEWS.VERTICAL && (
                    <button
                      onClick={() => setVerticalCompact(!verticalCompact)}
                      className={`ml-0.5 rounded-md px-2 py-1 text-[11px] font-medium transition-all cursor-pointer hidden sm:inline-flex ${
                        verticalCompact
                          ? 'bg-soft-accent text-secondary'
                          : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
                      }`}
                      title={verticalCompact ? 'Switch to expanded' : 'Switch to compact'}
                    >
                      {verticalCompact ? 'Dense' : 'Expanded'}
                    </button>
                  )}
                </div>

                <span className="h-4 w-px bg-gray-200 hidden sm:block" />

                <Button size="sm" onClick={() => setAddEventOpen(true)} title="Add event (N)">
                  <Plus size={14} />
                  <span className="hidden sm:inline">Add Event</span>
                </Button>

                <ImportMenu compact />
              </div>
            </div>
          </div>
        )}

        {/* ─── Content Area ─── */}
        <div className={`flex-1 px-4 sm:px-6 py-6 bg-gradient-to-b from-gray-50/80 via-slate-50/60 to-gray-100/70 ${
          timelineActive && hasEvents ? 'min-h-[calc(100vh-7.5rem)]' : 'min-h-[calc(100vh-3.5rem)]'
        }`}>
          {!timelineActive ? (
            /* ─── Landing Page ─── */
            <LandingContent onActivate={() => setTimelineActive(true)} />
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

              {!showImport && (
                <div className="mb-4 flex justify-end">
                  <button
                    onClick={() => setShowImport(true)}
                    className="text-sm text-secondary hover:underline cursor-pointer"
                  >
                    + Import more text
                  </button>
                </div>
              )}

              {filtered.length === 0 ? (
                <EmptyState
                  title="No matching events"
                  description="Try adjusting your filters."
                />
              ) : (
                <>
                  {activeView === VIEWS.VERTICAL && (
                    <VerticalView events={paginated} editable compact={verticalCompact} />
                  )}
                  {activeView === VIEWS.HORIZONTAL && (
                    <HorizontalView events={paginated} editable />
                  )}
                  {activeView === VIEWS.GRID && (
                    <GridView events={paginated} editable />
                  )}

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
          ) : null}
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
