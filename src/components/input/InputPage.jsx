import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, ArrowRight } from 'lucide-react'
import Logo from '@/components/layout/Logo'
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
    setPhotos: storePhotos,
    isParsing,
    setIsParsing,
    parseError,
    setParseError,
  } = useTimelineStore()

  const canSubmit = text.trim().length > 0 && !isParsing

  const handleSubmit = async () => {
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
      setEvents(data.events || [])
      storePhotos(photos)
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
          Turn text into a timeline
        </h1>
        <p className="text-base text-gray-500 leading-relaxed">
          Paste journal entries, family history, research notes, or anything with dates.
          AI extracts events, people, and relationships into an interactive timeline.
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

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSubmit} disabled={!canSubmit} size="lg">
            {isParsing ? (
              <>
                <span className="animate-spin inline-block h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                Extracting events…
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Timeline
              </>
            )}
          </Button>

          {events.length > 0 && (
            <Button variant="secondary" onClick={() => navigate('/timeline')}>
              View Existing Timeline
              <ArrowRight size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
