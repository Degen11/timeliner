import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion' // eslint-disable-line no-unused-vars -- motion is used as JSX motion.div
import { ArrowRight, Plus, CornerDownRight, Sparkles, CheckCircle2 } from 'lucide-react'
import TextInput from './TextInput'
import PhotoUpload from './PhotoUpload'
import Button from '@/components/shared/Button'
import AnimatedModal from '@/components/shared/AnimatedModal'
import useTimelineStore from '@/store/useTimelineStore'
import { MAX_TEXT_LENGTH } from '@/utils/constants'

const PARSING_STEPS = [
  'Reading your text…',
  'Finding dates and events…',
  'Identifying people…',
  'Building connections…',
  'Assembling timeline…',
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
          <Sparkles size={36} className="text-accent" />
        </motion.div>

        <div className="space-y-3">
          <h2 className="font-display text-xl font-semibold text-gray-900">
            Creating your timeline
          </h2>
          <div className="h-6">
            <AnimatePresence mode="wait">
              <motion.p
                key={stepIndex}
                className="text-sm text-gray-500"
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

        {/* Progress bar */}
        <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-accent rounded-full"
            initial={{ width: '5%' }}
            animate={{ width: `${Math.min(15 + stepIndex * 20, 90)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>
    </motion.div>
  )
}

function ParsingOverlay({ visible }) {
  return (
    <AnimatePresence>
      {visible && <ParsingOverlayContent />}
    </AnimatePresence>
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
              <p className="text-sm text-gray-500">
                {eventCount} event{eventCount !== 1 ? 's' : ''} extracted
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default function InputPage() {
  const [photos, setPhotos] = useState([])
  const [showConfirm, setShowConfirm] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [successCount, setSuccessCount] = useState(0)
  const navigate = useNavigate()
  const pendingNavigate = useRef(false)

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

  // Convert uploaded photos to data URLs and store them
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
      // Photos-only flow: skip API, just store photos and navigate
      if (!hasText && hasPhotos && hasExisting) {
        await storeUploadedPhotos()
        storePhotos(photos)
        showToast(`Added ${photos.length} photo${photos.length !== 1 ? 's' : ''} to your library`)
        setPhotos([])
        setIsParsing(false)
        navigate('/timeline')
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

      // Convert photos to data URLs BEFORE setting events so
      // photoMap is populated when the timeline page renders
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

      // Show success celebration before navigating
      setSuccessCount(newEvents.length)
      setShowSuccess(true)
      pendingNavigate.current = true
    } catch (err) {
      setParseError(err.message)
      setIsParsing(false)
    }
  }

  const handleSuccessContinue = () => {
    if (pendingNavigate.current) {
      pendingNavigate.current = false
      setShowSuccess(false)
      navigate('/timeline')
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

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-10">
        <h1 className="font-display text-3xl font-bold text-gray-900 mb-3 tracking-tight">
          {hasExisting ? 'Add to your timeline' : 'Turn text into a timeline'}
        </h1>
        <p className="text-base text-gray-500 leading-relaxed">
          {hasExisting
            ? `You have ${events.length} event${events.length !== 1 ? 's' : ''}. Paste more text to add new events, or start fresh.`
            : 'Paste journal entries, family history, research notes, or anything with dates. AI extracts events, people, and relationships into an interactive timeline.'}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <TextInput
          value={draftText}
          onChange={setDraftText}
          onSubmit={() => hasExisting ? handleParse(true) : handleParse(false)}
          disabled={!canSubmit}
        />
        <PhotoUpload photos={photos} onPhotosChange={setPhotos} />

        <AnimatePresence>
          {parseError && (
            <motion.div
              className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-error"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {parseError}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3 pt-2 flex-wrap">
          {hasExisting ? (
            <>
              <Button onClick={() => handleParse(true)} disabled={!canSubmit} size="lg">
                {isParsing ? (
                  <>
                    <span className="animate-spin inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                    {hasText ? 'Extracting events…' : 'Adding photos…'}
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

              <Button variant="ghost" onClick={() => navigate('/timeline')}>
                View Timeline
                <ArrowRight size={14} />
              </Button>
            </>
          ) : (
            <Button onClick={() => handleParse(false)} disabled={!canSubmit} size="lg">
              {isParsing ? (
                <>
                  <span className="animate-spin inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                  Extracting events…
                </>
              ) : (
                <>
                  <ArrowRight size={16} />
                  Generate Timeline
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Parsing overlay */}
      <ParsingOverlay visible={isParsing && hasText} />

      {/* Success celebration */}
      <SuccessOverlay
        visible={showSuccess}
        eventCount={successCount}
        onContinue={handleSuccessContinue}
      />

      {/* Confirm dialog for Start Fresh */}
      <AnimatedModal open={showConfirm} onClose={() => setShowConfirm(false)} className="bg-white rounded-xl shadow-2xl max-w-sm w-full mx-4 p-6">
        <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">
          Replace existing timeline?
        </h3>
        <p className="text-sm text-gray-500 mb-5">
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
    </div>
  )
}
