import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Plus, CornerDownRight } from 'lucide-react'
import TextInput from './TextInput'
import PhotoUpload from './PhotoUpload'
import Button from '@/components/shared/Button'
import useTimelineStore from '@/store/useTimelineStore'

export default function InputPage() {
  const [text, setText] = useState('')
  const [photos, setPhotos] = useState([])
  const navigate = useNavigate()

  const {
    events,
    setEvents,
    appendEvents,
    setPhotos: storePhotos,
    isParsing,
    setIsParsing,
    parseError,
    setParseError,
  } = useTimelineStore()

  const hasExisting = events.length > 0
  const canSubmit = text.trim().length > 0 && !isParsing

  const handleParse = async (append) => {
    if (!canSubmit) return

    setIsParsing(true)
    setParseError(null)

    try {
      const photoFilenames = photos.map((p) => p.name)

      const res = await fetch('/api/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, photoFilenames }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || `Parsing failed (${res.status})`)
      }

      const newEvents = data.events || []

      if (append) {
        appendEvents(newEvents)
      } else {
        setEvents(newEvents)
      }

      storePhotos(photos)
      setText('')
      setPhotos([])
      navigate('/timeline')
    } catch (err) {
      setParseError(err.message)
    } finally {
      setIsParsing(false)
    }
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
        <TextInput value={text} onChange={setText} />
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
                onClick={() => handleParse(false)}
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
    </div>
  )
}
