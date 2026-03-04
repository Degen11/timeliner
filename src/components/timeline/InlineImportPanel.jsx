import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars
import { Plus, ArrowRight, FileText, Sparkles, CheckCircle2 } from 'lucide-react'
import useTimelineStore from '@/store/useTimelineStore'
import { MAX_TEXT_LENGTH, SAMPLE_TEXT } from '@/utils/constants'
import Button from '@/components/shared/Button'
import TextInput from '@/components/input/TextInput'
import PhotoUpload from '@/components/input/PhotoUpload'
import AnimatedCount from '@/components/shared/AnimatedCount'

const PARSING_STEPS = [
  'Reading your text\u2026',
  'Finding dates and events\u2026',
  'Identifying people\u2026',
  'Building connections\u2026',
  'Assembling timeline\u2026',
]

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

export default function InlineImportPanel({ onDone, noWrapper = false }) {
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
      <AnimatePresence>{isParsing && hasText && <ParsingOverlayContent />}</AnimatePresence>

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
