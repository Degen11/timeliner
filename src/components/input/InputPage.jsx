import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Plus, CornerDownRight } from 'lucide-react'
import TextInput from './TextInput'
import PhotoUpload from './PhotoUpload'
import Button from '@/components/shared/Button'
import useTimelineStore from '@/store/useTimelineStore'

export default function InputPage() {
  const [photos, setPhotos] = useState([])
  const [showConfirm, setShowConfirm] = useState(false)
  const navigate = useNavigate()

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
  const canSubmit = draftText.trim().length > 0 && !isParsing

  const handleParse = async (append) => {
    if (!canSubmit) return

    setIsParsing(true)
    setParseError(null)

    try {
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

      if (append) {
        appendEvents(newEvents)
        showToast(`Added ${newEvents.length} new event${newEvents.length !== 1 ? 's' : ''} to your timeline`)
      } else {
        setEvents(newEvents)
      }

      // Convert photos to data URLs for persistent storage
      if (photos.length > 0) {
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

      storePhotos(photos)
      setDraftText('')
      setPhotos([])
      navigate('/timeline')
    } catch (err) {
      setParseError(err.message)
    } finally {
      setIsParsing(false)
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

        {parseError && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-error">
            {parseError}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2 flex-wrap">
          {hasExisting ? (
            <>
              <Button onClick={() => handleParse(true)} disabled={!canSubmit} size="lg">
                {isParsing ? (
                  <>
                    <span className="animate-spin inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                    Extracting events…
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Add to Timeline
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

      {/* Confirm dialog for Start Fresh */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full mx-4 p-6">
            <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">
              Replace existing timeline?
            </h3>
            <p className="text-sm text-gray-500 mb-5">
              This will replace your current {events.length} event{events.length !== 1 ? 's' : ''} with a new timeline. This can't be undone.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <Button variant="secondary" onClick={() => setShowConfirm(false)}>
                Cancel
              </Button>
              <Button onClick={confirmStartFresh}>
                Replace Timeline
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
